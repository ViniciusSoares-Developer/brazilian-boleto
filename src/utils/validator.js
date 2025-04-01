const { Carteiras } = require("../enums.js");

/**
 * @param {string} cpf
 * @returns string
 */
function cpfValidator(cpf) {
  // Remove caracteres não numéricos do CPF
  cpf = cpf.replace(/\D/g, "");

  // Verifica se o CPF tem 11 dígitos e se todos os dígitos são iguais
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    throw new Error("Cpf Invalido");
  }

  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto > 9 ? 0 : resto;
  // Verifica se o primeiro dígito verificador é válido
  if (parseInt(cpf.charAt(9)) !== digito1) {
    throw new Error("Cpf Invalido");
  }

  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto;

  // Verifica se o segundo dígito verificador é válido
  if (parseInt(cpf.charAt(10)) !== digito2) {
    throw new Error("Cpf Invalido");
  }

  // retorna o cpf formatado
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * @param {string} cnpj
 * @returns {string}
 */
function cnpjValidator(cnpj) {
  // Remove caracteres não numéricos do CNPJ
  cnpj = cnpj.replace(/\D/g, "");
  // Verifica se o CNPJ tem 14 dígitos
  if (cnpj.length !== 14) {
    throw new Error("Cnpj Invalido");
  }
  // Calcula o primeiro dígito verificador
  let soma = 0;
  let peso = 2;
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  // Verifica se o primeiro dígito verificador é válido
  if (parseInt(cnpj.charAt(12)) !== digito1) {
    throw new Error("Cnpj Invalido");
  }

  // Calcula o segundo dígito verificador
  soma = 0;
  peso = 2;
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpj.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  // Verifica se o segundo dígito verificador é válido
  if (parseInt(cnpj.charAt(13)) !== digito2) {
    throw new Error("Cnpj Invalido");
  }
  // retorna o cnpj formatado
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/**
 * @param {string} linhaDigitavel
 * @returns {void}
 */
function linhaDigitavelValidator(linhaDigitavel) {
  // Verifica se a linha digitável tem 47 caracteres
  if (linhaDigitavel.length !== 47) {
    throw new Error(
      "Linha digitável inválida, deve ter 47 caracteres e tem " +
        linhaDigitavel.length
    );
  }

  // Verifica se a linha digitável contém apenas caracteres numéricos
  if (!/^\d+$/.test(linhaDigitavel)) {
    throw new Error("Linha digitável inválida");
  }
}

/**
 *
 * @param {string} banco
 * @param {string} carteira
 */
function carteiraValidator(banco, carteira) {
  if (!Carteiras[banco].includes(carteira)) {
    throw new Error("Carteira inválida");
  }
}

module.exports = {
  cpfValidator,
  cnpjValidator,
  linhaDigitavelValidator,
  carteiraValidator,
  isValidDate,
};
