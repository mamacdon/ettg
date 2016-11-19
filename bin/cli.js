/*eslint-env node*/
/*eslint-disable no-console*/
var generator = require("../lib/generator")();

console.log("NOW PLAYING:\n");
for (var i = 0; i < 10; i++) {
    console.log(" * " + generator.getString())
}