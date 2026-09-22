// Parser C -> stato workspace Blockly.
//
// Converte un sottoinsieme didattico di C nel formato JSON di
// persistence.js (workspaceState), la stessa via di caricamento di
// main.js. E' ingegnerizzato per la simmetria con i generatori: i
// costrutti supportati corrispondono esattamente a quelli emessi da
// src/codegen/c.js, quindi "esporta C -> importa C" e' un round-trip.
//
// Sottoinsieme: int/bool/char, dichiarazioni, assegnazione, ++/--,
// printf/scanf, if/else, while, do-while, for, break, continue, return,
// funzioni, array v[i], operatori, letterali, commenti.

import { BlockBuilder } from './block-builder.js';

export function tokenize(code) {
  const tokens = [];
  let pos = 0;
  const re = /\s+|(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|(#[^\n]*)|(0[xX][0-9a-fA-F]+)|(\d+)|([A-Za-z_][A-Za-z0-9_]*)|('(?:\\[^]|[^'\\])*')|("(?:\\[^]|[^"\\])*")|(\+\+|--|<=|>=|==|!=|&&|\|\||[=+\-*\/%<>!&|])|([(){}\[\];,])/g;
  const isPunct = (s) => /^[(){}\[\];,]$/.test(s);
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[0].length === 0) break;
    if (m[1] || m[2] || m[3] || /^\s+$/.test(m[0])) continue;
    const val = m[0];
    if (isPunct(val)) tokens.push({ type: 'PUNCT', value: val, pos });
    else if (/^\d+$/.test(val)) tokens.push({ type: 'NUMBER', value: val, pos });
    else if (/^0[xX]/.test(val)) tokens.push({ type: 'NUMBER', value: String(parseInt(val, 16)), pos });
    else if (/^[A-Za-z_]/.test(val)) tokens.push({ type: 'IDENT', value: val, pos });
    else if (val.startsWith("'")) tokens.push({ type: 'CHAR', value: parseCharLit(val), pos });
    else if (val.startsWith('"')) tokens.push({ type: 'STRING', value: parseStrLit(val), pos });
    else tokens.push({ type: 'OP', value: val, pos });
    pos = re.lastIndex;
  }
  tokens.push({ type: 'EOF', value: '', pos });
  return tokens;
}

function parseCharLit(v) {
  const inner = v.slice(1, -1);
  if (inner.startsWith('\\')) {
    const map = { n: '\n', t: '\t', '\\': '\\', "'": "'", '"': '"', '0': '\0' };
    return map[inner[1]] !== undefined ? map[inner[1]] : inner[1];
  }
  return inner;
}
export const TYPE_MAP = { int: 'Number', bool: 'Boolean', char: 'String' };
function parseStrLit(v) {
  const inner = v.slice(1, -1);
  const map = { n: '\n', t: '\t', '\\': '\\', "'": "'", '"': '"' };
  return inner.replace(/\\(.)/g, (_, c) => (map[c] !== undefined ? map[c] : c));
}

// Estrae solo il "testo informativo" da una stringa di formato printf
// (elimina %d, %s, %c e i caratteri di fuga): la reintroduzione del formato
// è regola del generatore, non va duplicata nel blocco. Il write/printf
// generato aggiunge sempre il suo "\\n" finale, quindi i newline finali vanno
// rimossi qui: altrimenti ogni round-trip ne accumulerebbe uno in piu'.
function trimFormat(s) {
  return s
    .replace(/%[dsfc]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\r/g, ' ')
    .trim();
}

export class CParser {
  constructor(code) {
    this.tokens = tokenize(code);
    this.pos = 0;
    this.b = new BlockBuilder();
  }

  peek() { return this.tokens[this.pos]; }
  next() { return this.tokens[this.pos++]; }
  atEnd() { return this.peek().type === 'EOF'; }
  isOp(op) { return this.peek().type === 'OP' && this.peek().value === op; }
  isPunct(p) { return this.peek().type === 'PUNCT' && this.peek().value === p; }
  isIdent(v) { return this.peek().type === 'IDENT' && (v === undefined || this.peek().value === v); }

  expectOp(op) { if (!this.isOp(op)) this.fail(`atteso "${op}"`); return this.next(); }
  expectPunct(p) { if (!this.isPunct(p)) this.fail(`atteso "${p}"`); return this.next(); }
  expectIdent() { if (!this.isIdent()) this.fail('atteso identificatore'); return this.next().value; }
  fail(msg) {
    const t = this.peek();
    throw new Error(`Errore di parsing C a posizione ${t.pos ?? '?'}: ${msg} (trovato "${t.value || t.type}")`);
  }

  // === entrypoint ========================================================
  parse() {
    const funcs = [];
    while (!this.atEnd()) funcs.push(this.parseFunction());
    if (!funcs.length) this.fail('nessuna funzione');
    const mainIdx = funcs.findIndex((f) => f.name === 'main');
    if (mainIdx === -1) this.fail('manca main()');
    const main = funcs[mainIdx];
    const others = funcs.filter((_, i) => i !== mainIdx);

    const ws = this.b.toWorkspace();
    ws.blocks.blocks.push(this.b.block('program', {}, { BODY: this.b.chain(main.body) }));
    for (const f of others) {
      const paramsChain = this.b.chain(
        f.params.map((p) => this.b.block('param_decl', { NAME: p.name, TYPE: p.type === 'Boolean' ? 'Boolean' : 'Number' }, {}))
      );
      ws.blocks.blocks.push(this.b.block(
        'function_def',
        { NAME: f.name, RETURN_TYPE: f.ret },
        { PARAMS: paramsChain, BODY: this.b.chain(f.body) }
      ));
    }
    return ws;
  }

  parseFunction() {
    const ret = (this.peek().type === 'IDENT' && (this.peek().value in TYPE_MAP || this.peek().value === 'void')) ? this.next().value : 'int';
    const name = this.expectIdent();
    this.expectPunct('(');
    const params = [];
    while (!this.isPunct(')')) {
      const ptype = (this.peek().type === 'IDENT' && this.peek().value in TYPE_MAP) ? this.next().value : 'int';
      const pname = this.expectIdent();
      if (pname === 'void') { /* firma main(void) */ }
      else { this.b.ensureVariable(pname, TYPE_MAP[ptype]); params.push({ name: pname, type: TYPE_MAP[ptype] }); }
      if (!this.isPunct(')')) this.expectPunct(',');
    }
    this.expectPunct(')');
    const body = this.parseCompound();
    return { ret: (TYPE_MAP[ret] || (ret === 'void' ? 'Void' : 'Number')), name, body, params };
  }

  parseCompound() {
    this.expectPunct('{');
    const stmts = [];
    while (!this.isPunct('}') && !this.atEnd()) stmts.push(...this.parseStatement());
    this.expectPunct('}');
    return stmts;
  }

  // === statements =======================================================
  parseStatement() {
    const t = this.peek();
    if (t.type === 'PUNCT' && t.value === '{') return this.parseCompound();
    if (t.type === 'IDENT') {
      const kw = t.value;
      if (kw === 'if') return this.parseIf();
      if (kw === 'else') this.fail('else senza if');
      if (kw === 'while') return this.parseWhile();
      if (kw === 'do') return this.parseDoWhile();
      if (kw === 'for') return this.parseFor();
      if (kw === 'break') { this.next(); this.expectPunct(';'); return [this.b.block('controls_break')]; }
      if (kw === 'continue') { this.next(); this.expectPunct(';'); return [this.b.block('controls_continue')]; }
      if (kw === 'return') {
        this.next();
        const value = this.isPunct(';') ? null : this.parseExpression();
        this.expectPunct(';');
        return [this.b.block('return_statement', {}, value ? { VALUE: { block: this.toExprBlock(value) } } : {})];
      }
      if (kw === 'printf') return this.parsePrintf();
      if (kw === 'scanf') return this.parseScanf();
      if (kw in TYPE_MAP) return this.parseDeclaration();
    }
    const stmts = this.exprToStatement(this.parseExpression());
    this.expectPunct(';');
    return stmts;
  }

  parsePrintf() { return this.parseIo('write'); }
  parseScanf() { return this.parseIo('read'); }

  parseIo(kind) {
    this.next(); // printf/scanf
    this.expectPunct('(');
    const args = [];
    while (!this.isPunct(')')) { args.push(this.parseExpression()); if (!this.isPunct(')')) this.expectPunct(','); }
    this.expectPunct(')');
    this.expectPunct(';');
    if (kind === 'read') {
      // scanf("%d", &var) -> read
      const target = args[1];
      if (!target || target.kind !== 'var') this.fail('scanf: attesa variabile');
      return [this.b.block('read', { VAR: this.b.varField(target.name) })];
    }
    // printf: testo con eventuale %d
    let value;
    if (args.length === 1 && args[0].kind === 'str') {
      // I newline finali li aggiunge sempre il generatore come "\\n" di riga:
      // rimuoverli evita che ogni round-trip ne accumuli uno in piu'.
      value = this.b.block('string_literal', { TEXT: args[0].v.replace(/\n+$/, '') });
    } else if (args.length >= 1 && args[0].kind === 'str') {
      const textB = this.b.block('string_literal', { TEXT: trimFormat(args[0].v) });
      const exprB = this.toExprBlock(args[1]);
      value = this.b.block('string_concat', {}, { A: textB, B: exprB });
    } else {
      value = this.toExprBlock(args[0]);
    }
    return [this.b.block('write', {}, { VALUE: { block: value } })];
  }

  parseDeclaration() {
    const typeTok = this.next().value;
    const type = TYPE_MAP[typeTok];
    const blocks = [];
    while (true) {
      const name = this.expectIdent();
      if (this.isPunct('[')) {
        this.next();
        const size = this.isPunct(']') ? null : this.parseExpression();
        this.expectPunct(']');
        this.b.ensureVariable(name, 'Array');
        blocks.push(this.b.block(
          'array_decl', { VAR: this.b.varField(name) },
          size ? { SIZE: { block: this.toExprBlock(size) } } : {}
        ));
      } else {
        this.b.ensureVariable(name, type);
        if (this.isOp('=')) {
          this.next();
          const value = this.toExprBlock(this.parseExpression());
          blocks.push(this.b.block('assign', { VAR: this.b.varField(name) }, { VALUE: { block: value } }));
        } else {
          blocks.push(this.b.block('var_decl', { VAR: this.b.varField(name), TYPE: type }));
        }
      }
      if (this.isPunct(';')) { this.next(); break; }
      this.expectPunct(',');
    }
    return blocks;
  }

  parseIf() {
    this.next();
    this.expectPunct('(');
    const cond = { block: this.toExprBlock(this.parseExpression()) };
    this.expectPunct(')');
    const thenStmts = this.parseStatement();
    let elseStmts = [];
    if (this.isIdent('else')) { this.next(); elseStmts = this.parseStatement(); }
    const thenChain = this.b.chain(thenStmts);
    const elseChain = this.b.chain(elseStmts);
    if (elseStmts.length) {
      return [this.b.block('controls_if_else', {}, { COND: cond, THEN: thenChain, ELSE: elseChain })];
    }
    return [this.b.block('controls_if_simple', {}, { COND: cond, THEN: thenChain })];
  }

  parseWhile() {
    this.next();
    this.expectPunct('(');
    const cond = { block: this.toExprBlock(this.parseExpression()) };
    this.expectPunct(')');
    const body = this.b.chain(this.parseStatement());
    return [this.b.block('controls_while', {}, { COND: cond, BODY: body })];
  }

  parseDoWhile() {
    this.next();
    const body = this.b.chain(this.parseStatement());
    if (!this.isIdent('while')) this.fail('atteso while dopo do');
    this.next();
    this.expectPunct('(');
    const cond = { block: this.toExprBlock(this.parseExpression()) };
    this.expectPunct(')');
    this.expectPunct(';');
    return [this.b.block('controls_do_while', {}, { BODY: body, COND: cond })];
  }

  parseFor() {
    this.next();
    this.expectPunct('(');
    let init = [];
    if (!this.isPunct(';')) {
      if (this.peek().type === 'IDENT' && this.peek().value in TYPE_MAP) {
        init = this.parseForInitDecl();
      } else {
        init = this.exprToStatement(this.parseExpression());
      }
    }
    this.expectPunct(';');
    let cond = null;
    if (!this.isPunct(';')) cond = this.toExprBlock(this.parseExpression());
    this.expectPunct(';');
    let update = [];
    if (!this.isPunct(')')) update = this.exprToStatement(this.parseExpression());
    this.expectPunct(')');
    const body = this.b.chain(this.parseStatement());

    // pattern for (i = from; i <= to; i++) -> controls_for_simple
    if (init.length === 1 && update.length === 1 && cond) {
      const assignVar = isAssignedVar(init[0]);
      const updVar = isIncrementedVar(update[0]);
      const cmpVar = isCompareVarOn(cond);
      // controls_for_simple e' inclusivo (loop "da FROM a TO" con <=, come il
      // blocco didattico); il C "i < to" NON va quindi collassato qui, altrimenti
      // un'iterazione in piu' sarebbe eseguita (es. vet[i] per i==to sfora).
      // Solo "i <= to" ha la stessa semantica.
      if (assignVar && updVar && cmpVar && assignVar === updVar && assignVar === cmpVar && cond.fields.OP === 'LTE') {
        return [this.b.block('controls_for_simple', {
          VAR: init[0].fields.VAR,
        }, {
          FROM: init[0].inputs.VALUE.block,
          TO: cond.inputs.B.block,
          BODY: body,
        })];
      }
    }
    return [this.b.block('controls_for_expr', {}, {
      INIT: init.length ? init[0] : null,
      COND: cond ? { block: cond } : null,
      UPDATE: update.length ? update[0] : null,
      BODY: body,
    })];
  }

  // "int i = 5" dentro il for (senza punto e virgola)
  parseForInitDecl() {
    const typeTok = this.next().value;
    const type = TYPE_MAP[typeTok];
    const name = this.expectIdent();
    this.b.ensureVariable(name, type);
    if (this.isOp('=')) {
      this.next();
      const value = this.toExprBlock(this.parseExpression());
      return [this.b.block('assign', { VAR: this.b.varField(name) }, { VALUE: { block: value } })];
    }
    return [this.b.block('var_decl', { VAR: this.b.varField(name), TYPE: type })];
  }

  // === espressioni (AST) ================================================
  parseExpression() {
    const lhs = this.parseOr();
    if (this.isOp('=')) {
      this.next();
      const rhs = this.parseExpression();
      if (lhs.kind === 'var') return { kind: 'assign', name: lhs.name, value: rhs };
      if (lhs.kind === 'index') return { kind: 'assign_index', var: lhs.var, idx: lhs.idx, value: rhs };
      this.err('assegnazione non valida');
    }
    return lhs;
  }
  parseOr() {
    let l = this.parseAnd();
    while (this.isOp('||')) { this.next(); const r = this.parseAnd(); l = { kind: 'logic', OP: 'OR', a: l, b: r }; }
    return l;
  }
  parseAnd() {
    let l = this.parseEq();
    while (this.isOp('&&')) { this.next(); const r = this.parseEq(); l = { kind: 'logic', OP: 'AND', a: l, b: r }; }
    return l;
  }
  parseEq() {
    let l = this.parseRel();
    while (this.isOp('==') || this.isOp('!=')) { const op = this.next().value; const r = this.parseRel(); l = { kind: 'compare', OP: (op === '==' ? 'EQ' : 'NEQ'), a: l, b: r }; }
    return l;
  }
  parseRel() {
    let l = this.parseAdd();
    while (this.isOp('<') || this.isOp('<=') || this.isOp('>') || this.isOp('>=')) {
      const op = this.next().value; const r = this.parseAdd();
      l = { kind: 'compare', OP: { '<': 'LT', '<=': 'LTE', '>': 'GT', '>=': 'GTE' }[op], a: l, b: r };
    }
    return l;
  }
  parseAdd() {
    let l = this.parseMul();
    while (this.isOp('+') || this.isOp('-')) { const op = this.next().value; const r = this.parseMul(); l = { kind: 'arith', OP: (op === '+' ? 'ADD' : 'SUB'), a: l, b: r }; }
    return l;
  }
  parseMul() {
    let l = this.parseUnary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) { const op = this.next().value; const r = this.parseUnary(); l = { kind: 'arith', OP: { '*': 'MUL', '/': 'DIV', '%': 'MOD' }[op], a: l, b: r }; }
    return l;
  }
  parseUnary() {
    if (this.isOp('!')) { this.next(); return { kind: 'not', a: this.parseUnary() }; }
    if (this.isOp('&')) { this.next(); return this.parseUnary(); }
    if (this.isOp('-')) { this.next(); const b = this.parseUnary(); return { kind: 'arith', OP: 'SUB', a: { kind: 'num', v: 0 }, b }; }
    if (this.isOp('+')) { this.next(); return this.parseUnary(); }
    return this.parsePostfix();
  }
  parsePostfix() {
    let e = this.parsePrimary();
    for (;;) {
      if (this.isOp('++') || this.isOp('--')) {
        const op = this.next().value;
        e = (op === '++' ? { kind: 'incr', name: e.name } : { kind: 'decr', name: e.name });
      } else if (this.isPunct('[')) {
        this.next();
        const idx = this.parseExpression();
        this.expectPunct(']');
        e = { kind: 'index', var: e, idx };
      } else if (this.isPunct('(')) {
        this.next();
        const args = [];
        while (!this.isPunct(')')) { args.push(this.parseExpression()); if (!this.isPunct(')')) this.expectPunct(','); }
        this.expectPunct(')');
        e = { kind: 'call', name: e.name, args };
      } else break;
    }
    return e;
  }
  parsePrimary() {
    const t = this.peek();
    if (t.type === 'NUMBER') { this.next(); return { kind: 'num', v: t.value }; }
    if (t.type === 'CHAR') { this.next(); return { kind: 'char', v: t.value }; }
    if (t.type === 'STRING') { this.next(); return { kind: 'str', v: t.value }; }
    if (t.type === 'IDENT') {
      const name = this.next().value;
      if (name === 'true') return { kind: 'bool', v: true };
      if (name === 'false') return { kind: 'bool', v: false };
      return { kind: 'var', name };
    }
    if (this.isPunct('(')) { this.next(); const e = this.parseExpression(); this.expectPunct(')'); return e; }
    this.err('token inatteso in espressione');
  }

  // === AST -> blocchi ===================================================
  toExprBlock(expr) {
    if (!expr) return null;
    switch (expr.kind) {
      case 'num': return this.b.block('number_literal', { VALUE: Number(expr.v) });
      case 'char':
      case 'str': return this.b.block('string_literal', { TEXT: expr.v });
      case 'bool': return this.b.block('bool_literal', { VALUE: expr.v ? 'TRUE' : 'FALSE' });
      case 'var': {
        const vid = this.b.ensureVariable(expr.name);
        return this.b.block('variable_get', { VAR: { id: vid } });
      }
      case 'incr':
      case 'decr': {
        const vid = this.b.ensureVariable(expr.name);
        return this.b.block(expr.kind === 'incr' ? 'incr_expr' : 'decr_expr', { VAR: { id: vid } });
      }
      case 'index':
        return this.b.block('array_get', {}, {
          ARRAY: this.toExprBlock(expr.var), INDEX: this.toExprBlock(expr.idx),
        });
      case 'arith':
        return this.b.block('arith_op', { OP: expr.OP }, { A: this.toExprBlock(expr.a), B: this.toExprBlock(expr.b) });
      case 'compare':
        return this.b.block('compare_op', { OP: expr.OP }, { A: this.toExprBlock(expr.a), B: this.toExprBlock(expr.b) });
      case 'logic':
        return this.b.block('logic_op', { OP: expr.OP }, { A: this.toExprBlock(expr.a), B: this.toExprBlock(expr.b) });
      case 'not':
        return this.b.block('not_op', {}, { A: this.toExprBlock(expr.a) });
      case 'call': {
        const argBlocks = expr.args.map((a) => this.b.block('function_arg', {}, { VALUE: { block: this.toExprBlock(a) } }));
        return this.b.block('function_call', { NAME: expr.name }, { ARGS: { block: this.b.chain(argBlocks) } });
      }
      default:
        throw new Error(`nodo espressione non supportato: ${expr.kind}`);
    }
  }

  exprToStatement(expr) {
    if (expr.kind === 'assign') {
      return [this.b.block('assign', { VAR: this.b.varField(expr.name) }, { VALUE: { block: this.toExprBlock(expr.value) } })];
    }
    if (expr.kind === 'assign_index') {
      return [this.b.block('array_set', {}, {
        ARRAY: this.toExprBlock(expr.var),
        INDEX: this.toExprBlock(expr.idx),
        VALUE: this.toExprBlock(expr.value),
      })];
    }
    if (expr.kind === 'incr') {
      return [this.b.block('incr_decr', { OP: 'INC' }, { VAR: { block: this.b.block('variable_get', { VAR: { id: this.b.ensureVariable(expr.name) } }) } })];
    }
    if (expr.kind === 'decr') {
      return [this.b.block('incr_decr', { OP: 'DEC' }, { VAR: { block: this.b.block('variable_get', { VAR: { id: this.b.ensureVariable(expr.name) } }) } })];
    }
    if (expr.kind === 'call') {
      const argBlocks = expr.args.map((a) => this.b.block('function_arg', {}, { VALUE: { block: this.toExprBlock(a) } }));
      return [this.b.block('call_statement', { NAME: expr.name }, { ARGS: { block: this.b.chain(argBlocks) } })];
    }
    // espressione pura come istruzione: rifiuta tranquillamente
    throw new Error('espressione non utilizzabile come istruzione');
  }

  // === costruzione dei blocchi raccolta =================================
  varFieldForName(name) {
    return this.b.varField(name);
  }

  err(msg) { const t = this.peek(); throw new Error(`Errore di parsing C: ${msg} (trovato "${t.value || t.type}")`); }
}

// Helpers di riconoscimento per il "for contatore".
function isAssignedVar(block) {
  if (!block || block.type !== 'assign') return null;
  return block.fields && block.fields.VAR ? block.fields.VAR.id : null;
}
function isIncrementedVar(block) {
  if (!block || block.type !== 'incr_decr') return null;
  if (block.fields && block.fields.OP === 'DEC') return null;
  const inner = block.inputs && block.inputs.VAR && block.inputs.VAR.block;
  if (!inner || inner.type !== 'variable_get') return null;
  return inner.fields.VAR ? inner.fields.VAR.id : null;
}
function isCompareVarOn(condBlock) {
  if (!condBlock || condBlock.type !== 'compare_op') return null;
  const inner = condBlock.inputs && condBlock.inputs.A && condBlock.inputs.A.block;
  if (!inner || inner.type !== 'variable_get') return null;
  return inner.fields.VAR ? inner.fields.VAR.id : null;
}