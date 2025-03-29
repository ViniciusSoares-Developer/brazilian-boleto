const Banco = {
  BANCO_DO_BRASIL: "001",
  BRADESCO: "237",
};
module.exports.Banco = Banco;

/**
 * @type {{[key: string]: string[]}}
 */
const Carteiras = {
  "001": ["11", "12", "15", "16", "17", "18"],
  237: ["02", "03", "04", "05", "09", "", ""],
};
module.exports.Carteiras = Carteiras;
