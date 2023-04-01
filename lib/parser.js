import { Grammar, Terminal } from './grammar.js';

const whitespace = /\s+/g;
const restOfLine = /.*?\r?\n/g;
const nonTerminalTag = /<(.+?)>/g; // must reset lastIndex

/**
 * A parser that builds a Grammar from an input file in BNF-ish format
 * Basically the format needs to be:
 *  <start> := start | <blah>;;
 *  <blah> := blah;;
 */
class Parser {
  constructor(fileText) {
    this._grammar = this.parseGrammar(fileText);
  }

  getGrammar() {
    return this._grammar;
  }

  parseGrammar(str) {
    let i = 0; const len = str.length;
    const grammar = new Grammar();
    while (i < len) {
      const c = str[i];
      if (whitespace.test(c)) {
        // Advance past whitespace
        i = passWhitespace(str, i);
      } else if (c === '#') {
        // Comment.
        i = toNextLine(str, i);
      } else if (c === '<') {
        // Rule.
        // Get <nonTerminal>, by searching starting from i
        let result = matchAt(nonTerminalTag, str, i);
        const ruleNonTerminalName = result[1];
        i = result.index + result[1].length; // Go to >

        // pass the :=
        const re = /\s*:=\s*/g;
        result = matchAt(re, str, i);
        i = result.index + result[0].length;

        // Get string of the expression body
        result = getExprBody(str, i);
        const body = result[0];
        i = result[1];
        this._parseRule(grammar, ruleNonTerminalName, body);
      } else {
        throw new Error('unknown char `' + c + '` at ' + i);
      }
    }
    return grammar;
  }

  _parseRule(grammar, lhsName, expr) {
    const choices = [];
    const choicestrs = expr.split(/\s*\|\s*/);
    for (let i = 0; i < choicestrs.length; i++) {
      const choice = choicestrs[i];
      const symbols = [];
      // split on nonterminals, if any
      const tokens = choice.split(/(<.+?>)/);
      for (let j = 0; j < tokens.length; j++) {
        let token = tokens[j]; var symbol;
        token = token.trim();
        if (/^\s*$/.test(token)) {
          // just whitespace, ignore
          continue;
        } else if (token.indexOf('<') !== -1) {
          // Found a nonterminal tag
          const nonTerminalName = matchAt(nonTerminalTag, token, 0, 0)[1];
          // A Rule with our nonterminal may exist already
          const possiblyNewRule = grammar.getOrAddRule(nonTerminalName);
          symbol = possiblyNewRule.lhs;
        } else {
          symbol = new Terminal(token);
        }
        symbols.push(symbol);
      }
      choices.push(symbols);
    }
    // A Rule with this Nonterminal will already exist if it was encountered earlier
    // in the RHS of another Rule's expression. In that case its choices will be empty,
    // and we'll fill them in here.
    const rule = grammar.getOrAddRule(lhsName);
    rule.setChoices(choices);
  }
}

/**
 * Looks for a match of <code>re</code> at index <code>i</code> in <code>str</code>.
 * @param {RegExp} re
 * @param {string} str
 * @param {number} i
 * @param {number} resetIndex
 */
function matchAt(re, str, i, resetIndex) {
  if (typeof i === 'number') {
    if (!re.global) {
      throw new Error('Regex must have global flag set to use lastIndex');
    }
    re.lastIndex = i;
  }
  const result = re.exec(str);
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
  const result = matchAt(regex, str, i);
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
  const len = str.length;
  let inComment = false;
  const buf = [];

  // eslint-disable-next-line no-labels
  loop:
  for (; i < len; i++) {
    const c = str.charAt(i);
    switch (c) {
      case '#':
        inComment = true;
        break;

      case '\n':
        inComment = false;
        break;

      case ';':
        if (str.charAt(i + 1) === ';') {
          i = i + 1;
          // eslint-disable-next-line no-labels
          break loop;
        }
        break;

      default:
        if (!inComment) {
          buf.push(c);
        }
    }
  }
  
  return [buf.join(''), i + 1];
}

export default Parser;
