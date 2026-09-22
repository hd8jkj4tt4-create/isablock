// Definizione della tavolozza (toolbox). Il blocco "program" non compare
// qui apposta: ne esiste sempre e solo una copia fissa, creata da main.js.
//
// Raggruppata per argomento didattico (non per "istruzione vs espressione"
// come nella primissima versione): piu' intuitivo per chi non ha mai
// programmato, e nessuna categoria supera i 4 blocchi. Il colore della
// categoria e' solo per la navigazione nella tavolozza; il colore del
// singolo blocco (definito in blocks.js) codifica invece il suo tipo
// (istruzione/numero/booleano) e resta lo stesso in ogni categoria.
export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Variabili e I/O',
      colour: '#4a6fa5',
      contents: [
        { kind: 'block', type: 'assign' },
        { kind: 'block', type: 'read' },
        { kind: 'block', type: 'write' },
        { kind: 'block', type: 'variable_get' },
      ],
    },
    {
      kind: 'category',
      name: 'Numeri',
      colour: '#e0a458',
      contents: [
        { kind: 'block', type: 'number_literal' },
        { kind: 'block', type: 'arith_op' },
      ],
    },
    {
      kind: 'category',
      name: 'Condizioni',
      colour: '#5b8c5a',
      contents: [
        { kind: 'block', type: 'controls_if_simple' },
        { kind: 'block', type: 'controls_if_else' },
      ],
    },
    {
      kind: 'category',
      name: 'Logica',
      colour: '#c1666b',
      contents: [
        { kind: 'block', type: 'compare_op' },
        { kind: 'block', type: 'logic_op' },
        { kind: 'block', type: 'not_op' },
        { kind: 'block', type: 'bool_literal' },
      ],
    },
    {
      kind: 'category',
      name: 'Cicli',
      colour: '#8659a8',
      contents: [
        { kind: 'block', type: 'controls_while' },
        { kind: 'block', type: 'controls_for_simple' },
        { kind: 'block', type: 'repeat_times' },
      ],
    },
    {
      kind: 'category',
      name: 'Commenti',
      colour: '#8a94a6',
      contents: [{ kind: 'block', type: 'comment_line' }],
    },
  ],
};
