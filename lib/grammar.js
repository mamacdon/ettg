import randIndex from './rand.js';

const START_SYMBOL_NAME = 'start';

class Grammar {
  constructor() {
    this.rules = new Map();
  }

  generate() {
    const buf = [];
    const start = this.getRule(START_SYMBOL_NAME);
    if (!start) {
      throw new Error(`You need a ${START_SYMBOL_NAME} rule`);
    }

    start.expand(buf, new Trail());

    return buf;
  }

  getRule(nonTerminalName) {
    return this.rules.get(nonTerminalName) || null;
  }

  getOrAddRule(nonTerminalName) {
    let rule = this.getRule(nonTerminalName);
    if (rule) {
      return rule;
    }

    rule = new Rule(new Nonterminal(nonTerminalName, this));
    this.rules.set(nonTerminalName, rule);
    return rule;
  }

  toString() {
    const buf = [];
    for (const r of this.rules.values()) {
      buf.push(r.toString());
    }

    return buf.join('\n');
  }
}

/**
 * Rule
 * Represents one production rule, eg. <start> := <foo> | bar | baz<quux>zot
 */
class Rule {
  constructor(/** Nonterminal */ lhs) {
    this.lhs = lhs;
    this.choices = null; // Array[Symbol[]]
  }

  getChoices() {
    return this.choices;
  }

  setChoices(val) {
    if (this.choices) {
      throw new Error(`choices already set for Rule ${this}`);
    }

    this.choices = val;
  }

  expand(buf, trail) {
    if (!this.choices) {
      throw new Error(`Cannot expand ${this}: no choices`);
    }

    const choiceIndex = randIndex(this.choices);
    trail.push(choiceIndex);

    const choices = this.choices[choiceIndex];
    for (let i = 0; i < choices.length; i++) {
      const c = choices[i];
      c.expand(buf, trail); // recurse when symbol is Nonterminal
    }
  }

  toString() {
    const choices = this.choices;
    if (!choices.length) {
      return `${this.lhs} -> (empty rule)`;
    }

    const choicestr = [];
    for (let i = 0; i < choices.length; i++) {
      const symbolstr = choices[i].map(c => c.toString()).join();
      choicestr.push(symbolstr);
    }

    return '' + this.lhs + ' -> ' + choicestr.join('|');
  }
}

/**
 * Symbol
 * @abstract
 */
class Symbol {
  constructor(str) {
    this.str = str;
  }

  toString() {
    return this.str;
  }
}

/**
 * Nonterminal
 */
class Nonterminal extends Symbol {
  constructor(nonTerminalName, grammar) {
    super(nonTerminalName);
    this.grammar = grammar;
  }

  expand(buf, trail) {
    // Look up the rule in the grammar where our nonterminal symbol appears on the LHS, then expand that rule
    const rule = this.grammar.getOrAddRule(this.str);
    if (!rule) {
      throw new Error(`We are hosed at \`${this.str}\` in ${this.toString()}`);
    }

    rule.expand(buf, trail);
  }

  toString() {
    // <foo>
    return `<${this.str}>`;
  }
}

/**
 * Terminal
 * Eg. bar
 */
class Terminal extends Symbol {
  expand(buf, trail) {
    // TODO record in trail
    buf.push(this.str);
  }
}

/**
 * Represents a path through the grammar that produces a result, so we can
 * serialize and deserialize them for retrieving cool phrases later
 */
class Trail {
  constructor() {
    this.trail = [];
  }

  push(n) {
    this.trail.push(n);
  }
}

export { Grammar, Terminal };
