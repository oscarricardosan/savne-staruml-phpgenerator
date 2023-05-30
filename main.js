
const SavnePhpGenerator = require("./src/SavnePhpGenerator");
let savnePhpGenerator= SavnePhpGenerator.new();

function init () {
  savnePhpGenerator.init();
}

exports.init = init
