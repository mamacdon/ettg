#!/usr/bin/env node

/*eslint-env node*/
/*eslint-disable no-console*/
import Generator from "../lib/generator.js";
import { readFileSync } from 'fs';
import { resolve } from 'path';

const gen = new Generator({
    loadRules: () => readFileSync(resolve("./rules.txt"), "utf8")
});

for (var i = 0; i < 1500; i++) {
    console.log("" + gen.getString())
}