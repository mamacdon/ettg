#!/usr/bin/env node

const generator = require("../lib/generator")();
console.log(generator.grammar.toString());
