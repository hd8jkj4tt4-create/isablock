# Decisioni e opzioni sulle estensioni (dopo la Fase 1)

Documento di lavoro, redatto il 2026-09-19 dopo una discussione sulle estensioni
elencate in `ROADMAP.md` (Fase 3). Serve da punto di partenza quando si riprenderà il
discorso. Non è una specifica: distingue ciò che è **deciso**, ciò che è solo
**proposto** e ciò che è **aperto**.

Le estensioni si introducono solo dopo la validazione in classe della Fase 1 (vedi
`ROADMAP.md`) e solo se l'uso reale ne conferma il bisogno.

## Stato in sintesi

| Argomento | Stato |
|---|---|
| Float | **Escluso** (decisione presa) |
| Ordine di lavoro: booleani, stringhe, vettori, funzioni | **Deciso** come ordine desiderato |
| Booleani | Proposta dettagliata, da confermare |
| Stringhe | Orientamento: immutabili; livello B da decidere in base agli esercizi |
| Vettori | Proposta dettagliata, da confermare |
| Funzioni/procedure | Solo analisi; scelte di progetto da fare |
| Profili base/avanzato | Proposta: un solo codice con profili; da confermare |
| Login istituzionale | Futuro; predisporre solo una struttura, nessun backend ora |
| Versione app e versione formato file | **Fatto** (commit 9117438, vedi "Versionamento e configurazione") |
| Tag/numero di versione "vero" | **Rimandato** a dopo la validazione in classe |

## Punto di partenza tecnico (com'è oggi)

Tutto il sistema assume che ogni variabile sia un intero:
- ogni input dei blocchi ha `check: 'Number'` (`src/blocks/blocks.js`);
- il generatore C dichiara tutte le variabili `int` e usa `scanf("%d")` / `printf("%d")`;
- il generatore Python fa sempre `int(input())`;
- l'interprete (`src/runtime/interpreter.js`) inizializza le variabili a `0`;
- le espressioni booleane esistono ma non si possono salvare in una variabile
  (`assign` e `variable_get` lavorano solo su `Number`).

Nota preesistente: C dichiara `int a, b;` senza inizializzare (valore indefinito),
mentre l'interprete assume `0` per le variabili non assegnate. È già oggi una piccola
divergenza; con vettori e testi diventa più visibile. Proposta: inizializzare a 0 in C.

## Lavoro comune a tutte le estensioni sui tipi

1. **Dare un tipo alla variabile.** Blockly supporta variabili tipizzate; serve una UI
   per sceglierlo alla creazione.
2. **Inferenza del tipo di un'espressione in fase di generazione.** Oggi non esiste e
   non serve. Con più tipi serve per scegliere il formato di stampa in C e per
   `SCRIVI`.
3. **Dichiarazioni raggruppate per tipo in C** e una sezione dichiarazioni nello
   pseudocodice (oggi assente).
4. **Blocchi distinti per tipo**, non blocchi polimorfi (già indicato in `SPEC.md`).
5. **File salvati:** i vecchi restano leggibili (variabili senza tipo = intero); un
   file nuovo aperto in un'app vecchia si rompe. Vedi la sezione sul versionamento.
6. **Colorazione sintattica** (`src/codegen/highlight.js`): parole chiave nuove da
   aggiungere (da verificare quando si implementa).
7. **Test:** oggi non ci sono test automatici. Serve almeno un controllo che generi i
   tre output di un insieme di programmi campione e li confronti con risultati
   attesi (vedi "Test" in fondo).

## Float — escluso

Deciso di non introdurli. Effetto collaterale utile: con soli `int`, booleani e testo i
formati di stampa restano `%d` e `%s`, senza dover fissare un formato numerico comune
tra C, Python e interprete (in C `%f` stampa `3.500000`, in Python `3.5`).

Per memoria, se un giorno servissero: divisione reale vs intera, `mod` in C richiede
`fmod`/`math.h`, confronto di uguaglianza tra float, regola di promozione int→float,
interprete JS che non distingue int da float.

## Booleani

Le espressioni booleane esistono già; manca poter salvarle in una variabile.

**Proposta**
- Variabili booleane (blocco `variable_get` che restituisce `Boolean`, o blocco
  separato per tipo); `assign` accetta `Boolean` quando la variabile è booleana.
- C: `#include <stdbool.h>` e `bool`. Oggi `vero`/`falso` si traducono in `1`/`0` e già
  funzionano; Python `True`/`False`.
- Valore iniziale definito (falso), coerente nei tre output e nell'interprete.
- **Stampa:** `SCRIVI` di un booleano darebbe `1` in C e `True` in Python. Da unificare,
  per esempio `vero`/`falso` in tutti e tre (ternario in C e in Python).
- È il punto in cui si introduce l'**inferenza del tipo delle espressioni**, che le
  stringhe riusano subito.
- Vantaggio didattico: variabili "flag" (es. `primo ← vero` nella verifica di
  primalità).

Costo stimato: basso.

## Stringhe

**Orientamento (da confermare):** stringhe **immutabili**. Non servono tutte le
possibilità di manipolazione: lo scopo didattico è scrivere messaggi ("Inserisci una
parola") e, se serve, leggere una parola.

Due livelli:

- **Livello A — solo letterali di testo in `SCRIVI`.** Nessuna variabile di testo. Un
  blocco "testo" accettato da `SCRIVI`; in C `printf("%s\n", "...")`, in Python
  `print("...")`. Costo quasi nullo dopo l'inferenza dei tipi introdotta con i
  booleani. Si può fare insieme ai booleani.
- **Livello B — leggere una parola in una variabile.** Variabili di testo che ricevono
  un valore tramite `LEGGI` **oppure tramite assegnazione di un letterale o di
  un'altra variabile testo** (`parola ← "ciao"`, `parola2 ← parola1`); ammessi anche
  `SCRIVI parola` e il confronto `=` / `≠`. Niente concatenazione, lunghezza, accesso
  ai caratteri: l'assegnazione copia sempre l'intero valore in un colpo solo, non
  riapre i problemi (mutabilità, costruzione pezzo per pezzo) che l'immutabilità
  voleva evitare — per questo è stata ammessa nonostante inizialmente esclusa insieme
  al resto. Copre password, "come ti chiami", uguaglianza di due parole, messaggi
  costruiti da valori fissi. **Da decidere in base agli esercizi reali** (l'utente ha
  ancora da pensarci se implementare il livello B).

  *(Nota del 2026-09-22: l'esclusione iniziale dell'assegnazione non aveva una
  motivazione tecnica registrata, a differenza per esempio dei float — era stata
  raggruppata per minimalismo insieme a concatenazione/lunghezza/accesso ai
  caratteri. Riesaminata: tecnicamente equivalente a `LEGGI` (scrittura dell'intero
  buffer), quindi ammessa per coerenza con l'assegnazione numerica già esistente.)*

**Perché l'immutabilità aiuta:** niente `strcpy`/`strcat`; sparisce il problema della
concatenazione come istruzione (in C non è un'espressione) e dell'aliasing; sparisce la
divergenza di `strlen` con le lettere accentate (byte vs caratteri); le stringhe si
passano alle funzioni in sicurezza (`const char *` in C, `str` in Python).

**Non riusare l'infrastruttura dei vettori.** Si era considerato di modellare la
stringa come array di `char`, ma non regge: in Python la stringa è immutabile e non è
una lista; l'elemento sarebbe un `char` in C e una stringa di un carattere in Python
(un terzo tipo); la lunghezza è variabile. Con le stringhe immutabili la capacità è una
costante uguale per tutte le variabili di testo (per es. 100), quindi non serve la
finestra "nome + dimensione". Le stringhe dipendono solo da: tipo sulle variabili e
inferenza del tipo delle espressioni. Questo è ciò che permette l'ordine deciso
(booleani → stringhe → vettori).

**Blocchi distinti** (livello B): `LEGGI testo`, variabile di testo,
`testo ← "letterale"` / `testo ← testo`, `testo = testo`, separati dai blocchi
numerici.

**Punti tecnici da risolvere (livello B e letterali)**
- Escape nei letterali (virgolette, backslash, `%`) in C e Python; virgolette visibili
  nello pseudocodice.
- Accenti/UTF-8: la stampa funziona (sono byte) se il sorgente è UTF-8; da dire nella
  guida.
- Lettura: `scanf("%s")` si ferma allo spazio, `input()` legge la riga. Proposta in C:
  `scanf(" %99[^\n]", parola)`. Se l'input supera la capacità C tronca e Python no:
  l'interprete deve segnalare l'errore, oppure la capacità va scelta larga e
  documentata.
- **A capo dopo `SCRIVI`:** un messaggio come "Inserisci un numero: " si scrive di norma
  senza a capo. Proposta: spunta "senza a capo" sul blocco `SCRIVI`
  (`printf("%s", ...)` / `print(..., end="")`). **Aperto:** tocca anche interprete e
  console.
- Ordinamento `<`/`>` tra stringhe: fuori dal primo giro.

Costo stimato: livello A basso, livello B medio.

## Vettori

**Solo vettori di interi.** Niente vettori di stringhe (eviterebbero le matrici di
`char`, la parte più pesante del C). Niente matrici.

**Proposta**
- **Dichiarazione:** la dimensione è una proprietà **della variabile**, scelta alla
  creazione (finestra "crea vettore": nome + dimensione), non un blocco-istruzione
  nella sequenza. Un blocco dichiarazione potrebbe finire dentro un ciclo: Python lo
  riazzererebbe a ogni giro, mentre un `int v[10]` in C dentro le graffe non sarebbe
  visibile fuori. Con la dimensione sulla variabile, C dichiara `int v[10] = {0};` in
  cima a `main` e Python inizializza con `[0] * N` a inizio programma.
- **Dimensione: numero letterale fisso**, non espressione (in C sarebbe un array a
  lunghezza variabile).
- **Blocchi nuovi:** `v[i]` (espressione, restituisce `Number`), `v[i] ← espressione`
  (istruzione, separata da `assign`), `LEGGI v[i]`, e opzionale "lunghezza di v" (in C
  la costante `N`, in Python `len(v)`).
- **Filtro dei menu variabili per tipo** (`variableTypes` di Blockly): un vettore non
  deve poter comparire in `assign`, `variable_get`, `PER`, `LEGGI` scalari.
- **Indice base 0 in tutti e tre gli output** (`PER i DA 0 A n-1`), da dire nella guida.
  Convertire da base 1 nel generatore (`v[i-1]`) produce codice illeggibile. Se un libro
  usa base 1 sarebbe un'opzione con effetto su tutti e tre gli output.
- **Indici fuori limiti (divergenza più seria):** in C è comportamento indefinito; in
  Python `v[10]` dà errore ma `v[-1]` è valido. L'interprete deve segnalare l'errore
  "indice fuori dai limiti" in entrambi i casi.
- Inizializzazione a zero in tutti gli output (vedi nota su C nel punto di partenza).

Sblocca algoritmi da manuale: massimo e ricerca lineare su un vettore, inversione,
somma, media, bubble/selection sort.

Costo stimato: medio.

## Funzioni e procedure

**Solo analisi, nessuna scelta finale.** È il cambiamento più profondo: tocca la
struttura del programma.

- **Struttura:** oggi c'è un solo blocco `program`. Servono più blocchi di primo
  livello: definizione (nome, parametri, eventuale ritorno), chiamata (istruzione per le
  procedure, espressione per le funzioni), `RESTITUISCI`. I generatori emettono le
  definizioni prima di `main` (C: prima di `main` o con prototipi). Il Blockly in
  `vendor/blockly/` contiene solo `blockly_compressed.js`, senza i blocchi di procedura
  predefiniti: vanno scritti a mano o aggiunti.
- **Scope delle variabili (proposta):** tutte le variabili **locali** alla propria
  funzione; dati in ingresso solo tramite parametri, in uscita tramite valore di
  ritorno; **passaggio per valore**. Il passaggio per riferimento non ha equivalente
  pulito in Python. Oggi lo scope è unico e globale, quindi serve un modello con scope
  (Blockly non lo dà gratis). Senza questa regola C e Python divergono (in Python
  assegnare dentro una funzione crea una locale, in C modifica la globale).
- **Interprete:** `evalExpression` oggi è sincrona; una chiamata in un'espressione
  deve eseguire istruzioni che fanno `yield` (passo-passo, `LEGGI`), quindi va
  riscritta come generatore (`yield*`). Serve uno stack di chiamate con una mappa di
  variabili per frame e un meccanismo di `return`. La ricorsione arriva gratis e va
  gestita (il tetto `MAX_STEPS` la ferma, con messaggio adatto). L'evidenziazione
  passo-passo deve "entrare" nella funzione.
- **Editor:** chiamate come menu a tendina con i nomi delle funzioni esistenti;
  rinominare/eliminare una funzione deve aggiornare o segnalare le chiamate pendenti;
  categoria dinamica nella tavolozza; definizioni non annidabili.
- **Interazione con i tipi:** in C ogni funzione ha tipo di ritorno e tipi dei
  parametri; se si fanno prima le funzioni solo su interi, l'estensione ai tipi
  richiede di rivedere le firme.
- **Interazione con i vettori:** un vettore passato a una funzione è per riferimento in
  C e in Python (coincidono), mentre gli scalari sono per valore; lo studente deve
  capire la differenza; in C serve passare anche la lunghezza. È un motivo per fare i
  vettori prima delle funzioni.
- **Interazione con le stringhe immutabili:** passaggio sicuro (vedi sopra).

Costo stimato: alto.

## Ordine di lavoro

Ordine desiderato dall'utente: **booleani → stringhe → vettori → funzioni**, senza float.

Si era proposto di invertire stringhe e vettori per riusare l'infrastruttura, ma la
proposta è decaduta: con stringhe immutabili e capacità costante le stringhe non
dipendono dai vettori (vedi sopra). Il passo iniziale comune è: tipo sulle variabili +
inferenza del tipo delle espressioni, introdotto con i booleani.

## Profili base/avanzato (funzionalità attivabili)

**Proposta: un solo codice, con profili**, non due versioni separate (due rami
significherebbero generatori, interprete ed editor duplicati e destinati a divergere).

- Principio: le funzionalità limitano **cosa lo studente può creare**, non **cosa il
  motore capisce**. Blocchi, generatori e interprete gestiscono sempre tutto; il
  profilo filtra la tavolozza (`src/blocks/toolbox.js` è già un dato), i tipi offerti
  alla creazione delle variabili e gli eventuali pulsanti.
- In `src/app-config.js`: un elenco di funzionalità (booleani, testo, vettori,
  funzioni) e i profili come **insiemi con nome di funzionalità**, per poter definire
  anche livelli intermedi senza cambiare il codice. Le dipendenze vanno note al sistema
  (i vettori richiedono l'infrastruttura dei tipi): si pensa a livelli progressivi più
  che a scelta libera di singole voci.
- **Vincolo:** il profilo base deve produrre output identici a oggi. Le novità
  compaiono solo quando servono (sezione dichiarazioni e tipi in C solo se esistono
  variabili di quel tipo). Da verificare con un controllo automatico che confronti i
  tre output dei cinque esempi prima e dopo.
- La tavolozza va organizzata per funzionalità fin dall'inizio.
- **Come si sceglie il profilo (oggi):** parametro nell'indirizzo (`?profilo=base`),
  base come predefinito. Alternative scartate per ora: selettore nell'interfaccia
  (lo studente può cambiarlo), indirizzi diversi sullo stesso deploy (più rigido, più
  lavoro nello script di pubblicazione).
- Si sposa con la validazione in classe: la base resta il profilo validato e
  predefinito; l'avanzata si prova in parallelo con un link a parte.

**Aperto:** cosa fare di un file che contiene funzionalità non abilitate nel profilo
corrente. Opzioni: (a) aprirlo comunque (i blocchi sono sempre registrati e
funzionano) con un avviso; (b) rifiutarlo con un messaggio ("usa funzionalità non
abilitate in questo profilo"). La (b) richiede che il file dichiari le funzionalità che
usa. Preferenza espressa nella discussione: (a), ma dipende da quanto il profilo deve
essere vincolante.

## Login istituzionale (futuro)

Se in futuro servirà un account istituzionale per monitorare i progressi, il profilo
non potrà più venire dall'indirizzo (lo studente lo cambierebbe): diventerà un
attributo **della classe o dell'assegnazione**, deciso dal docente e restituito dal
server al login, con possibilità di sblocco progressivo durante l'anno.

**Predisposizione da fare ora, senza backend:**
- una sola funzione `resolveProfile()` (oggi legge l'indirizzo o il predefinito,
  domani chiederà al server);
- profili come elenchi di nomi di funzionalità (il server può restituire direttamente
  l'elenco);
- funzionalità organizzate una per una nella tavolozza.

**Da tenere presente**
- Il backend è una **decisione da proporre esplicitamente** (vincolo in `CLAUDE.md`):
  è un salto architetturale, probabilmente con OIDC (Google Workspace / Microsoft 365).
- Il filtro lato interfaccia è un aiuto didattico, non una protezione: tutto gira nel
  browser. Un vero "modo verifica" richiederebbe un controllo anche lato server.
- Il monitoraggio implica salvare i progetti sul server: il formato del file diventa lo
  schema di dati persistenti; `formatVersion` e l'elenco delle funzionalità usate
  servono a migrare i dati e a sapere quale profilo ha prodotto ogni lavoro.
- Studenti minorenni: obblighi di privacy (GDPR, informativa, minimizzazione); da
  coinvolgere la scuola.
- Il README chiede un uso possibile offline: tenere una modalità "ospite" locale (base
  come profilo) che continua a funzionare senza login.

## Versionamento e configurazione

**Fatto** (commit `9117438`, realizzato in un'altra sessione). Stato attuale:

- `src/app-config.js` (in coerenza con `src/pseudocode-config.js`): modulo JS con
  oggetto congelato `appConfig`, oggi `version: '0.1.0'` e `fileFormatVersion: 1`.
  Contiene solo valori dell'applicazione; le convenzioni dello pseudocodice restano
  separate. Altri valori fissi (per es. `MAX_STEPS`, nome file predefinito) non sono
  stati spostati: si spostano quando serve. Ospiterà in seguito funzionalità e profili.
- Il piè di pagina (`index.html`) mostra la versione in un `<span id="appVersion">`
  che `main.js` compila da `appConfig.version`: una sola fonte.
- `src/persistence.js`: i file salvati contengono `formatVersion` **e** `appVersion`
  (quest'ultima solo informativa, mai usata per decidere), **accanto alle chiavi di
  Blockly**, senza contenitore. Un file senza `formatVersion` (salvato prima) è
  trattato come formato 1; un file con `formatVersion` maggiore di quello supportato
  è rifiutato con un `FileFormatError` dal messaggio chiaro, e il controllo avviene
  **prima** di `workspace.clear()`, quindi il lavoro in corso non si perde.
- Nello stesso commit è stata aggiunta anche la scelta del nome al salvataggio
  (selettore "Salva con nome" dove il browser lo supporta), non prevista qui.
- Non ancora fatto: l'elenco delle funzionalità usate nel file (serve solo se si
  sceglie di rifiutare i file con funzionalità non abilitate nel profilo, vedi
  "Profili").
- Due numeri distinti perché cambiano con frequenza diversa: la versione dell'app sale a
  ogni rilascio, il formato solo quando un file nuovo non è più leggibile da un'app
  vecchia (o viceversa).

**Rimandato:** tag git (es. `v1.0.0` o `v0.9.0`), release su GitHub, scelta del numero
"vero". Si decide dopo la validazione in classe, così la base da fissare è più solida.
Le estensioni sarebbero poi `v1.1.0`, `v1.2.0`…, oppure `v2.0.0` se il formato dei file
cambia in modo incompatibile.

**Flusso di lavoro consigliato:** `scripts/publish-rel.sh` porta in `rel` tutto ciò che
è su `main`. Le estensioni vanno sviluppate su un branch a parte e portate in `main` a
lavoro finito, così `main` e il sito pubblicato restano nella versione stabile.

## Test

Nel repository non ci sono test automatici. Prima delle estensioni conviene aggiungere
un controllo minimo: generare i tre output (pseudocodice, C, Python) di un insieme di
programmi campione (i cinque esempi precaricati come base) e confrontarli con risultati
attesi. Serve a due cose: garantire che il profilo base resti identico a oggi, e
intercettare le divergenze tra i tre output che le estensioni tendono a introdurre
(indici, inizializzazione, formato di stampa, scope).

## Import da codice (blocchi ← C/Python) — fatto per C

Realizzato il percorso inverso **C → blocchi**: incollando codice C si ottengono i
blocchi corrispondenti e i tre output si rigenerano (pseudocodice, C, Python). I blocchi
così ottenuti sono gli stessi dell'editor, quindi il modello resta unico e l'export resta
coerente (round-trip stabile testato sia in headless sia nel browser reale).

Decisioni prese (2026-09-23):

- **Parser dedicati, fuori dai generatori.** `src/parsers/c-to-blocks.js` e
  `src/parsers/python-to-blocks.js` sono moduli separati (oggi usati da `src/main.js`,
  scheda "Importa"). Il parser C è completo per i costrutti della Fase 1; il parser
  Python è **abbozzato** (fanno parsing ma non trattano tutte le combinazioni) e va
  completato se si vuole l'import Python.
- **Minimalismo: un solo round-trip affidabile.** Dato che l'utente ha chiesto "solo C
  per ora", il parser Python è incluso solo quanto basta a non rompere l'avvio
  (è importato staticamente da `main.js`), non come funzione completa. Per collegare le
  variabili ai blocchi `variable_get` si `varField` per nome: Blockly 13 richiede
  `variableMap.getVariable(nome, tipo)` con **entrambi** gli argomenti.
- **Semantica dei cicli `for` conservata all'import.** `controls_for_simple` di Blockly è
  **inclusivo** (`<=`, stile "da 1 a N"); al round-trip viene usato soltanto per
  condizioni `<=`. Una condizione `<` resta un blocco `controls_for_expr` generico,
  altrimenti l'ultima iterazione cambierebbe (off-by-one).
- **`printf("solo testo")`**: il testo si conserva senza a-capo finali; l'interprete
  appende il proprio `\n`. I `\n`/`\t`/virgolette reali dentro i letterali vengono
  riscopati (`esc`) per non far saltare il round-trip.
- **Output atteso vs proprio**: import è un aiuto di editing, non un garante di identità
  testuale; il criterio di stabilità è la **convergenza** (seconda rigenerazione uguale
  alla terza), non l'uguaglianza col sorgente originale (le dichiarazioni multi-variabile
  `int n, i;` si spezzano in blocchi `var_decl` distinti la prima volta e poi restano
  stabili).

## Questioni aperte (riepilogo)

1. Stringhe: si resta al livello A (solo messaggi) o serve il livello B (leggere
   parole)? Dipende dagli esercizi che il docente vuole proporre.
2. Spunta "senza a capo" su `SCRIVI`: sì/no, e come si comporta la console.
3. Vettori: conferma di indice base 0 e di dimensione letterale fissa.
4. Funzioni: conferma di scope locale + passaggio per valore, e se partire dai soli
   interi.
5. Profili: conferma del parametro nell'indirizzo come meccanismo iniziale; cosa fare
   dei file con funzionalità non abilitate.
6. Inizializzare a 0 anche le variabili scalari in C (divergenza preesistente).
7. Numero di versione "vero" e tag, dopo la validazione in classe.
