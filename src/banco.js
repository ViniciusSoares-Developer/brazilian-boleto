const {
  codigoDeBarrasValidator,
  linhaDigitavelValidator,
} = require("./utils/validator.js");
const { calcularModulo11, calcularModulo10 } = require("./utils/modulos.js");
const { calcularFatorVencimento } = require("./utils/calculo.js");
const { formatarValorParaCodigo } = require("./utils/formatacao.js");

module.exports = class Banco {
  setData(boleto, beneficiario) {
    this.agencia = beneficiario.agencia.padStart(4, "0");
    this.carteira = beneficiario.carteira.padStart(2, "0");
    if (!this.carteiras.find((e) => e === this.carteira)) {
      throw new Error("Carteira inválida");
    }
    this.nossoNumero = boleto.nossoNumero.padStart(11, "0");
    this.conta = beneficiario.conta.replace(/\D/g, "").padStart(7, "0");
    this.moeda = "9"; // Real
    this.fator = calcularFatorVencimento(boleto.dataVencimento);
    this.valor = formatarValorParaCodigo(boleto.valor);
  }

  // Gera a linha digitável
  linhaDigitavel() {
    // Gerar Campo Livre
    const campoLivre = this.campoLivre();

    const codigoBarras = this.codigoDeBarras(campoLivre);

    // Calcula o DV geral do código de barras
    const dvGeral = this.dvGeral(calcularModulo11(codigoBarras));

    // Monta os campos da linha digitável
    const campo1 = `${this.codigo}${this.moeda}${campoLivre.substring(0, 5)}`;
    const dvCampo1 = calcularModulo10(campo1);

    const campo2 = campoLivre.substring(5, 15);
    const dvCampo2 = calcularModulo10(campo2);

    const campo3 = campoLivre.substring(15);
    const dvCampo3 = calcularModulo10(campo3);

    const campo4 = dvGeral;

    const campo5 = `${this.fator}${this.valor}`;

    const linhaDigitavel = `${campo1}${dvCampo1} ${campo2}${dvCampo2} ${campo3}${dvCampo3} ${campo4} ${campo5}`;

    // Validar a linha digitável
    linhaDigitavelValidator(linhaDigitavel.replace(/\D/g, ""));

    // Formata a linha digitável
    return linhaDigitavel;
  }

  /**
   * Gera o código de barras sem DV
   * @param {string} campoLivre
   * @returns {string}
   */
  codigoDeBarras(campoLivre) {
    // Código de barras
    return `${this.codigo}${this.moeda}${this.fator}${this.valor}${campoLivre}`;
  }

  /**
   * Gerar o código de barras com DV
   * @param {string} codigoDeBarras
   * @param {string} dv
   * @returns {string}
   */
  codigoDeBarrasCompleto() {
    const codigoDeBarrasSemDv = this.codigoDeBarras(this.campoLivre());
    const dv = this.dvGeral(calcularModulo11(codigoDeBarrasSemDv));
    const codigoDeBarrasComDV = `${codigoDeBarrasSemDv.slice(
      0,
      4
    )}${dv}${codigoDeBarrasSemDv.slice(4)}`;
    codigoDeBarrasValidator(codigoDeBarrasComDV);
    return codigoDeBarrasComDV;
  }
};
