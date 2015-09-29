/*!
 * sqlite-parser - v0.12.0
 * @copyright 2015 Code School (http://codeschool.com)
 * @author Nick Wronski <nick@javascript.com>
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sqliteParser = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * sqlite-parser
 */
var parser = require('./lib/parser');
function sqliteParser(source, callback) {
  try {
    callback(null, parser.parse(source));
  } catch (e) {
    callback(e);
  }
}

sqliteParser['NAME'] = 'sqlite-parser';
sqliteParser['VERSION'] = '0.12.0';

module.exports = sqliteParser;

},{"./lib/parser":3}],2:[function(require,module,exports){
/**
 * sqlite-parser utilities
 */
var slice = [].slice;

function makeArray(arr) {
  return !isArray(arr) ? (isOkay(arr) ? [arr] : []) : arr;
}

function typed(obj) {
  return Object.prototype.toString.call(obj);
}

function isPlain(obj) {
  return typed(obj) === '[object Object]';
}

function isPattern(obj) {
  return typed(obj) === '[object RegExp]';
}

function isFunc(obj) {
  return typed(obj) === '[object Function]';
}

function isString(obj) {
  return typed(obj) === '[object String]';
}

function isArray(obj) {
  return Array.isArray ? Array.isArray(obj) : (typed(obj) === '[object Array]');
}

function isOkay(obj) {
  return obj != null;
}

function collapse(arr) {
  var i, len, n, obj, ref, v;
  if (isArray(arr) && arr.length) {
    obj = {};
    for (i = 0, len = arr.length; i < len; i++) {
      ref = arr[i], n = ref.name, v = ref.value;
      obj[n] = v;
    }
    return obj;
  } else {
    return {};
  }
}

function compose(args, glue) {
  var conc = isArray(glue), res, start = conc ? [] : '';
  if (!isOkay(glue)) {
    glue = ' ';
  }
  res = args.reduce(function (prev, cur) {
    return conc ? (isOkay(cur) ? prev.concat(cur) : prev) :
                  (prev + (isOkay(cur) ? textNode(cur) + glue : ''));
  }, start);
  return conc ? res : res.trim();
}

function stack(arr) {
  return (isArray(arr) ?
    arr.map(function (elem) {
      return elem[1];
    }) : []);
}

function nodeToString(node) {
  var elem = ((isArray(node) || isString(node)) ? node : []);
  if (isArray(elem)) {
    if (elem.length && isArray(elem[0])) {
      elem = stack(elem);
    }
    elem = elem.join('');
  }
  return elem;
}

function textNode(elem) {
  /*
   * A text node has
   * - no leading or trailing whitespace
   */
  return nodeToString(elem).trim();
}

function textMerge() {
  return compose.call(this, slice.call(arguments, 0), '');
}

function unescape(str, quoteChar) {
  var re;
  if (quoteChar == null) {
    quoteChar = '\'';
  }
  re = new RegExp(quoteChar + '{2}', 'g');
  return nodeToString(str).replace(re, quoteChar);
}

function extend() {
  var first = arguments[0],
      rest = slice.call(arguments, 1);

  rest.forEach(function (next) {
    if (isOkay(next) && isPlain(next)) {
      var key;
      for (key in next) {
        if (next.hasOwnProperty(key)) {
          first[key] = next[key];
        }
      }
    }
  });

  return first;
}

function has(thing, item) {
  var k, v, len;
  if (isArray(thing)) {
    if (isString(item)) {
      // thing is an array, find substring item
      return thing.indexOf(item) !== -1;
    } else {
      // thing is an array, find item in array
      return findWhere(thing, item) !== undefined;
    }
  } else if (isPlain(thing)) {
    if (isFunc(item)) {
      return item(thing);
    } else if (isPlain(item)) {
      // item is an object, find each prop key and value in item within thing
      for (k in item) {
        v = item[k];
        if (!(thing.hasOwnProperty(k) && thing[k] === v)) {
          return false;
        }
      }
      return true;
    } else if (isArray(item)) {
      // item is an array, find each string prop within thing
      for (i = 0, len = item.length; i < len; i++) {
        k = item[i];
        if (!thing.hasOwnProperty(k)) {
          return false;
        }
      }
      return true;
    } else {
      // thing is an object, item is a string, find item string in thing
      return thing.hasOwnProperty(item);
    }
  }
  return false;
}

function findWhere(arr, props) {
  var i, len, val;
  for (i = 0, len = arr.length; i < len; i++) {
    val = arr[i];
    if (has(val, props)) {
      return val;
    }
  }
  return null;
}

function key(elem) {
  return textNode(elem).toLowerCase();
}

function keyify(arr, glue) {
  return key(compose(arr, glue));
}

function listify() {
  return compose.call(this, slice.call(arguments, 0), []);
}

function findLastIndex(arr, props) {
  return findLast(arr, props, true);
}

function findLast(arr, props, index) {
  var elem, i;
  for (i = arr.length - 1; i >= 0; i += -1) {
    elem = arr[i];
    if (has(elem, props)) {
      return index ? i : elem;
    }
  }
  return index ? -1 : null;
}

function takeWhile(arr, func) {
  var elem, i, len;
  for (i = 0, len = arr.length; i < len; i++) {
    elem = arr[i];
    if (!func(elem)) {
      break;
    }
  }
  return arr.slice(0, i);
}

function isArrayOkay(arr) {
  if (isArray(arr)) {
    return arr.length > 0 && isOkay(arr[0]);
  }
  return false;
}

module.exports = {
  // Array methods
  'stack':                stack,
  'collapse':             collapse,
  'compose':              compose,
  'findWhere':            findWhere,
  'has':                  has,
  'findLastIndex':        findLastIndex,
  'findLast':             findLast,
  'takeWhile':            takeWhile,
  'isArrayOkay':          isArrayOkay,
  'listify':              listify,
  // String methods
  'nodeToString':         nodeToString,
  'textNode':             textNode,
  'unescape':             unescape,
  'key':                  key,
  'keyify':               keyify,
  'textMerge':            textMerge,
  // Type detection
  'typed':                typed,
  'isPlain':              isPlain,
  'isPattern':            isPattern,
  'isFunc':               isFunc,
  'isString':             isString,
  'isArray':              isArray,
  'isOkay':								isOkay,
  // Misc methods
  'extend':               extend,
  'makeArray':            makeArray
};

},{}],3:[function(require,module,exports){
module.exports = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = function(s) {
            return util.extend({}, s);
          },
        peg$c1 = function(f, b) {
            return {
              'statement': util.listify(f, b)
            };
          },
        peg$c2 = function(s) { return s; },
        peg$c3 = { type: "other", description: "Expression" },
        peg$c4 = function(t) { return t; },
        peg$c5 = { type: "other", description: "Logical Expression Group" },
        peg$c6 = function(l, o, r) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(o),
              'left': l,
              'right': r
            };
          },
        peg$c7 = { type: "other", description: "Wrapped Expression" },
        peg$c8 = function(n) { return n; },
        peg$c9 = { type: "other", description: "Unary Expression" },
        peg$c10 = function(o, e) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'operation',
              'expression': e,
              'operator': util.key(o)
            };
          },
        peg$c11 = { type: "other", description: "CAST Expression" },
        peg$c12 = function(s, e, a) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': util.key(s),
              'expression': e,
              'as': a
            };
          },
        peg$c13 = { type: "other", description: "Type Alias" },
        peg$c14 = function(d) { return d; },
        peg$c15 = { type: "other", description: "EXISTS Expression" },
        peg$c16 = function(n, e) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'exists',
              'expression': e,
              'operator': util.key(n)
            };
          },
        peg$c17 = { type: "other", description: "EXISTS Keyword" },
        peg$c18 = function(n, x) { return util.compose([n, x]); },
        peg$c19 = { type: "other", description: "CASE Expression" },
        peg$c20 = function(t, e, w, s) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': util.key(t),
              'expression': e,
              'condition': util.listify(w, s)
            };
          },
        peg$c21 = { type: "other", description: "WHEN Clause" },
        peg$c22 = function(s, w, t) {
            return {
              'type': 'condition',
              'format': util.key(s),
              'when': w,
              'then': t
            };
          },
        peg$c23 = { type: "other", description: "ELSE Clause" },
        peg$c24 = function(s, e) {
            return {
              'type': 'condition',
              'format': util.key(s),
              'else': e
            };
          },
        peg$c25 = { type: "other", description: "RAISE Expression" },
        peg$c26 = function(s, a) {
            return util.extend({
              'type': 'expression',
              'format': 'unary',
              'variant': util.key(s),
              'expression': a
            }, a);
          },
        peg$c27 = { type: "other", description: "RAISE Expression Arguments" },
        peg$c28 = function(a) {
            return util.extend({
              'type': 'error'
            }, a);
          },
        peg$c29 = { type: "other", description: "IGNORE Keyword" },
        peg$c30 = function(f) {
            return {
              'action': util.key(f)
            };
          },
        peg$c31 = function(f, m) {
            return {
              'action': util.key(f),
              'message': m
            };
          },
        peg$c32 = { type: "other", description: "COLLATE Expression" },
        peg$c33 = function(v, s, c) {
            return util.extend(v, {
              'collate': c
            });
          },
        peg$c34 = { type: "other", description: "Comparison Expression" },
        peg$c35 = function(v, n, m, e, x) {
            return util.extend({
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.keyify([n, m]),
              'left': v,
              'right': e
            }, x);
          },
        peg$c36 = { type: "other", description: "ESCAPE Expression" },
        peg$c37 = function(s, e) {
            return {
              'escape': e
            };
          },
        peg$c38 = { type: "other", description: "NULL Expression" },
        peg$c39 = function(v, n) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'operation',
              'expression': v,
              'operation': n
            };
          },
        peg$c40 = { type: "other", description: "NULL Keyword" },
        peg$c41 = function(i, n) { return util.keyify([i, n]); },
        peg$c42 = function(t) { return util.key(t); },
        peg$c43 = { type: "other", description: "IS Keyword" },
        peg$c44 = function(i, n) {
            return util.keyify([i, n]);
          },
        peg$c45 = function(n) { return util.textNode(n); },
        peg$c46 = { type: "other", description: "BETWEEN Expression" },
        peg$c47 = function(v, n, b, e1, s, e2) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.keyify([n, b]),
              'left': v,
              'right': {
                'type': 'expression',
                'format': 'binary',
                'variant': 'operation',
                'operation': util.key(s),
                'left': e1,
                'right': e2
              }
            };
          },
        peg$c48 = { type: "other", description: "IN Expression" },
        peg$c49 = function(v, n, i, e) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.keyify([n, i]),
              'left': v,
              'right': e
            };
          },
        peg$c50 = function(e) { return e; },
        peg$c51 = { type: "other", description: "Type Definition" },
        peg$c52 = function(n, a) {
            return util.extend({
              'type': 'datatype',
              'variant': n[0],
              'affinity': n[1],
              'args': [] // datatype definition arguments
            }, a);
          },
        peg$c53 = { type: "other", description: "Type Definition Arguments" },
        peg$c54 = function(a1, a2) {
            return {
              'args': util.listify(a1, a2)
            };
          },
        peg$c55 = { type: "other", description: "Null Literal" },
        peg$c56 = function(n) {
            return {
              'type': 'literal',
              'variant': 'null',
              'value': util.key(n)
            };
          },
        peg$c57 = { type: "other", description: "Date Literal" },
        peg$c58 = function(d) {
            return {
              'type': 'literal',
              'variant': 'date',
              'value': util.key(d)
            };
          },
        peg$c59 = { type: "other", description: "String Literal" },
        peg$c60 = function(s) {
            return {
              'type': 'literal',
              'variant': 'string',
              'value': s
            };
          },
        peg$c61 = { type: "other", description: "Single-quoted String Literal" },
        peg$c62 = function(s) {
            /**
              * @note Unescaped the pairs of literal single quotation marks
              * @note Not sure if the BLOB type should be un-escaped
              */
            return util.unescape(s, "'");
          },
        peg$c63 = "''",
        peg$c64 = { type: "literal", value: "''", description: "\"''\"" },
        peg$c65 = /^[^']/,
        peg$c66 = { type: "class", value: "[^\\']", description: "[^\\']" },
        peg$c67 = { type: "other", description: "Blob Literal" },
        peg$c68 = /^[x]/i,
        peg$c69 = { type: "class", value: "[x]i", description: "[x]i" },
        peg$c70 = function(b) {
            return {
              'type': 'literal',
              'variant': 'blob',
              'value': b
            };
          },
        peg$c71 = { type: "other", description: "Number Sign" },
        peg$c72 = function(s, n) {
            if (util.isOkay(s)) {
              n['value'] = util.textMerge(s, n['value']);
            }
            return n;
          },
        peg$c73 = function(d, e) {
            return {
              'type': 'literal',
              'variant': 'decimal',
              'value': util.textMerge(d, e)
            };
          },
        peg$c74 = { type: "other", description: "Decimal Literal" },
        peg$c75 = function(f, b) { return util.textMerge(f, b); },
        peg$c76 = function(t, d) { return util.textMerge(t, d); },
        peg$c77 = { type: "other", description: "Decimal Literal Exponent" },
        peg$c78 = "e",
        peg$c79 = { type: "literal", value: "E", description: "\"E\"" },
        peg$c80 = /^[+\-]/,
        peg$c81 = { type: "class", value: "[\\+\\-]", description: "[\\+\\-]" },
        peg$c82 = function(e, s, d) { return util.textMerge(e, s, d); },
        peg$c83 = { type: "other", description: "Hexidecimal Literal" },
        peg$c84 = "0x",
        peg$c85 = { type: "literal", value: "0x", description: "\"0x\"" },
        peg$c86 = function(f, b) {
            return {
              'type': 'literal',
              'variant': 'hexidecimal',
              'value': util.textMerge(f, b)
            };
          },
        peg$c87 = /^[0-9a-f]/i,
        peg$c88 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
        peg$c89 = /^[0-9]/,
        peg$c90 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c91 = { type: "other", description: "Bind Parameter" },
        peg$c92 = function(b) {
            return util.extend({
              'type': 'variable'
            }, b);
          },
        peg$c93 = { type: "other", description: "Numbered Bind Parameter" },
        peg$c94 = /^[1-9]/,
        peg$c95 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c96 = function(q, id) {
            return {
              'format': 'numbered',
              'name': util.textMerge(q, id)
            };
          },
        peg$c97 = { type: "other", description: "Named Bind Parameter" },
        peg$c98 = /^[:@]/,
        peg$c99 = { type: "class", value: "[\\:\\@]", description: "[\\:\\@]" },
        peg$c100 = function(s, name) {
            return {
              'format': 'named',
              'name': util.textMerge(s, name)
            };
          },
        peg$c101 = { type: "other", description: "TCL Bind Parameter" },
        peg$c102 = "$",
        peg$c103 = { type: "literal", value: "$", description: "\"$\"" },
        peg$c104 = ":",
        peg$c105 = { type: "literal", value: ":", description: "\":\"" },
        peg$c106 = function(d, name, s) {
            return util.extend({
              'format': 'tcl',
              'name': util.textMerge(d, name)
            }, s);
          },
        peg$c107 = function(sfx) {
            return {
              'suffix': sfx
            };
          },
        peg$c108 = { type: "other", description: "Binary Expression" },
        peg$c109 = function(v, o, e) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(o),
              'left': v,
              'right': e
            };
          },
        peg$c110 = function(c) { return util.key(c); },
        peg$c111 = { type: "other", description: "Expression List" },
        peg$c112 = function(f, rest) {
            return util.listify(f, rest);
          },
        peg$c113 = { type: "other", description: "Function Call" },
        peg$c114 = function(n, a) {
            return util.extend({
              'type': 'function',
              'name': n,
              'args': []
            }, a);
          },
        peg$c115 = { type: "other", description: "Function Call Arguments" },
        peg$c116 = function(s) {
            return {
              'args': [{
                'type': 'identifier',
                'variant': 'star',
                'name': s
              }]
            };
          },
        peg$c117 = function(d, e) {
            return util.extend({
              'args': e
            }, d);
          },
        peg$c118 = function(s) {
            return {
              'filter': util.key(s)
            };
          },
        peg$c119 = { type: "other", description: "Error Message" },
        peg$c120 = function(m) { return m; },
        peg$c121 = { type: "other", description: "Statement" },
        peg$c122 = function(m, s) {
            return util.extend(s, m);
          },
        peg$c123 = { type: "other", description: "QUERY PLAN" },
        peg$c124 = function(e, q) {
            return {
              'explain': util.isOkay(e)
            };
          },
        peg$c125 = { type: "other", description: "QUERY PLAN Keyword" },
        peg$c126 = function(q, p) { return util.compose([q, p]); },
        peg$c127 = { type: "other", description: "Transaction" },
        peg$c128 = function(b, s, e) {
            return util.extend({
              'type': 'statement',
              'variant': 'transaction'
            }, b, s);
          },
        peg$c129 = { type: "other", description: "END Transaction Statement" },
        peg$c130 = function(s, t) {
            return util.keyify([s, t]);
          },
        peg$c131 = { type: "other", description: "BEGIN Transaction Statement" },
        peg$c132 = function(s, m, t) {
            return util.extend({}, m);
          },
        peg$c133 = function(m) {
            return {
              'defer': util.key(m)
            };
          },
        peg$c134 = { type: "other", description: "ROLLBACK Statement" },
        peg$c135 = function(s, n) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'to': n
            };
          },
        peg$c136 = { type: "other", description: "TO Clause" },
        peg$c137 = function(s) { return util.key(s); },
        peg$c138 = { type: "other", description: "SAVEPOINT Statement" },
        peg$c139 = function(s, n) {
            return {
              'type': 'statement',
              'variant': s,
              'target': n
            };
          },
        peg$c140 = { type: "other", description: "RELEASE Statement" },
        peg$c141 = function(s, a, n) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'target': n
            };
          },
        peg$c142 = { type: "other", description: "ALTER TABLE Statement" },
        peg$c143 = function(s, n, e) {
            return {
              'type': 'statement',
              'variant': util.key(s)
            };
          },
        peg$c144 = { type: "other", description: "ALTER TABLE Keyword" },
        peg$c145 = function(a, t) { return util.compose([a, t]); },
        peg$c146 = { type: "other", description: "RENAME TO Keyword" },
        peg$c147 = function(s, n) {
            return {
              'action': util.key(s),
              'name': n
            };
          },
        peg$c148 = { type: "other", description: "ADD COLUMN Keyword" },
        peg$c149 = function(s, d) {
            return {
              'action': util.key(s),
              'definition': d
            };
          },
        peg$c150 = function(w, s) { return util.extend(s, w); },
        peg$c151 = { type: "other", description: "WITH Clause" },
        peg$c152 = function(w) {
            return w;
          },
        peg$c153 = function(s, v, t) {
            var recursive = {
              'variant': util.isOkay(v) ? 'recursive' : 'common'
            };
            if (util.isArrayOkay(t)) {
              // Add 'recursive' property into each table expression
              t = t.map(function (elem) {
                return util.extend(elem, recursive);
              });
            }
            return {
              'with': t
            };
          },
        peg$c154 = function(f, r) { return util.listify(f, r); },
        peg$c155 = { type: "other", description: "Common Table Expression" },
        peg$c156 = function(t, s) {
            return util.extend({
              'type': 'expression',
              'format': 'table',
              'variant': 'common',
              'target': t
            }, s);
          },
        peg$c157 = function(s) {
            return {
              'expression': s
            };
          },
        peg$c158 = { type: "other", description: "DETACH Statement" },
        peg$c159 = function(d, b, n) {
            return {
              'type': 'statement',
              'variant': util.key(d),
              'target': n
            };
          },
        peg$c160 = { type: "other", description: "VACUUM Statement" },
        peg$c161 = function(v) {
            return {
              'type': 'statement',
              'variant': 'vacuum'
            };
          },
        peg$c162 = { type: "other", description: "ANALYZE Statement" },
        peg$c163 = function(s, a) {
            return util.extend({
              'type': 'statement',
              'variant': util.key(s)
            }, a);
          },
        peg$c164 = function(n) {
            return {
              'target': n['name']
            };
          },
        peg$c165 = { type: "other", description: "REINDEX Statement" },
        peg$c166 = function(a) {
            return {
              'target': a['name']
            };
          },
        peg$c167 = { type: "other", description: "PRAGMA Statement" },
        peg$c168 = function(s, n, v) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'target': n,
              'args': (util.isOkay(v) ? util.makeArray(v) : [])
            };
          },
        peg$c169 = function(v) { return v; },
        peg$c170 = function(v) { return /^(yes|no|false|true|0|1)$/i.test(v) },
        peg$c171 = function(v) {
            return {
              'type': 'literal',
              'variant': 'boolean',
              'normalized': (/^(yes|true|1)$/i.test(v) ? '1' : '0'),
              'value': v
            };
          },
        peg$c172 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'name',
              'name': n
            };
          },
        peg$c173 = { type: "other", description: "SELECT Statement" },
        peg$c174 = function(s, o, l) {
            return util.extend(s, o, l);
          },
        peg$c175 = { type: "other", description: "ORDER BY Clause" },
        peg$c176 = function(d) {
            return {
              'order': d
            };
          },
        peg$c177 = { type: "other", description: "LIMIT Clause" },
        peg$c178 = function(s, e, d) {
            return {
              'limit': util.extend({
                'type': 'expression',
                'variant': 'limit',
                'start': e
              }, d)
            };
          },
        peg$c179 = { type: "other", description: "OFFSET Clause" },
        peg$c180 = function(o, e) {
            return {
              'offset': e
            };
          },
        peg$c181 = function(s, u) {
            if (util.isArrayOkay(u)) {
              return {
                'type': 'statement',
                'variant': 'compound',
                'statement': s,
                'compound': u
              };
            } else {
              return s;
            }
          },
        peg$c182 = { type: "other", description: "Union Operation" },
        peg$c183 = function(c, s) {
            return {
              'type': 'compound',
              'variant': c,
              'statement': s
            };
          },
        peg$c184 = function(s, f, w, g) {
            return util.extend({
              'type': 'statement',
              'variant': 'select',
            }, s, f, w, g);
          },
        peg$c185 = { type: "other", description: "SELECT Results Clause" },
        peg$c186 = function(d, t) {
            return util.extend({
              'result': t
            }, d);
          },
        peg$c187 = { type: "other", description: "SELECT Results Modifier" },
        peg$c188 = function(s) {
            return {
              'distinct': true
            };
          },
        peg$c189 = function(s) {
            return {};
          },
        peg$c190 = { type: "other", description: "FROM Clause" },
        peg$c191 = function(s) {
            return {
              'from': s
            };
          },
        peg$c192 = { type: "other", description: "WHERE Clause" },
        peg$c193 = function(s, e) {
            return {
              'where': util.makeArray(e)
            };
          },
        peg$c194 = { type: "other", description: "GROUP BY Clause" },
        peg$c195 = function(s, e, h) {
            return util.extend({
              'group': util.makeArray(e)
            }, h);
          },
        peg$c196 = { type: "other", description: "HAVING Clause" },
        peg$c197 = function(s, e) {
            return {
              'having': e
            };
          },
        peg$c198 = function(q, s) {
            return {
              'type': 'identifier',
              'variant': 'star',
              'name': util.textMerge(q, s)
            };
          },
        peg$c199 = function(n, s) { return util.textMerge(n, s); },
        peg$c200 = function(e, a) {
            return util.extend(e, a);
          },
        peg$c201 = function(f, t) { return util.listify(f, t); },
        peg$c202 = { type: "other", description: "Qualified Table" },
        peg$c203 = function(d, i) {
            return util.extend(d, i);
          },
        peg$c204 = { type: "other", description: "Qualified Table Identifier" },
        peg$c205 = function(n, a) {
            return util.extend(n, a);
          },
        peg$c206 = { type: "other", description: "Qualfied Table Index" },
        peg$c207 = function(s, n) {
            return {
              'index': n
            };
          },
        peg$c208 = function(n, i) {
            // TODO: Not sure what should happen here
            return {
              'index': util.keyify([n, i])
            };
          },
        peg$c209 = { type: "other", description: "SELECT Source" },
        peg$c210 = function(l) { return l; },
        peg$c211 = { type: "other", description: "Subquery" },
        peg$c212 = function(s, a) {
            return util.extend(s, a);
          },
        peg$c213 = { type: "other", description: "Alias" },
        peg$c214 = function(a, n) {
            return {
              'alias': n
            };
          },
        peg$c215 = function(t, j) {
            return {
              'type': 'map',
              'variant': 'join',
              'source': t,
              'map': j
            };
          },
        peg$c216 = { type: "other", description: "JOIN Operation" },
        peg$c217 = function(o, n, c) {
            return {
              'type': 'join',
              'variant': util.key(o),
              'source': n,
              'constraint': c
            };
          },
        peg$c218 = { type: "other", description: "JOIN Operator" },
        peg$c219 = function(n, t, j) { return util.compose([n, t, j]); },
        peg$c220 = function(t, o) { return util.compose([t, o]); },
        peg$c221 = function(t) { return util.textNode(t); },
        peg$c222 = { type: "other", description: "JOIN Constraint" },
        peg$c223 = function(c) {
            return util.extend({
              'type': 'constraint',
              'variant': 'join'
            }, c);
          },
        peg$c224 = { type: "other", description: "Join ON Clause" },
        peg$c225 = function(s, e) {
            return {
              'format': util.key(s),
              'on': e
            };
          },
        peg$c226 = { type: "other", description: "Join USING Clause" },
        peg$c227 = function(s, e) {
            return {
              'format': util.key(s),
              'using': e
            };
          },
        peg$c228 = { type: "other", description: "VALUES Clause" },
        peg$c229 = function(s, l) {
            return util.extend({
              'type': 'statement',
              'variant': 'select'
            }, l);
          },
        peg$c230 = function(f, b) {
            return {
              'result': util.listify(f, b)
            };
          },
        peg$c231 = function(i) { return i; },
        peg$c232 = { type: "other", description: "Ordering Expression" },
        peg$c233 = function(e, c, d) {
            return util.extend({
              'type': 'expression',
              'variant': 'order',
              'expression': e
            }, c, d);
          },
        peg$c234 = { type: "other", description: "Star" },
        peg$c235 = { type: "other", description: "Fallback Type" },
        peg$c236 = function(k) { return k; },
        peg$c237 = { type: "other", description: "INSERT Statement" },
        peg$c238 = function(k, t) {
            return util.extend({
              'type': 'statement',
              'variant': 'insert'
            }, k, t);
          },
        peg$c239 = { type: "other", description: "INSERT Keyword" },
        peg$c240 = function(a, m) {
            return util.extend({
              'action': util.key(a)
            }, m);
          },
        peg$c241 = { type: "other", description: "REPLACE Keyword" },
        peg$c242 = function(a) {
            return {
              'action': util.key(a)
            };
          },
        peg$c243 = { type: "other", description: "INSERT OR Modifier" },
        peg$c244 = function(s, m) {
            return {
              'or': util.key(m)
            };
          },
        peg$c245 = function(i, r) {
            return util.extend({
              'into': i
            }, r);
          },
        peg$c246 = { type: "other", description: "INTO Clause" },
        peg$c247 = function(s, t) {
            return t;
          },
        peg$c248 = { type: "other", description: "INTO Keyword" },
        peg$c249 = function(r) {
            return {
              'result': r
            };
          },
        peg$c250 = { type: "other", description: "Column List" },
        peg$c251 = function(f, b) {
            return {
              'columns': util.listify(f, b)
            };
          },
        peg$c252 = function(c) { return c; },
        peg$c253 = { type: "other", description: "Column Name" },
        peg$c254 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'column',
              'name': n
            };
          },
        peg$c255 = function(s, r) { return r; },
        peg$c256 = { type: "other", description: "VALUES Keyword" },
        peg$c257 = function(f, b) { return util.listify(f, b); },
        peg$c258 = { type: "other", description: "Insert Values List" },
        peg$c259 = function(e) {
            return {
              'type': 'values',
              'variant': 'list',
              'values': e
            };
          },
        peg$c260 = { type: "other", description: "DEFAULT VALUES Clause" },
        peg$c261 = function(d, v) {
            return {
              'type': 'values',
              'variant': 'default'
              // TODO: Not sure what should go here
              // , 'values': null
            };
          },
        peg$c262 = { type: "other", description: "Compound Operator" },
        peg$c263 = { type: "other", description: "UNION Operator" },
        peg$c264 = function(s, a) { return util.compose([s, a]); },
        peg$c265 = function(a) { return a; },
        peg$c266 = { type: "other", description: "UPDATE Statement" },
        peg$c267 = function(s, f, t, u, w, o, l) {
            return util.extend({
              'type': 'statement',
              'variant': s,
              'into': t
            }, f, u, w, o, l);
          },
        peg$c268 = { type: "other", description: "UPDATE Keyword" },
        peg$c269 = { type: "other", description: "UPDATE OR Modifier" },
        peg$c270 = function(t) {
            return {
              'or': util.key(t)
            };
          },
        peg$c271 = { type: "other", description: "SET Clause" },
        peg$c272 = function(c) {
            return {
              'set': c
            };
          },
        peg$c273 = { type: "other", description: "Column Assignment" },
        peg$c274 = function(f, e) {
            return {
              'type': 'assignment',
              'target': f,
              'value': e
            };
          },
        peg$c275 = { type: "other", description: "DELETE Statement" },
        peg$c276 = function(s, t, w, o, l) {
            return util.extend({
              'type': 'statement',
              'variant': s,
              'from': t
            }, w, o, l);
          },
        peg$c277 = { type: "other", description: "DELETE Keyword" },
        peg$c278 = { type: "other", description: "CREATE Statement" },
        peg$c279 = { type: "other", description: "CREATE TABLE Statement" },
        peg$c280 = function(s, ne, id, r) {
            return util.extend({
              'type': 'statement',
              'name': id
            }, s, r, ne);
          },
        peg$c281 = function(s, tmp, t) {
            return {
              'temporary': util.isOkay(tmp),
              'variant': s,
              'format': util.key(t)
            };
          },
        peg$c282 = { type: "other", description: "IF NOT EXISTS Modifier" },
        peg$c283 = function(i, n, e) {
            return {
              'condition': util.makeArray({
                'type': 'condition',
                'condition': util.keyify([i, n, e])
              })
            };
          },
        peg$c284 = { type: "other", description: "Table Definition" },
        peg$c285 = function(s, t, r) {
            return util.extend({
              'definition': util.listify(s, t)
            }, r);
          },
        peg$c286 = function(r, w) {
            return {
              'optimization': [{
                'type': 'optimization',
                'value': util.keyify([r, w])
              }]
            };
          },
        peg$c287 = function(f) { return f; },
        peg$c288 = { type: "other", description: "Column Definition" },
        peg$c289 = function(n, t, c) {
            return util.extend({
              'type': 'definition',
              'variant': 'column',
              'name': n,
              'definition': (util.isOkay(c) ? c : []),
            }, t);
          },
        peg$c290 = { type: "other", description: "Column Datatype" },
        peg$c291 = function(t) {
            return {
              'datatype': t
            };
          },
        peg$c292 = { type: "other", description: "Column Constraint" },
        peg$c293 = function(n, c) {
            return util.extend(c, n);
          },
        peg$c294 = { type: "other", description: "Column Constraint Name" },
        peg$c295 = function(n) {
            return {
              'name': n
            };
          },
        peg$c296 = { type: "other", description: "FOREIGN KEY Column Constraint" },
        peg$c297 = function(f) {
            return util.extend({
              'variant': 'foreign key'
            }, f);
          },
        peg$c298 = { type: "other", description: "PRIMARY KEY Column Constraint" },
        peg$c299 = function(p, d, c, a) {
            return util.extend(p, c, d, a);
          },
        peg$c300 = { type: "other", description: "PRIMARY KEY Keyword" },
        peg$c301 = function(s, k) {
            return {
              'type': 'constraint',
              'variant': util.keyify([s, k])
            };
          },
        peg$c302 = { type: "other", description: "AUTOINCREMENT Keyword" },
        peg$c303 = function(a) {
            return {
              'autoIncrement': true
            };
          },
        peg$c304 = function(s, c) {
            return util.extend({
              'type': 'constraint',
              'variant': s
            }, c);
          },
        peg$c305 = { type: "other", description: "UNIQUE Column Constraint" },
        peg$c306 = { type: "other", description: "NULL Column Constraint" },
        peg$c307 = function(n, l) { return util.compose([n, l]); },
        peg$c308 = { type: "other", description: "CHECK Column Constraint" },
        peg$c309 = { type: "other", description: "DEFAULT Column Constraint" },
        peg$c310 = function(s, v) {
            return {
              'type': 'constraint',
              'variant': util.key(s),
              'value': v
            };
          },
        peg$c311 = { type: "other", description: "DEFAULT Column Value" },
        peg$c312 = { type: "other", description: "COLLATE Column Constraint" },
        peg$c313 = function(c) {
            return {
              'type': 'constraint',
              'variant': 'collate',
              'collate': c
            };
          },
        peg$c314 = { type: "other", description: "Table Constraint" },
        peg$c315 = function(n, c) {
            return util.extend({
              'type': 'definition',
              'variant': 'constraint'
            }, c, n);
          },
        peg$c316 = { type: "other", description: "Table Constraint Name" },
        peg$c317 = { type: "other", description: "CHECK Table Constraint" },
        peg$c318 = function(c) {
            return {
              'definition': util.makeArray(c)
            };
          },
        peg$c319 = { type: "other", description: "PRIMARY KEY Table Constraint" },
        peg$c320 = function(k, c, t) {
            return {
              'definition': util.makeArray(util.extend(k, t)),
              'columns': c
            };
          },
        peg$c321 = function(s) {
            return {
              'type': 'constraint',
              'variant': util.key(s)
            };
          },
        peg$c322 = function(p, k) { return util.compose([p, k]); },
        peg$c323 = { type: "other", description: "UNIQUE Keyword" },
        peg$c324 = function(u) { return util.textNode(u); },
        peg$c325 = { type: "other", description: "PRIMARY KEY Columns" },
        peg$c326 = { type: "other", description: "Indexed Column" },
        peg$c327 = function(e, c, d) {
            return util.extend({
              'type': 'identifier',
              'variant': 'column',
              'format': 'indexed',
              'name': e
            }, c, d);
          },
        peg$c328 = { type: "other", description: "Column Collation" },
        peg$c329 = function(n) {
            return {
              'collate': n
            };
          },
        peg$c330 = { type: "other", description: "Column Direction" },
        peg$c331 = function(t) {
            return {
              'direction': util.key(t),
            };
          },
        peg$c332 = function(s, t) {
            return {
              'conflict': util.key(t)
            };
          },
        peg$c333 = { type: "other", description: "ON CONFLICT Keyword" },
        peg$c334 = function(o, c) { return util.keyify([o, c]); },
        peg$c335 = function(k, c) {
            return {
              'type': 'constraint',
              'variant': util.key(k),
              'expression': c
            };
          },
        peg$c336 = { type: "other", description: "FOREIGN KEY Table Constraint" },
        peg$c337 = function(k, l, c) {
            return util.extend({
              'definition': util.makeArray(util.extend(k, c))
            }, l);
          },
        peg$c338 = { type: "other", description: "FOREIGN KEY Keyword" },
        peg$c339 = function(f, k) {
            return {
              'type': 'constraint',
              'variant': util.keyify([f, k])
            };
          },
        peg$c340 = function(r, a, d) {
            return util.extend({
              'type': 'constraint',
              'action': a,
              'defer': d
            }, r);
          },
        peg$c341 = { type: "other", description: "REFERENCES Clause" },
        peg$c342 = function(s, t) {
            return {
              'references': t
            };
          },
        peg$c343 = function(f, b) { return util.collect([f, b], []); },
        peg$c344 = { type: "other", description: "FOREIGN KEY Action Clause" },
        peg$c345 = function(m, a, n) {
            return {
              'type': 'action',
              'variant': util.key(m),
              'action': util.key(n)
            };
          },
        peg$c346 = { type: "other", description: "FOREIGN KEY Action" },
        peg$c347 = function(s, v) { return util.compose([s, v]); },
        peg$c348 = function(c) { return util.textNode(c); },
        peg$c349 = function(n, a) { return util.compose([n, a]); },
        peg$c350 = function(m, n) {
            return {
              'type': 'action',
              'variant': util.key(m),
              'action': n
            };
          },
        peg$c351 = { type: "other", description: "DEFERRABLE Clause" },
        peg$c352 = function(n, d, i) { return util.keyify([n, d, i]); },
        peg$c353 = function(i, d) { return util.compose([i, d]); },
        peg$c354 = function(s) {
            return {
              'definition': util.makeArray(s)
            };
          },
        peg$c355 = { type: "other", description: "CREATE INDEX Statement" },
        peg$c356 = function(s, ne, n, o, w) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'on': o,
            }, s, ne, w);
          },
        peg$c357 = function(s, u, i) {
            return util.extend({
              'variant': util.key(s),
              'format': util.key(i)
            }, u);
          },
        peg$c358 = function(u) {
            return {
              'unique': true
            };
          },
        peg$c359 = { type: "other", description: "ON Clause" },
        peg$c360 = function(o, t, c) {
            return {
              'target': t,
              'columns': c
            };
          },
        peg$c361 = { type: "other", description: "CREATE TRIGGER Statement" },
        peg$c362 = function(s, ne, n, cd, o, me, wh, a) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'on': o,
              'event': cd,
              'by': (util.isOkay(me) ? me : 'row'),
              'action': util.makeArray(a)
            }, s, ne, wh);
          },
        peg$c363 = function(s, tmp, t) {
            return util.extend({
              'variant': util.key(s),
              'format': util.key(t)
            }, tmp);
          },
        peg$c364 = { type: "other", description: "Conditional Clause" },
        peg$c365 = function(m, d) {
            return util.extend({
              'type': 'event'
            }, m, d);
          },
        peg$c366 = function(m) {
            return {
              'occurs': util.key(m)
            };
          },
        peg$c367 = function(i, o) { return util.compose([i, o]); },
        peg$c368 = { type: "other", description: "Conditional Action" },
        peg$c369 = function(o) {
            return {
              'event': util.key(o)
            };
          },
        peg$c370 = function(s, f) {
            return {
              'event': util.key(s),
              'of': f
            };
          },
        peg$c371 = function(s, c) { return c; },
        peg$c372 = "statement",
        peg$c373 = { type: "literal", value: "STATEMENT", description: "\"STATEMENT\"" },
        peg$c374 = function(f, e, r) { return util.key(r); },
        peg$c375 = function(w, e) { return e; },
        peg$c376 = { type: "other", description: "Actions Clause" },
        peg$c377 = function(s, a, e) { return a; },
        peg$c378 = { type: "other", description: "CREATE VIEW Statement" },
        peg$c379 = function(s, ne, n, r) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'result': r
            }, s, ne);
          },
        peg$c380 = function(s, p, v) {
            return {
              'temporary': util.isOkay(p),
              'variant': util.key(s),
              'format': util.key(v)
            };
          },
        peg$c381 = { type: "other", description: "CREATE VIRTUAL TABLE Statement" },
        peg$c382 = function(s, ne, n, m) {
            return util.extend({
              'type': 'statement',
              'target': n,
              'result': m
            }, s, ne);
          },
        peg$c383 = function(s, v, t) {
            return {
              'variant': util.key(s),
              'format': util.key(v)
            };
          },
        peg$c384 = function(m, a) {
            return util.extend({
              'type': 'module',
              'name': m,
              'args': []
            }, a);
          },
        peg$c385 = { type: "other", description: "Module Arguments" },
        peg$c386 = function(f) {
            return {
              'args': f
            };
          },
        peg$c387 = { type: "other", description: "DROP Statement" },
        peg$c388 = function(s, q) {
            /**
             * @note Manually copy in the correct variant for the target
             */
            return util.extend({
              'type': 'statement',
              'target': util.extend(q, {
                          'variant': s['format']
                        })
            }, s);
          },
        peg$c389 = { type: "other", description: "DROP Keyword" },
        peg$c390 = function(s, t, i) {
             return util.extend({
               'variant': util.key(s),
               'format': t,
               'condition': []
             }, i);
          },
        peg$c391 = { type: "other", description: "DROP Type" },
        peg$c392 = function(c) {
            return {
              'condition': util.makeArray(c)
            };
          },
        peg$c393 = { type: "other", description: "IF EXISTS Keyword" },
        peg$c394 = function(i, e) {
            return {
              'type': 'condition',
              'condition': util.keyify([i, e])
            };
          },
        peg$c395 = { type: "other", description: "Unary Operator" },
        peg$c396 = { type: "other", description: "Binary Operator" },
        peg$c397 = function(o) { return util.key(o); },
        peg$c398 = { type: "other", description: "Or" },
        peg$c399 = { type: "other", description: "Add" },
        peg$c400 = { type: "other", description: "Subtract" },
        peg$c401 = { type: "other", description: "Multiply" },
        peg$c402 = { type: "other", description: "Modulo" },
        peg$c403 = { type: "other", description: "Shift Left" },
        peg$c404 = { type: "other", description: "Shift Right" },
        peg$c405 = { type: "other", description: "Logical AND" },
        peg$c406 = { type: "other", description: "Logical OR" },
        peg$c407 = { type: "other", description: "Less Than" },
        peg$c408 = { type: "other", description: "Greater Than" },
        peg$c409 = { type: "other", description: "Less Than Or Equal" },
        peg$c410 = { type: "other", description: "Greater Than Or Equal" },
        peg$c411 = { type: "other", description: "Equal" },
        peg$c412 = { type: "other", description: "Not Equal" },
        peg$c413 = { type: "other", description: "IS" },
        peg$c414 = function(m) { return util.key(m); },
        peg$c415 = { type: "other", description: "Database Identifier" },
        peg$c416 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'database',
              'name': n
            };
          },
        peg$c417 = { type: "other", description: "Table Identifier" },
        peg$c418 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'table',
              'name': util.textMerge(d, n)
            };
          },
        peg$c419 = function(n, d) { return util.textMerge(n, d); },
        peg$c420 = { type: "other", description: "Column Identifier" },
        peg$c421 = function(q, n) {
            return {
              'type': 'identifier',
              'variant': 'column',
              'name': util.textMerge(q, n)
            };
          },
        peg$c422 = function() { return ''; },
        peg$c423 = function(d, t) { return util.textMerge(d, t); },
        peg$c424 = { type: "other", description: "Collation Identifier" },
        peg$c425 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'collation',
              'name': n
            };
          },
        peg$c426 = { type: "other", description: "Savepoint Indentifier" },
        peg$c427 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'savepoint',
              'name': n
            };
          },
        peg$c428 = { type: "other", description: "Index Identifier" },
        peg$c429 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'index',
              'name': util.textMerge(d, n)
            };
          },
        peg$c430 = { type: "other", description: "Trigger Identifier" },
        peg$c431 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'trigger',
              'name': util.textMerge(d, n)
            };
          },
        peg$c432 = { type: "other", description: "View Identifier" },
        peg$c433 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'view',
              'name': util.textMerge(d, n)
            };
          },
        peg$c434 = { type: "other", description: "Pragma Identifier" },
        peg$c435 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'pragma',
              'name': util.textMerge(d, n)
            };
          },
        peg$c436 = { type: "other", description: "CTE Identifier" },
        peg$c437 = function(n, a) {
            return util.extend({
              'type': 'identifier',
              'variant': 'expression',
              'format': 'table',
              'name': n,
              'columns': []
            }, a);
          },
        peg$c438 = { type: "other", description: "Table Constraint Identifier" },
        peg$c439 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'constraint',
              'format': 'table',
              'name': n
            };
          },
        peg$c440 = { type: "other", description: "Column Constraint Identifier" },
        peg$c441 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'constraint',
              'format': 'column',
              'name': n
            };
          },
        peg$c442 = { type: "other", description: "Datatype Name" },
        peg$c443 = function(t) { return [t, 'text']; },
        peg$c444 = function(t) { return [t, 'real']; },
        peg$c445 = function(t) { return [t, 'numeric']; },
        peg$c446 = function(t) { return [t, 'integer']; },
        peg$c447 = function(t) { return [t, 'none']; },
        peg$c448 = { type: "other", description: "TEXT Datatype Name" },
        peg$c449 = "n",
        peg$c450 = { type: "literal", value: "N", description: "\"N\"" },
        peg$c451 = "var",
        peg$c452 = { type: "literal", value: "VAR", description: "\"VAR\"" },
        peg$c453 = "char",
        peg$c454 = { type: "literal", value: "CHAR", description: "\"CHAR\"" },
        peg$c455 = "tiny",
        peg$c456 = { type: "literal", value: "TINY", description: "\"TINY\"" },
        peg$c457 = "medium",
        peg$c458 = { type: "literal", value: "MEDIUM", description: "\"MEDIUM\"" },
        peg$c459 = "long",
        peg$c460 = { type: "literal", value: "LONG", description: "\"LONG\"" },
        peg$c461 = "text",
        peg$c462 = { type: "literal", value: "TEXT", description: "\"TEXT\"" },
        peg$c463 = "clob",
        peg$c464 = { type: "literal", value: "CLOB", description: "\"CLOB\"" },
        peg$c465 = { type: "other", description: "REAL Datatype Name" },
        peg$c466 = "float",
        peg$c467 = { type: "literal", value: "FLOAT", description: "\"FLOAT\"" },
        peg$c468 = "real",
        peg$c469 = { type: "literal", value: "REAL", description: "\"REAL\"" },
        peg$c470 = { type: "other", description: "DOUBLE Datatype Name" },
        peg$c471 = "double",
        peg$c472 = { type: "literal", value: "DOUBLE", description: "\"DOUBLE\"" },
        peg$c473 = function(d, p) { return util.compose([d, p]); },
        peg$c474 = "precision",
        peg$c475 = { type: "literal", value: "PRECISION", description: "\"PRECISION\"" },
        peg$c476 = function(p) { return p; },
        peg$c477 = { type: "other", description: "NUMERIC Datatype Name" },
        peg$c478 = "numeric",
        peg$c479 = { type: "literal", value: "NUMERIC", description: "\"NUMERIC\"" },
        peg$c480 = "decimal",
        peg$c481 = { type: "literal", value: "DECIMAL", description: "\"DECIMAL\"" },
        peg$c482 = "boolean",
        peg$c483 = { type: "literal", value: "BOOLEAN", description: "\"BOOLEAN\"" },
        peg$c484 = "date",
        peg$c485 = { type: "literal", value: "DATE", description: "\"DATE\"" },
        peg$c486 = "time",
        peg$c487 = { type: "literal", value: "TIME", description: "\"TIME\"" },
        peg$c488 = "stamp",
        peg$c489 = { type: "literal", value: "STAMP", description: "\"STAMP\"" },
        peg$c490 = { type: "other", description: "INTEGER Datatype Name" },
        peg$c491 = "int",
        peg$c492 = { type: "literal", value: "INT", description: "\"INT\"" },
        peg$c493 = "2",
        peg$c494 = { type: "literal", value: "2", description: "\"2\"" },
        peg$c495 = "4",
        peg$c496 = { type: "literal", value: "4", description: "\"4\"" },
        peg$c497 = "8",
        peg$c498 = { type: "literal", value: "8", description: "\"8\"" },
        peg$c499 = "eger",
        peg$c500 = { type: "literal", value: "EGER", description: "\"EGER\"" },
        peg$c501 = "big",
        peg$c502 = { type: "literal", value: "BIG", description: "\"BIG\"" },
        peg$c503 = "small",
        peg$c504 = { type: "literal", value: "SMALL", description: "\"SMALL\"" },
        peg$c505 = { type: "other", description: "BLOB Datatype Name" },
        peg$c506 = "blob",
        peg$c507 = { type: "literal", value: "BLOB", description: "\"BLOB\"" },
        peg$c508 = /^[a-z0-9$_]/i,
        peg$c509 = { type: "class", value: "[a-z0-9\\$\\_]i", description: "[a-z0-9\\$\\_]i" },
        peg$c510 = function(r) { return util.textNode(r); },
        peg$c511 = function(n) { return util.key(n); },
        peg$c512 = "]",
        peg$c513 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c514 = /^[^\]]/,
        peg$c515 = { type: "class", value: "[^\\]]", description: "[^\\]]" },
        peg$c516 = "\"",
        peg$c517 = { type: "literal", value: "\"", description: "\"\\\"\"" },
        peg$c518 = function(n) { return util.unescape(n, '"'); },
        peg$c519 = "\"\"",
        peg$c520 = { type: "literal", value: "\"\"", description: "\"\\\"\\\"\"" },
        peg$c521 = /^[^"]/,
        peg$c522 = { type: "class", value: "[^\\\"]", description: "[^\\\"]" },
        peg$c523 = "'",
        peg$c524 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c525 = function(n) { return util.unescape(n, "'"); },
        peg$c526 = "`",
        peg$c527 = { type: "literal", value: "`", description: "\"`\"" },
        peg$c528 = function(n) { return util.unescape(n, '`'); },
        peg$c529 = "``",
        peg$c530 = { type: "literal", value: "``", description: "\"``\"" },
        peg$c531 = /^[^`]/,
        peg$c532 = { type: "class", value: "[^\\`]", description: "[^\\`]" },
        peg$c533 = { type: "other", description: "Open Bracket" },
        peg$c534 = "[",
        peg$c535 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c536 = { type: "other", description: "Close Bracket" },
        peg$c537 = { type: "other", description: "Open Parenthesis" },
        peg$c538 = "(",
        peg$c539 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c540 = { type: "other", description: "Close Parenthesis" },
        peg$c541 = ")",
        peg$c542 = { type: "literal", value: ")", description: "\")\"" },
        peg$c543 = { type: "other", description: "Comma" },
        peg$c544 = ",",
        peg$c545 = { type: "literal", value: ",", description: "\",\"" },
        peg$c546 = { type: "other", description: "Period" },
        peg$c547 = ".",
        peg$c548 = { type: "literal", value: ".", description: "\".\"" },
        peg$c549 = { type: "other", description: "Asterisk" },
        peg$c550 = "*",
        peg$c551 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c552 = { type: "other", description: "Question Mark" },
        peg$c553 = "?",
        peg$c554 = { type: "literal", value: "?", description: "\"?\"" },
        peg$c555 = { type: "other", description: "Single Quote" },
        peg$c556 = { type: "other", description: "Double Quote" },
        peg$c557 = { type: "other", description: "Backtick" },
        peg$c558 = { type: "other", description: "Tilde" },
        peg$c559 = "~",
        peg$c560 = { type: "literal", value: "~", description: "\"~\"" },
        peg$c561 = { type: "other", description: "Plus" },
        peg$c562 = "+",
        peg$c563 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c564 = { type: "other", description: "Minus" },
        peg$c565 = "-",
        peg$c566 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c567 = "=",
        peg$c568 = { type: "literal", value: "=", description: "\"=\"" },
        peg$c569 = { type: "other", description: "Ampersand" },
        peg$c570 = "&",
        peg$c571 = { type: "literal", value: "&", description: "\"&\"" },
        peg$c572 = { type: "other", description: "Pipe" },
        peg$c573 = "|",
        peg$c574 = { type: "literal", value: "|", description: "\"|\"" },
        peg$c575 = "%",
        peg$c576 = { type: "literal", value: "%", description: "\"%\"" },
        peg$c577 = "<",
        peg$c578 = { type: "literal", value: "<", description: "\"<\"" },
        peg$c579 = ">",
        peg$c580 = { type: "literal", value: ">", description: "\">\"" },
        peg$c581 = { type: "other", description: "Exclamation" },
        peg$c582 = "!",
        peg$c583 = { type: "literal", value: "!", description: "\"!\"" },
        peg$c584 = { type: "other", description: "Semicolon" },
        peg$c585 = ";",
        peg$c586 = { type: "literal", value: ";", description: "\";\"" },
        peg$c587 = { type: "other", description: "Colon" },
        peg$c588 = { type: "other", description: "Forward Slash" },
        peg$c589 = "/",
        peg$c590 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c591 = { type: "other", description: "Backslash" },
        peg$c592 = "\\",
        peg$c593 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c594 = "abort",
        peg$c595 = { type: "literal", value: "ABORT", description: "\"ABORT\"" },
        peg$c596 = "action",
        peg$c597 = { type: "literal", value: "ACTION", description: "\"ACTION\"" },
        peg$c598 = "add",
        peg$c599 = { type: "literal", value: "ADD", description: "\"ADD\"" },
        peg$c600 = "after",
        peg$c601 = { type: "literal", value: "AFTER", description: "\"AFTER\"" },
        peg$c602 = "all",
        peg$c603 = { type: "literal", value: "ALL", description: "\"ALL\"" },
        peg$c604 = "alter",
        peg$c605 = { type: "literal", value: "ALTER", description: "\"ALTER\"" },
        peg$c606 = "analyze",
        peg$c607 = { type: "literal", value: "ANALYZE", description: "\"ANALYZE\"" },
        peg$c608 = "and",
        peg$c609 = { type: "literal", value: "AND", description: "\"AND\"" },
        peg$c610 = "as",
        peg$c611 = { type: "literal", value: "AS", description: "\"AS\"" },
        peg$c612 = "asc",
        peg$c613 = { type: "literal", value: "ASC", description: "\"ASC\"" },
        peg$c614 = "attach",
        peg$c615 = { type: "literal", value: "ATTACH", description: "\"ATTACH\"" },
        peg$c616 = "autoincrement",
        peg$c617 = { type: "literal", value: "AUTOINCREMENT", description: "\"AUTOINCREMENT\"" },
        peg$c618 = "before",
        peg$c619 = { type: "literal", value: "BEFORE", description: "\"BEFORE\"" },
        peg$c620 = "begin",
        peg$c621 = { type: "literal", value: "BEGIN", description: "\"BEGIN\"" },
        peg$c622 = "between",
        peg$c623 = { type: "literal", value: "BETWEEN", description: "\"BETWEEN\"" },
        peg$c624 = "by",
        peg$c625 = { type: "literal", value: "BY", description: "\"BY\"" },
        peg$c626 = "cascade",
        peg$c627 = { type: "literal", value: "CASCADE", description: "\"CASCADE\"" },
        peg$c628 = "case",
        peg$c629 = { type: "literal", value: "CASE", description: "\"CASE\"" },
        peg$c630 = "cast",
        peg$c631 = { type: "literal", value: "CAST", description: "\"CAST\"" },
        peg$c632 = "check",
        peg$c633 = { type: "literal", value: "CHECK", description: "\"CHECK\"" },
        peg$c634 = "collate",
        peg$c635 = { type: "literal", value: "COLLATE", description: "\"COLLATE\"" },
        peg$c636 = "column",
        peg$c637 = { type: "literal", value: "COLUMN", description: "\"COLUMN\"" },
        peg$c638 = "commit",
        peg$c639 = { type: "literal", value: "COMMIT", description: "\"COMMIT\"" },
        peg$c640 = "conflict",
        peg$c641 = { type: "literal", value: "CONFLICT", description: "\"CONFLICT\"" },
        peg$c642 = "constraint",
        peg$c643 = { type: "literal", value: "CONSTRAINT", description: "\"CONSTRAINT\"" },
        peg$c644 = "create",
        peg$c645 = { type: "literal", value: "CREATE", description: "\"CREATE\"" },
        peg$c646 = "cross",
        peg$c647 = { type: "literal", value: "CROSS", description: "\"CROSS\"" },
        peg$c648 = "current_date",
        peg$c649 = { type: "literal", value: "CURRENT_DATE", description: "\"CURRENT_DATE\"" },
        peg$c650 = "current_time",
        peg$c651 = { type: "literal", value: "CURRENT_TIME", description: "\"CURRENT_TIME\"" },
        peg$c652 = "current_timestamp",
        peg$c653 = { type: "literal", value: "CURRENT_TIMESTAMP", description: "\"CURRENT_TIMESTAMP\"" },
        peg$c654 = "database",
        peg$c655 = { type: "literal", value: "DATABASE", description: "\"DATABASE\"" },
        peg$c656 = "default",
        peg$c657 = { type: "literal", value: "DEFAULT", description: "\"DEFAULT\"" },
        peg$c658 = "deferrable",
        peg$c659 = { type: "literal", value: "DEFERRABLE", description: "\"DEFERRABLE\"" },
        peg$c660 = "deferred",
        peg$c661 = { type: "literal", value: "DEFERRED", description: "\"DEFERRED\"" },
        peg$c662 = "delete",
        peg$c663 = { type: "literal", value: "DELETE", description: "\"DELETE\"" },
        peg$c664 = "desc",
        peg$c665 = { type: "literal", value: "DESC", description: "\"DESC\"" },
        peg$c666 = "detach",
        peg$c667 = { type: "literal", value: "DETACH", description: "\"DETACH\"" },
        peg$c668 = "distinct",
        peg$c669 = { type: "literal", value: "DISTINCT", description: "\"DISTINCT\"" },
        peg$c670 = "drop",
        peg$c671 = { type: "literal", value: "DROP", description: "\"DROP\"" },
        peg$c672 = "each",
        peg$c673 = { type: "literal", value: "EACH", description: "\"EACH\"" },
        peg$c674 = "else",
        peg$c675 = { type: "literal", value: "ELSE", description: "\"ELSE\"" },
        peg$c676 = "end",
        peg$c677 = { type: "literal", value: "END", description: "\"END\"" },
        peg$c678 = "escape",
        peg$c679 = { type: "literal", value: "ESCAPE", description: "\"ESCAPE\"" },
        peg$c680 = "except",
        peg$c681 = { type: "literal", value: "EXCEPT", description: "\"EXCEPT\"" },
        peg$c682 = "exclusive",
        peg$c683 = { type: "literal", value: "EXCLUSIVE", description: "\"EXCLUSIVE\"" },
        peg$c684 = "exists",
        peg$c685 = { type: "literal", value: "EXISTS", description: "\"EXISTS\"" },
        peg$c686 = "explain",
        peg$c687 = { type: "literal", value: "EXPLAIN", description: "\"EXPLAIN\"" },
        peg$c688 = "fail",
        peg$c689 = { type: "literal", value: "FAIL", description: "\"FAIL\"" },
        peg$c690 = "for",
        peg$c691 = { type: "literal", value: "FOR", description: "\"FOR\"" },
        peg$c692 = "foreign",
        peg$c693 = { type: "literal", value: "FOREIGN", description: "\"FOREIGN\"" },
        peg$c694 = "from",
        peg$c695 = { type: "literal", value: "FROM", description: "\"FROM\"" },
        peg$c696 = "full",
        peg$c697 = { type: "literal", value: "FULL", description: "\"FULL\"" },
        peg$c698 = "glob",
        peg$c699 = { type: "literal", value: "GLOB", description: "\"GLOB\"" },
        peg$c700 = "group",
        peg$c701 = { type: "literal", value: "GROUP", description: "\"GROUP\"" },
        peg$c702 = "having",
        peg$c703 = { type: "literal", value: "HAVING", description: "\"HAVING\"" },
        peg$c704 = "if",
        peg$c705 = { type: "literal", value: "IF", description: "\"IF\"" },
        peg$c706 = "ignore",
        peg$c707 = { type: "literal", value: "IGNORE", description: "\"IGNORE\"" },
        peg$c708 = "immediate",
        peg$c709 = { type: "literal", value: "IMMEDIATE", description: "\"IMMEDIATE\"" },
        peg$c710 = "in",
        peg$c711 = { type: "literal", value: "IN", description: "\"IN\"" },
        peg$c712 = "index",
        peg$c713 = { type: "literal", value: "INDEX", description: "\"INDEX\"" },
        peg$c714 = "indexed",
        peg$c715 = { type: "literal", value: "INDEXED", description: "\"INDEXED\"" },
        peg$c716 = "initially",
        peg$c717 = { type: "literal", value: "INITIALLY", description: "\"INITIALLY\"" },
        peg$c718 = "inner",
        peg$c719 = { type: "literal", value: "INNER", description: "\"INNER\"" },
        peg$c720 = "insert",
        peg$c721 = { type: "literal", value: "INSERT", description: "\"INSERT\"" },
        peg$c722 = "instead",
        peg$c723 = { type: "literal", value: "INSTEAD", description: "\"INSTEAD\"" },
        peg$c724 = "intersect",
        peg$c725 = { type: "literal", value: "INTERSECT", description: "\"INTERSECT\"" },
        peg$c726 = "into",
        peg$c727 = { type: "literal", value: "INTO", description: "\"INTO\"" },
        peg$c728 = "is",
        peg$c729 = { type: "literal", value: "IS", description: "\"IS\"" },
        peg$c730 = "isnull",
        peg$c731 = { type: "literal", value: "ISNULL", description: "\"ISNULL\"" },
        peg$c732 = "join",
        peg$c733 = { type: "literal", value: "JOIN", description: "\"JOIN\"" },
        peg$c734 = "key",
        peg$c735 = { type: "literal", value: "KEY", description: "\"KEY\"" },
        peg$c736 = "left",
        peg$c737 = { type: "literal", value: "LEFT", description: "\"LEFT\"" },
        peg$c738 = "like",
        peg$c739 = { type: "literal", value: "LIKE", description: "\"LIKE\"" },
        peg$c740 = "limit",
        peg$c741 = { type: "literal", value: "LIMIT", description: "\"LIMIT\"" },
        peg$c742 = "match",
        peg$c743 = { type: "literal", value: "MATCH", description: "\"MATCH\"" },
        peg$c744 = "natural",
        peg$c745 = { type: "literal", value: "NATURAL", description: "\"NATURAL\"" },
        peg$c746 = "no",
        peg$c747 = { type: "literal", value: "NO", description: "\"NO\"" },
        peg$c748 = "not",
        peg$c749 = { type: "literal", value: "NOT", description: "\"NOT\"" },
        peg$c750 = "notnull",
        peg$c751 = { type: "literal", value: "NOTNULL", description: "\"NOTNULL\"" },
        peg$c752 = "null",
        peg$c753 = { type: "literal", value: "NULL", description: "\"NULL\"" },
        peg$c754 = "of",
        peg$c755 = { type: "literal", value: "OF", description: "\"OF\"" },
        peg$c756 = "offset",
        peg$c757 = { type: "literal", value: "OFFSET", description: "\"OFFSET\"" },
        peg$c758 = "on",
        peg$c759 = { type: "literal", value: "ON", description: "\"ON\"" },
        peg$c760 = "or",
        peg$c761 = { type: "literal", value: "OR", description: "\"OR\"" },
        peg$c762 = "order",
        peg$c763 = { type: "literal", value: "ORDER", description: "\"ORDER\"" },
        peg$c764 = "outer",
        peg$c765 = { type: "literal", value: "OUTER", description: "\"OUTER\"" },
        peg$c766 = "plan",
        peg$c767 = { type: "literal", value: "PLAN", description: "\"PLAN\"" },
        peg$c768 = "pragma",
        peg$c769 = { type: "literal", value: "PRAGMA", description: "\"PRAGMA\"" },
        peg$c770 = "primary",
        peg$c771 = { type: "literal", value: "PRIMARY", description: "\"PRIMARY\"" },
        peg$c772 = "query",
        peg$c773 = { type: "literal", value: "QUERY", description: "\"QUERY\"" },
        peg$c774 = "raise",
        peg$c775 = { type: "literal", value: "RAISE", description: "\"RAISE\"" },
        peg$c776 = "recursive",
        peg$c777 = { type: "literal", value: "RECURSIVE", description: "\"RECURSIVE\"" },
        peg$c778 = "references",
        peg$c779 = { type: "literal", value: "REFERENCES", description: "\"REFERENCES\"" },
        peg$c780 = "regexp",
        peg$c781 = { type: "literal", value: "REGEXP", description: "\"REGEXP\"" },
        peg$c782 = "reindex",
        peg$c783 = { type: "literal", value: "REINDEX", description: "\"REINDEX\"" },
        peg$c784 = "release",
        peg$c785 = { type: "literal", value: "RELEASE", description: "\"RELEASE\"" },
        peg$c786 = "rename",
        peg$c787 = { type: "literal", value: "RENAME", description: "\"RENAME\"" },
        peg$c788 = "replace",
        peg$c789 = { type: "literal", value: "REPLACE", description: "\"REPLACE\"" },
        peg$c790 = "restrict",
        peg$c791 = { type: "literal", value: "RESTRICT", description: "\"RESTRICT\"" },
        peg$c792 = "right",
        peg$c793 = { type: "literal", value: "RIGHT", description: "\"RIGHT\"" },
        peg$c794 = "rollback",
        peg$c795 = { type: "literal", value: "ROLLBACK", description: "\"ROLLBACK\"" },
        peg$c796 = "row",
        peg$c797 = { type: "literal", value: "ROW", description: "\"ROW\"" },
        peg$c798 = "rowid",
        peg$c799 = { type: "literal", value: "ROWID", description: "\"ROWID\"" },
        peg$c800 = "savepoint",
        peg$c801 = { type: "literal", value: "SAVEPOINT", description: "\"SAVEPOINT\"" },
        peg$c802 = "select",
        peg$c803 = { type: "literal", value: "SELECT", description: "\"SELECT\"" },
        peg$c804 = "set",
        peg$c805 = { type: "literal", value: "SET", description: "\"SET\"" },
        peg$c806 = "table",
        peg$c807 = { type: "literal", value: "TABLE", description: "\"TABLE\"" },
        peg$c808 = "temp",
        peg$c809 = { type: "literal", value: "TEMP", description: "\"TEMP\"" },
        peg$c810 = "temporary",
        peg$c811 = { type: "literal", value: "TEMPORARY", description: "\"TEMPORARY\"" },
        peg$c812 = "then",
        peg$c813 = { type: "literal", value: "THEN", description: "\"THEN\"" },
        peg$c814 = "to",
        peg$c815 = { type: "literal", value: "TO", description: "\"TO\"" },
        peg$c816 = "transaction",
        peg$c817 = { type: "literal", value: "TRANSACTION", description: "\"TRANSACTION\"" },
        peg$c818 = "trigger",
        peg$c819 = { type: "literal", value: "TRIGGER", description: "\"TRIGGER\"" },
        peg$c820 = "union",
        peg$c821 = { type: "literal", value: "UNION", description: "\"UNION\"" },
        peg$c822 = "unique",
        peg$c823 = { type: "literal", value: "UNIQUE", description: "\"UNIQUE\"" },
        peg$c824 = "update",
        peg$c825 = { type: "literal", value: "UPDATE", description: "\"UPDATE\"" },
        peg$c826 = "using",
        peg$c827 = { type: "literal", value: "USING", description: "\"USING\"" },
        peg$c828 = "vacuum",
        peg$c829 = { type: "literal", value: "VACUUM", description: "\"VACUUM\"" },
        peg$c830 = "values",
        peg$c831 = { type: "literal", value: "VALUES", description: "\"VALUES\"" },
        peg$c832 = "view",
        peg$c833 = { type: "literal", value: "VIEW", description: "\"VIEW\"" },
        peg$c834 = "virtual",
        peg$c835 = { type: "literal", value: "VIRTUAL", description: "\"VIRTUAL\"" },
        peg$c836 = "when",
        peg$c837 = { type: "literal", value: "WHEN", description: "\"WHEN\"" },
        peg$c838 = "where",
        peg$c839 = { type: "literal", value: "WHERE", description: "\"WHERE\"" },
        peg$c840 = "with",
        peg$c841 = { type: "literal", value: "WITH", description: "\"WITH\"" },
        peg$c842 = "without",
        peg$c843 = { type: "literal", value: "WITHOUT", description: "\"WITHOUT\"" },
        peg$c844 = function(r) { return util.key(r); },
        peg$c845 = function() { return null; },
        peg$c846 = { type: "other", description: "Line Comment" },
        peg$c847 = "--",
        peg$c848 = { type: "literal", value: "--", description: "\"--\"" },
        peg$c849 = { type: "other", description: "Block Comment" },
        peg$c850 = "/*",
        peg$c851 = { type: "literal", value: "/*", description: "\"/*\"" },
        peg$c852 = "*/",
        peg$c853 = { type: "literal", value: "*/", description: "\"*/\"" },
        peg$c854 = { type: "any", description: "any character" },
        peg$c855 = { type: "other", description: "Whitespace" },
        peg$c856 = /^[ \t]/,
        peg$c857 = { type: "class", value: "[ \\t]", description: "[ \\t]" },
        peg$c858 = { type: "other", description: "New Line" },
        peg$c859 = /^[\n\x0B\f\r]/,
        peg$c860 = { type: "class", value: "[\\n\\v\\f\\r]", description: "[\\n\\v\\f\\r]" },
        peg$c861 = "__TODO__",
        peg$c862 = { type: "literal", value: "__TODO__", description: "\"__TODO__\"" },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parsestart() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_list();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_list() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsesemi_optional();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsestmt_list_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsestmt_list_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesemi_optional();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c1(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesemi_optional() {
      var s0, s1;

      s0 = [];
      s1 = peg$parsesym_semi();
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parsesym_semi();
      }

      return s0;
    }

    function peg$parsesemi_required() {
      var s0, s1;

      s0 = [];
      s1 = peg$parsesym_semi();
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$parsesym_semi();
        }
      } else {
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_list_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesemi_required();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_concat();
      if (s1 === peg$FAILED) {
        s1 = peg$parseexpression_types();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c3); }
      }

      return s0;
    }

    function peg$parseexpression_types() {
      var s0;

      s0 = peg$parseexpression_wrapped();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_unary();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_node();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_value();
          }
        }
      }

      return s0;
    }

    function peg$parseexpression_concat() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsebinary_loop_concat();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c6(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c5); }
      }

      return s0;
    }

    function peg$parseexpression_wrapped() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c7); }
      }

      return s0;
    }

    function peg$parseexpression_value() {
      var s0;

      s0 = peg$parseexpression_cast();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_exists();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_case();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_raise();
            if (s0 === peg$FAILED) {
              s0 = peg$parsebind_parameter();
              if (s0 === peg$FAILED) {
                s0 = peg$parsefunction_call();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseliteral_value();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseid_column();
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseexpression_unary() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseoperator_unary();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c10(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c9); }
      }

      return s0;
    }

    function peg$parseexpression_cast() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCAST();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_popen();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexpression();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsetype_alias();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsesym_pclose();
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c12(s1, s4, s6);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c11); }
      }

      return s0;
    }

    function peg$parsetype_alias() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetype_definition();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c14(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }

      return s0;
    }

    function peg$parseexpression_exists() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_exists_ne();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c16(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c15); }
      }

      return s0;
    }

    function peg$parseexpression_exists_ne() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEXISTS();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c18(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c17); }
      }

      return s0;
    }

    function peg$parseexpression_case() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCASE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parseexpression_case_when();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parseexpression_case_when();
                }
              } else {
                s5 = peg$FAILED;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseexpression_case_else();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseEND();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseo();
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c20(s1, s3, s5, s7);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c19); }
      }

      return s0;
    }

    function peg$parseexpression_case_when() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHEN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseTHEN();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsee();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseexpression();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c22(s1, s3, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c21); }
      }

      return s0;
    }

    function peg$parseexpression_case_else() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseELSE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c24(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c23); }
      }

      return s0;
    }

    function peg$parseexpression_raise() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseRAISE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_popen();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_raise_args();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsesym_pclose();
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c26(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c25); }
      }

      return s0;
    }

    function peg$parseexpression_raise_args() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseraise_args_ignore();
      if (s1 === peg$FAILED) {
        s1 = peg$parseraise_args_message();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c28(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c27); }
      }

      return s0;
    }

    function peg$parseraise_args_ignore() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIGNORE();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c30(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c29); }
      }

      return s0;
    }

    function peg$parseraise_args_message() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseROLLBACK();
      if (s1 === peg$FAILED) {
        s1 = peg$parseABORT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseFAIL();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_comma();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseerror_message();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c31(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_node() {
      var s0;

      s0 = peg$parseexpression_collate();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_compare();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_null();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_between();
            if (s0 === peg$FAILED) {
              s0 = peg$parseexpression_in();
              if (s0 === peg$FAILED) {
                s0 = peg$parsestmt_select();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseoperation_binary();
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseexpression_collate() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCOLLATE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseid_collation();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c33(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c32); }
      }

      return s0;
    }

    function peg$parseexpression_compare() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseLIKE();
            if (s4 === peg$FAILED) {
              s4 = peg$parseGLOB();
              if (s4 === peg$FAILED) {
                s4 = peg$parseREGEXP();
                if (s4 === peg$FAILED) {
                  s4 = peg$parseMATCH();
                }
              }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseexpression_escape();
                    if (s8 === peg$FAILED) {
                      s8 = null;
                    }
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c35(s1, s3, s4, s6, s8);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }

      return s0;
    }

    function peg$parseexpression_escape() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseESCAPE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c37(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c36); }
      }

      return s0;
    }

    function peg$parseexpression_null() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_null_nodes();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c39(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c38); }
      }

      return s0;
    }

    function peg$parseexpression_null_nodes() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsenull_nodes_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseNULL();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsee();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c41(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c40); }
      }

      return s0;
    }

    function peg$parsenull_nodes_types() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        s2 = peg$parseNOT();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c42(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseexpression_isnt() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c44(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c43); }
      }

      return s0;
    }

    function peg$parseexpression_is_not() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseNOT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c45(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_between() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseBETWEEN();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseAND();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsee();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseexpression();
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c47(s1, s3, s4, s6, s8, s10);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c46); }
      }

      return s0;
    }

    function peg$parseexpression_in() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseIN();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression_in_target();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c49(s1, s3, s4, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c48); }
      }

      return s0;
    }

    function peg$parseexpression_in_target() {
      var s0;

      s0 = peg$parseexpression_list_or_select();
      if (s0 === peg$FAILED) {
        s0 = peg$parseid_table();
      }

      return s0;
    }

    function peg$parseexpression_list_or_select() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_select();
        if (s2 === peg$FAILED) {
          s2 = peg$parseexpression_list();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c50(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetype_definition() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetype_definition_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c52(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c51); }
      }

      return s0;
    }

    function peg$parsetype_definition_args() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_number_signed();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsedefinition_args_loop();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c54(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c53); }
      }

      return s0;
    }

    function peg$parsedefinition_args_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseliteral_number_signed();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseliteral_value() {
      var s0;

      s0 = peg$parseliteral_number();
      if (s0 === peg$FAILED) {
        s0 = peg$parseliteral_string();
        if (s0 === peg$FAILED) {
          s0 = peg$parseliteral_blob();
          if (s0 === peg$FAILED) {
            s0 = peg$parseliteral_null();
            if (s0 === peg$FAILED) {
              s0 = peg$parseliteral_date();
            }
          }
        }
      }

      return s0;
    }

    function peg$parseliteral_null() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseNULL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c56(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c55); }
      }

      return s0;
    }

    function peg$parseliteral_date() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCURRENT_DATE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseCURRENT_TIMESTAMP();
        if (s1 === peg$FAILED) {
          s1 = peg$parseCURRENT_TIME();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c58(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c57); }
      }

      return s0;
    }

    function peg$parseliteral_string() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseliteral_string_single();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c60(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c59); }
      }

      return s0;
    }

    function peg$parseliteral_string_single() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_sglquote();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseliteral_string_schar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseliteral_string_schar();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_sglquote();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c62(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c61); }
      }

      return s0;
    }

    function peg$parseliteral_string_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c63) {
        s0 = peg$c63;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c65.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c66); }
        }
      }

      return s0;
    }

    function peg$parseliteral_blob() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c68.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c69); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_string_single();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c70(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c67); }
      }

      return s0;
    }

    function peg$parsenumber_sign() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_plus();
      if (s1 === peg$FAILED) {
        s1 = peg$parsesym_minus();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c2(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c71); }
      }

      return s0;
    }

    function peg$parseliteral_number_signed() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsenumber_sign();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_number();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c72(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseliteral_number() {
      var s0;

      s0 = peg$parseliteral_number_decimal();
      if (s0 === peg$FAILED) {
        s0 = peg$parseliteral_number_hex();
      }

      return s0;
    }

    function peg$parseliteral_number_decimal() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsenumber_decimal_node();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenumber_decimal_exponent();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c73(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsenumber_decimal_node() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsenumber_decimal_full();
      if (s0 === peg$FAILED) {
        s0 = peg$parsenumber_decimal_fraction();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }

      return s0;
    }

    function peg$parsenumber_decimal_full() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsenumber_digit();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsenumber_digit();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenumber_decimal_fraction();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c75(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsenumber_decimal_fraction() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_dot();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenumber_digit();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsenumber_digit();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c76(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsenumber_decimal_exponent() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 1).toLowerCase() === peg$c78) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c79); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c80.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c81); }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsenumber_digit();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenumber_digit();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c82(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c77); }
      }

      return s0;
    }

    function peg$parseliteral_number_hex() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c84) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c85); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenumber_hex();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsenumber_hex();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c86(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c83); }
      }

      return s0;
    }

    function peg$parsenumber_hex() {
      var s0;

      if (peg$c87.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c88); }
      }

      return s0;
    }

    function peg$parsenumber_digit() {
      var s0;

      if (peg$c89.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c90); }
      }

      return s0;
    }

    function peg$parsebind_parameter() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsebind_parameter_numbered();
      if (s1 === peg$FAILED) {
        s1 = peg$parsebind_parameter_named();
        if (s1 === peg$FAILED) {
          s1 = peg$parsebind_parameter_tcl();
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c92(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c91); }
      }

      return s0;
    }

    function peg$parsebind_parameter_numbered() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_quest();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        if (peg$c94.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c95); }
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          if (peg$c89.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c90); }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c89.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c90); }
            }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c96(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c93); }
      }

      return s0;
    }

    function peg$parsebind_parameter_named() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c98.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c99); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c100(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c97); }
      }

      return s0;
    }

    function peg$parsebind_parameter_tcl() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 36) {
        s1 = peg$c102;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c103); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s3 = peg$c104;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c105); }
          }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
            if (s3 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 58) {
                s3 = peg$c104;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c105); }
              }
            }
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsetcl_suffix();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c106(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c101); }
      }

      return s0;
    }

    function peg$parsetcl_suffix() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename_dblquoted();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c107(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseoperation_binary() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseoperator_binary();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_types();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c109(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c108); }
      }

      return s0;
    }

    function peg$parsebinary_loop_concat() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseAND();
      if (s1 === peg$FAILED) {
        s1 = peg$parseOR();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c110(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_list() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseexpression_list_rest();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseexpression_list_rest();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c112(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c111); }
      }

      return s0;
    }

    function peg$parseexpression_list_rest() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c50(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefunction_call() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_popen();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefunction_call_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c114(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c113); }
      }

      return s0;
    }

    function peg$parsefunction_call_args() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseselect_star();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c116(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseargs_list_distinct();
        if (s1 === peg$FAILED) {
          s1 = null;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseexpression_list();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c117(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c115); }
      }

      return s0;
    }

    function peg$parseargs_list_distinct() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDISTINCT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c118(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseerror_message() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseliteral_string();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c120(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c119); }
      }

      return s0;
    }

    function peg$parsestmt() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsestmt_modifier();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_nodes();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c122(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c121); }
      }

      return s0;
    }

    function peg$parsestmt_modifier() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseEXPLAIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsemodifier_query();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c124(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c123); }
      }

      return s0;
    }

    function peg$parsemodifier_query() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseQUERY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsePLAN();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c126(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c125); }
      }

      return s0;
    }

    function peg$parsestmt_nodes() {
      var s0;

      s0 = peg$parsestmt_crud();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_create();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_drop();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_transaction();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestmt_alter();
              if (s0 === peg$FAILED) {
                s0 = peg$parsestmt_rollback();
                if (s0 === peg$FAILED) {
                  s0 = peg$parsestmt_savepoint();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parsestmt_release();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parsestmt_sqlite();
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsestmt_transaction() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsestmt_begin();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_list();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_commit();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c128(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c127); }
      }

      return s0;
    }

    function peg$parsestmt_commit() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCOMMIT();
      if (s1 === peg$FAILED) {
        s1 = peg$parseEND();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecommit_transaction();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c130(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c129); }
      }

      return s0;
    }

    function peg$parsestmt_begin() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseBEGIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_begin_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsebegin_transaction();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c132(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c131); }
      }

      return s0;
    }

    function peg$parsecommit_transaction() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseTRANSACTION();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsebegin_transaction() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseTRANSACTION();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_begin_modifier() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDEFERRED();
      if (s1 === peg$FAILED) {
        s1 = peg$parseIMMEDIATE();
        if (s1 === peg$FAILED) {
          s1 = peg$parseEXCLUSIVE();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c133(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_rollback() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseROLLBACK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsebegin_transaction();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parserollback_savepoint();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c135(s1, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c134); }
      }

      return s0;
    }

    function peg$parserollback_savepoint() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseTO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesavepoint_alt();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_savepoint();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c8(s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c136); }
      }

      return s0;
    }

    function peg$parsesavepoint_alt() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseSAVEPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c137(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_savepoint() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesavepoint_alt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_savepoint();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c139(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c138); }
      }

      return s0;
    }

    function peg$parsestmt_release() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseRELEASE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesavepoint_alt();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_savepoint();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c141(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c140); }
      }

      return s0;
    }

    function peg$parsestmt_alter() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsealter_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_table();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsealter_action();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c143(s1, s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c142); }
      }

      return s0;
    }

    function peg$parsealter_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseALTER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTABLE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c145(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c144); }
      }

      return s0;
    }

    function peg$parsealter_action() {
      var s0;

      s0 = peg$parsealter_action_rename();
      if (s0 === peg$FAILED) {
        s0 = peg$parsealter_action_add();
      }

      return s0;
    }

    function peg$parsealter_action_rename() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseRENAME();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTO();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseid_table();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c147(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c146); }
      }

      return s0;
    }

    function peg$parsealter_action_add() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseADD();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseaction_add_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesource_def_column();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c149(s1, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c148); }
      }

      return s0;
    }

    function peg$parseaction_add_modifier() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseCOLUMN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c137(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_crud() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsestmt_core_with();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_crud_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c150(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_core_with() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseclause_with();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c152(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c151); }
      }

      return s0;
    }

    function peg$parseclause_with() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseWITH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseclause_with_recursive();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseclause_with_tables();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c153(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseclause_with_recursive() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseRECURSIVE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c137(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseclause_with_tables() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseexpression_cte();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseclause_with_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseclause_with_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c154(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseclause_with_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_cte();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c50(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseexpression_cte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_cte();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_alias();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c156(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c155); }
      }

      return s0;
    }

    function peg$parseselect_alias() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c157(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_wrapped() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_select();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c2(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_sqlite() {
      var s0;

      s0 = peg$parsestmt_detach();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_vacuum();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_analyze();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_reindex();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestmt_pragma();
            }
          }
        }
      }

      return s0;
    }

    function peg$parsestmt_detach() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDETACH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = peg$parseDATABASE();
          if (s4 !== peg$FAILED) {
            s5 = peg$parsee();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_database();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c159(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c158); }
      }

      return s0;
    }

    function peg$parsestmt_vacuum() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseVACUUM();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c161(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c160); }
      }

      return s0;
    }

    function peg$parsestmt_analyze() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseANALYZE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseanalyze_arg();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c163(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c162); }
      }

      return s0;
    }

    function peg$parseanalyze_arg() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_table();
        if (s2 === peg$FAILED) {
          s2 = peg$parseid_index();
          if (s2 === peg$FAILED) {
            s2 = peg$parseid_database();
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c164(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_reindex() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREINDEX();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsereindex_arg();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c163(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c165); }
      }

      return s0;
    }

    function peg$parsereindex_arg() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_table();
        if (s2 === peg$FAILED) {
          s2 = peg$parseid_index();
          if (s2 === peg$FAILED) {
            s2 = peg$parseid_collation();
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c166(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_pragma() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsePRAGMA();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_pragma();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsepragma_expression();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c168(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c167); }
      }

      return s0;
    }

    function peg$parsepragma_expression() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_equal();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsepragma_value();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c169(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesym_popen();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsepragma_value();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseo();
            if (s3 !== peg$FAILED) {
              s4 = peg$parsesym_pclose();
              if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c169(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parsepragma_value() {
      var s0;

      s0 = peg$parsepragma_value_bool();
      if (s0 === peg$FAILED) {
        s0 = peg$parsepragma_value_literal();
        if (s0 === peg$FAILED) {
          s0 = peg$parsepragma_value_name();
        }
      }

      return s0;
    }

    function peg$parsepragma_value_literal() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseliteral_number_signed();
      if (s1 === peg$FAILED) {
        s1 = peg$parseliteral_string();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c169(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsepragma_value_bool() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = peg$currPos;
        s2 = peg$c170(s1);
        if (s2) {
          s2 = void 0;
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c171(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsepragma_value_name() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c172(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsestmt_crud_types() {
      var s0;

      s0 = peg$parsestmt_select();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_insert();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_update();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_delete();
          }
        }
      }

      return s0;
    }

    function peg$parsestmt_select() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseselect_loop();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_order();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_limit();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c174(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c173); }
      }

      return s0;
    }

    function peg$parsestmt_core_order() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseORDER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_order_list();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c176(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c175); }
      }

      return s0;
    }

    function peg$parsestmt_core_limit() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseLIMIT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_limit_offset();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c178(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c177); }
      }

      return s0;
    }

    function peg$parsestmt_core_limit_offset() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parselimit_offset_variant();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c180(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c179); }
      }

      return s0;
    }

    function peg$parselimit_offset_variant() {
      var s0;

      s0 = peg$parselimit_offset_variant_name();
      if (s0 === peg$FAILED) {
        s0 = peg$parsesym_comma();
      }

      return s0;
    }

    function peg$parselimit_offset_variant_name() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseOFFSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c137(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseselect_parts();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_loop_union();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseselect_loop_union();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c181(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_loop_union() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseoperator_compound();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_parts();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c183(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c182); }
      }

      return s0;
    }

    function peg$parseselect_parts() {
      var s0;

      s0 = peg$parseselect_parts_core();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_parts_values();
      }

      return s0;
    }

    function peg$parseselect_parts_core() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseselect_core_select();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_core_from();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_where();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseselect_core_group();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c184(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_core_select() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseSELECT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseselect_target();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c186(s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c185); }
      }

      return s0;
    }

    function peg$parseselect_modifier() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseselect_modifier_distinct();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_modifier_all();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c187); }
      }

      return s0;
    }

    function peg$parseselect_modifier_distinct() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDISTINCT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c188(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_modifier_all() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseALL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c189(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_target() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseselect_node();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_target_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseselect_target_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c154(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_target_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_node();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c8(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_core_from() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseFROM();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_source();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c191(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c190); }
      }

      return s0;
    }

    function peg$parsestmt_core_where() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHERE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c193(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c192); }
      }

      return s0;
    }

    function peg$parseselect_core_group() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseGROUP();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_list();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseselect_core_having();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c195(s1, s5, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c194); }
      }

      return s0;
    }

    function peg$parseselect_core_having() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseHAVING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c197(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c196); }
      }

      return s0;
    }

    function peg$parseselect_node() {
      var s0;

      s0 = peg$parseselect_node_star();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_node_aliased();
      }

      return s0;
    }

    function peg$parseselect_node_star() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseselect_node_star_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_star();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c198(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_node_star_qualified() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c199(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_node_aliased() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsealias();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c200(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_source() {
      var s0;

      s0 = peg$parseselect_join_loop();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_source_loop();
      }

      return s0;
    }

    function peg$parseselect_source_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsetable_or_sub();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_loop_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_loop_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c201(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_loop_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_or_sub();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c4(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_or_sub() {
      var s0;

      s0 = peg$parsetable_or_sub_sub();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_qualified();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetable_or_sub_select();
        }
      }

      return s0;
    }

    function peg$parsetable_qualified() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetable_qualified_id();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_or_sub_index_node();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c203(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c202); }
      }

      return s0;
    }

    function peg$parsetable_qualified_id() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsealias();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c205(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c204); }
      }

      return s0;
    }

    function peg$parsetable_or_sub_index_node() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseindex_node_indexed();
      if (s0 === peg$FAILED) {
        s0 = peg$parseindex_node_none();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c206); }
      }

      return s0;
    }

    function peg$parseindex_node_indexed() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseINDEXED();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsename();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c207(s1, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseindex_node_none() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseINDEXED();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c208(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_or_sub_sub() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_source();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c210(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c209); }
      }

      return s0;
    }

    function peg$parsetable_or_sub_select() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseselect_wrapped();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsealias();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c212(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c211); }
      }

      return s0;
    }

    function peg$parsealias() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseAS();
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsename_char();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseo();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c214(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c213); }
      }

      return s0;
    }

    function peg$parseselect_join_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsetable_or_sub();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_join_clause();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseselect_join_clause();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c215(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseselect_join_clause() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_operator();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_or_sub();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsejoin_condition();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c217(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c216); }
      }

      return s0;
    }

    function peg$parsejoin_operator() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_operator_natural();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsejoin_operator_types();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseJOIN();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c219(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c218); }
      }

      return s0;
    }

    function peg$parsejoin_operator_natural() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseNATURAL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c45(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsejoin_operator_types() {
      var s0;

      s0 = peg$parseoperator_types_hand();
      if (s0 === peg$FAILED) {
        s0 = peg$parseoperator_types_misc();
      }

      return s0;
    }

    function peg$parseoperator_types_hand() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseLEFT();
      if (s1 === peg$FAILED) {
        s1 = peg$parseRIGHT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseFULL();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetypes_hand_outer();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c220(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetypes_hand_outer() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseOUTER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c221(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseoperator_types_misc() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseINNER();
      if (s1 === peg$FAILED) {
        s1 = peg$parseCROSS();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c221(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsejoin_condition() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_condition_on();
      if (s1 === peg$FAILED) {
        s1 = peg$parsejoin_condition_using();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c223(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c222); }
      }

      return s0;
    }

    function peg$parsejoin_condition_on() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c225(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c224); }
      }

      return s0;
    }

    function peg$parsejoin_condition_using() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUSING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseloop_columns();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c227(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c226); }
      }

      return s0;
    }

    function peg$parseselect_parts_values() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseVALUES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_values_list();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c229(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c228); }
      }

      return s0;
    }

    function peg$parsestmt_core_order_list() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsestmt_core_order_list_item();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_order_list_loop();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c230(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_core_order_list_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_core_order_list_item();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c231(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_core_order_list_item() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_collate();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseprimary_column_dir();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c233(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c232); }
      }

      return s0;
    }

    function peg$parseselect_star() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_star();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c234); }
      }

      return s0;
    }

    function peg$parsestmt_fallback_types() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREPLACE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseROLLBACK();
        if (s1 === peg$FAILED) {
          s1 = peg$parseABORT();
          if (s1 === peg$FAILED) {
            s1 = peg$parseFAIL();
            if (s1 === peg$FAILED) {
              s1 = peg$parseIGNORE();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c236(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c235); }
      }

      return s0;
    }

    function peg$parsestmt_insert() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_keyword();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_target();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c238(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c237); }
      }

      return s0;
    }

    function peg$parseinsert_keyword() {
      var s0;

      s0 = peg$parseinsert_keyword_ins();
      if (s0 === peg$FAILED) {
        s0 = peg$parseinsert_keyword_repl();
      }

      return s0;
    }

    function peg$parseinsert_keyword_ins() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseINSERT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_keyword_mod();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c240(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c239); }
      }

      return s0;
    }

    function peg$parseinsert_keyword_repl() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREPLACE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c242(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c241); }
      }

      return s0;
    }

    function peg$parseinsert_keyword_mod() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c244(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c243); }
      }

      return s0;
    }

    function peg$parseinsert_target() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseinsert_into();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinsert_results();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c245(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseinsert_into() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_into_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_cte();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c247(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c246); }
      }

      return s0;
    }

    function peg$parseinsert_into_start() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseINTO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c248); }
      }

      return s0;
    }

    function peg$parseinsert_results() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_value();
      if (s1 === peg$FAILED) {
        s1 = peg$parseinsert_select();
        if (s1 === peg$FAILED) {
          s1 = peg$parseinsert_default();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c249(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c228); }
      }

      return s0;
    }

    function peg$parseloop_columns() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_name();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseloop_column_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseloop_column_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c251(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c250); }
      }

      return s0;
    }

    function peg$parseloop_column_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_name();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c252(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseloop_name() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c254(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c253); }
      }

      return s0;
    }

    function peg$parseinsert_value() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_value_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinsert_values_list();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c255(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c228); }
      }

      return s0;
    }

    function peg$parseinsert_value_start() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseVALUES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c137(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c256); }
      }

      return s0;
    }

    function peg$parseinsert_values_list() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseinsert_values();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseinsert_values_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseinsert_values_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c257(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseinsert_values_loop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinsert_values();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c50(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseinsert_values() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_list();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c259(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c258); }
      }

      return s0;
    }

    function peg$parseinsert_select() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsestmt_select();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c185); }
      }

      return s0;
    }

    function peg$parseinsert_default() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVALUES();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c261(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c260); }
      }

      return s0;
    }

    function peg$parseoperator_compound() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecompound_union();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINTERSECT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseEXCEPT();
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c137(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c262); }
      }

      return s0;
    }

    function peg$parsecompound_union() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUNION();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecompound_union_all();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c264(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c263); }
      }

      return s0;
    }

    function peg$parsecompound_union_all() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseALL();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c265(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsestmt_update() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseupdate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseupdate_fallback();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_qualified();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseupdate_set();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsestmt_core_where();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsestmt_core_order();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsestmt_core_limit();
                      if (s9 === peg$FAILED) {
                        s9 = null;
                      }
                      if (s9 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c267(s1, s2, s3, s5, s6, s7, s9);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c266); }
      }

      return s0;
    }

    function peg$parseupdate_start() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUPDATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c137(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c268); }
      }

      return s0;
    }

    function peg$parseupdate_fallback() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c270(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c269); }
      }

      return s0;
    }

    function peg$parseupdate_set() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseupdate_columns();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c272(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c271); }
      }

      return s0;
    }

    function peg$parseupdate_columns() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseupdate_column();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseupdate_columns_tail();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseupdate_columns_tail();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c257(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseupdate_columns_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_comma();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseupdate_column();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c252(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseupdate_column() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_column();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_equal();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexpression_types();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c274(s1, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c273); }
      }

      return s0;
    }

    function peg$parsestmt_delete() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedelete_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_qualified();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsestmt_core_where();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_order();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parsestmt_core_limit();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c276(s1, s2, s4, s5, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c275); }
      }

      return s0;
    }

    function peg$parsedelete_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDELETE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseFROM();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c137(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c277); }
      }

      return s0;
    }

    function peg$parsestmt_create() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsecreate_table_only();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecreate_index_only();
        if (s0 === peg$FAILED) {
          s0 = peg$parsecreate_trigger_only();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecreate_view_only();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecreate_virtual_only();
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c278); }
      }

      return s0;
    }

    function peg$parsecreate_start() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseCREATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c137(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_table_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseINDEX();
        if (s4 === peg$FAILED) {
          s4 = peg$parseTRIGGER();
          if (s4 === peg$FAILED) {
            s4 = peg$parseVIEW();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_table();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c252(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_index_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseTRIGGER();
          if (s4 === peg$FAILED) {
            s4 = peg$parseVIEW();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_index();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c252(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_trigger_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseINDEX();
          if (s4 === peg$FAILED) {
            s4 = peg$parseVIEW();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_trigger();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c252(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_view_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseINDEX();
          if (s4 === peg$FAILED) {
            s4 = peg$parseTRIGGER();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIRTUAL();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_view();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c252(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_virtual_only() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsecreate_start();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseTABLE();
        if (s4 === peg$FAILED) {
          s4 = peg$parseINDEX();
          if (s4 === peg$FAILED) {
            s4 = peg$parseTRIGGER();
            if (s4 === peg$FAILED) {
              s4 = peg$parseVIEW();
            }
          }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_virtual();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c252(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_table() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_table_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_table();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsecreate_table_source();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c280(s1, s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c279); }
      }

      return s0;
    }

    function peg$parsecreate_table_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_tmp();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTABLE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c281(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_core_tmp() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseTEMPORARY();
      if (s1 === peg$FAILED) {
        s1 = peg$parseTEMP();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c42(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_core_ine() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEXISTS();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c283(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c282); }
      }

      return s0;
    }

    function peg$parsecreate_table_source() {
      var s0;

      s0 = peg$parsetable_source_def();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_source_select();
      }

      return s0;
    }

    function peg$parsetable_source_def() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesource_def_loop();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_tbl_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_tbl_loop();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesource_def_rowid();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c285(s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c284); }
      }

      return s0;
    }

    function peg$parsesource_def_rowid() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseWITHOUT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseROWID();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c286(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_def_loop() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesource_def_column();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_def_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_def_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c257(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_def_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesource_def_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c4(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_tbl_loop() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_constraint();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c287(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsesource_def_column() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parsename_char();
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = void 0;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseo();
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_type();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsecolumn_constraints();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c289(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c288); }
      }

      return s0;
    }

    function peg$parsecolumn_type() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetype_definition();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c291(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c290); }
      }

      return s0;
    }

    function peg$parsecolumn_constraints() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsecolumn_constraint();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsecolumn_constraint_tail();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsecolumn_constraint_tail();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c257(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecolumn_constraint_tail() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecolumn_constraint();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c252(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecolumn_constraint() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecolumn_constraint_name();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecolumn_constraint_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c293(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c292); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_name() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCONSTRAINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c295(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c294); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_types() {
      var s0;

      s0 = peg$parsecolumn_constraint_primary();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecolumn_constraint_null();
        if (s0 === peg$FAILED) {
          s0 = peg$parsecolumn_constraint_check();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecolumn_constraint_default();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecolumn_constraint_collate();
              if (s0 === peg$FAILED) {
                s0 = peg$parsecolumn_constraint_foreign();
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_foreign() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseforeign_clause();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c297(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c296); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_primary() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecol_primary_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column_dir();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseprimary_conflict();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsecol_primary_auto();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c299(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c298); }
      }

      return s0;
    }

    function peg$parsecol_primary_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsePRIMARY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c301(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c300); }
      }

      return s0;
    }

    function peg$parsecol_primary_auto() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseAUTOINCREMENT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c303(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c302); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_null() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseconstraint_null_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_conflict();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c304(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseconstraint_null_types() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseconstraint_null_value();
      if (s1 === peg$FAILED) {
        s1 = peg$parseUNIQUE();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c42(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c305); }
      }

      return s0;
    }

    function peg$parseconstraint_null_value() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseNULL();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c307(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c306); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_check() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseconstraint_check();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c308); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_default() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecol_default_val();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c310(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c309); }
      }

      return s0;
    }

    function peg$parsecol_default_val() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_wrapped();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c169(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsee();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseliteral_number_signed();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c169(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsee();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseliteral_value();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c169(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c311); }
      }

      return s0;
    }

    function peg$parsecolumn_constraint_collate() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecolumn_collate();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c313(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c312); }
      }

      return s0;
    }

    function peg$parsetable_constraint() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetable_constraint_name();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_constraint_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c315(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c314); }
      }

      return s0;
    }

    function peg$parsetable_constraint_name() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCONSTRAINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c295(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c316); }
      }

      return s0;
    }

    function peg$parsetable_constraint_types() {
      var s0;

      s0 = peg$parsetable_constraint_foreign();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_constraint_primary();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetable_constraint_check();
        }
      }

      return s0;
    }

    function peg$parsetable_constraint_check() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseconstraint_check();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c318(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c317); }
      }

      return s0;
    }

    function peg$parsetable_constraint_primary() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseprimary_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseprimary_columns();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseprimary_conflict();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c320(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c319); }
      }

      return s0;
    }

    function peg$parseprimary_start() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseprimary_start_normal();
      if (s1 === peg$FAILED) {
        s1 = peg$parseprimary_start_unique();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c321(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseprimary_start_normal() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsePRIMARY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c322(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c300); }
      }

      return s0;
    }

    function peg$parseprimary_start_unique() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUNIQUE();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c324(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c323); }
      }

      return s0;
    }

    function peg$parseprimary_columns() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseprimary_column_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseprimary_column_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c257(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c325); }
      }

      return s0;
    }

    function peg$parseprimary_column() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_collate();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseprimary_column_dir();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c327(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c326); }
      }

      return s0;
    }

    function peg$parsecolumn_collate() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCOLLATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_collation();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c329(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c328); }
      }

      return s0;
    }

    function peg$parseprimary_column_dir() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseASC();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDESC();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c331(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c330); }
      }

      return s0;
    }

    function peg$parseprimary_column_tail() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c252(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseprimary_conflict() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseprimary_conflict_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c332(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseprimary_conflict_start() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCONFLICT();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c334(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c333); }
      }

      return s0;
    }

    function peg$parseconstraint_check() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseCHECK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c335(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_constraint_foreign() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseforeign_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_columns();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseforeign_clause();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c337(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c336); }
      }

      return s0;
    }

    function peg$parseforeign_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseFOREIGN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c339(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c338); }
      }

      return s0;
    }

    function peg$parseforeign_clause() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseforeign_references();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseforeign_actions();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseforeign_deferrable();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c340(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_references() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseREFERENCES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_cte();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c342(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c341); }
      }

      return s0;
    }

    function peg$parseforeign_actions() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseforeign_action();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseforeign_actions_tail();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseforeign_actions_tail();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c343(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_actions_tail() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseforeign_action();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c265(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_action() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseforeign_action_on();
      if (s0 === peg$FAILED) {
        s0 = peg$parseforeign_action_match();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c344); }
      }

      return s0;
    }

    function peg$parseforeign_action_on() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDELETE();
          if (s3 === peg$FAILED) {
            s3 = peg$parseUPDATE();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseaction_on_action();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c345(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseaction_on_action() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parseon_action_set();
      if (s0 === peg$FAILED) {
        s0 = peg$parseon_action_cascade();
        if (s0 === peg$FAILED) {
          s0 = peg$parseon_action_none();
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c346); }
      }

      return s0;
    }

    function peg$parseon_action_set() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseNULL();
          if (s3 === peg$FAILED) {
            s3 = peg$parseDEFAULT();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c347(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseon_action_cascade() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseCASCADE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseRESTRICT();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c348(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseon_action_none() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseNO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseACTION();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c349(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_action_match() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseMATCH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c350(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseforeign_deferrable() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseDEFERRABLE();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedeferrable_initially();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c352(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c351); }
      }

      return s0;
    }

    function peg$parsedeferrable_initially() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseINITIALLY();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsee();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseDEFERRED();
            if (s4 === peg$FAILED) {
              s4 = peg$parseIMMEDIATE();
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c353(s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetable_source_select() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsecreate_as_select();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c354(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecreate_index() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_index_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_index();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseindex_on();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsestmt_core_where();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c356(s1, s2, s3, s5, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c355); }
      }

      return s0;
    }

    function peg$parsecreate_index_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseindex_unique();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseINDEX();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c357(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseindex_unique() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseUNIQUE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c358(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseindex_on() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseprimary_columns();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c360(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c359); }
      }

      return s0;
    }

    function peg$parsecreate_trigger() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_trigger_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_trigger();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsetrigger_conditions();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseON();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsee();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsename();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseo();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parsetrigger_foreach();
                        if (s10 === peg$FAILED) {
                          s10 = null;
                        }
                        if (s10 !== peg$FAILED) {
                          s11 = peg$parsetrigger_when();
                          if (s11 === peg$FAILED) {
                            s11 = null;
                          }
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parsetrigger_action();
                            if (s12 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c362(s1, s2, s3, s5, s8, s10, s11, s12);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c361); }
      }

      return s0;
    }

    function peg$parsecreate_trigger_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_tmp();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTRIGGER();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c363(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_conditions() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetrigger_apply_mods();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetrigger_do();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c365(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c364); }
      }

      return s0;
    }

    function peg$parsetrigger_apply_mods() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseBEFORE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseAFTER();
        if (s1 === peg$FAILED) {
          s1 = peg$parsetrigger_apply_instead();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c366(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_apply_instead() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseINSTEAD();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseOF();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c367(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_do() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsetrigger_do_on();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetrigger_do_update();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c368); }
      }

      return s0;
    }

    function peg$parsetrigger_do_on() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseDELETE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINSERT();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c369(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_do_update() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseUPDATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedo_update_of();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c370(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsedo_update_of() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseOF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedo_update_columns();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c371(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsedo_update_columns() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseloop_name();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseloop_column_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseloop_column_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c257(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_foreach() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseFOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEACH();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseROW();
              if (s5 === peg$FAILED) {
                if (input.substr(peg$currPos, 9).toLowerCase() === peg$c372) {
                  s5 = input.substr(peg$currPos, 9);
                  peg$currPos += 9;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c373); }
                }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parsee();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c374(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsetrigger_when() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHEN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c375(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c21); }
      }

      return s0;
    }

    function peg$parsetrigger_action() {
      var s0, s1, s2, s3, s4, s5, s6;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseBEGIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseaction_loop();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseEND();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c377(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c376); }
      }

      return s0;
    }

    function peg$parseaction_loop() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseaction_loop_stmt();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseaction_loop_stmt();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c210(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseaction_loop_stmt() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsestmt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesemi_required();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s1);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_view() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_view_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_view();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsecreate_as_select();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c379(s1, s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c378); }
      }

      return s0;
    }

    function peg$parsecreate_view_start() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_tmp();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVIEW();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c380(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_as_select() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_select();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c255(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsecreate_virtual() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecreate_virtual_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecreate_core_ine();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_table();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseUSING();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsee();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsevirtual_module();
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c382(s1, s2, s3, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c381); }
      }

      return s0;
    }

    function peg$parsecreate_virtual_start() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsecreate_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseVIRTUAL();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsee();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseTABLE();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c383(s1, s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsevirtual_module() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsevirtual_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c384(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsevirtual_args() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsevirtual_arg_types();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c386(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c385); }
      }

      return s0;
    }

    function peg$parsevirtual_arg_types() {
      var s0;

      s0 = peg$parsevirtual_arg_list();
      if (s0 === peg$FAILED) {
        s0 = peg$parsevirtual_arg_def();
      }

      return s0;
    }

    function peg$parsevirtual_arg_list() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsename();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseo();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsetype_definition();
          if (s5 === peg$FAILED) {
            s5 = peg$parsecolumn_constraint();
          }
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_list();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c210(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsevirtual_arg_def() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsesource_def_loop();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c210(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsestmt_drop() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedrop_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_table();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c388(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c387); }
      }

      return s0;
    }

    function peg$parsedrop_start() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDROP();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedrop_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsedrop_conditions();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c390(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c389); }
      }

      return s0;
    }

    function peg$parsedrop_types() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseTABLE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINDEX();
        if (s1 === peg$FAILED) {
          s1 = peg$parseTRIGGER();
          if (s1 === peg$FAILED) {
            s1 = peg$parseVIEW();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c42(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c391); }
      }

      return s0;
    }

    function peg$parsedrop_conditions() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsedrop_ie();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c392(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsedrop_ie() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEXISTS();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c394(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c393); }
      }

      return s0;
    }

    function peg$parseoperator_unary() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_tilde();
      if (s0 === peg$FAILED) {
        s0 = peg$parsesym_minus();
        if (s0 === peg$FAILED) {
          s0 = peg$parsesym_plus();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_is_not();
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c395); }
      }

      return s0;
    }

    function peg$parseoperator_binary() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsebinary_nodes();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c397(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c396); }
      }

      return s0;
    }

    function peg$parsebinary_nodes() {
      var s0;

      s0 = peg$parsebinary_concat();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_isnt();
        if (s0 === peg$FAILED) {
          s0 = peg$parsebinary_multiply();
          if (s0 === peg$FAILED) {
            s0 = peg$parsebinary_mod();
            if (s0 === peg$FAILED) {
              s0 = peg$parsebinary_plus();
              if (s0 === peg$FAILED) {
                s0 = peg$parsebinary_minus();
                if (s0 === peg$FAILED) {
                  s0 = peg$parsebinary_left();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parsebinary_right();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parsebinary_and();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parsebinary_or();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parsebinary_lte();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parsebinary_lt();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parsebinary_gte();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parsebinary_gt();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parsebinary_lang();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parsebinary_notequal();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parsebinary_equal();
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsebinary_concat() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_pipe();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_pipe();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c398); }
      }

      return s0;
    }

    function peg$parsebinary_plus() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_plus();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c399); }
      }

      return s0;
    }

    function peg$parsebinary_minus() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_minus();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c400); }
      }

      return s0;
    }

    function peg$parsebinary_multiply() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_star();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c401); }
      }

      return s0;
    }

    function peg$parsebinary_mod() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_mod();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c402); }
      }

      return s0;
    }

    function peg$parsebinary_left() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_lt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_lt();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c403); }
      }

      return s0;
    }

    function peg$parsebinary_right() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_gt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_gt();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c404); }
      }

      return s0;
    }

    function peg$parsebinary_and() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_amp();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c405); }
      }

      return s0;
    }

    function peg$parsebinary_or() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_pipe();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c406); }
      }

      return s0;
    }

    function peg$parsebinary_lt() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_lt();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c407); }
      }

      return s0;
    }

    function peg$parsebinary_gt() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$parsesym_gt();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c408); }
      }

      return s0;
    }

    function peg$parsebinary_lte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_lt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c409); }
      }

      return s0;
    }

    function peg$parsebinary_gte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_gt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c410); }
      }

      return s0;
    }

    function peg$parsebinary_equal() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_equal();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c411); }
      }

      return s0;
    }

    function peg$parsebinary_notequal() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_excl();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesym_lt();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsesym_gt();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c412); }
      }

      return s0;
    }

    function peg$parsebinary_lang() {
      var s0;

      s0 = peg$parsebinary_lang_isnt();
      if (s0 === peg$FAILED) {
        s0 = peg$parsebinary_lang_misc();
      }

      return s0;
    }

    function peg$parsebinary_lang_isnt() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c41(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c413); }
      }

      return s0;
    }

    function peg$parsebinary_lang_misc() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseIN();
      if (s1 === peg$FAILED) {
        s1 = peg$parseLIKE();
        if (s1 === peg$FAILED) {
          s1 = peg$parseGLOB();
          if (s1 === peg$FAILED) {
            s1 = peg$parseMATCH();
            if (s1 === peg$FAILED) {
              s1 = peg$parseREGEXP();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c414(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parseid_database() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c416(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c415); }
      }

      return s0;
    }

    function peg$parseid_table() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c418(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c417); }
      }

      return s0;
    }

    function peg$parseid_table_qualified() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c419(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_column() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecolumn_qualifiers();
      if (s1 === peg$FAILED) {
        s1 = peg$parseid_column_qualified();
        if (s1 === peg$FAILED) {
          s1 = peg$parsecolumn_unqualified();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c421(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c420); }
      }

      return s0;
    }

    function peg$parsecolumn_unqualified() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c422();
      }
      s0 = s1;

      return s0;
    }

    function peg$parsecolumn_qualifiers() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_column_qualified();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c423(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_column_qualified() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c76(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_collation() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c425(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c424); }
      }

      return s0;
    }

    function peg$parseid_savepoint() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c427(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c426); }
      }

      return s0;
    }

    function peg$parseid_index() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c429(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c428); }
      }

      return s0;
    }

    function peg$parseid_trigger() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c431(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c430); }
      }

      return s0;
    }

    function peg$parseid_view() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c433(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c432); }
      }

      return s0;
    }

    function peg$parseid_pragma() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c435(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c434); }
      }

      return s0;
    }

    function peg$parseid_cte() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_expression();
      if (s1 === peg$FAILED) {
        s1 = peg$parseid_table();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c14(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c436); }
      }

      return s0;
    }

    function peg$parseid_table_expression() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseloop_columns();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c437(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseid_constraint_table() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c439(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c438); }
      }

      return s0;
    }

    function peg$parseid_constraint_column() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c441(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c440); }
      }

      return s0;
    }

    function peg$parsedatatype_types() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_text();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c443(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsedatatype_real();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c444(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsedatatype_numeric();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c445(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsedatatype_integer();
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c446(s1);
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parsedatatype_none();
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c447(s1);
              }
              s0 = s1;
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c442); }
      }

      return s0;
    }

    function peg$parsedatatype_text() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 1).toLowerCase() === peg$c449) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c450); }
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3).toLowerCase() === peg$c451) {
          s3 = input.substr(peg$currPos, 3);
          peg$currPos += 3;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c452); }
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c453) {
            s4 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c454); }
          }
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 4).toLowerCase() === peg$c455) {
          s2 = input.substr(peg$currPos, 4);
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c456); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 6).toLowerCase() === peg$c457) {
            s2 = input.substr(peg$currPos, 6);
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c458); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 4).toLowerCase() === peg$c459) {
              s2 = input.substr(peg$currPos, 4);
              peg$currPos += 4;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c460); }
            }
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c461) {
            s3 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c462); }
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c463) {
            s1 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c464); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c42(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c448); }
      }

      return s0;
    }

    function peg$parsedatatype_real() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_real_double();
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 5).toLowerCase() === peg$c466) {
          s1 = input.substr(peg$currPos, 5);
          peg$currPos += 5;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c467); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c468) {
            s1 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c469); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c42(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c465); }
      }

      return s0;
    }

    function peg$parsedatatype_real_double() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c471) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c472); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsereal_double_precision();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c473(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c470); }
      }

      return s0;
    }

    function peg$parsereal_double_precision() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 9).toLowerCase() === peg$c474) {
          s2 = input.substr(peg$currPos, 9);
          peg$currPos += 9;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c475); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c476(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsedatatype_numeric() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c478) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c479); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 7).toLowerCase() === peg$c480) {
          s1 = input.substr(peg$currPos, 7);
          peg$currPos += 7;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c481); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 7).toLowerCase() === peg$c482) {
            s1 = input.substr(peg$currPos, 7);
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c483); }
          }
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            if (input.substr(peg$currPos, 4).toLowerCase() === peg$c484) {
              s2 = input.substr(peg$currPos, 4);
              peg$currPos += 4;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c485); }
            }
            if (s2 !== peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c486) {
                s3 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c487); }
              }
              if (s3 === peg$FAILED) {
                s3 = null;
              }
              if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
              s1 = peg$currPos;
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c486) {
                s2 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c487); }
              }
              if (s2 !== peg$FAILED) {
                if (input.substr(peg$currPos, 5).toLowerCase() === peg$c488) {
                  s3 = input.substr(peg$currPos, 5);
                  peg$currPos += 5;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c489); }
                }
                if (s3 === peg$FAILED) {
                  s3 = null;
                }
                if (s3 !== peg$FAILED) {
                  s2 = [s2, s3];
                  s1 = s2;
                } else {
                  peg$currPos = s1;
                  s1 = peg$FAILED;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c42(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c477); }
      }

      return s0;
    }

    function peg$parsedatatype_integer() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c491) {
        s2 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c492); }
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 50) {
          s3 = peg$c493;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c494); }
        }
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 52) {
            s3 = peg$c495;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c496); }
          }
          if (s3 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 56) {
              s3 = peg$c497;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c498); }
            }
            if (s3 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c499) {
                s3 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c500); }
              }
            }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 3).toLowerCase() === peg$c501) {
          s2 = input.substr(peg$currPos, 3);
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c502); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 6).toLowerCase() === peg$c457) {
            s2 = input.substr(peg$currPos, 6);
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c458); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 5).toLowerCase() === peg$c503) {
              s2 = input.substr(peg$currPos, 5);
              peg$currPos += 5;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c504); }
            }
            if (s2 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c455) {
                s2 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c456); }
              }
            }
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3).toLowerCase() === peg$c491) {
            s3 = input.substr(peg$currPos, 3);
            peg$currPos += 3;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c492); }
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c42(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c490); }
      }

      return s0;
    }

    function peg$parsedatatype_none() {
      var s0, s1;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c506) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c507); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c42(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c505); }
      }

      return s0;
    }

    function peg$parsename_char() {
      var s0;

      if (peg$c508.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c509); }
      }

      return s0;
    }

    function peg$parsename() {
      var s0;

      s0 = peg$parsename_bracketed();
      if (s0 === peg$FAILED) {
        s0 = peg$parsename_backticked();
        if (s0 === peg$FAILED) {
          s0 = peg$parsename_dblquoted();
          if (s0 === peg$FAILED) {
            s0 = peg$parsename_sglquoted();
            if (s0 === peg$FAILED) {
              s0 = peg$parsename_unquoted();
            }
          }
        }
      }

      return s0;
    }

    function peg$parsereserved_nodes() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsedatatype_types();
      if (s1 === peg$FAILED) {
        s1 = peg$parsereserved_words();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c510(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_unquoted() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$parsereserved_nodes();
      if (s2 === peg$FAILED) {
        s2 = peg$parsenumber_digit();
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c511(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_bracketed() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsesym_bopen();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_bracketed_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_bracketed_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_bclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c45(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_bracketed_schar() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = [];
      s4 = peg$parsewhitespace_space();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parsewhitespace_space();
      }
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 93) {
          s4 = peg$c512;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c513); }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        if (peg$c514.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c515); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c8(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_dblquoted() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c516;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c517); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_dblquoted_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_dblquoted_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s3 = peg$c516;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c517); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c518(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_dblquoted_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c519) {
        s0 = peg$c519;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c520); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c521.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c522); }
        }
      }

      return s0;
    }

    function peg$parsename_sglquoted() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c523;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c524); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_sglquoted_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_sglquoted_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s3 = peg$c523;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c524); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c525(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_sglquoted_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c63) {
        s0 = peg$c63;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c65.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c66); }
        }
      }

      return s0;
    }

    function peg$parsename_backticked() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 96) {
        s1 = peg$c526;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c527); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_backticked_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_backticked_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 96) {
            s3 = peg$c526;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c527); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c528(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsename_backticked_schar() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c529) {
        s0 = peg$c529;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c530); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c531.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c532); }
        }
      }

      return s0;
    }

    function peg$parsesym_bopen() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c534;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c535); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c533); }
      }

      return s0;
    }

    function peg$parsesym_bclose() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 93) {
        s1 = peg$c512;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c513); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c536); }
      }

      return s0;
    }

    function peg$parsesym_popen() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c538;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c539); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c537); }
      }

      return s0;
    }

    function peg$parsesym_pclose() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 41) {
        s1 = peg$c541;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c542); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c540); }
      }

      return s0;
    }

    function peg$parsesym_comma() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 44) {
        s1 = peg$c544;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c545); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c543); }
      }

      return s0;
    }

    function peg$parsesym_dot() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s1 = peg$c547;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c548); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c546); }
      }

      return s0;
    }

    function peg$parsesym_star() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 42) {
        s1 = peg$c550;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c551); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c549); }
      }

      return s0;
    }

    function peg$parsesym_quest() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 63) {
        s1 = peg$c553;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c554); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c552); }
      }

      return s0;
    }

    function peg$parsesym_sglquote() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c523;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c524); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c555); }
      }

      return s0;
    }

    function peg$parsesym_dblquote() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c516;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c517); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c556); }
      }

      return s0;
    }

    function peg$parsesym_backtick() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 96) {
        s1 = peg$c526;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c527); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c557); }
      }

      return s0;
    }

    function peg$parsesym_tilde() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 126) {
        s1 = peg$c559;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c560); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c558); }
      }

      return s0;
    }

    function peg$parsesym_plus() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 43) {
        s1 = peg$c562;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c563); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c561); }
      }

      return s0;
    }

    function peg$parsesym_minus() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s1 = peg$c565;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c566); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c564); }
      }

      return s0;
    }

    function peg$parsesym_equal() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 61) {
        s1 = peg$c567;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c568); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c411); }
      }

      return s0;
    }

    function peg$parsesym_amp() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 38) {
        s1 = peg$c570;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c571); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c569); }
      }

      return s0;
    }

    function peg$parsesym_pipe() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 124) {
        s1 = peg$c573;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c574); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c572); }
      }

      return s0;
    }

    function peg$parsesym_mod() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 37) {
        s1 = peg$c575;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c576); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c402); }
      }

      return s0;
    }

    function peg$parsesym_lt() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 60) {
        s1 = peg$c577;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c578); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c407); }
      }

      return s0;
    }

    function peg$parsesym_gt() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 62) {
        s1 = peg$c579;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c580); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c408); }
      }

      return s0;
    }

    function peg$parsesym_excl() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s1 = peg$c582;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c583); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c581); }
      }

      return s0;
    }

    function peg$parsesym_semi() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 59) {
        s1 = peg$c585;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c586); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c584); }
      }

      return s0;
    }

    function peg$parsesym_colon() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 58) {
        s1 = peg$c104;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c105); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c587); }
      }

      return s0;
    }

    function peg$parsesym_fslash() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 47) {
        s1 = peg$c589;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c590); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c588); }
      }

      return s0;
    }

    function peg$parsesym_bslash() {
      var s0, s1, s2;

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c592;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c593); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c591); }
      }

      return s0;
    }

    function peg$parseABORT() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c594) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c595); }
      }

      return s0;
    }

    function peg$parseACTION() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c596) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c597); }
      }

      return s0;
    }

    function peg$parseADD() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c598) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c599); }
      }

      return s0;
    }

    function peg$parseAFTER() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c600) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c601); }
      }

      return s0;
    }

    function peg$parseALL() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c602) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c603); }
      }

      return s0;
    }

    function peg$parseALTER() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c604) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c605); }
      }

      return s0;
    }

    function peg$parseANALYZE() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c606) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c607); }
      }

      return s0;
    }

    function peg$parseAND() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c608) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c609); }
      }

      return s0;
    }

    function peg$parseAS() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c610) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c611); }
      }

      return s0;
    }

    function peg$parseASC() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c612) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c613); }
      }

      return s0;
    }

    function peg$parseATTACH() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c614) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c615); }
      }

      return s0;
    }

    function peg$parseAUTOINCREMENT() {
      var s0;

      if (input.substr(peg$currPos, 13).toLowerCase() === peg$c616) {
        s0 = input.substr(peg$currPos, 13);
        peg$currPos += 13;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c617); }
      }

      return s0;
    }

    function peg$parseBEFORE() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c618) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c619); }
      }

      return s0;
    }

    function peg$parseBEGIN() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c620) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c621); }
      }

      return s0;
    }

    function peg$parseBETWEEN() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c622) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c623); }
      }

      return s0;
    }

    function peg$parseBY() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c624) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c625); }
      }

      return s0;
    }

    function peg$parseCASCADE() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c626) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c627); }
      }

      return s0;
    }

    function peg$parseCASE() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c628) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c629); }
      }

      return s0;
    }

    function peg$parseCAST() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c630) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c631); }
      }

      return s0;
    }

    function peg$parseCHECK() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c632) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c633); }
      }

      return s0;
    }

    function peg$parseCOLLATE() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c634) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c635); }
      }

      return s0;
    }

    function peg$parseCOLUMN() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c636) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c637); }
      }

      return s0;
    }

    function peg$parseCOMMIT() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c638) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c639); }
      }

      return s0;
    }

    function peg$parseCONFLICT() {
      var s0;

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c640) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c641); }
      }

      return s0;
    }

    function peg$parseCONSTRAINT() {
      var s0;

      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c642) {
        s0 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c643); }
      }

      return s0;
    }

    function peg$parseCREATE() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c644) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c645); }
      }

      return s0;
    }

    function peg$parseCROSS() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c646) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c647); }
      }

      return s0;
    }

    function peg$parseCURRENT_DATE() {
      var s0;

      if (input.substr(peg$currPos, 12).toLowerCase() === peg$c648) {
        s0 = input.substr(peg$currPos, 12);
        peg$currPos += 12;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c649); }
      }

      return s0;
    }

    function peg$parseCURRENT_TIME() {
      var s0;

      if (input.substr(peg$currPos, 12).toLowerCase() === peg$c650) {
        s0 = input.substr(peg$currPos, 12);
        peg$currPos += 12;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c651); }
      }

      return s0;
    }

    function peg$parseCURRENT_TIMESTAMP() {
      var s0;

      if (input.substr(peg$currPos, 17).toLowerCase() === peg$c652) {
        s0 = input.substr(peg$currPos, 17);
        peg$currPos += 17;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c653); }
      }

      return s0;
    }

    function peg$parseDATABASE() {
      var s0;

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c654) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c655); }
      }

      return s0;
    }

    function peg$parseDEFAULT() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c656) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c657); }
      }

      return s0;
    }

    function peg$parseDEFERRABLE() {
      var s0;

      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c658) {
        s0 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c659); }
      }

      return s0;
    }

    function peg$parseDEFERRED() {
      var s0;

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c660) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c661); }
      }

      return s0;
    }

    function peg$parseDELETE() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c662) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c663); }
      }

      return s0;
    }

    function peg$parseDESC() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c664) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c665); }
      }

      return s0;
    }

    function peg$parseDETACH() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c666) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c667); }
      }

      return s0;
    }

    function peg$parseDISTINCT() {
      var s0;

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c668) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c669); }
      }

      return s0;
    }

    function peg$parseDROP() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c670) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c671); }
      }

      return s0;
    }

    function peg$parseEACH() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c672) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c673); }
      }

      return s0;
    }

    function peg$parseELSE() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c674) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c675); }
      }

      return s0;
    }

    function peg$parseEND() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c676) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c677); }
      }

      return s0;
    }

    function peg$parseESCAPE() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c678) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c679); }
      }

      return s0;
    }

    function peg$parseEXCEPT() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c680) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c681); }
      }

      return s0;
    }

    function peg$parseEXCLUSIVE() {
      var s0;

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c682) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c683); }
      }

      return s0;
    }

    function peg$parseEXISTS() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c684) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c685); }
      }

      return s0;
    }

    function peg$parseEXPLAIN() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c686) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c687); }
      }

      return s0;
    }

    function peg$parseFAIL() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c688) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c689); }
      }

      return s0;
    }

    function peg$parseFOR() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c690) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c691); }
      }

      return s0;
    }

    function peg$parseFOREIGN() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c692) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c693); }
      }

      return s0;
    }

    function peg$parseFROM() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c694) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c695); }
      }

      return s0;
    }

    function peg$parseFULL() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c696) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c697); }
      }

      return s0;
    }

    function peg$parseGLOB() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c698) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c699); }
      }

      return s0;
    }

    function peg$parseGROUP() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c700) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c701); }
      }

      return s0;
    }

    function peg$parseHAVING() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c702) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c703); }
      }

      return s0;
    }

    function peg$parseIF() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c704) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c705); }
      }

      return s0;
    }

    function peg$parseIGNORE() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c706) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c707); }
      }

      return s0;
    }

    function peg$parseIMMEDIATE() {
      var s0;

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c708) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c709); }
      }

      return s0;
    }

    function peg$parseIN() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c710) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c711); }
      }

      return s0;
    }

    function peg$parseINDEX() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c712) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c713); }
      }

      return s0;
    }

    function peg$parseINDEXED() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c714) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c715); }
      }

      return s0;
    }

    function peg$parseINITIALLY() {
      var s0;

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c716) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c717); }
      }

      return s0;
    }

    function peg$parseINNER() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c718) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c719); }
      }

      return s0;
    }

    function peg$parseINSERT() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c720) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c721); }
      }

      return s0;
    }

    function peg$parseINSTEAD() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c722) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c723); }
      }

      return s0;
    }

    function peg$parseINTERSECT() {
      var s0;

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c724) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c725); }
      }

      return s0;
    }

    function peg$parseINTO() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c726) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c727); }
      }

      return s0;
    }

    function peg$parseIS() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c728) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c729); }
      }

      return s0;
    }

    function peg$parseISNULL() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c730) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c731); }
      }

      return s0;
    }

    function peg$parseJOIN() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c732) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c733); }
      }

      return s0;
    }

    function peg$parseKEY() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c734) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c735); }
      }

      return s0;
    }

    function peg$parseLEFT() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c736) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c737); }
      }

      return s0;
    }

    function peg$parseLIKE() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c738) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c739); }
      }

      return s0;
    }

    function peg$parseLIMIT() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c740) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c741); }
      }

      return s0;
    }

    function peg$parseMATCH() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c742) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c743); }
      }

      return s0;
    }

    function peg$parseNATURAL() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c744) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c745); }
      }

      return s0;
    }

    function peg$parseNO() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c746) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c747); }
      }

      return s0;
    }

    function peg$parseNOT() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c748) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c749); }
      }

      return s0;
    }

    function peg$parseNOTNULL() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c750) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c751); }
      }

      return s0;
    }

    function peg$parseNULL() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c752) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c753); }
      }

      return s0;
    }

    function peg$parseOF() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c754) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c755); }
      }

      return s0;
    }

    function peg$parseOFFSET() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c756) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c757); }
      }

      return s0;
    }

    function peg$parseON() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c758) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c759); }
      }

      return s0;
    }

    function peg$parseOR() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c760) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c761); }
      }

      return s0;
    }

    function peg$parseORDER() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c762) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c763); }
      }

      return s0;
    }

    function peg$parseOUTER() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c764) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c765); }
      }

      return s0;
    }

    function peg$parsePLAN() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c766) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c767); }
      }

      return s0;
    }

    function peg$parsePRAGMA() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c768) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c769); }
      }

      return s0;
    }

    function peg$parsePRIMARY() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c770) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c771); }
      }

      return s0;
    }

    function peg$parseQUERY() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c772) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c773); }
      }

      return s0;
    }

    function peg$parseRAISE() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c774) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c775); }
      }

      return s0;
    }

    function peg$parseRECURSIVE() {
      var s0;

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c776) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c777); }
      }

      return s0;
    }

    function peg$parseREFERENCES() {
      var s0;

      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c778) {
        s0 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c779); }
      }

      return s0;
    }

    function peg$parseREGEXP() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c780) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c781); }
      }

      return s0;
    }

    function peg$parseREINDEX() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c782) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c783); }
      }

      return s0;
    }

    function peg$parseRELEASE() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c784) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c785); }
      }

      return s0;
    }

    function peg$parseRENAME() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c786) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c787); }
      }

      return s0;
    }

    function peg$parseREPLACE() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c788) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c789); }
      }

      return s0;
    }

    function peg$parseRESTRICT() {
      var s0;

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c790) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c791); }
      }

      return s0;
    }

    function peg$parseRIGHT() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c792) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c793); }
      }

      return s0;
    }

    function peg$parseROLLBACK() {
      var s0;

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c794) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c795); }
      }

      return s0;
    }

    function peg$parseROW() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c796) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c797); }
      }

      return s0;
    }

    function peg$parseROWID() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c798) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c799); }
      }

      return s0;
    }

    function peg$parseSAVEPOINT() {
      var s0;

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c800) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c801); }
      }

      return s0;
    }

    function peg$parseSELECT() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c802) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c803); }
      }

      return s0;
    }

    function peg$parseSET() {
      var s0;

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c804) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c805); }
      }

      return s0;
    }

    function peg$parseTABLE() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c806) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c807); }
      }

      return s0;
    }

    function peg$parseTEMP() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c808) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c809); }
      }

      return s0;
    }

    function peg$parseTEMPORARY() {
      var s0;

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c810) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c811); }
      }

      return s0;
    }

    function peg$parseTHEN() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c812) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c813); }
      }

      return s0;
    }

    function peg$parseTO() {
      var s0;

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c814) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c815); }
      }

      return s0;
    }

    function peg$parseTRANSACTION() {
      var s0;

      if (input.substr(peg$currPos, 11).toLowerCase() === peg$c816) {
        s0 = input.substr(peg$currPos, 11);
        peg$currPos += 11;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c817); }
      }

      return s0;
    }

    function peg$parseTRIGGER() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c818) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c819); }
      }

      return s0;
    }

    function peg$parseUNION() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c820) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c821); }
      }

      return s0;
    }

    function peg$parseUNIQUE() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c822) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c823); }
      }

      return s0;
    }

    function peg$parseUPDATE() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c824) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c825); }
      }

      return s0;
    }

    function peg$parseUSING() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c826) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c827); }
      }

      return s0;
    }

    function peg$parseVACUUM() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c828) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c829); }
      }

      return s0;
    }

    function peg$parseVALUES() {
      var s0;

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c830) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c831); }
      }

      return s0;
    }

    function peg$parseVIEW() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c832) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c833); }
      }

      return s0;
    }

    function peg$parseVIRTUAL() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c834) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c835); }
      }

      return s0;
    }

    function peg$parseWHEN() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c836) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c837); }
      }

      return s0;
    }

    function peg$parseWHERE() {
      var s0;

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c838) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c839); }
      }

      return s0;
    }

    function peg$parseWITH() {
      var s0;

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c840) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c841); }
      }

      return s0;
    }

    function peg$parseWITHOUT() {
      var s0;

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c842) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c843); }
      }

      return s0;
    }

    function peg$parsereserved_words() {
      var s0, s1;

      s0 = peg$currPos;
      s1 = peg$parsereserved_word_list();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c844(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsereserved_word_list() {
      var s0;

      s0 = peg$parseABORT();
      if (s0 === peg$FAILED) {
        s0 = peg$parseACTION();
        if (s0 === peg$FAILED) {
          s0 = peg$parseADD();
          if (s0 === peg$FAILED) {
            s0 = peg$parseAFTER();
            if (s0 === peg$FAILED) {
              s0 = peg$parseALL();
              if (s0 === peg$FAILED) {
                s0 = peg$parseALTER();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseANALYZE();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseAND();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseASC();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseATTACH();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseAUTOINCREMENT();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseBEFORE();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseBEGIN();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseBETWEEN();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseBY();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseCASCADE();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parseCASE();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parseCAST();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parseCHECK();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parseCOLLATE();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parseCOLUMN();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parseCOMMIT();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parseCONFLICT();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parseCONSTRAINT();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parseCREATE();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parseCROSS();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parseCURRENT_DATE();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parseCURRENT_TIME();
                                                            if (s0 === peg$FAILED) {
                                                              s0 = peg$parseCURRENT_TIMESTAMP();
                                                              if (s0 === peg$FAILED) {
                                                                s0 = peg$parseDATABASE();
                                                                if (s0 === peg$FAILED) {
                                                                  s0 = peg$parseDEFAULT();
                                                                  if (s0 === peg$FAILED) {
                                                                    s0 = peg$parseDEFERRABLE();
                                                                    if (s0 === peg$FAILED) {
                                                                      s0 = peg$parseDEFERRED();
                                                                      if (s0 === peg$FAILED) {
                                                                        s0 = peg$parseDELETE();
                                                                        if (s0 === peg$FAILED) {
                                                                          s0 = peg$parseDESC();
                                                                          if (s0 === peg$FAILED) {
                                                                            s0 = peg$parseDETACH();
                                                                            if (s0 === peg$FAILED) {
                                                                              s0 = peg$parseDISTINCT();
                                                                              if (s0 === peg$FAILED) {
                                                                                s0 = peg$parseDROP();
                                                                                if (s0 === peg$FAILED) {
                                                                                  s0 = peg$parseEACH();
                                                                                  if (s0 === peg$FAILED) {
                                                                                    s0 = peg$parseELSE();
                                                                                    if (s0 === peg$FAILED) {
                                                                                      s0 = peg$parseEND();
                                                                                      if (s0 === peg$FAILED) {
                                                                                        s0 = peg$parseESCAPE();
                                                                                        if (s0 === peg$FAILED) {
                                                                                          s0 = peg$parseEXCEPT();
                                                                                          if (s0 === peg$FAILED) {
                                                                                            s0 = peg$parseEXCLUSIVE();
                                                                                            if (s0 === peg$FAILED) {
                                                                                              s0 = peg$parseEXISTS();
                                                                                              if (s0 === peg$FAILED) {
                                                                                                s0 = peg$parseEXPLAIN();
                                                                                                if (s0 === peg$FAILED) {
                                                                                                  s0 = peg$parseFAIL();
                                                                                                  if (s0 === peg$FAILED) {
                                                                                                    s0 = peg$parseFOREIGN();
                                                                                                    if (s0 === peg$FAILED) {
                                                                                                      s0 = peg$parseFOR();
                                                                                                      if (s0 === peg$FAILED) {
                                                                                                        s0 = peg$parseFROM();
                                                                                                        if (s0 === peg$FAILED) {
                                                                                                          s0 = peg$parseFULL();
                                                                                                          if (s0 === peg$FAILED) {
                                                                                                            s0 = peg$parseGLOB();
                                                                                                            if (s0 === peg$FAILED) {
                                                                                                              s0 = peg$parseGROUP();
                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                s0 = peg$parseHAVING();
                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                  s0 = peg$parseIGNORE();
                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                    s0 = peg$parseIMMEDIATE();
                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                      s0 = peg$parseINDEXED();
                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                        s0 = peg$parseINDEX();
                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                          s0 = peg$parseINITIALLY();
                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                            s0 = peg$parseINNER();
                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                              s0 = peg$parseINSERT();
                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                s0 = peg$parseINSTEAD();
                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                  s0 = peg$parseINTERSECT();
                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                    s0 = peg$parseINTO();
                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                      s0 = peg$parseISNULL();
                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                        s0 = peg$parseJOIN();
                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                          s0 = peg$parseKEY();
                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                            s0 = peg$parseLEFT();
                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                              s0 = peg$parseLIKE();
                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                s0 = peg$parseLIMIT();
                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                  s0 = peg$parseMATCH();
                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                    s0 = peg$parseNATURAL();
                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                      s0 = peg$parseNOTNULL();
                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                        s0 = peg$parseOFFSET();
                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                          s0 = peg$parseORDER();
                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                            s0 = peg$parseOUTER();
                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                              s0 = peg$parsePLAN();
                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                s0 = peg$parsePRAGMA();
                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                  s0 = peg$parsePRIMARY();
                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                    s0 = peg$parseQUERY();
                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                      s0 = peg$parseRAISE();
                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                        s0 = peg$parseRECURSIVE();
                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                          s0 = peg$parseREFERENCES();
                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                            s0 = peg$parseREGEXP();
                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                              s0 = peg$parseREINDEX();
                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                s0 = peg$parseRELEASE();
                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                  s0 = peg$parseRENAME();
                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                    s0 = peg$parseREPLACE();
                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                      s0 = peg$parseRESTRICT();
                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                        s0 = peg$parseRIGHT();
                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                          s0 = peg$parseROLLBACK();
                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                            s0 = peg$parseROW();
                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                              s0 = peg$parseSAVEPOINT();
                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                s0 = peg$parseSELECT();
                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                  s0 = peg$parseSET();
                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                    s0 = peg$parseTABLE();
                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                      s0 = peg$parseTEMPORARY();
                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                        s0 = peg$parseTEMP();
                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                          s0 = peg$parseTHEN();
                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                            s0 = peg$parseTO();
                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                              s0 = peg$parseTRANSACTION();
                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                s0 = peg$parseTRIGGER();
                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                  s0 = peg$parseUNION();
                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                    s0 = peg$parseUNIQUE();
                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                      s0 = peg$parseUPDATE();
                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                        s0 = peg$parseUSING();
                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                          s0 = peg$parseVACUUM();
                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                            s0 = peg$parseVALUES();
                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                              s0 = peg$parseVIEW();
                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                s0 = peg$parseVIRTUAL();
                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                  s0 = peg$parseWHEN();
                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                    s0 = peg$parseWHERE();
                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                      s0 = peg$parseWITHOUT();
                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                        s0 = peg$parseWITH();
                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                          s0 = peg$parseNULL();
                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                            s0 = peg$parseNOT();
                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                              s0 = peg$parseIN();
                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                s0 = peg$parseIF();
                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                  s0 = peg$parseIS();
                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                    s0 = peg$parseOF();
                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                      s0 = peg$parseON();
                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                        s0 = peg$parseOR();
                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                          s0 = peg$parseNO();
                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                            s0 = peg$parseAS();
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsecomment() {
      var s0, s1;

      s0 = peg$parsecomment_line();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsecomment_block();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c845();
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parsecomment_line() {
      var s0, s1, s2, s3, s4, s5;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecomment_line_start();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsewhitespace_line();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsematch_all();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parsewhitespace_line();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = void 0;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsematch_all();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c846); }
      }

      return s0;
    }

    function peg$parsecomment_line_start() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c847) {
        s0 = peg$c847;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c848); }
      }

      return s0;
    }

    function peg$parsecomment_block() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecomment_block_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomment_block_feed();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecomment_block_end();
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c849); }
      }

      return s0;
    }

    function peg$parsecomment_block_start() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c850) {
        s0 = peg$c850;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c851); }
      }

      return s0;
    }

    function peg$parsecomment_block_end() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c852) {
        s0 = peg$c852;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c853); }
      }

      return s0;
    }

    function peg$parsecomment_block_body() {
      var s0, s1, s2, s3;

      s0 = [];
      s1 = peg$currPos;
      s2 = peg$currPos;
      peg$silentFails++;
      s3 = peg$parsecomment_block_end();
      if (s3 === peg$FAILED) {
        s3 = peg$parsecomment_block_start();
      }
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsematch_all();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$currPos;
          s2 = peg$currPos;
          peg$silentFails++;
          s3 = peg$parsecomment_block_end();
          if (s3 === peg$FAILED) {
            s3 = peg$parsecomment_block_start();
          }
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = void 0;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsematch_all();
            if (s3 !== peg$FAILED) {
              s2 = [s2, s3];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        }
      } else {
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseblock_body_nodes() {
      var s0;

      s0 = peg$parsecomment_block_body();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment_block();
      }

      return s0;
    }

    function peg$parsecomment_block_feed() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseblock_body_nodes();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsewhitespace();
        if (s3 === peg$FAILED) {
          s3 = peg$parseblock_body_nodes();
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsewhitespace();
          if (s3 === peg$FAILED) {
            s3 = peg$parseblock_body_nodes();
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsematch_all() {
      var s0;

      if (input.length > peg$currPos) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c854); }
      }

      return s0;
    }

    function peg$parseo() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsewhitespace_nodes();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsewhitespace_nodes();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c8(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsee() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsewhitespace_nodes();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsewhitespace_nodes();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c8(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsewhitespace_nodes() {
      var s0;

      s0 = peg$parsewhitespace();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment();
      }

      return s0;
    }

    function peg$parsewhitespace() {
      var s0;

      s0 = peg$parsewhitespace_space();
      if (s0 === peg$FAILED) {
        s0 = peg$parsewhitespace_line();
      }

      return s0;
    }

    function peg$parsewhitespace_space() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c856.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c857); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c855); }
      }

      return s0;
    }

    function peg$parsewhitespace_line() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c859.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c860); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c858); }
      }

      return s0;
    }

    function peg$parse_TODO_() {
      var s0;

      if (input.substr(peg$currPos, 8) === peg$c861) {
        s0 = peg$c861;
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c862); }
      }

      return s0;
    }


      var util = require('./parser-util');


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

},{"./parser-util":2}]},{},[1])(1)
});