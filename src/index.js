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
const { calcularFatorVencimento } = require("./utils/calculo.js");
const {
  cnpjValidator,
  cpfValidator,
  carteiraValidator,
} = require("./utils/validator.js");
const { Banco, Carteiras } = require("./enums.js");
const { dvNossoNumero, calculaModulo11 } = require("./utils/modulos.js");

const pdfConfig = {
  PDFKit: { size: "A4", margin: 20 },
  x: 20,
  y: 20,
  maxWidth: 550,
  linesHeight: 30,
  textX: (x) => x + 20,
  textY: (x) => x + 16,
};

let lastLineHeight = 0;

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
      this.linhaDigitavel =
        dados.boleto.linhaDigitavel || gerarLinhaDigitavel(this.dados);
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

    const campoLivre = gerarCampoLivre(this.dados);
    const dv = calculaModulo11(
      `${banco}${moeda}${fator}${valor}${campoLivre}`,
      this.dados.banco.codigo
    );

    const codigoBarras = `${banco}${moeda}${dv}${fator}${valor}${campoLivre}`;

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
    const doc = new PDFKit(pdfConfig.PDFKit);
    const chunks = [];

    //captura os chunks do PDF em um array
    doc.on("data", (chunk) => chunks.push(chunk));

    // Configurações gerais
    this.configuracoesIniciais(doc);

    // Parte superior (Recibo do Pagador)
    this.desenharCabecalhoRecibo(doc);
    this.desenharDadosRecibo(doc);
    this.desenharLinhaRecortavel(doc);

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
    const yAlign = 10;

    // Título do recibo
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(
        "RECIBO DO PAGADOR",
        pdfConfig.maxWidth - 100,
        pdfConfig.y + yAlign,
        {
          align: "left",
        }
      );

    // Caixa para o código do banco
    doc.rect(pdfConfig.x, pdfConfig.y, 80, 30).stroke();
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(
        `${this.dados.banco.codigo}-${
          this.dados.banco.codigo === Banco.BRADESCO ? "2" : "X"
        }`,
        pdfConfig.x + 20,
        pdfConfig.y + yAlign
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
    const yLine1 = pdfConfig.y + pdfConfig.linesHeight + 10;
    const texts = [
      `${this.dados.beneficiario.nome} - CNPJ: ${this.dados.beneficiario.cpfCnpj}`,
      `${this.dados.beneficiario.endereco}, ${this.dados.beneficiario.bairro}`,
      `${this.dados.beneficiario.cidade}/${this.dados.beneficiario.uf} — ${this.dados.beneficiario.cep}`,
    ];
    this.montarLinha(
      doc,
      [
        {
          title: "Beneficiário",
          value: texts.join("\n"),
          width: pdfConfig.maxWidth,
          height: 60,
        },
      ],
      yLine1
    );

    // Linha 2 - Nome do Pagador, Data Vencimento, Valor Cobrado
    const yLine2 = yLine1 + 60;
    this.montarLinha(
      doc,
      [
        {
          title: "Nome do Pagador",
          value: this.dados.pagador.nome,
          width: 300,
        },
        {
          title: "Data de Vencimento",
          value: formatarData(this.dados.boleto.dataVencimento),
          width: 125,
        },
        { title: "Valor Cobrado", value: "", width: 125, fontSize: 9 },
      ],
      yLine2
    );

    // Linha 3 - Carteira, Espécie Doc, Nº Documento, Valor Documento
    const yLine3 = yLine2 + pdfConfig.linesHeight;
    this.montarLinha(
      doc,
      [
        {
          title: "Carteira",
          value: this.dados.banco.carteira,
          width: 75,
        },
        {
          title: "Espécie Doc.",
          value: this.dados.boleto.especieDocumento,
          width: 75,
        },
        {
          title: "Nº do Documento",
          value: this.dados.boleto.numeroDocumento,
          width: 200,
        },
        {
          title: "Valor do Documento",
          value: formatarMoeda(this.dados.boleto.valor),
          width: 200,
        },
      ],
      yLine3
    );

    // Linha 4 - Data Processamento, Agência/Código, Nosso Número
    const yLine4 = yLine3 + pdfConfig.linesHeight;
    this.montarLinha(
      doc,
      [
        {
          title: "Data Processamento",
          value: formatarData(
            this.dados.boleto.dataProcessamento || new Date()
          ),
        },
        {
          title: "Agência / Código do Beneficiário",
          value: `${this.dados.banco.agencia}/${this.dados.banco.conta}`,
        },
        {
          title: "Nosso Número",
          value: this.dados.boleto.nossoNumero,
        },
      ],
      yLine4
    );

    // Espaço para Autenticação Mecânica
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        "Autenticação Mecânica",
        pdfConfig.maxWidth - 80,
        yLine4 + pdfConfig.linesHeight + 20
      );

    // Linha Digitavel
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(
        this.linhaDigitavel,
        pdfConfig.x + 20,
        yLine4 + pdfConfig.linesHeight + 20
      );

    lastLineHeight = yLine4 + pdfConfig.linesHeight + 20;
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
        "- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -",
        pdfConfig.x,
        lastLineHeight + pdfConfig.linesHeight
      );

    lastLineHeight += pdfConfig.linesHeight;
  }

  /**
   * Desenha o cabeçalho da ficha de compensação
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharCabecalhoFicha(doc) {
    const yLine1 = lastLineHeight + pdfConfig.linesHeight;

    // Caixa para o código do banco
    doc.rect(pdfConfig.x, yLine1, 80, 30).stroke();
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(
        `${this.dados.banco.codigo}-${
          this.dados.banco.codigo === Banco.BRADESCO ? "2" : "X"
        }`,
        pdfConfig.x + 20,
        yLine1 + 10
      );

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(this.linhaDigitavel, 140, yLine1 + 10);

    lastLineHeight = yLine1;
  }

  /**
   * Desenha os dados da ficha de compensação
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharDadosFicha(doc) {
    // Linha 1 - Local de Pagamento e Vencimento
    const yLine1 = lastLineHeight + pdfConfig.linesHeight + 10;
    this.montarLinha(
      doc,
      [
        {
          title: "Local do pagamento",
          value: "PAGÁVEL EM QUALQUER BANCO ATÉ O VENCIMENTO",
          width: 420,
        },
        {
          title: "Vencimento",
          value: formatarData(this.dados.boleto.dataVencimento),
          width: 130,
        },
      ],
      yLine1
    );

    // Linha 2 - Beneficiário, Agência/Código
    const yLine2 = yLine1 + pdfConfig.linesHeight;
    this.montarLinha(
      doc,
      [
        {
          title: "Beneficiário",
          value: this.dados.beneficiario.nome,
          width: 420,
        },
        {
          title: "Agência / Código do Beneficiário",
          value: `${this.dados.banco.agencia}/${this.dados.banco.conta}`,
          width: 130,
        },
      ],
      yLine2
    );

    // Linha 3 - Data Documento, Nº Documento, Espécie Doc, Aceite, Data Processamento
    const yLine3 = yLine2 + pdfConfig.linesHeight;
    const banco = this.dados.banco.codigo;
    this.montarLinha(
      doc,
      [
        {
          title: "Data Documento",
          value: formatarData(this.dados.boleto.dataDocumento || new Date()),
          width: 100,
        },
        {
          title: "Nº Documento",
          value: this.dados.boleto.numeroDocumento,
          width: 100,
        },
        {
          title: "Espécie Doc.",
          value: this.dados.boleto.especieDocumento,
          width: 50,
        },
        {
          title: "Aceite",
          value: "N",
          width: 50,
        },
        {
          title: "Data Processamento",
          value: formatarData(
            this.dados.boleto.dataProcessamento || new Date()
          ),
          width: 100,
        },
        {
          title: "Nosso Número",
          value:
            banco !== Banco.BANCO_DO_BRASIL
              ? `${this.dados.banco.carteira}/${
                  this.dados.boleto.nossoNumero
                }-${dvNossoNumero(this.dados.boleto.nossoNumero, banco)}`
              : this.dados.boleto.nossoNumero,
          width: 150,
        },
      ],
      yLine3
    );

    // Linha 4 - Uso do Banco, CIP, Carteira, Moeda, Quantidade, Valor
    const yLine4 = yLine3 + pdfConfig.linesHeight;
    this.montarLinha(
      doc,
      [
        {
          title: "Uso do Banco",
          value: "",
          width: 70,
        },
        {
          title: "CIP",
          value: "",
          width: 100,
        },
        {
          title: "Carteira",
          value: this.dados.banco.carteira,
          width: 70,
        },
        {
          title: "Moeda",
          value: "R$",
          width: 70,
        },
        {
          title: "Quantidade",
          value: "",
          width: 110,
        },
        {
          title: "(=) Valor do Documento",
          value: formatarMoeda(this.dados.boleto.valor),
          width: 130,
        },
      ],
      yLine4
    );

    // Linha 5 - Valor do documento, Descontos, Abatimentos, Outras Deduções, Juros / Multa, Outros Acréscimos, Valor Cobrado
    const yLine5 = yLine4 + pdfConfig.linesHeight;
    this.montarLinha(
      doc,
      [
        {
          title: "(-) Desconto / Abatimento",
          value: "",
        },
        {
          title: "(-) Outras Deduções",
          value: "",
        },
        {
          title: "(+) Juros / Multa",
          value: "",
        },
        {
          title: "(+) Outros Acréscimos",
          value: "",
        },
        {
          title: "(=) Valor Cobrado",
          value: "",
        },
      ],
      yLine5
    );

    // Linha 6 - Informações do beneficiário
    const yLine6 = yLine5 + pdfConfig.linesHeight;
    this.montarLinha(
      doc,
      [
        {
          title: "Informações de responsabilidade do beneficiário",
          value: this.dados.boleto.instrucoes.join("\n"),
          width: 550,
          height: 100,
        },
      ],
      yLine6
    );
    lastLineHeight = yLine6 + 100;
  }

  /**
   * Desenha o código de barras
   * @param {PDFKit.PDFDocument} doc
   * @returns {Promise<void>}
   * @access private
   */
  async desenharCodigoBarras(doc) {
    const codigoBarras = await this.gerarCodigoBarras();
    const y = lastLineHeight + 30; // Posição Y para o código de barras

    //mudar para renderizar com font
    doc.image(codigoBarras, pdfConfig.x, y, { width: 400, height: 50 });
    lastLineHeight = y + 50;
  }

  /**
   * Desenha os dados do pagador
   * @param {PDFKit.PDFDocument} doc
   * @returns {void}
   * @access private
   */
  desenharDadosPagador(doc) {
    const y = lastLineHeight + 10;

    const texts = [
      `${this.dados.pagador.nome}`,
      `${this.dados.pagador.endereco}, ${this.dados.pagador.bairro}`,
      `${this.dados.pagador.cidade}/${this.dados.pagador.uf} — ${this.dados.pagador.cep}`,
    ];
    const height = 70;
    this.montarLinha(
      doc,
      [
        {
          title: "Pagador",
          value: texts.join("\n"),
          width: 550,
          height,
        },
      ],
      y
    );

    doc.fontSize(8).text("Código de Baixa", pdfConfig.x + 20, y + height + 10);

    doc
      .fontSize(8)
      .text(
        "Autenticação mecânica - Ficha de Compensação",
        350,
        y + height + 10
      );
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
      .text(titulo, x + 5, y + 5, { width: largura - 4 });
  }

  /**
   * Gera os dados para a linha
   * @param {PDFKit.PDFDocument} doc
   * @param {{ title: string, value: any, width?: number, height?: number, fontSize: number }[]} arr
   * @param {number} linePos - Posição Y da linha
   * @access private
   */
  montarLinha(doc, arr, linePos) {
    const totalWidth = arr.reduce((acc, e) => (acc += e.width || 0), 0);
    if (totalWidth > pdfConfig.maxWidth) {
      throw new Error("Linha muito grande");
    }

    const widthDefault =
      (pdfConfig.maxWidth - totalWidth) / arr.filter((e) => !e.width).length;
    let lastLineWidth = 0;
    arr.forEach((e) => {
      this.desenharCampoDadoCabecalho(
        doc,
        e.title,
        pdfConfig.x + lastLineWidth,
        linePos,
        e.width || widthDefault,
        e.height || pdfConfig.linesHeight
      );
      if (e.value) {
        doc
          .fontSize(e.fontSize || 9)
          .text(
            e.value,
            pdfConfig.textX(pdfConfig.x + lastLineWidth),
            pdfConfig.textY(linePos),
            {
              lineBreak: true,
              lineGap: 5,
            }
          );
      }

      lastLineWidth += e.width || widthDefault;
    });
  }
}

module.exports.BoletoGenerator = BoletoGenerator;

module.exports.Banco = Banco;
module.exports.Carteiras = Carteiras;
