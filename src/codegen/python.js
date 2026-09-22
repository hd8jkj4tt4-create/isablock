import { Order, ARITH_OPS, COMPARE_SYMBOLS_ASCII, chainNextBlock, sanitizeIdentifier } from './common.js';

const PY_KEYWORDS = new Set([
  'false', 'none', 'true', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  // builtin che il codice generato usa direttamente: una variabile con lo
  // stesso nome li nasconderebbe (shadowing) e romperebbe il programma.
  'print', 'input', 'int', 'range',
]);

const LOGIC_SYMBOLS = { AND: 'and', OR: 'or' };
const ARITH_SYMBOLS = { ADD: '+', SUB: '-', MUL: '*', MOD: '%' };

// Genera codice Python 3 idiomatico dallo stesso modello a blocchi usato
// dagli altri due generatori. La divisione intera usa int(a / b) invece
// del piu' idiomatico "//": int() tronca verso zero come la divisione
// intera del C, mentre "//" arrotonda verso il basso - per operandi
// negativi darebbero risultati diversi da C, il che romperebbe
// l'equivalenza richiesta tra i tre output. Il modulo "%" resta invece
// quello nativo di Python: per i cinque algoritmi di riferimento della
// Fase 1 (tutti su interi non negativi) il comportamento coincide con
// quello del C.
export function createPythonGenerator(Blockly, cfg) {
  const gen = new Blockly.Generator('Python');
  gen.INDENT = '    ';

  const name = (variableModel) => sanitizeIdentifier(variableModel.name, PY_KEYWORDS);
  const bodyOrPass = (code, indent) => code || `${indent}pass\n`;

  gen.scrub_ = function (block, code, opt_thisOnly) {
    return chainNextBlock(this, block, code);
  };

  gen.forBlock['program'] = function (block, generator) {
    // Il corpo del programma e' codice Python "di modulo": non va
    // indentato, a differenza del corpo di se/mentre/per. Non si puo'
    // usare statementToCode (indenta sempre di un livello), quindi si
    // cammina l'albero a mano con blockToCode.
    const first = block.getInputTargetBlock('BODY');
    return first ? generator.blockToCode(first) : '';
  };

  gen.forBlock['assign'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return `${name(variable)} = ${value}\n`;
  };

  gen.forBlock['read'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return `${name(variable)} = int(input())\n`;
  };

  gen.forBlock['write'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return `print(${value})\n`;
  };

  gen.forBlock['controls_if_simple'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const thenCode = bodyOrPass(generator.statementToCode(block, 'THEN'), generator.INDENT);
    return `if ${cond}:\n${thenCode}`;
  };

  gen.forBlock['controls_if_else'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const thenCode = bodyOrPass(generator.statementToCode(block, 'THEN'), generator.INDENT);
    const elseCode = bodyOrPass(generator.statementToCode(block, 'ELSE'), generator.INDENT);
    return `if ${cond}:\n${thenCode}else:\n${elseCode}`;
  };

  gen.forBlock['controls_while'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const body = bodyOrPass(generator.statementToCode(block, 'BODY'), generator.INDENT);
    return `while ${cond}:\n${body}`;
  };

  gen.forBlock['controls_for_simple'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const v = name(variable);
    const from = generator.valueToCode(block, 'FROM', Order.NONE) || cfg.MISSING_VALUE;
    const to = generator.valueToCode(block, 'TO', Order.NONE) || cfg.MISSING_VALUE;
    const body = bodyOrPass(generator.statementToCode(block, 'BODY'), generator.INDENT);
    return `for ${v} in range(${from}, ${to} + 1):\n${body}`;
  };

  gen.forBlock['repeat_times'] = function (block, generator) {
    const times = generator.valueToCode(block, 'TIMES', Order.NONE) || cfg.MISSING_VALUE;
    const body = bodyOrPass(generator.statementToCode(block, 'BODY'), generator.INDENT);
    return `for _ in range(${times}):\n${body}`;
  };

  gen.forBlock['comment_line'] = function (block) {
    return `# ${block.getFieldValue('TEXT')}\n`;
  };

  gen.forBlock['number_literal'] = function (block) {
    return [String(block.getFieldValue('VALUE')), Order.ATOMIC];
  };

  gen.forBlock['variable_get'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return [name(variable), Order.ATOMIC];
  };

  gen.forBlock['arith_op'] = function (block, generator) {
    const op = block.getFieldValue('OP');
    const info = ARITH_OPS[op];
    const a = generator.valueToCode(block, 'A', info.order) || cfg.MISSING_VALUE;
    const b = generator.valueToCode(block, 'B', info.rightOrder) || cfg.MISSING_VALUE;
    if (op === 'DIV') {
      return [`int(${a} / ${b})`, Order.ATOMIC];
    }
    return [`${a} ${ARITH_SYMBOLS[op]} ${b}`, info.order];
  };

  gen.forBlock['compare_op'] = function (block, generator) {
    const op = block.getFieldValue('OP');
    const a = generator.valueToCode(block, 'A', Order.ADDITIVE) || cfg.MISSING_VALUE;
    const b = generator.valueToCode(block, 'B', Order.ADDITIVE) || cfg.MISSING_VALUE;
    return [`${a} ${COMPARE_SYMBOLS_ASCII[op]} ${b}`, Order.RELATIONAL];
  };

  gen.forBlock['logic_op'] = function (block, generator) {
    const op = block.getFieldValue('OP');
    const order = op === 'AND' ? Order.LOGICAL_AND : Order.LOGICAL_OR;
    const a = generator.valueToCode(block, 'A', order) || cfg.MISSING_CONDITION;
    const b = generator.valueToCode(block, 'B', order) || cfg.MISSING_CONDITION;
    return [`${a} ${LOGIC_SYMBOLS[op]} ${b}`, order];
  };

  gen.forBlock['not_op'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', Order.UNARY_NOT) || cfg.MISSING_CONDITION;
    return [`not ${a}`, Order.UNARY_NOT];
  };

  gen.forBlock['bool_literal'] = function (block) {
    return [block.getFieldValue('VALUE') === 'TRUE' ? 'True' : 'False', Order.ATOMIC];
  };

  return gen;
}
