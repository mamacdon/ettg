#!/usr/bin/env node

/*eslint-env node*/
/*eslint-disable no-console*/
var Generator = require("../lib/generator");
var gen = new Generator();

for (var i = 0; i < 1500; i++) {
    console.log("" + gen.getString())
}