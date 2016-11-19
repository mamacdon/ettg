const grammar = require("./grammar");
const Grammar = grammar.Grammar;
const Terminal = grammar.Terminal;

module.exports = Parser;

const whitespace = /\s+/g;
const restOfLine = /.*?\r?\n/g;
const nonTerminalTag = /<(.+?)>/g; //must reset lastIndex

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
            } else if (c === "#") {
                // Comment.
                i = toNextLine(str, i);
            } else if (c === "<") {
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
                throw "unknown char " + c + " at " + i;
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
                if (token === "") {
                    // split expr matched entire string
                    continue;
                } else if (token.indexOf("<") !== -1) {
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

/**
 * Looks for a match of <code>re</code> at index <code>i</code> in <code>str</code>.
 * @param {RegExp} re
 * @param {string} str
 * @param {number} i
 * @param {number} resetIndex
 */
function matchAt(re, str, i, resetIndex) {
    if (typeof i === "number") {
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
    if (typeof resetIndex === "number") {
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

loop: //eslint-disable-line indent
    for (; i < len; i++) {
        var c = str.charAt(i);
        switch (c) {
        case "#":
            inComment = true;
            break;
        case "\n":
            inComment = false;
            break;
        case ";":
            if (str.charAt(i+1) === ";") {
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
    return [buf.join(""), i+1];
}
