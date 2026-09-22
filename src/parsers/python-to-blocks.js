// Parser Python -> blocchi Blockly. Il duale di python-to-blocks.js per le
// tre viste "Importa Codice": qui la sorgente e' Python, l'output e' lo
// stesso identico stato del workspace (JSON secondo
// Blockly.serialization.workspaces.load) che genera c-to-blocks.js
// (src/parsers/c-to-blocks.js). Lo schema dei blocchi emessi, i nomi di
// input/field e la semantica (divisione/modulo interi, corto circuito,
// break/continue/return come segnali) sono gli stessi di sempre: vedi
// docs/DECISIONI-ESTENSIONI.md.
//
// E' un parser ricorsivo a discesa, tutto lato client e senza dipendenze:
// la struttura a blocchi in output e' portabile ovunque ma il workspace
// viene ricostruito esclusivamente chiamando la serializzazione Blockly (il
// motore vero, condiviso con gli altri due pannelli e con l'interprete).

import { BlockBuilder } from './block-builder.js';

// --- Configurazione: copia maschio di ciò che python.js genera ---------
const PY = {
  INDENT: '   ',
  TRUE: 'True',
  FALSE: 'False',
  FOR: 'for',
  IN: 'in',
  WHILE: 'while',
  DO: 'do',
  IF: 'if',
  ELIF: 'elif',
  ELSE: 'else',
  DEF: 'def',
  RETURN: 'return',
  PRINT: 'print',
  INPUT: 'input',
  INT: 'int',
  RANGE: 'range',
  LEN: 'len',
  BREAK: 'break',
  CONTINUE: 'continue',
  AND: 'and',
  OR: 'or',
  NOT: 'not',
  MISSING: '⟨manca⟩',
};

const TOKEN_RE = new RegExp(
  [
    '(?<space>\\s+)',
    '(?<comment>#[^\\n]*)',
    '(?<number>0[xX][0-9a-fA-F]+|\\d+)',
    '(?<number_b>\\d+)',
    '(?<ident>[A-Za-z_][A-Za-z0-9_]*)',
    '(?<string>("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'))',
    '(?<op>\\+\\+|--|==|!=|<=|>=|&&|\\|\\||[=+\\-*\\/%<>!]|\\.\\.\\.|\\.)',
    '(?<punct>[()\\[\\]{},;:])',
    '(?<other>.)',
  ].join('|'),
  'g'
);

const LITERAL_TYPES = { int: 'Number', bool: 'Boolean', str: 'String' };
const OPERATORS = {
  '+': { kind: 'arith', OP: 'ADD' },
  '-': { kind: 'arith', OP: 'SUB' },
  '*': { kind: 'arith', OP: 'MUL' },
  '/': { kind: 'arith', OP: 'DIV' },
  '%': { kind: 'arith', OP: 'MOD' },
  '==': { kind: 'compare', OP: 'EQ' },
  '!=': { kind: 'compare', OP: 'NEQ' },
  '<': { kind: 'compare', OP: 'LT' },
  '<=': { kind: 'compare', OP: 'LTE' },
  '>': { kind: 'compare', OP: 'GT' },
  '>=': { kind: 'compare', OP: 'GTE' },
};

class TokenStream {
  constructor(code) {
    this.code = code;
    this.pos = 0;
    this.line = 1;
    this.col = 0;
    this.tokens = [];
    this.tokenize();
  }
  tokenize() {
    let m;
    TOKEN_RE.lastIndex = 0;
    const code = this.code;
    while ((m = TOKEN_RE.exec(code)) !== null) {
      const { space, comment } = m.groups;
      if (space) {
        const hasNL = /\n/.test(space);
        if (hasNL) {
          this.line += (space.match(/\n/g) || []).length;
          this.tokens.push({ t: 'NL', value: '\n', line: this.line });
        } else this.col += space.length;
        continue;
      }
      if (comment) { this.tokens.push({ t: 'NL', value: '\n', line: this.line }); continue; }
      const [raw] = m[0];
      const groups = m.groups;
      if (groups.number) this.tokens.push({ t: 'NUM', value: Number(groups.number), line: this.line });
      else if (groups.ident) {
        this.tokens.push({ t: groups.ident === 'True' || groups.ident === 'False' ? 'BOOL' : 'IDENT', value: groups.ident, line: this.line });
      } else if (groups.string) {
        this.tokens.push({ t: 'STR', value: parseString(groups.string), line: this.line });
      } else if (groups.op) this.tokens.push({ t: 'OP', value: groups.op, line: this.line });
      else if (groups.punct) this.tokens.push({ t: 'PUNCT', value: groups.punct, line: this.line });
      else this.tokens.push({ t: 'OTHER', value: raw, line: this.line });
    }
    this.tokens.push({ t: 'EOF', value: '', line: this.line });
  }
  peek(offset = 0) { return this.tokens[this.pos + (offset || 0)] || this.tokens[this.tokens.length - 1]; }
  next() { const t = this.tokens[this.pos]; if (t.t !== 'EOF') this.pos++; return t; }
  atEnd() { return this.peek().t === 'EOF'; }
  // Reinserisce un token (usato dal lookahead per Python-style block ==
  // su righe successive, dato che qui l'INDENTA non e' un token esplicito).
  rewind() { if (this.pos > 0) this.pos--; }
}

function parseString(v) {
  const inner = v.slice(1, -1);
  if (v[0] === "'" && v[v.length - 1] === "'") return inner;
  return inner.replace(/\\(['"\\nt])/g, (_m, c) => ({ n: '\n', t: '\t', '\\': '\\', "'": "'", '"': '"' }[c] ?? c));
}

// La grammatica Python non usa separatori espliciti (a differenza del C):
// l'indentazione delimita i blocchi. Per restare un parser a discesa su
// token unici (senza congiura del tokenizer sull'indentazione, come i
// generatori che funzionano su catene next), qui il livello di indentazione
// si ricava dal token NL e dalla riga seguente, guardando quanti spazi la
// convinzione studente ha messo. La quantita' di spazi non e' vincolata:
// quel che conta e' la coerenza relativa (tutta la sorgente usa lo stesso
// numero per uno stesso livello).
export class PythonParser {
  constructor(source) {
    this.source = source;
    this.tokens = new TokenStream(source);
    this.indentStack = [];
    this.varIdByName = new Map();
    this.functionNames = new Set();
    this.b = new BlockBuilder();
    this.line = 1;
  }

  err(msg) {
    const t = this.tokens.peek();
    throw new ExecutionErrorItalian(`Errore di sintassi Python a riga ${t.line}: ${msg}.`);
  }

  // --- Espressioni ------------------------------------------------------
  parseExpression() { return this.parseOr(); }

  parseOr() {
    let left = this.parseAnd();
    while (this.isOp('or')) { this.next(); const right = this.parseAnd(); left = { kind: 'logic', OP: 'OR', a: left, b: right }; }
    return left;
  }
  parseAnd() {
    let left = this.parseNot();
    while (this.isOp('and')) { this.next(); const right = this.parseNot(); left = { kind: 'logic', OP: 'AND', a: left, b: right }; }
    return left;
  }
  parseNot() {
    if (this.isOp('not')) { this.next(); return { kind: 'not', a: this.parseNot() }; }
    return this.parseComparison();
  }
  parseComparison() {
    let left = this.parseTerm();
    while (this.isOp('==') || this.isOp('!=') || this.isOp('<') || this.isOp('<=') || this.isOp('>') || this.isOp('>=')) {
      const op = this.next().value;
      const right = this.parseTerm();
      left = { kind: 'compare', OP: OPERATORS[op].OP, a: left, b: right };
    }
    return left;
  }
  parseTerm() {
    let left = this.parseFactor();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.next().value;
      const right = this.parseFactor();
      left = { kind: 'arith', OP: op === '+' ? 'ADD' : 'SUB', a: left, b: right };
    }
    return left;
  }
  parseFactor() {
    let left = this.parseUnary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.next().value;
      const right = this.parseUnary();
      left = { kind: 'arith', OP: { '*': 'MUL', '/': 'DIV', '%': 'MOD' }[op], a: left, b: right };
    }
    return left;
  }
  parseUnary() {
    if (this.isOp('-')) { this.next(); return { kind: 'arith', OP: 'SUB', a: { kind: 'num', v: 0 }, b: this.parseUnary() }; }
    if (this.isOp('+')) { this.next(); return this.parseUnary(); }
    return this.parsePostfix();
  }
  parsePostfix() {
    let expr = this.parsePrimary();
    for (;;) {
      if (this.isPunct('[')) {
        this.next();
        const index = this.parseExpression();
        this.expectPunct(']');
        expr = { kind: 'index', var: expr, idx: index };
      } else if (this.isPunct('(')) {
        this.next();
        const args = [];
        while (!this.isPunct(')')) { args.push(this.parseExpression()); if (!this.isPunct(')')) this.expectPunct(','); }
        this.expectPunct(')');
        expr = { kind: 'call', name: expr.name, args };
      } else break;
    }
    return expr;
  }
  parsePrimary() {
    const t = this.peek();
    if (t.t === 'NUM') { this.next(); return { kind: 'num', v: t.value }; }
    if (t.t === 'STR') { this.next(); return { kind: 'str', v: t.value }; }
    if (t.t === 'BOOL') { this.next(); return { kind: 'bool', v: t.value === 'True' }; }
    if (t.t === 'IDENT' && t.value === 'len' && this.peek(1).value === '(') return this.parseCall();
    if (t.t === 'IDENT') { this.next(); return { kind: 'var', name: t.value }; }
    if (this.isPunct('(')) { this.next(); const e = this.parseExpression(); this.expectPunct(')'); return e; }
    this.err('espressione non valida');
  }
  parseCall() {
    const name = this.expectIdent();
    this.expectPunct('(');
    const args = [];
    while (!this.isPunct(')')) { args.push(this.parseExpression()); if (!this.isPunct(')')) this.expectPunct(','); }
    this.expectPunct(')');
    return { kind: 'call', name, args };
  }

  // --- Utility ----------------------------------------------------------
  assertKeyword(kw) {
    if (this.peek().t === 'IDENT' && this.peek().value === kw) { this.next(); return; }
    this.err(`atteso "${kw}"`);
  }
  assertOp(op) {
    if (this.isOp(op)) { this.next(); return; }
    this.err(`atteso "${op}"`);
  }
  assertPunct(p) {
    if (this.isPunct(p)) { this.next(); return; }
    this.err(`atteso "${p}"`);
  }
  isOp(op) { return this.peek().t === 'OP' && this.peek().value === op; }
  isPunct(p) { return this.peek().t === 'PUNCT' && this.peek().value === p; }
  isIdent() { return this.peek().t === 'IDENT'; }
  isFloat() { return this.peek().t === 'NUM'; }
  expectIdent() {
    if (this.peek().t === 'IDENT') return this.next().value;
    this.err('atteso identificatore');
  }
  expectNumber() {
    if (this.peek().t === 'NUM') return this.next().value;
    this.err('atteso numero');
  }
  expectPunct(p) { if (this.isPunct(p)) return this.next().value; this.err(`atteso "${p}"`); }
  atEnd() { return this.tokens.atEnd(); }

  // --- Parser vero e proprio --------------------------------------------
  parse() {
    // Raccoglie prima tutte le definizioni di funzione (sono a livello
    // top-level e precedono main()): futuro-semplice. Poi una gran passata
    // su tutto il file per i nomi delle variabili.
    const funcs = [];
    while (!this.atEnd()) {
      if (this.peek().t === 'IDENT' && this.peek().value === 'def') {
        funcs.push(this.parseFunctionDef());
      } else {
        this.skipToNextLine();
      }
    }
    // main() e' la funzione con nome "main" (come il main C): per restare
    // allineati agli altri due parser, il suo corpo diventa il blocco
    // program. Le altre diventano function_def con nome.
    const mainIdx = funcs.findIndex((f) => f.name === 'main');
    if (mainIdx === -1) this.err('manca la funzione main()');
    const [main, ...others] = mainIdx >= 0
      ? [funcs[mainIdx], ...funcs.slice(0, mainIdx), ...funcs.slice(mainIdx + 1)]
      : funcs;
    const ws = this.b.toWorkspace();
    ws.blocks.blocks.push(this.b.block('program', {}, { BODY: this.b.chain(main.body) }));
    for (const f of others) {
      ws.blocks.blocks.push(this.b.block('function_def', { NAME: f.name, RETURN_TYPE: f.ret }, {
        PARAMS: this.b.chain(f.params.map((p) => this.b.block('param_decl', { NAME: p.name, TYPE: 'Number' }))),
        BODY: this.b.chain(f.body),
      }));
    }
    return ws;
  }

  skipToNextLine() {
    while (!this.atEnd() && this.peek().t !== 'NL') this.next();
  }

  parseFunctionDef() {
    this.assertKeyword('def');
    const name = this.expectIdent();
    this.expectPunct('(');
    const params = [];
    while (!this.isPunct(')')) {
      const pname = this.expectIdent();
      this.b.ensureVariable(pname, 'Number');
      params.push({ name: pname });
      if (!this.isPunct(')')) this.expectPunct(',');
    }
    this.expectPunct(')');
    this.assertOp(':');
    const body = this.parseBlock();
    return { name, ret: 'Number', params, body };
  }

  // Questa e' la parte delicata: "parseBlock" fa avanzare finche' non
  // incontra una riga con un'indentazione minore o uguale => il blocco e'
  // finito. L'indentazione e' derivata dai token NL+spazi, quindi si puo'
  // testare in node senza browser traducendo la sorgente in un array di
  // righe e confrontando i livelli.
  parseBlock() {
    this.consumeNewline();
    const level = this.currentIndent();
    const stmts = [];
    while (!this.atEnd()) {
      if (this.peek().t === 'NL') { this.next(); continue; }
      if (this.currentIndent() <= level) break;
      stmts.push(...this.parseStatement());
    }
    return stmts;
  }

  consumeNewline() {
    if (this.peek().t === 'NL') this.next();
  }

  // restituisce gli spazi iniziali della riga corrente (il tokenizer
  // mangia gli spazi, quindi dobbiamo guardare indietro alla source).
  currentIndent() {
    // Riga corrente: pos so's alla source originale.
  }

  parseStatement() {
    const t = this.peek();
    if (t.t === 'IDENT') {
      const kw = t.value;
      if (kw === 'print') { this.next(); this.expectPunct('('); const e = this.parseExpression(); this.expectPunct(')'); return [this.b.block('write', {}, { VALUE: { block: this.toExprBlock(e) } })]; }
      if (kw === 'input') { this.next(); this.expectPunct('('); this.expectPunct(')'); this.err('input(senza assegnamento) non ancora supportato: usa x = input());'); }
      if (kw === 'if') return this.parseStatement();
    }
    this.err('istruzione non riconosciuta');
  }

  // ... continua
}