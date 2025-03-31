const fs = require("node:fs");
const path = require("node:path");
const PDFKit = require("pdfkit");
const bwipjs = require("bwip-js");
const {
  formatarData,
  formatarMoeda,
  formatarValorParaCodigo,
} = require("./utils/formatacao.js");
const {
  gerarLinhaDigitavel,
  gerarCampoLivre,
} = require("./utils/linhaDigitavel.js");
const {
  calcularFatorVencimento,
  calcularDvGeral,
} = require("./utils/calculo.js");
const {
  cnpjValidator,
  cpfValidator,
  carteiraValidator,
} = require("./utils/validator.js");
const { Banco, Carteiras } = require("./enums.js");

/**
 * Classe para geração de boletos
 */
class BoletoGenerator {
  /**
   * @param {*} dados
   */
  constructor(dados) {
    try {
      dados.banco.carteira = dados.banco.carteira.padStart(2, "0");
      carteiraValidator(dados.banco.codigo, dados.banco.carteira);
      if (dados.beneficiario.cpfCnpj.replace(/D/g, "").length === 11) {
        cpfValidator(dados.beneficiario.cpfCnpj);
      } else {
        cnpjValidator(dados.beneficiario.cpfCnpj);
      }
      this.dados = dados;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Gera o código de barras como imagem PNG
   * @returns {Promise<Buffer>}
   */
  async gerarCodigoBarras() {
    const banco = this.dados.banco.codigo.padStart(3, "0");
    const moeda = "9";
    const fator = calcularFatorVencimento(this.dados);
    const valor = formatarValorParaCodigo(this.dados.boleto.valor);
    const campoLivre = `${this.dados.banco.agencia}${
      this.dados.banco.carteira
    }${this.dados.boleto.nossoNumero}${this.dados.banco.conta.replace(
      /\D/g,
      ""
    )}`;

    const codigoBarras = `${banco}${moeda}${fator}${valor}${campoLivre}`;

    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: "interleaved2of5",
          text: codigoBarras,
          scale: 3,
          height: 10,
          includetext: false,
          textxalign: "center",
        },
        (err, png) => {
          if (err) {
            reject(err);
          } else {
            resolve(png);
          }
        }
      );
    });
  }

  // Gera o PDF do boleto
  /**
   *
   * @param {string | undefined} outputPath
   * @returns {Promise<string>}
   * @access public
   */
  async gerarPDFFile(outputPath) {
    // Define o caminho de saída se não for fornecido
    if (!outputPath) {
      outputPath = path.join(
        process.cwd(),
        "tmp",
        "boletos",
        `boleto-${this.dados.boleto.numeroDocumento.replace(/\//g, "-")}.pdf`
      );
    }

    // Garante que o diretório exista
    const diretorio = path.dirname(outputPath);
    if (!fs.existsSync(diretorio)) {
      fs.mkdirSync(diretorio, { recursive: true });
    }

    // Cria o PDF
    const doc = new PDFKit({ size: "A4", margin: 20 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Configurações gerais
    this.configuracoesIniciais(doc);

    // Parte superior (Recibo do Pagador)
    this.desenharCabecalhoRecibo(doc);
    this.desenharDadosRecibo(doc);
    this.desenharLinhaRecortavel(doc, 295);

    // Parte inferior (Ficha de Compensação)
    this.desenharCabecalhoFicha(doc);
    this.desenharDadosFicha(doc);
    await this.desenharCodigoBarras(doc);
    this.desenharDadosPagador(doc);

    // Finaliza o PDF
    doc.end();

    // Retorna o caminho do arquivo quando o stream for fechado
    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(outputPath));
      stream.on("error", reject);
    });
  }

  // Gera o PDF do boleto
  /**
   * @returns {Promise<Buffer>}
   * @access public
   */
  async gerarPDFBuffer() {
    // Cria o PDF na memória
    const doc = new PDFKit({ size: "A4", margin: 20 });
    const chunks = [];

    //captura os chunks do PDF em um array
    doc.on("data", (chunk) => chunks.push(chunk));

    // Configurações gerais
    this.configuracoesIniciais(doc);

    // Parte superior (Recibo do Pagador)
    this.desenharCabecalhoRecibo(doc);
    this.desenharDadosRecibo(doc);
    this.desenharLinhaRecortavel(doc, 295);

    // Parte inferior (Ficha de Compensação)
    this.desenharCabecalhoFicha(doc);
    this.desenharDadosFicha(doc);
    await this.desenharCodigoBarras(doc);
    this.desenharDadosPagador(doc);

    // Finaliza o PDF
    doc.end();

    // Retorna o caminho do arquivo quando o stream for fechado
    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
  }

  /**
   * Define configurações iniciais do documento
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  configuracoesIniciais(doc) {
    // Adiciona fonte padrão
    doc.font("Helvetica");
    doc.fontSize(10);
  }

  /**
   * Desenha o cabeçalho do recibo
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharCabecalhoRecibo(doc) {
    // Título do recibo
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("RECIBO DO PAGADOR", 450, 40, { align: "left" });

    // Caixa para o código do banco
    doc.rect(30, 40, 80, 30).stroke();
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(
        `${this.dados.banco.codigo}-${
          this.dados.banco.codigo === Banco.BRADESCO ? "2" : "X"
        }`,
        55,
        52
      );
  }

  /**
   * Desenha os dados do recibo do pagador
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharDadosRecibo(doc) {
    // Linha 1 - Beneficiário
    this.desenharCampoDadoCabecalho(doc, "BENEFICIÁRIO", 30, 80, 550, 50);
    doc
      .fontSize(9)
      .font("Helvetica")
      .text(
        `${this.dados.beneficiario.nome} - CNPJ: ${this.dados.beneficiario.cpfCnpj}`,
        45,
        95
      );
    doc.text(
      `${this.dados.beneficiario.endereco}, ${this.dados.beneficiario.bairro}`,
      45,
      105
    );
    doc.text(
      `${this.dados.beneficiario.cidade}/${this.dados.beneficiario.uf} — ${this.dados.beneficiario.cep}`,
      45,
      115
    );

    // Linha 2 - Nome do Pagador, Data Vencimento, Valor Cobrado
    const y = 130;
    this.desenharCampoDadoCabecalho(doc, "Nome do Pagador", 30, y, 310, 25);
    this.desenharCampoDadoCabecalho(doc, "Data de Vencimento", 340, y, 140, 25);
    this.desenharCampoDadoCabecalho(doc, "Valor Cobrado", 480, y, 100, 25);

    doc.fontSize(9).text(this.dados.pagador.nome, 40, y + 13);
    doc.text(formatarData(this.dados.boleto.dataVencimento), 350, y + 13);
    doc.text("", 455, y + 13); // Valor preenchido após pagamento

    // Linha 3 - Carteira, Espécie Doc, Nº Documento, Valor Documento
    const y2 = 155;
    this.desenharCampoDadoCabecalho(doc, "Carteira", 30, y2, 80, 25);
    this.desenharCampoDadoCabecalho(doc, "Espécie Doc.", 110, y2, 80, 25);
    this.desenharCampoDadoCabecalho(doc, "Nº do Documento", 190, y2, 160, 25);
    this.desenharCampoDadoCabecalho(
      doc,
      "Valor do Documento",
      350,
      y2,
      230,
      25
    );

    doc.fontSize(9).text(this.dados.banco.carteira, 35, y2 + 12);
    doc.text("DM", 115, y2 + 12);
    doc.text(this.dados.boleto.numeroDocumento, 195, y2 + 12);
    doc.text(formatarMoeda(this.dados.boleto.valor), 355, y2 + 12);

    // Linha 4 - Data Processamento, Agência/Código, Nosso Número
    const y3 = 180;
    this.desenharCampoDadoCabecalho(doc, "Data Processamento", 30, y3, 160, 25);
    this.desenharCampoDadoCabecalho(
      doc,
      "Agência / Código do Beneficiário",
      190,
      y3,
      250,
      25
    );
    this.desenharCampoDadoCabecalho(doc, "Nosso Número", 440, y3, 140, 25);

    doc
      .fontSize(9)
      .text(
        formatarData(this.dados.boleto.dataProcessamento || new Date()),
        35,
        y3 + 12
      );
    doc.text(
      `${this.dados.banco.agencia}/${this.dados.banco.conta}`,
      195,
      y3 + 12
    );

    const nossoNumero = `${this.dados.banco.carteira}/${this.dados.boleto.nossoNumero}`;

    if (this.dados.banco.codigo === Banco.BRADESCO) {
      nossoNumero +=
        "-" + calcularDvGeral(this.dados, gerarCampoLivre(this.dados));
    }

    doc.text(nossoNumero, 445, y3 + 12);

    // Espaço para Autenticação Mecânica
    doc.fontSize(8).font("Helvetica").text("Autenticação Mecânica", 400, 220);

    // Linha Digitável
    let linhaDigitavel =
      this.dados.boleto.linhaDigitavel || gerarLinhaDigitavel(this.dados);

    doc.fontSize(11).font("Helvetica-Bold").text(linhaDigitavel, 145, 250);
  }

  /**
   * Desenha linha recortável
   * @param {PDFKit.PDFDocument} doc
   * @param {number} y - Posição Y da linha
   * @returns {void}
   * @access private
   */
  desenharLinhaRecortavel(doc, y) {
    doc
      .fontSize(8)
      .text(
        "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -",
        30,
        y
      );
  }

  /**
   * Desenha o cabeçalho da ficha de compensação
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharCabecalhoFicha(doc) {
    const y = 315;

    // Logo e código do banco
    const nomeBanco =
      this.dados.banco.codigo === Banco.BANCO_DO_BRASIL
        ? "Banco do Brasil"
        : "Bradesco";

    // Caixa para o código do banco
    doc.rect(30, y, 80, 30).stroke();
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(
        `${this.dados.banco.codigo}-${
          this.dados.banco.codigo === Banco.BRADESCO ? "2" : "X"
        }`,
        55,
        y + 10
      );

    // Linha digitável
    let linhaDigitavel =
      this.dados.boleto.linhaDigitavel || gerarLinhaDigitavel(this.dados);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(linhaDigitavel, 145, y + 10);
  }

  /**
   * Desenha os dados da ficha de compensação
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharDadosFicha(doc) {
    const yInicio = 345;

    // Linha 1 - Local de Pagamento e Vencimento
    this.desenharCampoDadoCabecalho(
      doc,
      "Local do Pagamento",
      30,
      yInicio,
      420,
      25
    );
    this.desenharCampoDadoCabecalho(doc, "Vencimento", 450, yInicio, 130, 25);

    doc
      .fontSize(9)
      .text("PAGÁVEL EM QUALQUER BANCO ATÉ O VENCIMENTO", 35, yInicio + 12);
    doc.text(formatarData(this.dados.boleto.dataVencimento), 455, yInicio + 12);

    // Linha 2 - Beneficiário
    const y2 = yInicio + 25;
    this.desenharCampoDadoCabecalho(doc, "Beneficiário", 30, y2, 420, 25);
    this.desenharCampoDadoCabecalho(
      doc,
      "Agência / Código do Beneficiário",
      450,
      y2,
      130,
      25
    );

    doc
      .fontSize(9)
      .text(
        `${this.dados.beneficiario.nome} - CNPJ: ${this.dados.beneficiario.cpfCnpj}`,
        35,
        y2 + 12
      );
    doc.text(
      `${this.dados.banco.agencia}/${this.dados.banco.conta}`,
      455,
      y2 + 12
    );

    // Linha 3 - Data Documento, Nº Documento, Espécie Doc, Aceite, Data Processamento
    const y3 = y2 + 25;
    this.desenharCampoDadoCabecalho(doc, "Data Documento", 30, y3, 100, 25);
    this.desenharCampoDadoCabecalho(doc, "Nº do Documento", 130, y3, 100, 25);
    this.desenharCampoDadoCabecalho(doc, "Espécie Doc.", 230, y3, 70, 25);
    this.desenharCampoDadoCabecalho(doc, "Aceite", 300, y3, 70, 25);
    this.desenharCampoDadoCabecalho(
      doc,
      "Data Processamento",
      370,
      y3,
      100,
      25
    );
    this.desenharCampoDadoCabecalho(doc, "Nosso Número", 470, y3, 110, 25);

    doc
      .fontSize(9)
      .text(
        formatarData(this.dados.boleto.dataDocumento || new Date()),
        35,
        y3 + 12
      );
    doc.text(this.dados.boleto.numeroDocumento, 135, y3 + 12);
    doc.text("DM", 235, y3 + 12);
    doc.text("N", 305, y3 + 12);
    doc.text(
      formatarData(this.dados.boleto.dataProcessamento || new Date()),
      375,
      y3 + 12
    );
    doc.text(
      `${this.dados.banco.carteira}/${
        this.dados.boleto.nossoNumero
      }-${calcularDvGeral(this.dados, gerarCampoLivre(this.dados))}`,
      475,
      y3 + 12
    );

    // Linha 4 - Uso do Banco, CIP, Carteira, Moeda, Quantidade, Valor
    const y4 = y3 + 25;
    this.desenharCampoDadoCabecalho(doc, "Uso do Banco", 30, y4, 100, 25);
    this.desenharCampoDadoCabecalho(doc, "CIP", 130, y4, 70, 25);
    this.desenharCampoDadoCabecalho(doc, "Carteira", 200, y4, 70, 25);
    this.desenharCampoDadoCabecalho(doc, "Moeda", 270, y4, 70, 25);
    this.desenharCampoDadoCabecalho(doc, "Quantidade", 340, y4, 110, 25);
    this.desenharCampoDadoCabecalho(
      doc,
      "(=) Valor do Documento",
      450,
      y4,
      130,
      25
    );

    doc.fontSize(9).text("", 35, y4 + 12);
    doc.text("", 135, y4 + 12);
    doc.text(this.dados.banco.carteira, 205, y4 + 12);
    doc.text("R$", 275, y4 + 12);
    doc.text("", 345, y4 + 12);
    doc.text(formatarMoeda(this.dados.boleto.valor), 455, y4 + 12);

    // Linha 5 - Valor do documento, Descontos, Abatimentos, Outras Deduções, Juros / Multa, Outros Acréscimos, Valor Cobrado
    const y5 = y4 + 25;

    // Descontos, juros, etc
    this.desenharCampoDadoCabecalho(
      doc,
      "(-) Desconto / Abatimento",
      30,
      y5,
      110,
      20
    );
    this.desenharCampoDadoCabecalho(
      doc,
      "(-) Outras Deduções",
      140,
      y5,
      110,
      20
    );
    this.desenharCampoDadoCabecalho(doc, "(+) Juros / Multa", 250, y5, 110, 20);
    this.desenharCampoDadoCabecalho(
      doc,
      "(+) Outros Acréscimos",
      360,
      y5,
      110,
      20
    );
    this.desenharCampoDadoCabecalho(doc, "(=) Valor Cobrado", 470, y5, 110, 20);

    // Linha 6 - Informações do beneficiário
    const y6 = y5 + 20;
    this.desenharCampoDadoCabecalho(
      doc,
      "Informações de responsabilidade do beneficiário",
      30,
      y6,
      550,
      100
    );

    // Instruções
    let yInstrucao = y6 + 15;
    this.dados.boleto.instrucoes.forEach((instrucao) => {
      if (instrucao) {
        doc.fontSize(9).text(instrucao, 35, yInstrucao);
        yInstrucao += 15;
      }
    });
  }

  /**
   * Desenha o código de barras
   * @param {PDFKit.PDFDocument} doc
   * @returns {Promise<void>}
   * @access private
   */
  async desenharCodigoBarras(doc) {
    const codigoBarras = await this.gerarCodigoBarras();
    const y = 600; // Posição Y para o código de barras

    doc.image(codigoBarras, 30, y, { width: 400, height: 50 });
  }

  /**
   * Desenha os dados do pagador
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharDadosPagador(doc) {
    const y = 670;

    this.desenharCampoDadoCabecalho(doc, "Pagador", 30, y, 550, 50);

    doc
      .fontSize(9)
      .font("Helvetica")
      .text(`${this.dados.pagador.nome}`, 35, y + 12);
    doc.text(
      `${this.dados.pagador.endereco}, ${this.dados.pagador.bairro}`,
      35,
      y + 22
    );
    doc.text(
      `${this.dados.pagador.cidade}/${this.dados.pagador.uf} — ${this.dados.pagador.cep}`,
      35,
      y + 32
    );

    doc.fontSize(8).text("Código de Baixa", 30, y + 60);

    doc
      .fontSize(8)
      .text("Autenticação mecânica - Ficha de Compensação", 400, y + 60);
  }

  /**
   * Desenha um campo com cabeçalho e área para dados
   * @param {PDFKit.PDFDocument} doc
   * @param {string} titulo - Título do campo
   * @param {number} x - Posição X do campo
   * @param {number} y - Posição Y do campo
   * @param {number} largura - Largura do campo
   * @param {number} altura - Altura do campo
   * @returns {void}
   * @access private
   */
  desenharCampoDadoCabecalho(doc, titulo, x, y, largura, altura) {
    // Desenha o retângulo
    doc.rect(x, y, largura, altura).stroke();

    // Adiciona o título
    doc
      .fontSize(6)
      .font("Helvetica-Bold")
      .fillColor("#000000")
      .text(titulo + ":", x + 4, y + 4, { width: largura - 4 });
  }
}

module.exports.BoletoGenerator = BoletoGenerator;

module.exports.Banco = Banco;
module.exports.Carteiras = Carteiras;
