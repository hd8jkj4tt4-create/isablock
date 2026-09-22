import { Order, ARITH_OPS, COMPARE_SYMBOLS_ASCII, chainNextBlock, sanitizeIdentifier } from './common.js';

const C_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int',
  'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static',
  'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile',
  'while', 'inline', 'restrict', 'main', 'printf', 'scanf',
]);

const LOGIC_SYMBOLS = { AND: '&&', OR: '||' };
const ARITH_SYMBOLS = { ADD: '+', SUB: '-', MUL: '*', DIV: '/', MOD: '%' };

// Tipi di variabile Blockly -> tipo C (e relativo formato scanf/printf).
const SCALAR_C_TYPES = {
  Number: { type: 'int', printf: '%d', scanf: '%d' },
  Boolean: { type: 'bool', printf: '%d', scanf: '%d' },
};

// Genera codice C compilabile (gcc, C99): #include, funzioni definite
// dallo studente, main con dichiarazioni int/bool, printf/scanf, dallo
// stesso modello a blocchi usato dagli altri due generatori.
export function createCGenerator(Blockly, cfg) {
  const gen = new Blockly.Generator('C');
  gen.INDENT = '    ';

  const name = (variableModel) => sanitizeIdentifier(variableModel.name, C_KEYWORDS);

  gen.init = function (workspace) {
    Blockly.Generator.prototype.init.call(this, workspace);
    this.workspace = workspace;
  };

  gen.scrub_ = function (block, code, opt_thisOnly) {
    return chainNextBlock(this, block, code);
  };

  // Lo scheletro del file (prelude + funzioni + main) vive qui, non nel
  // blocco "program": cosi' le funzioni definite dallo studente possono
  // comparire PRIMA di main potendo essere chiamate da main senza
  // prototipi. Il blocco "program" genera quindi solo il corpo di main.
  gen.workspaceToCode = function (workspace) {
    this.init(workspace);
    const blocks = workspace.getTopBlocks(true);
    let prelude = '#include <stdio.h>\n';
    const functionCodes = [];
    let mainCode = null;
    for (const block of blocks) {
      const code = this.blockToCode(block);
      if (!code) continue;
      if (block.type === 'program') {
        mainCode = code;
      } else if (block.type === 'function_def') {
        functionCodes.push(code);
      }
    }
    if (!mainCode) mainCode = '';
    // Se c'e' almeno una variabile booleana, serve <stdbool.h>.
    const usedModels = Blockly.Variables.allUsedVarModels(workspace);
    if (usedModels.some((m) => m.type === 'Boolean')) {
      prelude += '#include <stdbool.h>\n';
    }
    return `${prelude}\n${functionCodes.join('\n')}${mainCode}`;
  };

  gen.forBlock['program'] = function (block, generator) {
    const body = generator.statementToCode(block, 'BODY');
    // Dichiarazioni: solo variabili scalari effettivamente usate nel corpo
    // di main, escluse quelle dichiarate esplicitamente con var_decl (le
    // emette gia') e i parametri delle funzioni (declarati nelle firme).
    const declaredNames = collectExplicitDeclarations(generator.workspace, 'var_decl');
    const paramNames = collectFunctionParams(generator.workspace);
    const used = Blockly.Variables.allUsedVarModels(generator.workspace).filter(
      (m) => m.type !== 'Array' && !declaredNames.has(m.name) && !paramNames.has(m.name)
    );
    const byType = new Map();
    for (const m of used) {
      const t = SCALAR_C_TYPES[m.type] || SCALAR_C_TYPES.Number;
      if (!byType.has(t.type)) byType.set(t.type, []);
      byType.get(t.type).push(name(m));
    }
    const decls = [];
    for (const [t, names] of byType) {
      decls.push(`${generator.INDENT}${t} ${names.join(', ')};\n`);
    }
    // Il return finale di main viene apposto solo se il corpo non lo
    // dichiara gia' (es. viene da un import C con "return 0" esplicito):
    // cosi' il round-trip esporta->importa->esporta non lo duplica ad ogni
    // passaggio.
    const lastStmt = lastStatementBlock(block, 'BODY');
    const hasReturn = lastStmt && lastStmt.type === 'return_statement';
    return `int main(void) {\n${decls.join('')}${body}${hasReturn ? '' : `${generator.INDENT}return 0;\n`}}\n`;
  };

  gen.forBlock['assign'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const op = block.getFieldValue('OP') || '=';
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return `${name(variable)} ${op} ${value};\n`;
  };

  gen.forBlock['read'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    const t = SCALAR_C_TYPES[variable.type] || SCALAR_C_TYPES.Number;
    return `scanf("${t.scanf}", &${name(variable)});\n`;
  };

  gen.forBlock['write'] = function (block, generator) {
    const target = block.getInputTargetBlock('VALUE');
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    // Re-escape dei caratteri che il parser ha gia' un-escapato (es. il "\\n"
    // dell'input viene memorizzato come newline reale in TEXT e qui va
    // ri-riportato a "\\n"), altrimenti un printf("...\\n") genererebbe una
    // riga C spezzata.
    const esc = (s) =>
      s
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r');
    if (target && target.type === 'string_concat') {
      const strPart = target.getInputTargetBlock('A');
      const text = strPart && strPart.type === 'string_literal' ? strPart.getFieldValue('TEXT') : '';
      const b = generator.valueToCode(target, 'B', Order.NONE) || cfg.MISSING_VALUE;
      const fmt = `${text} %d`;
      return `printf("${esc(fmt)}\\n", ${b});\n`;
    }
    if (target && target.type === 'string_literal') {
      const text = target.getFieldValue('TEXT');
      return `printf("${esc(text)}\\n");\n`;
    }
    return `printf("%d\\n", ${value});\n`;
  };

  gen.forBlock['controls_if_simple'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const thenCode = generator.statementToCode(block, 'THEN');
    return `if (${cond}) {\n${thenCode}}\n`;
  };

  gen.forBlock['controls_if_else'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const thenCode = generator.statementToCode(block, 'THEN');
    const elseCode = generator.statementToCode(block, 'ELSE');
    return `if (${cond}) {\n${thenCode}} else {\n${elseCode}}\n`;
  };

  gen.forBlock['controls_while'] = function (block, generator) {
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    const body = generator.statementToCode(block, 'BODY');
    return `while (${cond}) {\n${body}}\n`;
  };

  gen.forBlock['controls_do_while'] = function (block, generator) {
    const body = generator.statementToCode(block, 'BODY');
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || cfg.MISSING_CONDITION;
    return `do {\n${body}} while (${cond});\n`;
  };

  gen.forBlock['controls_for_simple'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const v = name(variable);
    const from = generator.valueToCode(block, 'FROM', Order.NONE) || cfg.MISSING_VALUE;
    const to = generator.valueToCode(block, 'TO', Order.NONE) || cfg.MISSING_VALUE;
    const body = generator.statementToCode(block, 'BODY');
    return `for (${v} = ${from}; ${v} <= ${to}; ${v}++) {\n${body}}\n`;
  };

  gen.forBlock['controls_for_expr'] = function (block, generator) {
    const init = generator.statementToCode(block, 'INIT').trim().replace(/;\s*$/, '');
    const cond = generator.valueToCode(block, 'COND', Order.NONE) || '1';
    const update = generator.statementToCode(block, 'UPDATE').trim().replace(/;\s*$/, '');
    const body = generator.statementToCode(block, 'BODY');
    return `for (${init}; ${cond}; ${update}) {\n${body}}\n`;
  };

  gen.forBlock['repeat_times'] = function (block, generator) {
    const times = generator.valueToCode(block, 'TIMES', Order.NONE) || cfg.MISSING_VALUE;
    const depth = (generator.repeatDepth || 0) + 1;
    const counter = depth === 1 ? '_i' : `_i${depth}`;
    generator.repeatDepth = depth;
    const body = generator.statementToCode(block, 'BODY');
    generator.repeatDepth = depth - 1;
    return `for (int ${counter} = 0; ${counter} < ${times}; ${counter}++) {\n${body}}\n`;
  };

  gen.forBlock['controls_break'] = function (block) {
    return 'break;\n';
  };

  gen.forBlock['controls_continue'] = function (block) {
    return 'continue;\n';
  };

  gen.forBlock['incr_decr'] = function (block, generator) {
    const op = block.getFieldValue('OP') === 'INC' ? '++' : '--';
    const varCode = generator.valueToCode(block, 'VAR', Order.NONE) || cfg.MISSING_VALUE;
    return `${varCode}${op};\n`;
  };

  gen.forBlock['incr_expr'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return [`${name(variable)}++`, Order.ATOMIC];
  };

  gen.forBlock['decr_expr'] = function (block) {
    const variable = block.getField('VAR').getVariable();
    return [`${name(variable)}--`, Order.ATOMIC];
  };

  gen.forBlock['var_decl'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const t = SCALAR_C_TYPES[block.getFieldValue('TYPE')] || SCALAR_C_TYPES.Number;
    return `${t.type} ${name(variable)};\n`;
  };

  gen.forBlock['array_decl'] = function (block, generator) {
    const variable = block.getField('VAR').getVariable();
    const size = generator.valueToCode(block, 'SIZE', Order.NONE) || '0';
    return `int ${name(variable)}[${size}];\n`;
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
    return `${arr}[${idx}] = ${value};\n`;
  };

  gen.forBlock['function_def'] = function (block, generator) {
    const fname = block.getFieldValue('NAME');
    const retType = block.getFieldValue('RETURN_TYPE');
    const paramBlocks = block.getInputTargetBlock('PARAMS');
    const params = collectParams(paramBlocks, name);
    const body = generator.statementToCode(block, 'BODY');
    if (retType === 'Void') return `void ${fname}(${params.join(', ')}) {\n${body}}\n`;
    return `int ${fname}(${params.join(', ')}) {\n${body}}\n`;
  };

  gen.forBlock['param_decl'] = function (block) {
    const type = block.getFieldValue('TYPE') === 'Boolean' ? 'bool' : 'int';
    return `${type} ${block.getFieldValue('NAME')}`;
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
    return `${fname}(${args.join(', ')});\n`;
  };

  gen.forBlock['function_arg'] = function (block, generator) {
    const v = generator.valueToCode(block, 'VALUE', Order.NONE) || cfg.MISSING_VALUE;
    return [v, Order.NONE];
  };

  gen.forBlock['return_statement'] = function (block, generator) {
    const value = generator.valueToCode(block, 'VALUE', Order.NONE);
    return value ? `return ${value};\n` : 'return;\n';
  };

  gen.forBlock['comment_line'] = function (block) {
    const text = block.getFieldValue('TEXT').replace(/\\+$/, '');
    return `// ${text}\n`;
  };

  gen.forBlock['number_literal'] = function (block) {
    return [String(block.getFieldValue('VALUE')), Order.ATOMIC];
  };

  gen.forBlock['string_literal'] = function (block) {
    const text = block.getFieldValue('TEXT');
    return [`"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`, Order.ATOMIC];
  };

  gen.forBlock['string_concat'] = function (block, generator) {
    const a = generator.valueToCode(block, 'A', Order.NONE) || '""';
    const b = generator.valueToCode(block, 'B', Order.NONE) || cfg.MISSING_VALUE;
    return [`${a} + ${b}`, Order.ADDITIVE];
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
    return [`!${a}`, Order.UNARY_NOT];
  };

  gen.forBlock['bool_literal'] = function (block) {
    return [block.getFieldValue('VALUE') === 'TRUE' ? 'true' : 'false', Order.ATOMIC];
  };

  return gen;
}

// Raccolta dei nomi dichiarati esplicitamente da blocchi di un tipo.
function collectExplicitDeclarations(workspace, blockType) {
  const names = new Set();
  const stack = [...workspace.getTopBlocks(true)];
  while (stack.length) {
    const b = stack.pop();
    if (b.type === blockType) {
      const f = b.getField && b.getField('VAR');
      const vm = f && f.getVariable && f.getVariable();
      if (vm) names.add(vm.name);
    }
    for (const input of b.inputList || []) {
      const target = input.connection && input.connection.targetBlock();
      if (target) stack.push(target);
    }
    const next = b.getNextBlock && b.getNextBlock();
    if (next) stack.push(next);
  }
  return names;
}

// I nomi dei parametri dichiarati nelle function_def di primo livello:
// sono visibili solo dentro la funzione, non devono essere dichiarati in main.
function collectFunctionParams(workspace) {
  const names = new Set();
  for (const block of workspace.getTopBlocks(true)) {
    if (block.type !== 'function_def') continue;
    let p = block.getInputTargetBlock('PARAMS');
    while (p) {
      if (p.type === 'param_decl') names.add(p.getFieldValue('NAME'));
      p = p.getNextBlock();
    }
  }
  return names;
}

// Raccoglie i parametri di una funzione_def come coppie nome:tipo.
function collectParams(firstParamBlock, sanitize) {
  const out = [];
  let cur = firstParamBlock;
  while (cur) {
    if (cur.type === 'param_decl') {
      const type = cur.getFieldValue('TYPE') === 'Boolean' ? 'bool' : 'int';
      out.push(`${type} ${cur.getFieldValue('NAME')}`);
    }
    cur = cur.getNextBlock();
  }
  return out;
}

// Raccoglie gli argomenti di una chiamata tramite la catena di function_arg.
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

// L'ultimo blocco in una catena di statement (input statement) a partire da
// block: serve a riconoscere se il corpo di main termina gia' con un return.
function lastStatementBlock(block, inputName) {
  let last = block.getInputTargetBlock && block.getInputTargetBlock(inputName);
  if (!last) return null;
  while (last.getNextBlock && last.getNextBlock()) last = last.getNextBlock();
  return last;
}