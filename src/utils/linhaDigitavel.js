const { formatarValorParaCodigo } = require("./formatacao.js");
const { calcularFatorVencimento } = require("./calculo.js");
const { calculaModulo11, calcularModulo10 } = require("./modulos.js");
const { linhaDigitavelValidator } = require("./validator.js");

/**
 * Gera a linha digitável para o Bradesco
 * @param {*} dados
 * @returns {string}
 */
function gerarLinhaDigitavel(dados) {
  const banco = dados.banco.codigo.padStart(3, "0");
  const moeda = "9"; // Real
  const fator = calcularFatorVencimento(dados);
  const valor = formatarValorParaCodigo(dados.boleto.valor);
  const agencia = dados.banco.agencia.padStart(4, "0");
  const carteira = dados.banco.carteira.padStart(2, "0");
  const nossoNumero = dados.boleto.nossoNumero.padStart(11, "0");
  const conta = dados.banco.conta.replace(/\D/g, "").padStart(7, "0");

  // Campo livre específico do Bradesco
  const campoLivre = `${agencia}${carteira}${nossoNumero}${conta}0`;

  // Código de barras
  const codigoBarras = `${banco}${moeda}${fator}${valor}${campoLivre}`;

  // Calcula o DV geral do código de barras
  const dvGeral = calculaModulo11(
    codigoBarras.substring(0, 4) + codigoBarras.substring(5),
    dados.banco.codigo
  );

  // Insere o DV geral na 5ª posição do código de barras
  const codigoBarrasCompleto =
    codigoBarras.substring(0, 4) + dvGeral + codigoBarras.substring(4);

  // Monta os campos da linha digitável
  const campo1 = `${banco}${moeda}${campoLivre.substring(0, 5)}`;
  const dvCampo1 = calcularModulo10(campo1);

  const campo2 = campoLivre.substring(5, 15);
  const dvCampo2 = calcularModulo10(campo2);

  const campo3 = campoLivre.substring(15);
  const dvCampo3 = calcularModulo10(campo3);

  const campo4 = dvGeral;

  const campo5 = `${fator}${valor}`;

  const linhaDigitavel = `${campo1}${dvCampo1} ${campo2}${dvCampo2} ${campo3}${dvCampo3} ${campo4} ${campo5}`;

  // Validar a linha digitável
  linhaDigitavelValidator(linhaDigitavel.replace(/\D/g, ""));

  // Formata a linha digitável
  return linhaDigitavel;
}

module.exports = {
  gerarLinhaDigitavel,
};
