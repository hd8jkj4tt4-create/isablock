// Definizione dei blocchi custom per la Fase 1.
//
// Per aggiungere un nuovo blocco in futuro: aggiungere una voce a questo
// array (o un nuovo Blockly.Blocks[...] per logica non esprimibile in
// JSON) e una funzione generatore in ciascuno dei tre file in src/codegen/.
// Nient'altro nell'editor deve essere toccato.
//
// Convenzione colori: il colore comunica il "tipo" del blocco allo
// studente, oltre alle connessioni tipizzate (che impediscono comunque
// l'incastro sbagliato anche se lo studente ignora il colore).
export const COLOR_PROGRAM = '#5b6770';
export const COLOR_STATEMENT = '#4a6fa5';
export const COLOR_NUMBER = '#e0a458';
export const COLOR_BOOLEAN = '#c1666b';
export const COLOR_COMMENT = '#8a94a6';

const blockDefinitions = [
  // --- Struttura -----------------------------------------------------
  {
    type: 'program',
    message0: 'INIZIO',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'BODY' }],
    message2: 'FINE',
    colour: COLOR_PROGRAM,
  },

  // --- Istruzioni ------------------------------------------------------
  {
    type: 'assign',
    message0: 'ASSEGNA A %1 IL VALORE %2',
    args0: [
      { type: 'field_variable', name: 'VAR', variable: 'variabile' },
      { type: 'input_value', name: 'VALUE', check: ['Number', 'Boolean', 'String'] },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Assegna il valore di un’espressione a una variabile',
  },
  {
    type: 'read',
    message0: 'LEGGI %1',
    args0: [{ type: 'field_variable', name: 'VAR', variable: 'variabile' }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Legge un valore in input e lo salva in una variabile',
  },
  {
    type: 'write',
    message0: 'SCRIVI %1',
    args0: [{ type: 'input_value', name: 'VALUE', check: ['Number', 'Boolean', 'String'] }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Stampa in output il valore di un’espressione',
  },
  {
    type: 'controls_if_simple',
    message0: 'SE %1 ALLORA',
    args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'THEN' }],
    message2: 'FINE SE',
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Selezione semplice',
  },
  {
    type: 'controls_if_else',
    message0: 'SE %1 ALLORA',
    args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'THEN' }],
    message2: 'ALTRIMENTI',
    message3: '%1',
    args3: [{ type: 'input_statement', name: 'ELSE' }],
    message4: 'FINE SE',
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Selezione con alternativa',
  },
  {
    type: 'controls_while',
    message0: 'MENTRE %1 RIPETI',
    args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'BODY' }],
    message2: 'FINE MENTRE',
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Iterazione a condizione iniziale (condizione valutata prima di ogni ripetizione)',
  },
  {
    type: 'controls_for_simple',
    message0: 'PER %1 DA %2 A %3',
    args0: [
      { type: 'field_variable', name: 'VAR', variable: 'i' },
      { type: 'input_value', name: 'FROM', check: 'Number' },
      { type: 'input_value', name: 'TO', check: 'Number' },
    ],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'BODY' }],
    message2: 'FINE PER',
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Iterazione a contatore, da un valore iniziale a un valore finale incluso, passo 1',
  },
  {
    type: 'repeat_times',
    message0: 'RIPETI %1 VOLTE',
    args0: [{ type: 'input_value', name: 'TIMES', check: 'Number' }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'BODY' }],
    message2: 'FINE RIPETI',
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Ripete le istruzioni un numero di volte fissato, senza bisogno di un contatore',
  },

  // --- Commenti ----------------------------------------------------------
  {
    type: 'comment_line',
    message0: '// %1',
    args0: [{ type: 'field_input', name: 'TEXT', text: 'commento' }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_COMMENT,
    tooltip: 'Nota per chi legge il codice: non ha alcun effetto sull’esecuzione',
  },

  // --- Espressioni numeriche -------------------------------------------
  {
    type: 'number_literal',
    message0: '%1',
    args0: [{ type: 'field_number', name: 'VALUE', value: 0, precision: 1 }],
    output: 'Number',
    colour: COLOR_NUMBER,
  },
  {
    type: 'variable_get',
    message0: '%1',
    args0: [{ type: 'field_variable', name: 'VAR', variable: 'variabile' }],
    output: null,
    colour: COLOR_NUMBER,
  },
  {
    type: 'arith_op',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A', check: 'Number' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['+', 'ADD'],
          ['−', 'SUB'],
          ['×', 'MUL'],
          ['÷', 'DIV'],
          ['mod', 'MOD'],
        ],
      },
      { type: 'input_value', name: 'B', check: 'Number' },
    ],
    inputsInline: true,
    output: 'Number',
    colour: COLOR_NUMBER,
  },

  // --- Espressioni booleane ---------------------------------------------
  {
    type: 'compare_op',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A', check: 'Number' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['=', 'EQ'],
          ['≠', 'NEQ'],
          ['<', 'LT'],
          ['≤', 'LTE'],
          ['>', 'GT'],
          ['≥', 'GTE'],
        ],
      },
      { type: 'input_value', name: 'B', check: 'Number' },
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: COLOR_BOOLEAN,
  },
  {
    type: 'logic_op',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A', check: 'Boolean' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['E', 'AND'],
          ['O', 'OR'],
        ],
      },
      { type: 'input_value', name: 'B', check: 'Boolean' },
    ],
    inputsInline: true,
    output: 'Boolean',
    colour: COLOR_BOOLEAN,
  },
  {
    type: 'not_op',
    message0: 'NON %1',
    args0: [{ type: 'input_value', name: 'A', check: 'Boolean' }],
    inputsInline: true,
    output: 'Boolean',
    colour: COLOR_BOOLEAN,
  },
  {
    type: 'bool_literal',
    message0: '%1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'VALUE',
        options: [
          ['vero', 'TRUE'],
          ['falso', 'FALSE'],
        ],
      },
    ],
    output: 'Boolean',
    colour: COLOR_BOOLEAN,
  },
  // --- Stringhe ----------------------------------------------------------
  {
    type: 'string_literal',
    message0: '"%1"',
    args0: [{ type: 'field_input', name: 'TEXT', text: '' }],
    output: 'String',
    colour: COLOR_NUMBER,
  },
  {
    type: 'string_concat',
    message0: '%1 E %2',
    args0: [
      { type: 'input_value', name: 'A', check: 'String' },
      { type: 'input_value', name: 'B' },
    ],
    inputsInline: true,
    output: 'String',
    colour: COLOR_NUMBER,
    tooltip: 'Unisce un testo a un valore',
  },
  // --- Controllo di flusso aggiuntivo -----------------------------------
  {
    type: 'controls_do_while',
    message0: 'RIPETI',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'BODY' }],
    message2: 'FINCHÉ %1',
    args2: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Ripete almeno una volta finché la condizione è vera',
  },
  {
    type: 'controls_break',
    message0: 'INTERROMPI',
    previousStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Esce dal ciclo corrente',
  },
  {
    type: 'controls_continue',
    message0: 'CONTINUA',
    previousStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Prosegue alla prossima iterazione del ciclo corrente',
  },
  {
    type: 'controls_for_expr',
    message0: 'PER (inizializza)',
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'INIT' }],
    message2: 'FINCHÉ %1',
    args2: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
    message3: '%1 (aggiorna)',
    args3: [{ type: 'input_statement', name: 'UPDATE' }],
    message4: '%1',
    args4: [{ type: 'input_statement', name: 'BODY' }],
    message5: 'FINE PER',
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Ciclo for generico (inizializzazione; condizione; aggiornamento)',
  },
  {
    type: 'incr_decr',
    message0: '%1 %2',
    args0: [
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['++', 'INC'],
          ['--', 'DEC'],
        ],
      },
      { type: 'input_value', name: 'VAR', check: 'Number' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Incrementa o decrementa una variabile',
  },
  {
    type: 'incr_expr',
    message0: '%1++',
    args0: [{ type: 'field_variable', name: 'VAR', variable: 'variabile' }],
    output: 'Number',
    colour: COLOR_NUMBER,
    tooltip: 'Incrementa e restituisce la variabile',
  },
  {
    type: 'decr_expr',
    message0: '%1--',
    args0: [{ type: 'field_variable', name: 'VAR', variable: 'variabile' }],
    output: 'Number',
    colour: COLOR_NUMBER,
    tooltip: 'Decrementa e restituisce la variabile',
  },

  // --- Variabili tipizzate e array --------------------------------------
  {
    type: 'var_decl',
    message0: 'DICHIARA %1 (%2)',
    args0: [
      { type: 'field_variable', name: 'VAR', variable: 'variabile' },
      {
        type: 'field_dropdown',
        name: 'TYPE',
        options: [
          ['intero (int)', 'Number'],
          ['booleano (bool)', 'Boolean'],
        ],
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Dichiara esplicitamente una variabile tipizzata',
  },
  {
    type: 'array_decl',
    message0: 'DICHIARA ARRAY %1 DI %2 ELEMENTI',
    args0: [
      { type: 'field_variable', name: 'VAR', variable: 'array', variableTypes: ['Array'], defaultType: 'Array' },
      { type: 'input_value', name: 'SIZE', check: 'Number' },
    ],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'INIT', check: null }],
    message2: 'FINE ARRAY',
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Dichiara un array di interi con dimensione fissa',
  },
  {
    type: 'array_get',
    message0: '%1 [ %2 ]',
    args0: [
      { type: 'input_value', name: 'ARRAY', check: 'Array' },
      { type: 'input_value', name: 'INDEX', check: 'Number' },
    ],
    inputsInline: true,
    output: 'Number',
    colour: COLOR_NUMBER,
    tooltip: 'Elemento di un array',
  },
  {
    type: 'array_set',
    message0: 'PONI %1 IN %2 [ %3 ]',
    args0: [
      { type: 'input_value', name: 'VALUE', check: 'Number' },
      { type: 'input_value', name: 'ARRAY', check: 'Array' },
      { type: 'input_value', name: 'INDEX', check: 'Number' },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Assegna un valore a un elemento di un array',
  },

  // --- Funzioni ----------------------------------------------------------
  {
    type: 'function_def',
    message0: 'FUNZIONE %1 → %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'miaFunzione' },
      {
        type: 'field_dropdown',
        name: 'RETURN_TYPE',
        options: [
          ['int', 'Number'],
          ['bool', 'Boolean'],
          ['char', 'String'],
          ['void', 'Void'],
        ],
      },
    ],
    message1: 'PARAMETRI: %1',
    args1: [{ type: 'input_statement', name: 'PARAMS' }],
    message2: '%1',
    args2: [{ type: 'input_statement', name: 'BODY' }],
    message3: 'FINE FUNZIONE',
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Definisce una funzione con parametri e corpo',
  },
  {
    type: 'param_decl',
    message0: '%1 %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'x' },
      {
        type: 'field_dropdown',
        name: 'TYPE',
        options: [
          ['int', 'Number'],
          ['bool', 'Boolean'],
        ],
      },
    ],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Dichiara un parametro',
  },
  {
    type: 'function_call',
    message0: '%1 (', 
    args0: [{ type: 'field_input', name: 'NAME', text: 'miaFunzione' }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'ARGS' }],
    message2: ')',
    inputsInline: true,
    output: 'Number',
    colour: COLOR_BOOLEAN,
    tooltip: 'Chiama una funzione e usa il valore restituito',
  },
  {
    type: 'call_statement',
    message0: 'CHIAMA %1',
    args0: [{ type: 'field_input', name: 'NAME', text: 'miaFunzione' }],
    message1: 'ARGOMENTI: %1',
    args1: [{ type: 'input_statement', name: 'ARGS' }],
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Chiama una funzione come istruzione',
  },
  {
    type: 'function_arg',
    message0: '%1',
    args0: [{ type: 'input_value', name: 'VALUE' }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_BOOLEAN,
    tooltip: 'Argomento di una chiamata di funzione',
  },
  {
    type: 'return_statement',
    message0: 'RESTITUISCI %1',
    args0: [{ type: 'input_value', name: 'VALUE' }],
    inputsInline: true,
    previousStatement: null,
    nextStatement: null,
    colour: COLOR_STATEMENT,
    tooltip: 'Restituisce un valore dalla funzione corrente',
  },
];

export function registerBlocks(Blockly) {
  Blockly.common.defineBlocksWithJsonArray(blockDefinitions);

  // Imposta i tipi di variabile supportati (Blockly 13 usa variableTypes sui
  // campi field_variable: 'Number'/'Boolean'/'String'/'Array').
  if (Blockly.Types && Blockly.Types.addVariableTypes) {
    Blockly.Types.addVariableTypes(['Number', 'Boolean', 'String', 'Array']);
  }
}

// Rende il tooltip di una funzione dinamico: i nomi delle funzioni definite
// diventano selezionabili nel dropdown di function_call. Chiamato dopo il
// registro dei blocchi al primo caricamento del workspace.
export function refreshFunctionNames(Blockly, workspace) {}
