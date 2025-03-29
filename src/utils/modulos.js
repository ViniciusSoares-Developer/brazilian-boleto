const { Banco } = require("../enums");

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
 * @param {string} banco
 * @returns {string}
 */
function calculaModulo11(bloco, banco) {
  let multiplicadores = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;

  if (banco === Banco.BANCO_DO_BRASIL) {
    multiplicadores = [2, 3, 4, 5, 6, 7, 8, 9]; // Regra do Banco do Brasil
  } else if (banco === Banco.BRADESCO) {
    multiplicadores = [2, 3, 4, 5, 6, 7]; // Regra do Bradesco
  } else {
    throw new Error("Banco não suportado");
  }

  for (let i = bloco.length - 1, j = 0; i >= 0; i--, j++) {
    const digito = parseInt(bloco[i]);
    soma += digito * multiplicadores[j % multiplicadores.length];
  }

  const resto = soma % 11;
  const digito = 11 - resto;

  if (banco === Banco.BRADESCO) {
    if (digito === 0 || digito === 10 || digito === 11) {
      digito = 1; // Regra do Bradesco
    }
  } else if (banco === Banco.BANCO_DO_BRASIL) {
    if (digito === 10) {
      digito = "X"; // Regra do Banco do Brasil
    } else if (digito === 11) {
      digito = 0;
    }
  }

  return digito.toString();
}

module.exports = {
  calculaModulo11,
  calcularModulo10,
};
