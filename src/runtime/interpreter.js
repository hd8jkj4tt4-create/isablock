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
//
// SEMANTICA (allineata ai tre output, vedi src/codegen/c.js e python.js):
//   - variabili: Number (int), Boolean (bool), String (solo stringhe letterali),
//     Array (vettori di interi). Tutte vivono nello ``scope'' corrente.
//   - break/continue/return sono segnali di flusso (FlowSignal) fatti
//     rimbalzare fino al generatore del ciclo/funzione che deve gestirli;
//     un segnale non gestito (es. break fuori da un ciclo) diventa un
//     ExecutionError quando esce da runProgram.
//   - incr_expr/decr_expr seguono la convenzione di c.js: postfisso C, quindi
//     RESTITUISCONO il valore precedente e poi aggiornano la variabile.
//   - divisione e modulo sono interi, come dichiarato dai tre generatori.
//   - gli accessi fuori dai limiti di un array sono un ExecutionError
//     (scelta didattica: negli output sarebbero un "undefined behavior" C,
//     qui si preferisce un errore leggibile; vedi DECISIONI-ESTENSIONI.md).

const MAX_STEPS = 200000;

export class ExecutionError extends Error {}
export class FlowSignal extends Error {
  constructor(kind, value) {
    super(`segnale di flusso "${kind}"`); // non mostrato direttamente
    this.kind = kind;
    this.value = value;
  }
}

function checkStepBudget(io) {
  io.stepCount += 1;
  if (io.stepCount > MAX_STEPS) {
    throw new ExecutionError(
      'Esecuzione interrotta: troppi passi (probabile ciclo infinito).'
    );
  }
}

// "Scope" = catena di frame (Map id-variabile -> valore). Il primo serve da
// ambito globale; ogni chiamata a funzione ne appoggia uno nuovo sopra per i
// propri parametri/locali, senza toccare i globals (stesso comportamento dei
// tre output, che dichiarano di produrre variabili locali per funzione).
class Scope {
  constructor(parent) {
    this.parent = parent || null;
    this.vals = new Map();
    this.scripts = []; // definizioni di funzione visibili da questo scope
  }
  has(id) {
    for (let s = this; s; s = s.parent) if (s.vals.has(id)) return true;
    return false;
  }
  get(id) {
    for (let s = this; s; s = s.parent) if (s.vals.has(id)) return s.vals.get(id);
    return undefined;
  }
  set(id, value) {
    // Imposta nel frame piu' vicino che gia' possiede la variabile (o in
    // quello corrente se e' nuova): identico all'assegnazione dei tre.
    let s = this;
    while (s && !s.vals.has(id)) s = s.parent;
    (s || this).vals.set(id, value);
  }
  declare(id, value = 0) {
    this.vals.set(id, value);
  }
}

function evalExpression(block, scope) {
  if (!block) {
    throw new ExecutionError('Espressione mancante in un blocco.');
  }
  switch (block.type) {
    case 'number_literal':
      return Number(block.getFieldValue('VALUE'));
    case 'bool_literal':
      return block.getFieldValue('VALUE') === 'TRUE';
    case 'string_literal':
      return block.getFieldValue('TEXT');
    case 'variable_get': {
      const variable = block.getField('VAR').getVariable();
      return scope.has(variable.getId()) ? scope.get(variable.getId()) : 0;
    }
    case 'incr_expr': {
      const variable = block.getField('VAR').getVariable();
      const old = scope.has(variable.getId()) ? scope.get(variable.getId()) : 0;
      scope.set(variable.getId(), old + 1);
      return old;
    }
    case 'decr_expr': {
      const variable = block.getField('VAR').getVariable();
      const old = scope.has(variable.getId()) ? scope.get(variable.getId()) : 0;
      scope.set(variable.getId(), old - 1);
      return old;
    }
    case 'array_get': {
      const arr = evalExpression(block.getInputTargetBlock('ARRAY'), scope);
      const index = evalExpression(block.getInputTargetBlock('INDEX'), scope);
      if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
        throw new ExecutionError('Accesso a un array fuori dai suoi limiti.');
      }
      return arr[index];
    }
    case 'string_concat': {
      const a = evalExpression(block.getInputTargetBlock('A'), scope);
      const b = evalExpression(block.getInputTargetBlock('B'), scope);
      return String(a) + String(b);
    }
    case 'arith_op': {
      const a = evalExpression(block.getInputTargetBlock('A'), scope);
      const b = evalExpression(block.getInputTargetBlock('B'), scope);
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
      const a = evalExpression(block.getInputTargetBlock('A'), scope);
      const b = evalExpression(block.getInputTargetBlock('B'), scope);
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
      const a = evalExpression(block.getInputTargetBlock('A'), scope);
      if (block.getFieldValue('OP') === 'AND') {
        return a && evalExpression(block.getInputTargetBlock('B'), scope);
      }
      return a || evalExpression(block.getInputTargetBlock('B'), scope);
    }
    case 'not_op':
      return !evalExpression(block.getInputTargetBlock('A'), scope);
    case 'function_call': {
      const fn = scope.scripts.find((f) => f.name === block.getFieldValue('NAME'));
      if (!fn) throw new ExecutionError(`Funzione sconosciuta: ${block.getFieldValue('NAME')}`);
      // Le chiamate nel mezzo di un'espressione non sono ancora eseguite
      // (richiederebbero che evalExpression sia un generatore): vengono
      // eseguite solo come RHS intera di un assegnamento o come istruzione.
      throw new ExecutionError(
        'Chiamate a funzione dentro espressioni composte non ancora eseguite. Usa il risultato in un assegnamento semplice.'
      );
    }
    default:
      throw new ExecutionError(`Blocco espressione sconosciuto: ${block.type}`);
  }
}

// Segnali di ciclo non gestiti *qui sotto* ma rimbalzati ai generatore dei
// costrutti: 0 = nessuno, 'break' / 'continue'.
function* runStatements(firstBlock, scope, io) {
  let current = firstBlock;
  while (current) {
    yield* runStatement(current, scope, io);
    current = current.nextConnection && current.nextConnection.targetBlock();
  }
}

// Oggetti funzione estratti dalle function_def di primo livello: { name,
// params: [blockId dei param_decl], argBlocks, body }. Iparametti sono
// registrati come variabili di quel workspace (vedi c-to-blocks.js).
// Le function_def NON sono agganciate al blocco program: sono blocchi
// top-level separati nel workspace, quindi vanno cercate tra tutti i
// top blocks, non nella catena next del program.
function collectFunctions(programBlock) {
  const funcs = [];
  const workspace = programBlock.workspace;
  for (const top of workspace.getTopBlocks ? workspace.getTopBlocks(true) : [programBlock.getRootBlock()]) {
    if (top.type !== 'function_def') continue;
    const paramIds = [];
    let p = top.getInputTargetBlock('PARAMS');
    while (p) {
      if (p.type === 'param_decl') paramIds.push(p);
      p = p.getNextBlock();
    }
    funcs.push({ name: top.getFieldValue('NAME'), params: paramIds, body: top.getInputTargetBlock('BODY') });
  }
  return funcs;
}

function* runStatement(block, scope, io) {
  checkStepBudget(io);
  switch (block.type) {
    case 'var_decl': {
      // La dichiarazione tipizzata non fa nulla a runtime (la variabile era
      // gia' registrata all'import); resta un passo visibile per l'allineamento.
      yield { blockId: block.id };
      const variable = block.getField('VAR').getVariable();
      if (!scope.has(variable.getId())) scope.declare(variable.getId(), 0);
      return;
    }
    case 'array_decl': {
      yield { blockId: block.id };
      const variable = block.getField('VAR').getVariable();
      const size = evalExpression(block.getInputTargetBlock('SIZE'), scope);
      if (!Number.isInteger(size) || size < 0) {
        throw new ExecutionError('La dimensione di un array deve essere un intero non negativo.');
      }
      scope.declare(variable.getId(), new Array(size).fill(0));
      return;
    }
    case 'assign': {
      const variable = block.getField('VAR').getVariable();
      const valueBlock = block.getInputTargetBlock('VALUE');
      // Se la RHS e' una sola chiamata a funzione (senza altre operazioni),
      // la si puo' eseguire davvero: e' l'uso didatticamente piu' frequente.
      if (valueBlock && valueBlock.type === 'function_call') {
        const value = yield* invokeFunction(block, valueBlock, scope, io);
        yield { blockId: block.id };
        scope.set(variable.getId(), value);
        return;
      }
      yield { blockId: block.id };
      scope.set(variable.getId(), evalExpression(valueBlock, scope));
      return;
    }
    case 'array_set': {
      yield { blockId: block.id };
      const arr = evalExpression(block.getInputTargetBlock('ARRAY'), scope);
      const index = evalExpression(block.getInputTargetBlock('INDEX'), scope);
      const value = evalExpression(block.getInputTargetBlock('VALUE'), scope);
      if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
        throw new ExecutionError('Accesso a un array fuori dai suoi limiti.');
      }
      arr[index] = value; // l'array e' un riferimento: resta assegnato
      return;
    }
    case 'incr_decr': {
      yield { blockId: block.id };
      const variableBlock = block.getInputTargetBlock('VAR');
      const variable = variableBlock && variableBlock.getField('VAR').getVariable();
      if (!variable) throw new ExecutionError('Variabile mancante in ++/--.');
      const cur = scope.has(variable.getId()) ? scope.get(variable.getId()) : 0;
      scope.set(variable.getId(), block.getFieldValue('OP') === 'INC' ? cur + 1 : cur - 1);
      return;
    }
    case 'read': {
      const variable = block.getField('VAR').getVariable();
      const value = yield { blockId: block.id, awaitingInput: true };
      scope.set(variable.getId(), typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value);
      return;
    }
    case 'write': {
      yield { blockId: block.id };
      io.onOutput(evalExpression(block.getInputTargetBlock('VALUE'), scope));
      return;
    }
    case 'comment_line': {
      yield { blockId: block.id };
      return;
    }
    case 'controls_if_simple': {
      yield { blockId: block.id };
      if (evalExpression(block.getInputTargetBlock('COND'), scope)) {
        yield* runStatements(block.getInputTargetBlock('THEN'), scope, io);
      }
      return;
    }
    case 'controls_if_else': {
      yield { blockId: block.id };
      const branch = evalExpression(block.getInputTargetBlock('COND'), scope) ? 'THEN' : 'ELSE';
      yield* runStatements(block.getInputTargetBlock(branch), scope, io);
      return;
    }
    case 'controls_while': {
      for (;;) {
        yield { blockId: block.id };
        if (!evalExpression(block.getInputTargetBlock('COND'), scope)) break;
        try {
          yield* runStatements(block.getInputTargetBlock('BODY'), scope, io);
        } catch (signal) {
          if (signal instanceof FlowSignal && signal.kind === 'break') return;
          if (signal instanceof FlowSignal && signal.kind === 'continue') continue;
          throw signal;
        }
        checkStepBudget(io);
      }
      return;
    }
    case 'controls_do_while': {
      do {
        yield { blockId: block.id };
        try {
          yield* runStatements(block.getInputTargetBlock('BODY'), scope, io);
        } catch (signal) {
          if (signal instanceof FlowSignal && signal.kind === 'break') return;
          if (signal instanceof FlowSignal && signal.kind === 'continue') { /* salta alla condizione */ }
          else throw signal;
        }
        checkStepBudget(io);
        yield { blockId: block.id };
      } while (evalExpression(block.getInputTargetBlock('COND'), scope));
      return;
    }
    case 'controls_for_simple': {
      const variable = block.getField('VAR').getVariable();
      const from = evalExpression(block.getInputTargetBlock('FROM'), scope);
      const to = evalExpression(block.getInputTargetBlock('TO'), scope);
      for (let i = from; i <= to; i++) {
        scope.set(variable.getId(), i);
        yield { blockId: block.id };
        try {
          yield* runStatements(block.getInputTargetBlock('BODY'), scope, io);
        } catch (signal) {
          if (signal instanceof FlowSignal && signal.kind === 'break') return;
          if (signal instanceof FlowSignal && signal.kind === 'continue') continue;
          throw signal;
        }
        checkStepBudget(io);
      }
      return;
    }
    case 'controls_for_expr': {
      // PER (INIT); FINCHE' COND; (UPDATE); BODY
      yield { blockId: block.id };
      yield* runStatements(block.getInputTargetBlock('INIT'), scope, io);
      for (;;) {
        yield { blockId: block.id };
        if (!evalExpression(block.getInputTargetBlock('COND'), scope)) return;
        try {
          yield* runStatements(block.getInputTargetBlock('BODY'), scope, io);
        } catch (signal) {
          if (signal instanceof FlowSignal && signal.kind === 'break') return;
          if (signal instanceof FlowSignal && signal.kind === 'continue') { /* next: passa all'aggiornamento */ }
          else throw signal;
        }
        yield* runStatements(block.getInputTargetBlock('UPDATE'), scope, io);
        checkStepBudget(io);
      }
    }
    case 'repeat_times': {
      const times = evalExpression(block.getInputTargetBlock('TIMES'), scope);
      for (let i = 0; i < times; i++) {
        yield { blockId: block.id };
        try {
          yield* runStatements(block.getInputTargetBlock('BODY'), scope, io);
        } catch (signal) {
          if (signal instanceof FlowSignal && signal.kind === 'break') return;
          if (signal instanceof FlowSignal && signal.kind === 'continue') continue;
          throw signal;
        }
        checkStepBudget(io);
      }
      return;
    }
    case 'call_statement': {
      yield* invokeFunction(block, block, scope, io);
      return;
    }
    case 'return_statement': {
      const value = evalExpression(block.getInputTargetBlock('VALUE'), scope);
      throw new FlowSignal('return', value);
    }
    case 'controls_break':
      throw new FlowSignal('break');
    case 'controls_continue':
      throw new FlowSignal('continue');
    default:
      throw new ExecutionError(`Blocco istruzione sconosciuto: ${block.type}`);
  }
}

// Esegue una chiamata a funzione. callBlock e' il blocco chiamante (call_statement
// o assign), valueBlock la function_call da cui leggo nome/argomenti.
function* invokeFunction(callBlock, valueBlock, outerScope, io) {
  const name = valueBlock.getFieldValue('NAME');
  const fn = outerScope.scripts.find((f) => f.name === name);
  if (!fn) throw new ExecutionError(`Funzione sconosciuta: ${name}`);
  const frame = new Scope(outerScope);
  // Args catena (function_arg) -> valori, in ordine.
  const argBlocks = valueBlock.getInputTargetBlock('ARGS');
  const argValues = [];
  let curArg = argBlocks;
  while (curArg) {
    if (curArg.type === 'function_arg') {
      argValues.push(evalExpression(curArg.getInputTargetBlock('VALUE'), outerScope));
    }
    curArg = curArg.getNextBlock();
  }
  // param_decl usa un campo testo NAME (non un field_variable): il model di
  // variabile va ritrovato nel workspace per nome, come fa variable_get.
  const workspace = callBlock.workspace;
  const variableMap = workspace.getVariableMap ? workspace.getVariableMap() : workspace;
  // getVariable(name, type): il secondo argomento e' il tipo, senza il quale
  // la variabile non viene trovata (Blockly 13).
  const paramVars = fn.params.map((p) => {
    const pname = p.getFieldValue('NAME');
    const ptypeRaw = p.getFieldValue('TYPE');
    const ptype = ptypeRaw === 'Number' ? 'Number' : ptypeRaw === 'Boolean' ? 'Boolean' : ptypeRaw === 'String' ? 'String' : 'Number';
    return variableMap.getVariable(pname, ptype) || (variableMap.createVariable ? variableMap.createVariable(pname, ptype) : null) || workspace.createVariable(pname, ptype);
  });
  if (paramVars.length !== argValues.length) {
    throw new ExecutionError(`La funzione ${name} attende ${paramVars.length} argomenti, ne hai passati ${argValues.length}.`);
  }
  for (let i = 0; i < paramVars.length; i++) frame.declare(paramVars[i].getId(), argValues[i]);
  try {
    yield* runStatements(fn.body, frame, io);
  } catch (signal) {
    if (signal instanceof FlowSignal && signal.kind === 'return') return signal.value;
    throw signal;
  }
  return 0; // nessun return esplicito: per convenzione valore 0
}

// io = { onOutput(value), stepCount: 0 } - stepCount va inizializzato dal
// chiamante e viene aggiornato qui dentro per il tetto anti-ciclo-infinito.
export function* runProgram(programBlock, io) {
  const scope = new Scope(null);
  for (const fn of collectFunctions(programBlock)) scope.scripts.push(fn);
  const body = programBlock.getInputTargetBlock('BODY');
  if (body) {
    try {
      yield* runStatements(body, scope, io);
    } catch (signal) {
      // Segnali di flusso che nessun ciclo/funzione ha gestito: in C sarebbero
      // un errore di compilazione; qui diventano un errore di esecuzione.
      // Un'eccezione: return al livello del programma chiude main normalmente
      // (e' il comportamento C: "return" in main conclude il programma), quindi
      // non e' un errore.
      if (signal instanceof FlowSignal) {
        if (signal.kind === 'return') return;
        const label = signal.kind === 'break' ? 'INTERROMPI' : 'CONTINUA';
        throw new ExecutionError(`"${label}" fuori da un ciclo.`);
      }
      throw signal;
    }
  }
}
