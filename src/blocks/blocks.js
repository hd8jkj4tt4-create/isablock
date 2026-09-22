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
      { type: 'input_value', name: 'VALUE', check: 'Number' },
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
    args0: [{ type: 'input_value', name: 'VALUE', check: 'Number' }],
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
    output: 'Number',
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
];

export function registerBlocks(Blockly) {
  Blockly.common.defineBlocksWithJsonArray(blockDefinitions);
}
