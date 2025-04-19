const Banco = require("../banco");

module.exports = class BancoDoBrasil extends Banco {
  carteiras = ["11", "12", "15", "16", "17", "18"];
  nome = "Banco do Brasil";
  codigo = "001";

  campoLivre() {
    if (this.nossoNumero.length === 11) {
      return `${this.nossoNumero}${this.agencia}${this.conta}${this.carteira}`;
    } else if (this.nossoNumero.length === 17) {
      return `000000${this.nossoNumero}${this.carteira}`;
    } else {
      throw new Error("Nosso número inválido");
    }
  }

  /**
   * @param {number} mod11
   * @returns
   */
  dvGeral(mod11) {
    return mod11 === 0 || mod11 === 10 || mod11 === 11 ? "1" : mod11.toString();
  }
};
