// Helper per costruire lo stato di workspace Blockly (JSON di serializzazione)
// da un AST, mantenendo lo stesso formato di persistence.js.
let uidCounter = 0;

export function genUid(prefix) {
  uidCounter += 1;
  return `${prefix || 'b'}_${uidCounter}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export class BlockBuilder {
  constructor() {
    this.variables = [];
    this.varIndex = new Map();
  }

  declareVariable(name, type) {
    const id = genUid('var');
    const entry = { name, id };
    if (type) entry.type = type;
    this.variables.push(entry);
    this.varIndex.set(name, id);
    return id;
  }

  ensureVariable(name, type) {
    if (this.varIndex.has(name)) return this.varIndex.get(name);
    return this.declareVariable(name, type);
  }

  varField(name, type) {
    if (!this.varIndex.has(name)) this.declareVariable(name, type);
    return { id: this.varIndex.get(name) };
  }

  block(type, fields = {}, inputs = {}, extra = {}) {
    const b = { type, id: genUid(), fields: {}, inputs: {} };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined && v !== null) b.fields[k] = v;
    }
    for (const [k, v] of Object.entries(inputs)) {
      if (v !== undefined && v !== null) {
        const chain = this._chain(v);
        if (chain) b.inputs[k] = chain;
      }
    }
    if (extra.x !== undefined) b.x = extra.x;
    if (extra.y !== undefined) b.y = extra.y;
    return b;
  }

  _chain(value) {
    if (Array.isArray(value)) {
      // value = [first, next, next...] costruisce la catena next
      if (!value.length) return null;
      const [first, ...rest] = value;
      const root = this._chain(first);
      let cur = root.block || root.shadow;
      for (const item of rest) {
        const ch = this._chain(item);
        if (cur) cur.next = ch;
        cur = ch && (ch.block || ch.shadow);
      }
      return root;
    }
    if (value && typeof value === 'object' && value.block) {
      return { block: value.block };
    }
    if (value && typeof value === 'object' && value.shadow) {
      return { shadow: value.shadow };
    }
    if (value && typeof value === 'object' && typeof value.type === 'string') {
      // blocco grezzo
      return { block: value };
    }
    return null;
  }

  chain(stmts) {
    if (!stmts || !stmts.length) return null;
    const first = stmts[0];
    for (let i = 0; i < stmts.length - 1; i++) {
      stmts[i].next = { block: stmts[i + 1] };
    }
    return first;
  }

  toWorkspace() {
    return {
      blocks: { languageVersion: 0, blocks: [] },
      variables: this.variables,
    };
  }
}
