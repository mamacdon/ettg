/*eslint-env node*/
const Parser = require("./parser");
const rulesText = require("fs").readFileSync("./rules.txt", "utf8");

module.exports = Generator;

function Generator() {
    var grammar = new Parser(rulesText).getGrammar();
    return {
        get: function() {
            // Massage the result into something displayable
            var words = grammar.generate();
            var joined = words.join(" ");
            var obj = parseTags(joined);
            // Titlecase everything
            Object.keys(obj).forEach(key => {
                obj[key] = titleCase(obj[key]);
            });
            return obj;
        },
        getString: function() {
            var obj = this.get();
            if (obj.sequel) {
                return obj.title + " " + obj.sequel + ": " + obj.subtitle
            }
            return obj.title;
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

// parse "[title]foo bar[/title]" into a `title` property with value "foo bar"
// adds property to obj
const blockOpenTag = /\[(\w+)\]/;

function parseTags(str) {
    var obj = Object.create(null);
    parseTagsRec(str, obj);
    return obj;
}

function parseTagsRec(str, obj) {
    var match = blockOpenTag.exec(str);
    if (!match) {
        return obj;
    }
    var tagName = match[1];
    var closeTag = "[/" + tagName + "]";
    var openEndIndex = match.index + match[0].length;
    var closeStartIndex = str.indexOf(closeTag, openEndIndex);
    var tagContent = str.substring(openEndIndex + 1, closeStartIndex);
    obj[tagName] = tagContent.trim(); // remove pesky spaces between content and tag: [title] foo [/title]
    return parseTagsRec(str.substring(closeStartIndex + closeTag.length), obj);
}
