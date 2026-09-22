import { registerBlocks } from './blocks/blocks.js';
import { toolbox } from './blocks/toolbox.js';
import { createPseudocodeGenerator } from './codegen/pseudocode.js';
import { createCGenerator } from './codegen/c.js';
import { createPythonGenerator } from './codegen/python.js';
import { extractSourceMap } from './codegen/common.js';
import { tokenizePseudocode, tokenizeC, tokenizePython } from './codegen/highlight.js';
import { pseudocodeConfig } from './pseudocode-config.js';
import { appConfig } from './app-config.js';
import { saveWorkspaceToFile, saveWorkspaceWithPicker, hasNativeSavePicker, loadWorkspaceFromFile, FileFormatError } from './persistence.js';
import { examples } from './examples.js';
import { runProgram, ExecutionError } from './runtime/interpreter.js';

const Blockly = window.Blockly;

registerBlocks(Blockly);

const workspace = Blockly.inject('blocklyDiv', {
  toolbox,
  trashcan: true,
  zoom: { controls: true, wheel: true, startScale: 1 },
  move: { scrollbars: true, drag: true, wheel: false },
});

const pseudocodeGen = createPseudocodeGenerator(Blockly, pseudocodeConfig);
const cGen = createCGenerator(Blockly, pseudocodeConfig);
const pythonGen = createPythonGenerator(Blockly, pseudocodeConfig);

// Attiva la source map blocco->testo (vedi src/codegen/common.js): serve a
// evidenziare la riga corrispondente al blocco in esecuzione, senza mai
// eseguire il testo generato.
pseudocodeGen.sourceMap = true;
cGen.sourceMap = true;
pythonGen.sourceMap = true;

const outputPseudocode = document.getElementById('outputPseudocode');
const outputC = document.getElementById('outputC');
const outputPython = document.getElementById('outputPython');

// Testo pulito e mappa blockId -> {start, end} per ciascun output,
// ricalcolati ad ogni modifica del workspace; usati sia per la
// visualizzazione normale sia per l'evidenziazione durante l'esecuzione.
let outputTexts = { pseudocode: '', c: '', python: '' };
let sourceMaps = { pseudocode: new Map(), c: new Map(), python: new Map() };

// Token di colorazione sintattica per ciascun output, ricalcolati insieme
// al testo (vedi updateOutputs): array di {start, end, type} nello stesso
// sistema di offset della source map, cosi' i due si possono fondere in
// renderCodePanel senza doversi rincorrere.
let tokenMaps = { pseudocode: [], c: [], python: [] };

// blockId attualmente in esecuzione (null quando non si sta eseguendo):
// e' lo stato condiviso che lega l'evidenziazione dei blocchi Blockly a
// quella dei tre pannelli di codice, indipendentemente da quale scheda e'
// aperta in un dato momento.
let currentBlockId = null;

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// Restituisce l'HTML di text.slice(from, to), con gli span di colorazione
// sintattica applicati (ritagliati sul segmento se un token ne straborda).
// Usata sia per il testo "a riposo" sia per le due meta' del pannello in
// esecuzione, ai due lati del <mark> — vedi renderCodePanel.
function renderSegment(text, tokens, from, to) {
  let html = '';
  let pos = from;
  for (const token of tokens) {
    const start = Math.max(token.start, from);
    const end = Math.min(token.end, to);
    if (start >= end) continue;
    if (start > pos) html += escapeHtml(text.slice(pos, start));
    html += `<span class="tok-${token.type}">${escapeHtml(text.slice(start, end))}</span>`;
    pos = end;
  }
  if (pos < to) html += escapeHtml(text.slice(pos, to));
  return html;
}

function renderCodePanel(el, text, tokens, range) {
  if (!range) {
    el.innerHTML = renderSegment(text, tokens, 0, text.length);
    return;
  }
  el.innerHTML =
    renderSegment(text, tokens, 0, range.start) +
    `<mark class="exec-highlight">${renderSegment(text, tokens, range.start, range.end)}</mark>` +
    renderSegment(text, tokens, range.end, text.length);
  el.querySelector('.exec-highlight').scrollIntoView({ block: 'nearest' });
}

function renderAllPanels() {
  renderCodePanel(outputPseudocode, outputTexts.pseudocode, tokenMaps.pseudocode, currentBlockId && sourceMaps.pseudocode.get(currentBlockId));
  renderCodePanel(outputC, outputTexts.c, tokenMaps.c, currentBlockId && sourceMaps.c.get(currentBlockId));
  renderCodePanel(outputPython, outputTexts.python, tokenMaps.python, currentBlockId && sourceMaps.python.get(currentBlockId));
}

function updateOutputs() {
  const pseudo = extractSourceMap(pseudocodeGen.workspaceToCode(workspace));
  const c = extractSourceMap(cGen.workspaceToCode(workspace));
  const python = extractSourceMap(pythonGen.workspaceToCode(workspace));
  outputTexts = { pseudocode: pseudo.text, c: c.text, python: python.text };
  sourceMaps = { pseudocode: pseudo.ranges, c: c.ranges, python: python.ranges };
  tokenMaps = {
    pseudocode: tokenizePseudocode(pseudo.text, pseudocodeConfig),
    c: tokenizeC(c.text),
    python: tokenizePython(python.text),
  };
  renderAllPanels();
}

// Il blocco "program" e' il contenitore fisso (INIZIO/FINE) richiesto
// dalla specifica: ne esiste sempre esattamente una copia, non spostabile
// ne' cancellabile, e non compare nella tavolozza cosi' lo studente non
// puo' crearne altre copie. I flag deletable/movable non sopravvivono
// alla serializzazione, quindi vanno riapplicati dopo ogni caricamento.
function enforceProgramBlock() {
  const programBlocks = workspace.getTopBlocks(false).filter((b) => b.type === 'program');
  if (programBlocks.length === 0) {
    const block = workspace.newBlock('program');
    block.initSvg();
    block.render();
    block.moveBy(40, 40);
    programBlocks.push(block);
  }
  for (const block of programBlocks) {
    block.setDeletable(false);
    block.setMovable(false);
    block.contextMenu = false;
  }
}

let debounceTimer = null;
function scheduleUpdate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateOutputs, 250);
}

workspace.addChangeListener((event) => {
  if (event.isUiEvent) return;
  scheduleUpdate();
});

enforceProgramBlock();
updateOutputs();

// --- Notifica toast ------------------------------------------------------
const toast = document.getElementById('toast');
let toastTimer = null;
function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// --- Modale di benvenuto (solo al primo utilizzo) -------------------------
const welcomeModal = document.getElementById('welcomeModal');
const WELCOME_SEEN_KEY = 'isablock-welcome-seen';
try {
  if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) {
    welcomeModal.hidden = false;
  }
} catch {
  // Storage non disponibile (es. navigazione privata): non e' grave,
  // semplicemente la modale potrebbe ricomparire ad ogni visita.
}
document.getElementById('welcomeAcceptBtn').addEventListener('click', () => {
  welcomeModal.hidden = true;
  try {
    window.localStorage.setItem(WELCOME_SEEN_KEY, '1');
  } catch {
    // vedi sopra
  }
});

// --- Guida rapida (riapribile in qualsiasi momento, a differenza della
// modale di benvenuto che compare solo al primo utilizzo) --------------
const helpModal = document.getElementById('helpModal');
function openHelp() {
  helpModal.hidden = false;
}
function closeHelp() {
  helpModal.hidden = true;
}
document.getElementById('btnHelp').addEventListener('click', openHelp);
document.getElementById('helpCloseBtn').addEventListener('click', closeHelp);
document.getElementById('helpCloseBtn2').addEventListener('click', closeHelp);
helpModal.addEventListener('click', (event) => {
  if (event.target === helpModal) closeHelp();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !helpModal.hidden) closeHelp();
});

// La versione ha una sola fonte (app-config.js): il piè di pagina la legge da lì.
document.getElementById('appVersion').textContent = appConfig.version;

// --- Barra dei comandi ------------------------------------------------
document.getElementById('btnNew').addEventListener('click', () => {
  if (!window.confirm('Cancellare il programma corrente e ricominciare da zero?')) return;
  workspace.clear();
  enforceProgramBlock();
  updateOutputs();
  showToast('Nuovo programma creato', 'success');
});

// Nome proposto per il file: lo stesso per selettore nativo e per il ripiego.
const DEFAULT_FILE_NAME = 'programma-a-blocchi';

function saveWithPrompt() {
  // prompt() funziona in tutti i browser: è il ripiego dove manca il
  // selettore nativo, ed è coerente con i confirm() degli altri comandi.
  const answer = window.prompt('Con che nome vuoi salvare il programma?', DEFAULT_FILE_NAME);
  if (answer === null) return; // Annulla: nessun salvataggio
  // Via i caratteri non ammessi nei nomi di file e l'eventuale .json già digitato.
  const name = answer.trim().replace(/\.json$/i, '').replace(/[\\/:*?"<>|]/g, '-');
  saveWorkspaceToFile(Blockly, workspace, `${name || DEFAULT_FILE_NAME}.json`);
  showToast('Programma salvato', 'success');
}

document.getElementById('btnSave').addEventListener('click', async () => {
  if (hasNativeSavePicker) {
    try {
      const saved = await saveWorkspaceWithPicker(Blockly, workspace, `${DEFAULT_FILE_NAME}.json`);
      if (saved) showToast('Programma salvato', 'success');
      return;
    } catch {
      // Selettore non utilizzabile (es. contesto non sicuro): ripiego sul nome.
    }
  }
  saveWithPrompt();
});

const fileInput = document.getElementById('fileInput');
document.getElementById('btnLoad').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  fileInput.value = '';
  if (!file) return;
  loadWorkspaceFromFile(Blockly, workspace, file)
    .then(() => {
      enforceProgramBlock();
      updateOutputs();
      showToast('Programma caricato', 'success');
    })
    .catch((err) => {
      showToast(err instanceof FileFormatError ? err.message : 'Il file scelto non è un programma valido', 'error');
    });
});

// --- Tab di output e pulsanti "Copia" ----------------------------------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.code-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.querySelector(`.code-panel[data-tab="${btn.dataset.tab}"]`).classList.add('active');
  });
});

import { CParser } from './parsers/c-to-blocks.js';
import { PythonParser } from './parsers/python-to-blocks.js';

document.getElementById('btnImport').addEventListener('click', () => {
  const lang = document.getElementById('importLang').value;
  const code = document.getElementById('importCode').value;
  try {
    let ws;
    if (lang === 'c') {
      ws = new CParser(code).parse();
    } else {
      ws = new PythonParser(code).parse();
    }
    workspace.clear();
    Blockly.serialization.workspaces.load(ws, workspace);
    enforceProgramBlock();
    updateOutputs();
    showToast('Codice importato in blocchi', 'success');
  } catch (e) {
    showToast('Errore nell\'importazione: ' + e.message, 'error');
  }
});

document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const text = document.getElementById(btn.dataset.copyTarget).textContent;
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copiato!';
      setTimeout(() => {
        btn.textContent = original;
      }, 1200);
    });
  });
});

const exampleSelect = document.getElementById('exampleSelect');
for (const example of examples) {
  const option = document.createElement('option');
  option.value = example.id;
  option.textContent = example.title;
  exampleSelect.appendChild(option);
}
exampleSelect.addEventListener('change', () => {
  const example = examples.find((e) => e.id === exampleSelect.value);
  exampleSelect.value = '';
  if (!example) return;
  if (!window.confirm(`Caricare l’esempio "${example.title}"? Il programma corrente andrà perso.`)) return;
  workspace.clear();
  Blockly.serialization.workspaces.load(example.workspaceState, workspace);
  enforceProgramBlock();
  updateOutputs();
  showToast(`Esempio "${example.title}" caricato`, 'success');
});

// --- Esecuzione a blocchi -------------------------------------------------
// L'unico "motore" che gira davvero e' l'interprete (src/runtime/interpreter.js),
// che cammina l'albero di blocchi. I tre pannelli di codice non vengono mai
// eseguiti: si limitano a evidenziare, tramite la source map, la porzione di
// testo che corrisponde al blockId corrente - lo stesso stato condiviso da
// cui dipende anche l'evidenziazione del blocco nel canvas Blockly.
const btnRun = document.getElementById('btnRun');
const btnStep = document.getElementById('btnStep');
const btnStop = document.getElementById('btnStop');
const execStatus = document.getElementById('execStatus');
const blocklyDiv = document.getElementById('blocklyDiv');
const runStrip = document.getElementById('runStrip');
const runSplitter = document.getElementById('runSplitter');
const runStripClose = document.getElementById('runStripClose');
const runConsole = document.getElementById('runConsole');
const runInputForm = document.getElementById('runInputForm');
const runInputField = document.getElementById('runInputField');
const execSpeedSelect = document.getElementById('execSpeed');

let runStepDelayMs = Number(execSpeedSelect.value);
execSpeedSelect.addEventListener('change', () => {
  runStepDelayMs = Number(execSpeedSelect.value);
});

let execGenerator = null;
let execRunning = false; // true = esecuzione continua ("Esegui"), false = passo singolo o in pausa
let execTimer = null;
let resumeRunningAfterInput = false; // execRunning da ripristinare dopo un LEGGI in attesa
let awaitingInput = false; // in attesa di un valore per un blocco LEGGI

function appendConsoleLine(text, className) {
  const line = document.createElement('div');
  line.className = className ? `run-line ${className}` : 'run-line';
  line.textContent = text;
  runConsole.appendChild(line);
  runConsole.scrollTop = runConsole.scrollHeight;
}

function setWorkspaceLocked(locked) {
  blocklyDiv.classList.toggle('exec-locked', locked);
  document.getElementById('btnNew').disabled = locked;
  document.getElementById('btnLoad').disabled = locked;
  exampleSelect.disabled = locked;
}

function updateExecButtons() {
  const active = execGenerator !== null;
  btnStop.disabled = !active;
  // In esecuzione continua, o mentre si aspetta un valore da LEGGI, i due
  // comandi "manuali" restano disabilitati: durante l'attesa di un LEGGI
  // l'unico modo per proseguire e' fornire il valore (altrimenti
  // generator.next() riprenderebbe con un valore mancante).
  btnRun.disabled = active && (execRunning || awaitingInput);
  btnStep.disabled = active && (execRunning || awaitingInput);
  // Il pannello si chiude solo a esecuzione ferma (terminata/interrotta):
  // mentre gira, specialmente in attesa di un LEGGI, non ha senso poterlo
  // nascondere.
  runStripClose.disabled = active;
}

function stopExecution(statusText) {
  clearTimeout(execTimer);
  execGenerator = null;
  execRunning = false;
  awaitingInput = false;
  currentBlockId = null;
  workspace.highlightBlock(null);
  renderAllPanels();
  runInputForm.hidden = true;
  setWorkspaceLocked(false);
  execStatus.textContent = statusText || 'Pronto';
  updateExecButtons();
}

function startExecution() {
  const programBlock = workspace.getTopBlocks(false).find((b) => b.type === 'program');
  if (!programBlock) return;
  runStrip.hidden = false;
  runSplitter.hidden = false;
  runConsole.innerHTML = '';
  runInputForm.hidden = true;
  const io = {
    stepCount: 0,
    onOutput: (value) => appendConsoleLine(String(value), 'run-output'),
  };
  execGenerator = runProgram(programBlock, io);
  setWorkspaceLocked(true);
}

// Fa avanzare l'interprete di un passo (un solo yield). inputValue viene
// passato a generator.next(...) per sbloccare un LEGGI in attesa.
function advance(inputValue) {
  let result;
  try {
    result = execGenerator.next(inputValue);
  } catch (err) {
    if (!(err instanceof ExecutionError)) throw err;
    appendConsoleLine(err.message, 'run-error');
    showToast(err.message, 'error');
    stopExecution('Interrotto');
    return;
  }

  if (result.done) {
    stopExecution('Esecuzione terminata');
    return;
  }

  const event = result.value;
  currentBlockId = event.blockId;
  workspace.highlightBlock(event.blockId);
  renderAllPanels();

  if (event.awaitingInput) {
    resumeRunningAfterInput = execRunning;
    execRunning = false;
    awaitingInput = true;
    execStatus.textContent = 'In attesa di un valore da LEGGI…';
    runInputForm.hidden = false;
    runInputField.value = '';
    runInputField.focus();
    updateExecButtons();
    return;
  }

  runInputForm.hidden = true;
  if (execRunning) {
    execStatus.textContent = 'In esecuzione…';
    execTimer = setTimeout(() => advance(), runStepDelayMs);
  } else {
    execStatus.textContent = 'In pausa — Passo per continuare';
  }
  updateExecButtons();
}

btnRun.addEventListener('click', () => {
  execRunning = true;
  if (!execGenerator) startExecution();
  advance();
});

btnStep.addEventListener('click', () => {
  execRunning = false;
  if (!execGenerator) startExecution();
  advance();
});

btnStop.addEventListener('click', () => stopExecution());

runStripClose.addEventListener('click', () => {
  runStrip.hidden = true;
  runSplitter.hidden = true;
});

runInputForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const raw = runInputField.value.trim();
  if (!/^-?\d+$/.test(raw)) {
    showToast('Inserisci un numero intero', 'error');
    return;
  }
  appendConsoleLine(`LEGGI → ${raw}`, 'run-input');
  runInputForm.hidden = true;
  awaitingInput = false;
  execRunning = resumeRunningAfterInput;
  advance(parseInt(raw, 10));
});

// --- Scorciatoie da tastiera per l'esecuzione ---------------------------
// Invio/Spazio/Esc richiamano semplicemente il click dei bottoni
// corrispondenti: rispettano quindi automaticamente lo stato "disabled"
// (un click su un bottone disabilitato non genera l'evento 'click').
// Vanno pero' ignorate mentre si sta scrivendo da qualche parte (campo
// LEGGI, rinominare una variabile, modificare un commento, un altro
// bottone con il focus) o mentre e' aperto un modale. Esc fa eccezione:
// e' una convenzione universale di "annulla" che non confligge mai con la
// digitazione (a differenza di Spazio/Invio), quindi resta attiva anche
// dentro al campo LEGGI.
function shouldIgnoreShortcut(target) {
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return true;
  // Un bottone diverso dai tre di esecuzione: rispetta la sua attivazione
  // nativa con Invio/Spazio invece di dirottarla su Esegui (es. il focus
  // resta su "Guida" dopo un Tab, Invio deve attivare "Guida", non Esegui).
  // I tre bottoni dell'esecuzione restano invece sempre attivi: dopo un
  // click su "Passo" il focus vi resta sopra, e le scorciatoie devono
  // continuare a funzionare.
  if (tag === 'BUTTON' && target !== btnRun && target !== btnStep && target !== btnStop) return true;
  return false;
}

document.addEventListener('keydown', (event) => {
  if (!welcomeModal.hidden || !helpModal.hidden) return;
  if (event.key === 'Escape') {
    btnStop.click();
    return;
  }
  if (shouldIgnoreShortcut(event.target)) return;
  switch (event.key) {
    case ' ':
      event.preventDefault(); // altrimenti Spazio scorre la pagina
      btnStep.click();
      break;
    case 'Enter':
      event.preventDefault();
      btnRun.click();
      break;
    default:
      break;
  }
});

// --- Ridimensionamento manuale dei pannelli ------------------------------
// Due separatori trascinabili, attivi solo in vista desktop: la vista
// mobile (sotto i 900px, vedi style.css) impila i pannelli con altezze
// fisse pensate per lo schermo piccolo, dove trascinare col dito e' piu'
// scomodo che utile (vedi .splitter { display: none } nella media query).
const workspaceArea = document.querySelector('.workspace-area');
const outputsPanel = document.querySelector('.outputs');
const blocksSplitter = document.getElementById('blocksSplitter');
const desktopLayout = window.matchMedia('(min-width: 901px)');

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setBlocksWidth(px) {
  const min = 260;
  const max = workspaceArea.getBoundingClientRect().width - 260 - blocksSplitter.getBoundingClientRect().width;
  blocklyDiv.style.flex = `0 0 ${clamp(px, min, max)}px`;
  Blockly.svgResize(workspace);
}

function setRunStripHeight(px) {
  const min = 120;
  const max = outputsPanel.getBoundingClientRect().height - 160;
  runStrip.style.height = `${clamp(px, min, max)}px`;
}

// Blockly si ridisegna da solo al resize della window, non del suo div:
// senza la chiamata esplicita a svgResize() dentro setBlocksWidth() l'area
// blocchi resterebbe congelata con viewport/scrollbar vecchi dopo un
// trascinamento.

// Gestisce il ciclo di vita del trascinamento (pointer capture cosi' il
// movimento resta tracciato anche fuori dai bordi sottili del separatore,
// classe .dragging per il feedback visivo, doppio click per tornare alle
// proporzioni di default).
function enableSplitterDrag(splitter, getStart, onMove, onReset) {
  splitter.addEventListener('pointerdown', (event) => {
    if (!desktopLayout.matches) return;
    event.preventDefault();
    splitter.setPointerCapture(event.pointerId);
    splitter.classList.add('dragging');
    document.body.style.userSelect = 'none';
    const start = getStart(event);
    function move(moveEvent) {
      onMove(moveEvent, start);
    }
    function end() {
      splitter.classList.remove('dragging');
      document.body.style.userSelect = '';
      splitter.removeEventListener('pointermove', move);
      splitter.removeEventListener('pointerup', end);
      splitter.removeEventListener('pointercancel', end);
    }
    splitter.addEventListener('pointermove', move);
    splitter.addEventListener('pointerup', end);
    splitter.addEventListener('pointercancel', end);
  });
  splitter.addEventListener('dblclick', onReset);
}

enableSplitterDrag(
  blocksSplitter,
  (event) => ({ x: event.clientX, width: blocklyDiv.getBoundingClientRect().width }),
  (event, start) => setBlocksWidth(start.width + (event.clientX - start.x)),
  () => {
    blocklyDiv.style.flex = '';
    Blockly.svgResize(workspace);
  },
);

enableSplitterDrag(
  runSplitter,
  (event) => ({ y: event.clientY, height: runStrip.getBoundingClientRect().height }),
  (event, start) => setRunStripHeight(start.height - (event.clientY - start.y)),
  () => {
    runStrip.style.height = '';
  },
);

// Frecce per chi naviga da tastiera (i separatori sono role="separator"
// focusabili), Home riporta alle proporzioni di default.
blocksSplitter.addEventListener('keydown', (event) => {
  if (!desktopLayout.matches) return;
  const step = 24;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    setBlocksWidth(blocklyDiv.getBoundingClientRect().width - step);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    setBlocksWidth(blocklyDiv.getBoundingClientRect().width + step);
  } else if (event.key === 'Home') {
    event.preventDefault();
    blocklyDiv.style.flex = '';
    Blockly.svgResize(workspace);
  }
});

runSplitter.addEventListener('keydown', (event) => {
  if (!desktopLayout.matches) return;
  const step = 24;
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setRunStripHeight(runStrip.getBoundingClientRect().height + step);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    setRunStripHeight(runStrip.getBoundingClientRect().height - step);
  } else if (event.key === 'Home') {
    event.preventDefault();
    runStrip.style.height = '';
  }
});

// Un ridimensionamento fatto in vista desktop lascerebbe uno stile inline
// stantio se la finestra si restringe sotto i 900px: in colonna il "flex"
// usato per la larghezza dell'area blocchi diventerebbe un'altezza,
// scavalcando i 55vh pensati per il layout mobile. Si azzera quindi ogni
// override al passaggio sotto la soglia, cosi' tornano i valori da CSS.
desktopLayout.addEventListener('change', (event) => {
  if (!event.matches) {
    blocklyDiv.style.flex = '';
    runStrip.style.height = '';
  }
});
