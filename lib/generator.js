/*eslint-env node*/
import Parser from "./parser.js";

/**
 * @param options.loadRules Returns the text to be parsed
 */
class Generator {
    constructor(options) {
        options = options || {};
        const text = options.loadRules();
        this.grammar = new Parser(text).getGrammar();
    }

    get() {
        // Massage the result into something displayable
        var words = this.grammar.generate();
        var joined = words.join(" ");
        joined = insertArticles(joined);
        var obj = parseTags(joined);

        // Titlecase everything
        Object.keys(obj).forEach(key => {
            obj[key] = titleCase(obj[key]);
        });
        return obj;
    }

    getString() {
        var obj = this.get();
        if (obj.sequel) {
            return obj.title + " " + obj.sequel + ": " + obj.subtitle
        }
        return obj.title;
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

function insertArticles(str) {
    return str.replace(/__a_an__(\s+)(\w)/g, (match, space, next) => {
        return (/[aeiou]/i.test(next) ? "an" : "a") + space + next;
    });
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

export default Generator;
