const { calculaModulo11 } = require("./modulos.js");
const { formatarValorParaCodigo } = require("./formatacao.js");

/**
 * @param {*} dados
 * @returns {string}
 */
function calcularFatorVencimento(dados) {
  const dataBase = new Date(2022, 4, 29);
  const dataVencimento = dados.boleto.dataVencimento;

  // Obtém a diferença em dias
  const diferencaDias = Math.floor(
    (dataVencimento.getTime() - dataBase.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diferencaDias < 0) {
    throw new Error("A data de vencimento não pode ser anterior à data base.");
  }

  if (diferencaDias > 9999) {
    throw new Error(
      "A data de vencimento não pode ser mais de 9999 dias no futuro."
    );
  }

  return diferencaDias.toString().padStart(4, "0");
}

/**
 *
 * @param {*} dados
 * @param {string} campoLivre
 * @returns {string}
 */
function calcularDvGeral(dados, campoLivre) {
  const banco = dados.banco.codigo.padStart(3, "0");
  const moeda = "9"; // Real
  const fator = calcularFatorVencimento(dados);
  const valor = formatarValorParaCodigo(dados.boleto.valor);

  // Código de barras
  const codigoBarras = `${banco}${moeda}${fator}${valor}${campoLivre}`;

  // Calcula o DV geral do código de barras
  return calculaModulo11(
    codigoBarras.substring(0, 4) + codigoBarras.substring(5),
    dados.banco.codigo
  );
}

module.exports = {
  calcularFatorVencimento,
  calcularDvGeral,
};
