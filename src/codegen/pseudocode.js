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

  gen.forBlock['string_literal'] = function (block) {
    const text = block.getFieldValue('TEXT');
    return [`"${text.replace(/"/g, '\\"')}"`, Order.ATOMIC];
  };

  gen.forBlock['controls_do_while'] = function (block, generator) {
    const body = generator.statementToCode(block, 'BODY');
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    return `RIPETI\n${body}FINCHÉ ${cond}\n`;
  };

  gen.forBlock['controls_break'] = function (block) {
    return `${cfg.BREAK || 'INTERROMPI'}\n`;
  };

  gen.forBlock['controls_continue'] = function (block) {
    return `${cfg.CONTINUE || 'CONTINUA'}\n`;
  };

  gen.forBlock['controls_for_expr'] = function (block, generator) {
    const init = generator.statementToCode(block, 'INIT').trim().replace(/\n$/, '');
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const update = generator.statementToCode(block, 'UPDATE').trim().replace(/\n$/, '');
    const body = generator.statementToCode(block, 'BODY');
    return `${cfg.FOR2} (${init}; ${cond}; ${update})\n${body}${cfg.END_FOR}\n`;
  };

  gen.forBlock['incr_decr'] = function (block, generator) {
    const varCode = generator.valueToCode(block, 'VAR', Order.NONE) || cfg.MISSING_VALUE;
    return block.getFieldValue('OP') === 'INC' ? `${varCode} ← ${varCode} + 1\n` : `${varCode} ← ${varCode} - 1\n`;
  };

  gen.forBlock['incr_expr'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return [`${varName(variable)} + 1`, Order.ADDITIVE];
  };

  gen.forBlock['decr_expr'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return [`${varName(variable)} - 1`, Order.ADDITIVE];
  };

  gen.forBlock['var_decl'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    const typeName = block.getFieldValue('TYPE') === 'Boolean' ? 'booleana' : 'intera';
    return `${cfg.DECLARE || 'DICHIARA'} ${varName(variable)} (${typeName})\n`;
  };

  gen.forBlock['array_decl'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const size = generator.valueToCode(block, 'SIZE', Order.NONE) || cfg.MISSING_VALUE;
    return `${cfg.DECLARE || 'DICHIARA'} ${varName(variable)}[${size}]\n`;
  };

  gen.forBlock['array_get'] = function (block, generator) {
    const arr = generator.valueToCode(block, 'ARRAY', Order.NONE) || cfg.MISSING_VALUE;
    const idx = generator.valueToCode(block, 'INDEX', Order.NONE) || cfg.MISSING_VALUE;
    return [`${arr}[${idx}]`, Order.ATOMIC];
  };

  gen.forBlock['array_set'] = function (block, generator) {
    const arr = generator.valueToCode(block, 'ARRAY', Order.NONE) || cfg.MISSING_VALUE;
    const idx = generator.valueToCode(block, 'INDEX', Order.NONE) || cfg.MISSING_VALUE;
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return `${arr}[${idx}] ← ${value}\n`;
  };

  gen.forBlock['function_def'] = function (block, generator) {
    const fname = block.getFieldValue('NAME');
    const paramBlocks = block.getInputTargetBlock('PARAMS');
    const params = [];
    let cur = paramBlocks;
    while (cur) {
      if (cur.type === 'param_decl') params.push(cur.getFieldValue('NAME'));
      cur = cur.getNextBlock();
    }
    const body = generator.statementToCode(block, 'BODY');
    return `${cfg.FUNCTION || 'FUNZIONE'} ${fname}(${params.join(', ')})\n${body}${cfg.END_FUNCTION || 'FINE FUNZIONE'}\n`;
  };

  gen.forBlock['param_decl'] = function (block) {
    return block.getFieldValue('NAME');
  };

  gen.forBlock['function_call'] = function (block, generator) {
    const fname = block.getFieldValue('NAME');
    const argBlocks = block.getInputTargetBlock('ARGS');
    const args = collectArgs(argBlocks, generator);
    return [`${fname}(${args.join(', ')})`, Order.ATOMIC];
  };

  gen.forBlock['call_statement'] = function (block, generator) {
    const fname = block.getFieldValue('NAME');
    const argBlocks = block.getInputTargetBlock('ARGS');
    const args = collectArgs(argBlocks, generator);
    return `${fname}(${args.join(', ')})\n`;
  };

  gen.forBlock['function_arg'] = function (block, generator) {
    const v = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return [v, Order.NONE];
  };

  gen.forBlock['return_statement'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', Order.NONE);
    return `${cfg.RETURN || 'RESTITUISCI'} ${value || ''}\n`;
  };

  gen.forBlock['string_concat'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', Order.NONE) || '';
    const b = generator.valueToCode(block, 'B', Order.NONE) || cfg.MISSING_VALUE;
    return [`${a} + ${b}`, Order.ADDITIVE];
  };

  return gen;
}

function collectArgs(firstArgBlock, generator) {
  const out = [];
  let cur = firstArgBlock;
  while (cur) {
    if (cur.type === 'function_arg') {
      out.push(generator.valueToCode(cur, 'VALUE', Order.NONE) || '0');
    }
    cur = cur.getNextBlock();
  }
  return out;
}
