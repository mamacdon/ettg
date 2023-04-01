#!/usr/bin/env node

import Generator from '../lib/generator.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const gen = new Generator({
  loadRules: () => readFileSync(resolve('./rules.txt'), 'utf8')
});

console.log(gen.grammar.toString());
