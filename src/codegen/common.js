// Utilita' condivise dai tre generatori (pseudocodice/C/Python), cosi'
// che un costrutto tradotto in modo incoerente tra i tre output sia
// strutturalmente difficile da scrivere per errore: la precedenza degli
// operatori e il chaining delle istruzioni vivono in un solo posto.

// Ordini di precedenza (numero piu' basso = lega piu' stretto). Comuni
// alle tre grammatiche perche' i tre output devono restare equivalenti.
export const Order = {
  ATOMIC: 0,
  UNARY_NOT: 1,
  MULTIPLICATIVE: 2,
  ADDITIVE: 3,
  RELATIONAL: 4,
  LOGICAL_AND: 5,
  LOGICAL_OR: 6,
  NONE: 99,
};

// Left: ordine richiesto all'operando sinistro senza aggiungere parentesi
// superflue. Right: ordine richiesto all'operando destro - piu' stretto
// per gli operatori non associativi (- e /), cosi' "a - (b - c)" non
// perde le parentesi necessarie.
export const ARITH_OPS = {
  ADD: { order: Order.ADDITIVE, rightOrder: Order.ADDITIVE },
  SUB: { order: Order.ADDITIVE, rightOrder: Order.ATOMIC },
  MUL: { order: Order.MULTIPLICATIVE, rightOrder: Order.MULTIPLICATIVE },
  DIV: { order: Order.MULTIPLICATIVE, rightOrder: Order.ATOMIC },
  MOD: { order: Order.MULTIPLICATIVE, rightOrder: Order.ATOMIC },
};

export const COMPARE_SYMBOLS_ASCII = {
  EQ: '==',
  NEQ: '!=',
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>=',
};

// Concatena il blocco successivo nella pila (previous/nextStatement).
// Identica per i tre generatori: la sequenza si comporta sempre allo
// stesso modo, indipendentemente da come viene resa testualmente.
//
// Se generator.sourceMap e' attivo, avvolge anche il proprio frammento con
// marcatori invisibili (vedi extractSourceMap) cosi' l'esecutore a blocchi
// puo' evidenziare la porzione di testo che corrisponde al blocco in
// esecuzione, in ciascuno dei tre output, senza eseguire il testo stesso.
export function chainNextBlock(generator, block, code) {
  const ownCode = generator.sourceMap ? wrapWithBlockMarker(block, code) : code;
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const nextCode = nextBlock ? generator.blockToCode(nextBlock) : '';
  return ownCode + nextCode;
}

// Caratteri di controllo: non possono comparire nel testo generato dai tre
// linguaggi, quindi sono sicuri da usare come delimitatori invisibili e da
// rimuovere senza ambiguita' in extractSourceMap.
const MARK_OPEN = '';
const MARK_START = '';
const MARK_END = '';
const MARK_RE = /([^]*)([])/g;

function wrapWithBlockMarker(block, code) {
  if (!code) return code;
  // Il marcatore di chiusura va prima dell'eventuale ultimo "a capo": deve
  // restare sulla stessa riga del codice del blocco, altrimenti
  // l'indentazione a riga (statementToCode) lo sposterebbe fuori posto.
  const hasTrailingNewline = code.endsWith('\n');
  const body = hasTrailingNewline ? code.slice(0, -1) : code;
  const wrapped = `${MARK_OPEN}${block.id}${MARK_START}${body}${MARK_OPEN}${block.id}${MARK_END}`;
  return hasTrailingNewline ? wrapped + '\n' : wrapped;
}

// Rimuove i marcatori da un output generato con sourceMap attivo,
// restituendo il testo pulito (identico a quello senza sourceMap) insieme
// alla mappa blockId -> {start, end} nel testo pulito. Usa una mappa
// indicizzata per id anziche' una pila esplicita: funziona comunque per
// marcatori annidati perche' ogni id e' unico nel workspace.
export function extractSourceMap(rawText) {
  const ranges = new Map();
  const openOffsets = new Map();
  let clean = '';
  let lastIndex = 0;
  let match;
  while ((match = MARK_RE.exec(rawText)) !== null) {
    clean += rawText.slice(lastIndex, match.index);
    lastIndex = MARK_RE.lastIndex;
    const [, blockId, kind] = match;
    if (kind === MARK_START) {
      openOffsets.set(blockId, clean.length);
    } else {
      const start = openOffsets.get(blockId);
      openOffsets.delete(blockId);
      if (start !== undefined) {
        ranges.set(blockId, { start, end: clean.length });
      }
    }
  }
  clean += rawText.slice(lastIndex);
  return { text: clean, ranges };
}

const RESERVED_SUFFIX = '_var';

// Evita di generare identificatori che collidono con parole chiave del
// linguaggio di destinazione (es. una variabile chiamata "for" o "int").
// Lo pseudocodice non ne ha bisogno: non e' un linguaggio da compilare.
export function sanitizeIdentifier(name, reservedWords) {
  const safe = String(name).replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1') || '_';
  return reservedWords.has(safe.toLowerCase()) ? safe + RESERVED_SUFFIX : safe;
}
