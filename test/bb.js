const { addDays } = require("date-fns");
const { BoletoGenerator } = require("../src/index.js");
const { Banco } = require("../src/enums.js");

/**
 * @returns {Promise<string>}
 */
async function gerarBoletoExemplo() {
  // const item = {
  //   dataEmissao:
  //     "Sun Mar 09 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
  //   dataVencimento:
  //     "Mon Mar 31 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
  //   valor: 2284.67,
  //   numeroDocumento: "134168/03",
  //   codigo: "00190.00009 03309.936007 00341.249175 2 10370000228467",
  //   observacao:
  //     "Cobrar Juros ao dia de R$ 4,57 a partir de 31/03/2025 .\r\n\r\n",
  //   informacao: "PAGÁVEL EM QUALQUER BANCO",
  //   tel2Client: "75988302590",
  //   celClient: "7598017243",
  //   codTransac: 10020309,
  //   ctrlBoleto: 11464862,
  //   pagador: {
  //     nome: "T. A. S COMERCIO DE PRODUTOS PARA ANIMAIS LTDA",
  //     uf: "BA",
  //     cidade: "SAO FELIPE",
  //     endereco: "RUA DOM MACEDO COSTA",
  //     bairro: "CENTRO",
  //     cep: "44550000",
  //   },
  //   beneficiario: {
  //     nome: "NUTRANE-BA",
  //     nome: "NUTRANE-BA",
  //     cnpj: "04591114000708",
  //     endereco: "ROD BA 493 KM 10",
  //     cnpj: "04591114000708",
  //     endereco: "ROD BA 493 KM 10",
  //     endereco: "ROD BA 493 KM 10",
  //     bairro: "ZONA RURAL",
  //     uf: "BA",
  //     cidade: "CASTRO ALVES",
  //     agencia: "3433",
  //     agencia: "3433",
  //     agenciaDig: "9 ",
  //     carteira: "17",
  //     conta: "6868",
  //     contaDig: "3",
  //     nossoNumero: "33099360000341249",
  //     cep: "44500000",
  //   },
  // };

  const item = {
    dataEmissao:
      "Sun Mar 09 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
    dataVencimento:
      "Mon Mar 31 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília)",
    valor: 543.6,
    numeroDocumento: "134163/02",
    codigo: "00190.00009 03309.936007 00341.241172 2 10370000054360",
    observacao:
      "Cobrar Juros ao dia de R$ 1,06 a partir de 31/03/2025 .\r\n\r\n",
    informacao: "PAGÁVEL EM QUALQUER BANCO",
    tel2Client: "75988302590",
    celClient: "7598017243",
    codTransac: 10020309,
    ctrlBoleto: 11464854,
    pagador: {
      nome: "T. A. S COMERCIO DE PRODUTOS PARA ANIMAIS LTDA",
      uf: "BA",
      cidade: "SAO FELIPE",
      endereco: "RUA DOM MACEDO COSTA",
      bairro: "CENTRO",
      cep: "44550000",
    },
    beneficiario: {
      nome: "NUTRANE-BA",
      cnpj: "04591114000708",
      endereco: "ROD BA 493 KM 10",
      bairro: "ZONA RURAL",
      uf: "BA",
      cidade: "CASTRO ALVES",
      agencia: "3433",
      agenciaDig: "9 ",
      carteira: "17",
      conta: "6868",
      contaDig: "3",
      nossoNumero: "33099360000341241",
      cep: "44500000",
    },
  };

  const boleto = new BoletoGenerator({
    banco: {
      codigo: Banco.BANCO_DO_BRASIL,
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
      nossoNumero: item.beneficiario.nossoNumero,
      dataEmissao: new Date(item.dataEmissao),
      dataVencimento: new Date(item.dataVencimento),
      especieDocumento: "DM",
      instrucoes: [item.informacao, item.observacao],
      numeroDocumento: item.numeroDocumento,
      valor: item.valor,
      linhaDigitavel: item.codigo,
    },
  });

  await boleto.gerarPDFFile();
}

gerarBoletoExemplo();

console.log("Boleto gerado com sucesso!");
