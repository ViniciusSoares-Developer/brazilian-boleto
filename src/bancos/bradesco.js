const Banco = require("../banco");

module.exports = class Bradesco extends Banco {
  carteiras = ["02", "03", "04", "05", "09"];
  nome = "Banco Bradesco S.A.";
  codigo = "237";

  campoLivre() {
    return `${this.agencia}${this.carteira}${this.nossoNumero}${this.conta}0`;
  }

  /**
   * @param {number} mod11
   * @returns
   */
  dvGeral(mod11) {
    return mod11 === 0 || mod11 === 10 || mod11 === 11 ? "1" : mod11.toString();
  }
};
