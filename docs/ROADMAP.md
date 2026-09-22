# Roadmap

## Fase 1 — Editor a blocchi con tre output sincronizzati

**Stato: implementata.** Tutti e cinque gli algoritmi di esempio sono disponibili
come esempi precaricati nello strumento, ora con commenti esplicativi nei punti
chiave (oltre al costrutto minimo richiesto, è stato aggiunto "ripeti N volte" —
vedi `SPEC.md`). Salvataggio/caricamento locale presente. Aggiunta anche
un'esecuzione passo-passo del programma a blocchi (tasti Esegui/Passo, richiamabili
anche da tastiera, a velocità regolabile, con la console di input/output in una
striscia fissa sotto il codice), che evidenzia in tempo reale sia il blocco attivo
sia la riga corrispondente — colorata sintatticamente — in ciascuno dei tre output:
esegue il modello a blocchi, non il testo generato — non è quindi in contraddizione
con "Cosa NON deve fare" in `README.md`, che riguarda l'esecuzione reale di C/Python.
La colorazione sintattica dei tre output (parole chiave, numeri, commenti,
stringhe/funzioni di libreria) legge anch'essa il testo già generato: non introduce
una quarta implementazione indipendente da tenere sincronizzata con i tre
generatori. Completano l'usabilità in laboratorio una guida rapida richiamabile in
ogni momento e pannelli ridimensionabili in vista desktop. Prima di iniziare la
Fase 2, resta da validare l'uso in classe come indicato sotto.

Obiettivo: uno strumento usabile in classe che copre tutti i costrutti elencati in
`SPEC.md`, con pseudocodice/C/Python generati in tempo reale dallo stesso algoritmo.

Criterio di "fatto": un docente può comporre a blocchi ciascuno dei cinque algoritmi
di esempio citati in `SPEC.md` (massimo/minimo, somma di una sequenza, ricerca
lineare, fattoriale, verifica di primalità elementare) e ottenere pseudocodice, C e
Python corretti e coerenti tra loro per ognuno.

Include anche, come requisiti minimi di usabilità in laboratorio:
- salvataggio/caricamento locale del lavoro (vedi SPEC.md, sezione Persistenza)
- almeno un esempio precaricato, per far vedere subito lo strumento in azione senza
  che lo studente debba costruire tutto da zero alla prima esperienza

## Fase 2 — Vista a diagramma di flusso sincronizzata

Un secondo modo di rappresentare **lo stesso identico programma** della Fase 1, a
diagramma di flusso invece che a blocchi. Le due viste sono intercambiabili: modifico
in una, l'altra si aggiorna.

Vincolo architetturale chiave (vedi anche SPEC.md): il flowchart deve essere
strutturato fin dall'inizio, non un canvas libero. Ogni forma (decisione, ciclo) ha un
solo ingresso e una sola uscita; si inseriscono nuovi elementi solo spezzando una
connessione esistente, mai disegnando frecce arbitrarie. Senza questo vincolo, il
flowchart potrebbe rappresentare strutture non traducibili in blocchi annidati puliti.

Prerequisito tecnico: un modello dati intermedio che descriva il programma in modo
astratto, indipendente da quale vista lo sta visualizzando o modificando. Sia i
blocchi che il flowchart leggono/scrivono questo stesso modello; i generatori di
codice della Fase 1 continuano a leggere dal modello, non da una vista specifica.

Non iniziare questa fase finché la Fase 1 non è stata usata e validata in classe
almeno una volta: è la fase tecnicamente più delicata (sincronizzazione bidirezionale
mantenendo sempre una struttura valida), meglio partire da un cuore (modello +
generatori) già stabile.

## Fase 3 — Estensioni sul dominio, da validare con l'uso reale

Non impegnative singolarmente, ma da introdurre solo se l'uso in classe ne conferma
il bisogno reale:

- Tipi di dato oltre agli interi (stringhe, numeri decimali) — come blocchi distinti,
  vedi nota in SPEC.md
- Funzioni/procedure definite dallo studente
- Esecuzione reale del codice generato in C/Python (distinta dall'esecuzione a
  blocchi già presente in Fase 1: qui si intende compilare/interpretare
  davvero il testo C o Python prodotto — Python è il candidato più semplice da
  eseguire direttamente nel browser; C richiede un compilatore, quindi più complesso)
- Libreria di esempi precaricati più ampia, per costruire una piccola progressione
  didattica dentro lo strumento stesso
- Eventuale salvataggio collegato a un account/classe (richiederebbe introdurre un
  backend, oggi volutamente assente — va proposto e discusso esplicitamente, non
  aggiunto di default)
