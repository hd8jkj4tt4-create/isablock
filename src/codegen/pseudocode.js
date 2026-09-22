import { Order, ARITH_OPS, chainNextBlock } from './common.js';

// Genera pseudocodice a partire dallo stesso modello (albero di blocchi
// Blockly) usato dagli altri due generatori. Le parole chiave vengono
// lette da pseudocodeConfig, passato dal chiamante: cambiare quel file
// basta per adattare lo stile a un altro libro di testo.
export function createPseudocodeGenerator(Blockly, cfg) {
  const gen = new Blockly.Generator('Pseudocodice');
  gen.INDENT = cfg.INDENT;

  const varName = (variableModel) => variableModel.name;

  gen.scrub_ = function (block, code, opt_thisOnly) {
    return chainNextBlock(this, block, code);
  };

  gen.forBlock['program'] = function (block, generator) {
    const body = generator.statementToCode(block, 'BODY');
    return `${cfg.PROGRAM_START}\n${body}${cfg.PROGRAM_END}\n`;
  };

  gen.forBlock['assign'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return `${cfg.ASSIGN_TO} ${varName(variable)} ${cfg.ASSIGN_VALUE} ${value}\n`;
  };

  gen.forBlock['read'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return `${cfg.READ} ${varName(variable)}\n`;
  };

  gen.forBlock['write'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return `${cfg.WRITE} ${value}\n`;
  };

  gen.forBlock['controls_if_simple'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const thenCode = generator.statementToCode(block, 'THEN');
    return `${cfg.IF} ${cond} ${cfg.THEN}\n${thenCode}${cfg.END_IF}\n`;
  };

  gen.forBlock['controls_if_else'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const thenCode = generator.statementToCode(block, 'THEN');
    const elseCode = generator.statementToCode(block, 'ELSE');
    return `${cfg.IF} ${cond} ${cfg.THEN}\n${thenCode}${cfg.ELSE}\n${elseCode}${cfg.END_IF}\n`;
  };

  gen.forBlock['controls_while'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const body = generator.statementToCode(block, 'BODY');
    return `${cfg.WHILE} ${cond} ${cfg.DO}\n${body}${cfg.END_WHILE}\n`;
  };

  gen.forBlock['controls_for_simple'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const from = generator.valueToCode(block, 'FROM', Order.NONE) || cfg.MISSING_VALUE;
    const to = generator.valueToCode(block, 'TO', Order.NONE) || cfg.MISSING_VALUE;
    const body = generator.statementToCode(block, 'BODY');
    return `${cfg.FOR} ${varName(variable)} ${cfg.FROM} ${from} ${cfg.TO} ${to}\n${body}${cfg.END_FOR}\n`;
  };

  gen.forBlock['repeat_times'] = function (block, generator) {
    const times = generator.valueToCode(block, 'TIMES', Order.NONE) || cfg.MISSING_VALUE;
    const body = generator.statementToCode(block, 'BODY');
    return `${cfg.REPEAT} ${times} ${cfg.TIMES}\n${body}${cfg.END_REPEAT}\n`;
  };

  gen.forBlock['comment_line'] = function (block) {
    return `${cfg.COMMENT} ${block.getFieldValue('TEXT')}\n`;
  };

  gen.forBlock['number_literal'] = function (block) {
    return [String(block.getFieldValue('VALUE')), Order.ATOMIC];
  };

  gen.forBlock['variable_get'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return [varName(variable), Order.ATOMIC];
  };

  gen.forBlock['arith_op'] = function (block, generator) {
    const op = block.getFieldValue('OP');
    const info = ARITH_OPS[op];
    const a = generator.valueToCode(block, 'A', info.order) || cfg.MISSING_VALUE;
    const b = generator.valueToCode(block, 'B', info.rightOrder) || cfg.MISSING_VALUE;
    return [`${a} ${cfg[op]} ${b}`, info.order];
  };

  gen.forBlock['compare_op'] = function (block, generator) {
    const op = block.getFieldValue('OP');
    const a = generator.valueToCode(block, 'A', Order.ADDITIVE) || cfg.MISSING_VALUE;
    const b = generator.valueToCode(block, 'B', Order.ADDITIVE) || cfg.MISSING_VALUE;
    return [`${a} ${cfg[op]} ${b}`, Order.RELATIONAL];
  };

  gen.forBlock['logic_op'] = function (block, generator) {
    const op = block.getFieldValue('OP');
    const order = op === 'AND' ? Order.LOGICAL_AND : Order.LOGICAL_OR;
    const a = generator.valueToCode(block, 'A', order) || cfg.MISSING_CONDITION;
    const b = generator.valueToCode(block, 'B', order) || cfg.MISSING_CONDITION;
    return [`${a} ${cfg[op]} ${b}`, order];
  };

  gen.forBlock['not_op'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', Order.UNARY_NOT) || cfg.MISSING_CONDITION;
    return [`${cfg.NOT} ${a}`, Order.UNARY_NOT];
  };

  gen.forBlock['bool_literal'] = function (block) {
    const value = block.getFieldValue('VALUE');
    return [value === 'TRUE' ? cfg.TRUE : cfg.FALSE, Order.ATOMIC];
  };

  return gen;
}
