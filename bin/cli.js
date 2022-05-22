#!/usr/bin/env node

/*eslint-env node*/
/*eslint-disable no-console*/
var generator = require("../lib/generator")();

for (var i = 0; i < 1500; i++) {
    console.log("" + generator.getString())
}