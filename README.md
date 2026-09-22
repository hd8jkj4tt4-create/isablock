# IsaBlock

> Tu metti la logica, il codice lo mettiamo noi.

## Il problema che vogliamo risolvere

Gli studenti di una terza superiore di informatica, quando partono direttamente col C,
si scontrano subito con la sintassi (punti e virgola, dichiarazioni di tipo, parentesi
graffe) prima ancora di aver interiorizzato la logica dell'algoritmo. Il risultato è
che passano più tempo a debuggare errori di sintassi che a ragionare sul problema.

Vogliamo uno strumento che permetta di **comporre un algoritmo in modo visuale** (a
blocchi, come Scratch — connessioni che impediscono combinazioni illogiche) e di
vedere **in tempo reale** a cosa corrisponde in pseudocodice, in C e in Python. Lo
studente ragiona sulla logica (sequenza, selezione, iterazione) senza lottare con la
sintassi, e quando è pronto vede la "traduzione" nel linguaggio vero — capendo che è
solo una trascrizione di un ragionamento che già sa fare.

## Chi lo usa

- Studenti di terza superiore, indirizzo informatico, nessuna esperienza pregressa di
  programmazione testuale (qualcuno potrebbe già conoscere Scratch dalle medie).
- Il docente, per costruire esempi e assegnare esercizi.

## Cosa deve fare, in sintesi

1. Un editor a blocchi per comporre algoritmi con i costrutti fondamentali:
   sequenza, assegnazione, lettura/scrittura, selezione (if/else), iterazione
   (condizionale e a contatore).
2. Generazione automatica e sincronizzata di tre output testuali dallo stesso
   algoritmo: pseudocodice, C, Python.
3. Deve girare interamente nel browser, senza bisogno di un server per la funzione
   principale (comporre blocchi → vedere il codice). Deve poter essere usato in
   laboratorio scolastico, anche offline se possibile, senza installazioni per gli
   studenti.

Il dettaglio dei requisiti è in `docs/SPEC.md`. Le fasi di sviluppo previste sono in
`docs/ROADMAP.md`.

## Cosa NON deve fare (almeno inizialmente)

- Non deve compilare o eseguire davvero il C o il Python generati — è uno
  strumento di visualizzazione/traduzione, non un IDE. (È invece presente
  un'esecuzione passo-passo del *programma a blocchi*, che mostra la logica in
  azione evidenziando in sincrono i tre output: guida la lettura del codice,
  non lo esegue.)
- Non deve richiedere account, login o salvataggio lato server nella prima fase.
- Non deve introdurre concetti di tipo (stringhe, virgola mobile) nella prima fase:
  tutte le variabili sono numeri interi, per tenere il focus sulla logica di
  controllo piuttosto che sul sistema dei tipi.
