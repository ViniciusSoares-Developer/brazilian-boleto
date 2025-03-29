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

module.exports = {
  calcularFatorVencimento,
};
