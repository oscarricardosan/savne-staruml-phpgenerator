
const SavnePhpGenerator = require("./src/SavnePhpGenerator");
const SavnePhpImporter = require("./src/SavnePhpImporter");
let savnePhpGenerator= SavnePhpGenerator.new();
let savnePhpImporter= SavnePhpImporter.new();


function init () {
  savnePhpGenerator.init();
  savnePhpImporter.init();

}

exports.init = init
