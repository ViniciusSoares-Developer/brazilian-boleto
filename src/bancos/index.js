const bradesco = require("./bradesco.js");
const bancoDoBrasil = require("./bancoDoBrasil.js");

const BRADESCO = new bradesco();
const BANCODOBRASIL = new bancoDoBrasil();

module.exports = {
  BRADESCO,
  BANCODOBRASIL,
};
