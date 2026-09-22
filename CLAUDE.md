# CLAUDE.md

Contesto di progetto per Claude Code. Il codice non esiste ancora: questo repository
parte vuoto. Leggi anche @README.md (visione del progetto) e @docs/SPEC.md (requisiti
funzionali dettagliati) e @docs/ROADMAP.md (fasi di sviluppo) prima di scrivere codice.

Se il lavoro riguarda le estensioni successive alla Fase 1 (tipi di dato, stringhe,
vettori, funzioni, profili/funzionalità attivabili, versionamento dei file), leggi
prima `docs/DECISIONI-ESTENSIONI.md`: raccoglie decisioni già prese, proposte e
questioni aperte, da non rimettere in discussione senza motivo.

## Il tuo compito

Progettare e costruire da zero l'applicazione descritta in `docs/SPEC.md`, a partire
dalla Fase 1 di `docs/ROADMAP.md`. **Non sono state prese decisioni architetturali a
priori** oltre ai vincoli elencati sotto: struttura delle cartelle, eventuale
framework/build tool, organizzazione dei file sono decisioni tue.

Prima di scrivere codice per la Fase 1, proponi brevemente:
- la struttura di cartelle/file che intendi usare e perché,
- se userai un bundler/build step o resterai su file statici serviti direttamente,
  motivando la scelta rispetto al vincolo "deve restare apribile/eseguibile senza
  installazioni complesse in laboratorio scolastico".

Poi procedi.

## Vincoli non negoziabili

- **Tutto client-side.** Nessun backend richiesto per la funzione principale
  (comporre blocchi → vedere pseudocodice/C/Python). Se in una fase successiva serve
  persistenza reale (account, dati condivisi tra sessioni sul server), è una
  decisione da proporre esplicitamente, non da introdurre di default.
- **Editor a blocchi**, non testo libero né solo diagramma di flusso: connessioni
  tipizzate che impediscono combinazioni sintatticamente illogiche (è il motivo per
  cui i blocchi sono stati scelti al posto di un flowchart libero — vedi
  `docs/SPEC.md` per il ragionamento completo).
- **Tre output testuali sempre sincronizzati** dallo stesso modello di programma:
  pseudocodice, C, Python. Devono restare semanticamente equivalenti tra loro: se un
  costrutto cambia comportamento in un output, deve cambiare coerentemente negli
  altri due.
- **Target: studenti senza esperienza di programmazione testuale.** In caso di
  dubbio tra una soluzione tecnicamente più elegante e una più leggibile/comprensibile
  per uno studente di terza superiore, preferisci la seconda.

## Come lavorare in questo progetto

- Fasi piccole e verificabili: costruisci la Fase 1 della roadmap fino in fondo
  (utilizzabile e testabile) prima di iniziare la Fase 2, anche se in questa sessione
  arrivi a coprire più fasi.
- Quando aggiungi un nuovo costrutto (nuovo tipo di blocco), verifica sempre che sia
  gestito in tutti e tre i generatori di output (pseudocodice/C/Python) — non lasciare
  un costrutto supportato solo in uno o due linguaggi senza segnalarlo esplicitamente.
- Lo stile dello pseudocodice non è fissato in modo rigido nella spec (vedi
  `docs/SPEC.md`): puoi proporre una convenzione coerente, ma tienila facilmente
  configurabile/modificabile, perché verrà probabilmente adattata al libro di testo
  della classe.
