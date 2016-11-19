/*eslint-env node*/
export default Parser;

const START_SYMBOL_NAME = 'start';

function Grammar() {
    this.rules = [];
}
Grammar.prototype = {
    generateString: function() {
        var buf = [];
        var start = this.getRule(START_SYMBOL_NAME);
        if (!start) {
            throw new Error('You need a ' + START_SYMBOL_NAME + ' rule');
        }
        start.expand(buf, new Trail());
        return buf.join('');
    },
    getRule: function(nonTerminalName) {
        var rules = this.rules;
        for (var i=0; i < rules.length; i++) {
            if (rules[i].lhs.str === nonTerminalName) {
                return rules[i];
            }
        }
        return null;
    },
    getOrAddRule: function(nonTerminalName) {
        var rule = this.getRule(nonTerminalName);
        if (!rule) {
            rule = new Rule(new Nonterminal(nonTerminalName, this));
            this.rules.push(rule);
        }
        return rule;
    },
    toString: function() {
        return this.rules.map(function(r) {
            r.toString();
        }).join('\n');
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
            throw new Error('choices already set for Rule ' + this);
        }
        this.choices = val;
    },
    expand: function(buf, trail) {
        if (!this.choices) {
            throw new Error('Cannot expand ' + this + ': no choices');
        }
        var choiceIndex = randRange(0, this.choices.length);
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
            return '' + this.lhs + ' -> (empty rule)';
        }
        var choicestr = [];
        for (var i=0; i < choices.length; i++) {
            var symbolstr = choices[i].map(function(c) {
                return c.toString();
            }).join();
            choicestr.push(symbolstr);
        }
        return '' + this.lhs + ' -> ' + choicestr.join('|');
    }
};

function randRange(min, max) {
    return Math.floor(Math.random()*max + min);
}

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
};
Nonterminal.prototype = Object.create(Symbol.prototype);
Nonterminal.prototype.expand = function(buf, trail) {
    // Look up the rule in the grammar where our nonterminal symbol appears on the LHS, then expand that rule
    var rule = this.grammar.getOrAddRule(this.str);
    if (!rule) {
        throw new Error('We\'re fucked at ' + this.str + ' in ' + this);
    }
    rule.expand(buf, trail);
};
Nonterminal.prototype.toString = function() {
    // <foo>
    return '<' + this.str + '>';
};

/**
 * Terminal
 * Eg. bar
 */
Terminal = function(value) {
    Symbol.call(this, value);
};
Terminal.prototype = Object.create(Symbol.prototype);
Terminal.prototype.expand = function(buf, trail) {
    buf.push(this.str);
};

/**
 * Represents a path through the grammar that produces a result, so we can
 * serialize and deserialize them for retrieving cool phrases later
 */
Trail = function() {
    this.trail = [];
};
Trail.prototype = {
    push: function(n) {
        this.trail.push(n);
    }
};

var whitespace = /\s+/g;
var restOfLine = /.*?\r?\n/g;
var nonTerminalTag = /<(.+?)>/g; //must reset lastIndex

/**
 * Looks for a match of <code>re</code> at index <code>i</code> in <code>str</code>.
 */
function matchAt(/**RegExp*/ re, /**String*/ str, /**Number*/ i, /**Number*/ resetIndex) {
    if (typeof i === 'number') {
        if (!re.global) {
            throw new Error("Regex must have global flag set to use lastIndex");
        }
        re.lastIndex = i;
    }
    var result = re.exec(str);
//        if (result && result.index !== i) {
//            // Must match exactly at i
//            result = null;
//        }
    if (typeof resetIndex === 'number') {
        re.lastIndex = resetIndex;
    }
    return result;
}
function matchAdvance(regex, str, i) {
    var result = matchAt(regex, str, i);
    if (!result) {
        return i;
    } else {
        return i + result[0].length;
    }
}
function passWhitespace(str, i) {
    return matchAdvance(whitespace, str, i);
}
function toNextLine(str, i) {
    return matchAdvance(restOfLine, str, i);
}

function getExprBody(str, i) {
    var len = str.length;
    var inComment = false;
    var buf = [];

loop: for (; i < len; i++) {
        var c = str.charAt(i);
        switch (c) {
        case '#':
            inComment = true;
            break;
        case '\n':
            inComment = false;
            break;
        case ';':
            if (str.charAt(i+1) === ';') {
                i = i+1;
                break loop;
            }
            break;
        default:
            if (!inComment) {
                buf.push(c);
            }
        }
    }
    return [buf.join(''), i+1];
}

/**
 * A parser that builds a Grammar from an input file in BNF-ish format
 * Basically the format needs to be:
 *  <start> := start | <blah>;;
 *  <blah> := blah;;
 */
function Parser(fileText) {
    this._grammar = this.parseGrammar(fileText);
}
Parser.prototype = {
    getGrammar: function() {
        return this._grammar;
    },
    parseGrammar: function(str) {
        var i=0, len = str.length;
        var grammar = new Grammar();
        while (i < len) {
            var c = str[i];
            if (whitespace.test(c)) {
                // Advance past whitespace
                i = passWhitespace(str, i);
            } else if (c === '#') {
                // Comment.
                i = toNextLine(str, i);
            } else if (c === '<') {
                // Rule.
                // Get <nonTerminal>, by searching starting from i
                var result = matchAt(nonTerminalTag, str, i);
                var ruleNonTerminalName = result[1];
                i = result.index + result[1].length; // Go to >
                // pass the :=
                var re = /\s*:=\s*/g;
                result = matchAt(re, str, i);
                i = result.index + result[0].length;

                // Get string of the expression body
                result = getExprBody(str, i);
                var body = result[0];
                i = result[1];
                this._parseRule(grammar, ruleNonTerminalName, body);
            } else {
                throw 'unknown char ' + c + ' at ' + i;
            }
        }
        return grammar;
    },
    _parseRule: function(grammar, lhsName, expr) {
        var choices = [];
        var choicestrs = expr.split(/\s*\|\s*/);
        for (var i=0; i < choicestrs.length; i++) {
            var choice = choicestrs[i];
            var symbols = [];
            // split on nonterminals, if any
            var tokens = choice.split(/(<.+?>)/);
            for (var j=0; j < tokens.length; j++) {
                var token = tokens[j], symbol;
                if (token === '') {
                    // split expr matched entire string
                    continue;
                } else if (token.indexOf('<') !== -1) {
                    // Found a nonterminal tag
                    token = token.trim(); // Nonterminals shouldn't carry whitespace; causes phantom spaces
                    var nonTerminalName = matchAt(nonTerminalTag, token, 0, 0)[1];
                    // A Rule with our nonterminal may exist already
                    var possiblyNewRule = grammar.getOrAddRule(nonTerminalName);
                    symbol = possiblyNewRule.lhs;
                } else if (!/^s*$/.test(token)) { // skip whitespace-only terminals
                    symbol = new Terminal(token);
                }
                symbols.push(symbol);
            }
            choices.push(symbols);
        }
        // A Rule with this Nonterminal will already exist if it was encountered earlier 
        // in the RHS of another Rule's expression. In that case its choices will be empty,
        // and we'll fill them in here.
        var rule = grammar.getOrAddRule(lhsName);
        rule.setChoices(choices);
    }
};