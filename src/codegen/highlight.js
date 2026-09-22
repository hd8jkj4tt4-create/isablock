// Colorazione sintattica dei tre pannelli di output. Lavora sul testo
// GIA' generato e ripulito dai marcatori di source map (vedi
// extractSourceMap in common.js): non tocca i tre generatori, quindi non
// puo' introdurre una quarta implementazione che rischia di divergere da
// pseudocodice/C/Python. E' "solo" un lettore del testo che i generatori
// producono, non una quarta fonte di verita'.
//
// Ogni tokenizzatore restituisce un array di {start, end, type} (offset
// nel testo pulito, non sovrapposti, in ordine), che main.js unisce con
// l'evidenziazione a blocco dell'esecuzione passo-passo.

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Alcune parole chiave dello pseudocodice sono simboli (es. '←', '×') e non
// hanno senso circondati da \b (funziona solo tra caratteri "di parola" e
// non): il confine si aggiunge solo sul lato che inizia/finisce con una
// lettera o cifra, cosi' sia 'FINE SE' sia '←' vengono riconosciuti bene.
function keywordToPattern(word) {
  const esc = escapeRegExp(word);
  const startsWordChar = /\w/.test(word[0]);
  const endsWordChar = /\w/.test(word[word.length - 1]);
  return `${startsWordChar ? '\\b' : ''}${esc}${endsWordChar ? '\\b' : ''}`;
}

// Costruisce un tokenizzatore da una lista ordinata di {type, source}
// (source = sorgente di una regex, senza flag): un solo passaggio con
// un'unica regex a gruppi alternativi, cosi' i token non si sovrappongono
// mai per costruzione.
function buildTokenizer(patterns) {
  const re = new RegExp(patterns.map((p, i) => `(?<g${i}>${p.source})`).join('|'), 'gm');
  return function tokenize(text) {
    const tokens = [];
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      const groupIndex = patterns.findIndex((_, i) => match.groups[`g${i}`] !== undefined);
      tokens.push({ start: match.index, end: match.index + match[0].length, type: patterns[groupIndex].type });
      if (match[0].length === 0) re.lastIndex += 1; // evita loop infiniti su match vuoti
    }
    return tokens;
  };
}

// Numero preceduto da '-' solo se attaccato (es. il letterale "-5"): una
// sottrazione "a - b" ha sempre uno spazio prima dell'operando, quindi non
// viene mai inglobata per errore nel token numero (vedi arith_op nei tre
// generatori, che scrive sempre "a <op> b" con spazi).
const NUMBER_SOURCE = '-?\\b\\d+\\b';

// --- Pseudocodice ---------------------------------------------------------
// Le parole chiave non sono fisse: arrivano da pseudocodeConfig (vedi
// src/pseudocode-config.js), pensato per essere adattato al libro di testo
// della classe. Il tokenizzatore va quindi ricostruito quando cambia la
// configurazione, non puo' avere una lista di parole scritta a mano qui.
const PSEUDOCODE_KEYWORD_KEYS = [
  'PROGRAM_START', 'PROGRAM_END', 'READ', 'WRITE', 'ASSIGN_TO', 'ASSIGN_VALUE',
  'IF', 'THEN', 'ELSE', 'END_IF',
  'WHILE', 'DO', 'END_WHILE',
  'FOR', 'FROM', 'TO', 'END_FOR',
  'REPEAT', 'TIMES', 'END_REPEAT',
  'AND', 'OR', 'NOT', 'TRUE', 'FALSE',
  'EQ', 'NEQ', 'LT', 'LTE', 'GT', 'GTE',
  'ADD', 'SUB', 'MUL', 'DIV', 'MOD',
];

let cachedPseudocodeCfg = null;
let cachedPseudocodeTokenize = null;

export function tokenizePseudocode(text, cfg) {
  if (cfg !== cachedPseudocodeCfg) {
    const words = [...new Set(PSEUDOCODE_KEYWORD_KEYS.map((key) => cfg[key]).filter(Boolean))]
      .sort((a, b) => b.length - a.length);
    cachedPseudocodeTokenize = buildTokenizer([
      { type: 'comment', source: `${escapeRegExp(cfg.COMMENT)}[^\\n]*` },
      { type: 'number', source: NUMBER_SOURCE },
      { type: 'keyword', source: `(?:${words.map(keywordToPattern).join('|')})` },
    ]);
    cachedPseudocodeCfg = cfg;
  }
  return cachedPseudocodeTokenize(text);
}

// --- C ---------------------------------------------------------------------
const tokenizeCImpl = buildTokenizer([
  { type: 'comment', source: '//[^\\n]*' },
  { type: 'preprocessor', source: '#include\\s*<[^>]*>' },
  { type: 'string', source: '"(?:[^"\\\\]|\\\\.)*"' },
  { type: 'number', source: NUMBER_SOURCE },
  { type: 'keyword', source: '\\b(?:int|void|if|else|while|for|return)\\b' },
  { type: 'builtin', source: '\\b(?:printf|scanf)\\b' },
]);
export function tokenizeC(text) {
  return tokenizeCImpl(text);
}

// --- Python ------------------------------------------------------------
const tokenizePythonImpl = buildTokenizer([
  { type: 'comment', source: '#[^\\n]*' },
  { type: 'number', source: NUMBER_SOURCE },
  { type: 'keyword', source: '\\b(?:if|elif|else|while|for|in|and|or|not|True|False|pass)\\b' },
  { type: 'builtin', source: '\\b(?:print|input|int|range)\\b' },
]);
export function tokenizePython(text) {
  return tokenizePythonImpl(text);
}
