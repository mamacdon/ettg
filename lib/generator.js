/* eslint-env node */
import Parser from './parser.js';

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
    const words = this.grammar.generate();
    let joined = words.join(' ');
    joined = insertArticles(joined);
    const obj = parseTags(joined);

    // Titlecase everything
    Object.keys(obj).forEach(key => {
      obj[key] = titleCase(obj[key]);
    });
    return obj;
  }

  getString() {
    const obj = this.get();
    if (obj.sequel) {
      return `${obj.title} ${obj.sequel}: ${obj.subtitle}`;
    }
    return obj.title;
  }
}

function titleCase(str) {
  const result = [];
  const words = str.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word === '') {
      continue;
    }

    const isFirst = i === 0;
    const isShort = /^(of|the|to|in|and|for)$/.test(word);
    const capitalized = word.substr(0, 1).toUpperCase() + word.substr(1);

    if (isFirst) {
      result.push(capitalized);
    } else {
      result.push(` ${isShort ? word : capitalized}`);
    }
  }

  return result.join('');
}

function insertArticles(str) {
  return str.replace(/__a_an__(\s+)(\w)/g, (match, space, next) => {
    return (/[aeiou]/i.test(next) ? 'an' : 'a') + space + next;
  });
}

// parse "[title]foo bar[/title]" into a `title` property with value "foo bar"
// adds property to obj
const blockOpenTag = /\[(\w+)\]/;

function parseTags(str) {
  const obj = Object.create(null);
  parseTagsRec(str, obj);
  return obj;
}

function parseTagsRec(str, obj) {
  const match = blockOpenTag.exec(str);
  if (!match) {
    return obj;
  }

  const tagName = match[1];
  const closeTag = `[/${tagName}]`;
  const openEndIndex = match.index + match[0].length;
  const closeStartIndex = str.indexOf(closeTag, openEndIndex);
  const tagContent = str.substring(openEndIndex + 1, closeStartIndex);

  obj[tagName] = tagContent.trim(); // remove pesky spaces between content and tag: [title] foo [/title]

  return parseTagsRec(str.substring(closeStartIndex + closeTag.length), obj);
}

export default Generator;
