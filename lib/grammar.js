const randIndex = require("./rand");

module.exports.Grammar = Grammar;
module.exports.Terminal = Terminal;

const START_SYMBOL_NAME = "start";

function Grammar() {
    this.rules = new Map();
}
Grammar.prototype = {
    generate: function() {
        var buf = [];
        var start = this.getRule(START_SYMBOL_NAME);
        if (!start) {
            throw new Error("You need a " + START_SYMBOL_NAME + " rule");
        }
        start.expand(buf, new Trail());
        return buf;
    },
    getRule: function(nonTerminalName) {
        return this.rules.get(nonTerminalName) || null;
    },
    getOrAddRule: function(nonTerminalName) {
        var rule = this.getRule(nonTerminalName);
        if (rule) {
            return rule;
        }
        rule = new Rule(new Nonterminal(nonTerminalName, this));
        this.rules.set(nonTerminalName, rule)
        return rule;
    },
    toString: function() {
        var buf = [];
        for (const r of this.rules.values()) {
            buf.push(r.toString())
        }
        return buf.join("\n")
    }
};

/**
 * Rule
 * Represents one production rule, eg. <start> := <foo> | bar | baz<quux>zot
 */
function Rule(/**Nonterminal*/ lhs) {
    this.lhs = lhs;
    this.choices = null; // Array[Symbol[]]
}
Rule.prototype = {
    getChoices: function() {
        return this.choices;
    },
    setChoices: function(val) {
        if (this.choices) {
            throw new Error("choices already set for Rule " + this);
        }
        this.choices = val;
    },
    expand: function(buf, trail) {
        if (!this.choices) {
            throw new Error("Cannot expand " + this + ": no choices");
        }
        var choiceIndex = randIndex(this.choices);
        trail.push(choiceIndex);
        var choices = this.choices[choiceIndex];
        for (var i=0; i < choices.length; i++) {
            var c = choices[i];
            c.expand(buf, trail); // recurse when symbol is Nonterminal
        }
    },
    toString: function() {
        var choices = this.choices;
        if (!choices.length) {
            return "" + this.lhs + " -> (empty rule)";
        }
        var choicestr = [];
        for (var i=0; i < choices.length; i++) {
            var symbolstr = choices[i].map(c => c.toString()).join();
            choicestr.push(symbolstr);
        }
        return "" + this.lhs + " -> " + choicestr.join("|");
    }
};

/**
 * Symbol
 * @abstract
 */
function Symbol(str) {
    this.str = str;
}
Symbol.prototype = {
    toString: function() {
        return this.str;
    }
};

/**
 * Nonterminal
 */
function Nonterminal(nonTerminalName, grammar) {
    Symbol.call(this, nonTerminalName);
    this.grammar = grammar;
}
Nonterminal.prototype = Object.create(Symbol.prototype);
Nonterminal.prototype.expand = function(buf, trail) {
    // Look up the rule in the grammar where our nonterminal symbol appears on the LHS, then expand that rule
    var rule = this.grammar.getOrAddRule(this.str);
    if (!rule) {
        throw new Error("We are hosed at `" + this.str + "` in " + this.toString());
    }
    rule.expand(buf, trail);
};
Nonterminal.prototype.toString = function() {
    // <foo>
    return "<" + this.str + ">";
};

/**
 * Terminal
 * Eg. bar
 */
function Terminal(value) {
    Symbol.call(this, value);
}
Terminal.prototype = Object.create(Symbol.prototype);
Terminal.prototype.expand = function(buf, trail) {
    // TODO record in trail
    buf.push(this.str);
};

/**
 * Represents a path through the grammar that produces a result, so we can
 * serialize and deserialize them for retrieving cool phrases later
 */
function Trail() {
    this.trail = [];
}
Trail.prototype = {
    push: function(n) {
        this.trail.push(n);
    }
};
