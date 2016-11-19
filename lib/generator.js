/*eslint-env node*/
const Parser = require("./parser");
const rulesText = require("fs").readFileSync("./rules.txt", "utf8");

module.exports = Generator;

function Generator() {
    var grammar = new Parser(rulesText).getGrammar();
    return {
        get: function() {
            var s = grammar.generateString();
            return s
            // titlecase s
        }
    }
}

function titleCase(str) {
    var result = [], words = str.split(/\s+/);
    for (var i=0; i < words.length; i++) {
        var word = words[i];
        if (word === "") {
            continue;
        }
        var isFirst = i === 0,
            isShort = /^(of|the|to|in|and|for)$/.test(word),
            capitalized = word.substr(0,1).toUpperCase() + word.substr(1);
        if (isFirst) {
            result.push(capitalized);
        } else {
            result.push(" " + (isShort ? word : capitalized));
        }
    }
    return result.join("");
}
