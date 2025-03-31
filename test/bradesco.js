const { BoletoGenerator } = require("../src/index.js");
const { Banco } = require("../src/enums.js");

/**
 * @returns {Promise<string>}
 */
async function gerarBoletoExemplo() {
  const item = {
    dataEmissao:
      "Mon Feb 24 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
    dataVencimento:
      "Mon Mar 31 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
    valor: 913.48,
    numeroDocumento: "211022/03",
    codigo: "23792.96003 90000.029372 49000.228103 9 10370000091348",
    observacao:
      "Cobrar Juros ao dia de R$ 1,83 após 31/03/2025 .\r\n" +
      "\r\n" +
      "Protestar após 15 do vencimento.Não nos responsabilizamos por pagamentos efetuados via deposito.\r\n" +
      "\r\n" +
      "\r\n",
    informacao:
      "PAGAR PREFERENCIALMENTE NA REDE BRADESCO, OU EM QUALQUER BANCO ATE O VENCIMENTO",
    tel2Client: "81 9.9970-8491",
    celClient: "8199708491",
    codTransac: 40005212,
    ctrlBoleto: 11457705,
    pagador: {
      nome: "J. F. MAIA DE SIQUEIRA COMERCIO LTDA",
      uf: "PE",
      cidade: "PAULISTA",
      endereco: "AVENIDA PRESIDENTE TANCREDO NEVES",
      bairro: "JARDIM PAULISTA",
      cep: "53409190",
    },
    beneficiario: {
      nome: "NUT-CARP",
      cnpj: "04591114000457",
      endereco: "AV. CONGRESSO EUCARISTICO INTERNACIONAL",
      bairro: "SANTA CRUZ",
      uf: "PE",
      cidade: "CARPINA",
      agencia: "2960",
      agenciaDig: "2 ",
      carteira: "09",
      conta: "2281",
      contaDig: "0",
      nossoNumero: "09/00000293749-5",
      cep: "55811000",
    },
  };

  // const item = {
  //   dataEmissao:
  //     "Tue Feb 25 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
  //   dataVencimento:
  //     "Tue Apr 01 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
  //   valor: 28.830000000000002,
  //   numeroDocumento: "211034/03",
  //   codigo: "23792.96003 90000.029372 71000.228107 9 10380000002883",
  //   observacao:
  //     "Cobrar Juros ao dia de R$ 0,06 após 01/04/2025 .\r\n" +
  //     "\r\n" +
  //     "Protestar após 15 do vencimento.Não nos responsabilizamos por pagamentos efetuados via deposito.\r\n" +
  //     "\r\n" +
  //     "\r\n",
  //   informacao:
  //     "PAGAR PREFERENCIALMENTE NA REDE BRADESCO, OU EM QUALQUER BANCO ATE O VENCIMENTO",
  //   tel2Client: null,
  //   celClient: "8296847343",
  //   codTransac: 10024578,
  //   ctrlBoleto: 11457757,
  //   pagador: {
  //     nome: "META AGRO COMERCIO E REPRESENTACOES LTDA",
  //     uf: "AL",
  //     cidade: "ARAPIRACA",
  //     endereco: "R BENJAMIM FREIRE DE AMORIM",
  //     bairro: "BAIXA GRANDE",
  //     cep: "57300000",
  //   },
  //   beneficiario: {
  //     nome: "NUT-CARP",
  //     cnpj: "04591114000457",
  //     endereco: "AV. CONGRESSO EUCARISTICO INTERNACIONAL",
  //     bairro: "SANTA CRUZ",
  //     uf: "PE",
  //     cidade: "CARPINA",
  //     agencia: "2960",
  //     agenciaDig: "2 ",
  //     carteira: "09",
  //     conta: "2281",
  //     contaDig: "0",
  //     nossoNumero: "09/00000293771-1",
  //     cep: "55811000",
  //   },
  // };

  const numeroFormatado = item.beneficiario.nossoNumero
    .toString()
    .match(/\d+/g);
  const nossoNumero = numeroFormatado[1];

  try {
    const boleto = new BoletoGenerator({
      banco: {
        codigo: Banco.BRADESCO,
        agencia: item.beneficiario.agencia,
        conta: item.beneficiario.conta,
        carteira: item.beneficiario.carteira,
      },
      beneficiario: {
        nome: item.beneficiario.nome,
        cpfCnpj: item.beneficiario.cnpj,
        endereco: item.beneficiario.endereco,
        cep: item.beneficiario.cep,
        cidade: item.beneficiario.cidade,
        uf: item.beneficiario.uf,
        bairro: item.beneficiario.bairro,
      },
      pagador: {
        nome: item.pagador.nome,
        endereco: item.pagador.endereco,
        cep: item.pagador.cep,
        cidade: item.pagador.cidade,
        uf: item.pagador.uf,
        bairro: item.pagador.bairro,
      },
      boleto: {
        nossoNumero,
        dataEmissao: new Date(item.dataEmissao),
        dataVencimento: new Date(item.dataVencimento),
        especieDocumento: "DM",
        instrucoes: [item.informacao, item.observacao],
        numeroDocumento: item.numeroDocumento,
        valor: item.valor,
      },
    });

    await boleto.gerarPDFFile();
    const pdf = await boleto.gerarPDFBuffer();
    console.log(pdf);
  } catch (error) {
    console.log("Erro ao gerar boleto:", error.message);
    throw error;
  }
}

gerarBoletoExemplo();

console.log("Boleto gerado com sucesso!");
