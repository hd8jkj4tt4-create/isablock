// Interprete diretto sui blocchi Blockly: stesso modello dati letto dai tre
// generatori di codice (src/codegen/*.js), ma invece di produrre testo
// esegue realmente l'algoritmo, un'istruzione alla volta. Nessuno dei tre
// output testuali viene mai eseguito - eseguire il C o il Python generati
// richiederebbe rispettivamente un compilatore o un runtime pesante in
// browser (vedi docs/ROADMAP.md, Fase 3). I tre pannelli di codice si
// limitano a "seguire" evidenziando, tramite la source map prodotta da
// src/codegen/common.js: e' l'unico motore che gira davvero.
//
// E' una funzione generatore JS: ogni istruzione fa yield del proprio
// blockId prima di essere eseguita, cosi' il chiamante puo' evidenziare il
// blocco (e la riga corrispondente nei tre output) sia in modalita' "Passo"
// sia in esecuzione continua. Il blocco LEGGI fa yield di un evento
// distinto e riprende con il valore fornito dallo studente tramite
// generator.next(valore).

const MAX_STEPS = 200000;

export class ExecutionError extends Error {}

function checkStepBudget(io) {
  io.stepCount += 1;
  if (io.stepCount > MAX_STEPS) {
    throw new ExecutionError(
      'Esecuzione interrotta: troppi passi (probabile ciclo infinito).'
    );
  }
}

// Stessa identica semantica di divisione/modulo gia' scelta e documentata
// nei tre generatori (vedi src/codegen/c.js e src/codegen/python.js): non e'
// una nuova convenzione, e' quella che i tre output dichiarano di produrre.
function evalExpression(block, vars) {
  if (!block) {
    throw new ExecutionError('Espressione mancante in un blocco.');
  }
  switch (block.type) {
    case 'number_literal':
      return block.getFieldValue('VALUE');
    case 'bool_literal':
      return block.getFieldValue('VALUE') === 'TRUE';
    case 'variable_get': {
      const variable = block.getField('VAR').getVariable();
      return vars.has(variable.getId()) ? vars.get(variable.getId()) : 0;
    }
    case 'arith_op': {
      const a = evalExpression(block.getInputTargetBlock('A'), vars);
      const b = evalExpression(block.getInputTargetBlock('B'), vars);
      switch (block.getFieldValue('OP')) {
        case 'ADD':
          return a + b;
        case 'SUB':
          return a - b;
        case 'MUL':
          return a * b;
        case 'DIV':
          if (b === 0) throw new ExecutionError('Divisione per zero.');
          return Math.trunc(a / b);
        case 'MOD':
          if (b === 0) throw new ExecutionError('Divisione per zero (mod).');
          return a % b;
        default:
          throw new ExecutionError('Operatore aritmetico sconosciuto.');
      }
    }
    case 'compare_op': {
      const a = evalExpression(block.getInputTargetBlock('A'), vars);
      const b = evalExpression(block.getInputTargetBlock('B'), vars);
      switch (block.getFieldValue('OP')) {
        case 'EQ':
          return a === b;
        case 'NEQ':
          return a !== b;
        case 'LT':
          return a < b;
        case 'LTE':
          return a <= b;
        case 'GT':
          return a > b;
        case 'GTE':
          return a >= b;
        default:
          throw new ExecutionError('Operatore di confronto sconosciuto.');
      }
    }
    case 'logic_op': {
      // Corto circuito, come negli output generati (&&/|| in C, and/or in
      // Python): B non viene valutato se non serve.
      const a = evalExpression(block.getInputTargetBlock('A'), vars);
      if (block.getFieldValue('OP') === 'AND') {
        return a && evalExpression(block.getInputTargetBlock('B'), vars);
      }
      return a || evalExpression(block.getInputTargetBlock('B'), vars);
    }
    case 'not_op':
      return !evalExpression(block.getInputTargetBlock('A'), vars);
    default:
      throw new ExecutionError(`Blocco espressione sconosciuto: ${block.type}`);
  }
}

function* runStatements(firstBlock, vars, io) {
  let current = firstBlock;
  while (current) {
    yield* runStatement(current, vars, io);
    current = current.nextConnection && current.nextConnection.targetBlock();
  }
}

function* runStatement(block, vars, io) {
  checkStepBudget(io);
  switch (block.type) {
    case 'assign': {
      yield { blockId: block.id };
      const variable = block.getField('VAR').getVariable();
      vars.set(variable.getId(), evalExpression(block.getInputTargetBlock('VALUE'), vars));
      return;
    }
    case 'read': {
      const variable = block.getField('VAR').getVariable();
      const value = yield { blockId: block.id, awaitingInput: true };
      vars.set(variable.getId(), value);
      return;
    }
    case 'write': {
      yield { blockId: block.id };
      io.onOutput(evalExpression(block.getInputTargetBlock('VALUE'), vars));
      return;
    }
    case 'comment_line': {
      // Nessun effetto (per definizione), ma resta un passo visibile: la
      // spec lo descrive come una riga reale della sequenza, non solo
      // un'annotazione dell'editor.
      yield { blockId: block.id };
      return;
    }
    case 'controls_if_simple': {
      yield { blockId: block.id };
      if (evalExpression(block.getInputTargetBlock('COND'), vars)) {
        yield* runStatements(block.getInputTargetBlock('THEN'), vars, io);
      }
      return;
    }
    case 'controls_if_else': {
      yield { blockId: block.id };
      const branch = evalExpression(block.getInputTargetBlock('COND'), vars) ? 'THEN' : 'ELSE';
      yield* runStatements(block.getInputTargetBlock(branch), vars, io);
      return;
    }
    case 'controls_while': {
      for (;;) {
        yield { blockId: block.id };
        if (!evalExpression(block.getInputTargetBlock('COND'), vars)) break;
        yield* runStatements(block.getInputTargetBlock('BODY'), vars, io);
        checkStepBudget(io);
      }
      return;
    }
    case 'controls_for_simple': {
      const variable = block.getField('VAR').getVariable();
      const from = evalExpression(block.getInputTargetBlock('FROM'), vars);
      const to = evalExpression(block.getInputTargetBlock('TO'), vars);
      for (let i = from; i <= to; i++) {
        vars.set(variable.getId(), i);
        yield { blockId: block.id };
        yield* runStatements(block.getInputTargetBlock('BODY'), vars, io);
        checkStepBudget(io);
      }
      return;
    }
    case 'repeat_times': {
      const times = evalExpression(block.getInputTargetBlock('TIMES'), vars);
      for (let i = 0; i < times; i++) {
        yield { blockId: block.id };
        yield* runStatements(block.getInputTargetBlock('BODY'), vars, io);
        checkStepBudget(io);
      }
      return;
    }
    default:
      throw new ExecutionError(`Blocco istruzione sconosciuto: ${block.type}`);
  }
}

// io = { onOutput(value), stepCount: 0 } - stepCount va inizializzato dal
// chiamante e viene aggiornato qui dentro per il tetto anti-ciclo-infinito.
export function* runProgram(programBlock, io) {
  const vars = new Map();
  const body = programBlock.getInputTargetBlock('BODY');
  if (body) {
    yield* runStatements(body, vars, io);
  }
}
