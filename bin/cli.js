/*eslint-env node*/
/*eslint-disable no-console*/
var generator = require("../lib/generator")();

for (var i = 0; i < 10; i++) {
    console.log(generator.get())
}