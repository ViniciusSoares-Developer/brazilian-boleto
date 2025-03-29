const { addDays } = require("date-fns");
const { BoletoGenerator } = require("../src/boleto-gen.js");
const { Banco } = require("../src/enums.js");

/**
 * @returns {Promise<string>}
 */
async function gerarBoletoExemplo() {
  try {
    const gerador = new BoletoGenerator({
      banco: {
        codigo: Banco.BRADESCO,
        agencia: "1234",
        conta: "56789-0",
        carteira: "9",
      },
      pagador: {
        nome: "João da Silva",
        cpfCnpj: "123.456.789-00",
        endereco: "Rua das Flores, 123",
        bairro: "Centro",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01234-567",
      },
      beneficiario: {
        nome: "Empresa XYZ Ltda",
        cpfCnpj: "54.927.997/0001-59",
        endereco: "Avenida Paulista, 1000",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01310-100",
      },
      boleto: {
        nossoNumero: "00123456789",
        numeroDocumento: "12345",
        dataVencimento: addDays(new Date(), 30),
        dataEmissao: new Date(),
        valor: 1299.99,
        especieDocumento: "DM",
        instrucoes: [
          "Não receber após o vencimento",
          "Juros de 1% ao mês",
          "Multa de 2% após o vencimento",
          "Pagável em qualquer agência bancária até o vencimento",
        ],
      },
    });

    await gerador.gerarPDFFile();
    const pdf = await gerador.gerarPDFBuffer();
    console.log(pdf);
  } catch (error) {
    console.log("Erro ao gerar boleto:", error.message);
    throw error;
  }
}

gerarBoletoExemplo();

console.log("Boleto gerado com sucesso!");
