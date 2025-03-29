const { format } = require("date-fns");
const { ptBR } = require("date-fns/locale");

/**
 * Formata o valor para o padrão brasileiro
 * @param {number} valor
 * @returns {string}
 */
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/**
 * Formata a data para o padrão brasileiro
 * @param {Date} data
 * @returns {string}
 */

function formatarData(data) {
  return format(data, "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Formata o valor para o padrão de código
 * @param {number} valor
 * @returns {string}
 */

function formatarValorParaCodigo(valor) {
  return Math.floor(valor * 100)
    .toString()
    .padStart(10, "0");
}

module.exports = {
  formatarMoeda,
  formatarData,
  formatarValorParaCodigo,
};
