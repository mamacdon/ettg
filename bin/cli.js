#!/usr/bin/env node

/*eslint-env node*/
/*eslint-disable no-console*/
var generator = require("../lib/generator")();

console.log("NOW AVAILABLE ON VIDEOCASSETTE:\n");
for (var i = 0; i < 10; i++) {
    console.log(" * " + generator.getString())
}