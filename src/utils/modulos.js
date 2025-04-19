// const { Banco } = require("../enums");

/**
 * Calcula o dígito verificador pelo módulo 10 de um número.
 * @param {string} numero - String contendo apenas dígitos numéricos.
 * @return {number} Dígito verificador calculado.
 */
function calcularModulo10(numero) {
  let soma = 0;
  let multiplicador = 2;

  // Percorre os dígitos do número de trás para frente
  for (let i = numero.length - 1; i >= 0; i--) {
    let resultado = parseInt(numero[i]) * multiplicador;
    soma += resultado < 10 ? resultado : resultado - 9;

    // Alterna o multiplicador entre 2 e 1
    multiplicador = multiplicador === 2 ? 1 : 2;
  }

  let resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

/**
 *
 * @param {string} bloco
 * @returns {string}
 */
function calcularModulo11(bloco) {
  let multiplicadores = [2, 3, 4, 5, 6, 7, 8, 9]; // Regra padrão

  let soma = 0;
  let pesoIndex = 0;

  // Percorre os dígitos da direita para a esquerda
  for (let i = bloco.length - 1; i >= 0; i--) {
    const digito = parseInt(bloco[i], 10);
    const peso = multiplicadores[pesoIndex % multiplicadores.length]; // Aplica o peso correto
    soma += digito * peso;
    pesoIndex++;
  }

  const resto = soma % 11;
  return 11 - resto;
}

module.exports = {
  calcularModulo11,
  calcularModulo10,
};
