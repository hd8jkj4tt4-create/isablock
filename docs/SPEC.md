# Specifica funzionale

## Perché blocchi e non (solo) diagrammi di flusso

Un diagramma di flusso "libero" (frecce disegnate a piacere) può rappresentare grafi
di controllo che non sono traducibili in modo pulito in codice strutturato — lo stesso
problema che affrontano i decompilatori con salti/`goto` arbitrari. I blocchi, per
costruzione, impediscono questo: un "se" contiene fisicamente i blocchi al suo interno,
non è possibile costruire un controllo di flusso ambiguo. Per questo la Fase 1 è
blocchi-soli. Una vista a diagramma di flusso è prevista in una fase successiva (vedi
`ROADMAP.md`), ma **solo se vincolata a essere strutturata allo stesso modo** (una
entrata e una uscita per ogni forma; niente frecce libere) — altrimenti le due
rappresentazioni non sarebbero garantite equivalenti.

## Costrutti richiesti (Fase 1)

### Struttura
- Un contenitore di programma (inizio/fine) che racchiude la sequenza principale di
  istruzioni.

### Istruzioni
- **Assegnazione**: `variabile ← espressione`
- **Lettura input**: legge un valore e lo assegna a una variabile
- **Scrittura output**: stampa il valore di un'espressione
- **Selezione semplice**: `se condizione allora ...`
- **Selezione con alternativa**: `se condizione allora ... altrimenti ...`
- **Iterazione a condizione iniziale** (mentre/while): ripete finché la condizione è
  vera, condizione valutata prima di ogni iterazione
- **Iterazione a contatore** (per/for): variabile che va da un valore iniziale a un
  valore finale incluso, passo 1
- **Iterazione a ripetizione fissa** (ripeti N volte): ripete un numero di volte
  stabilito, senza esporre un contatore. Aggiunta rispetto al set minimo iniziale:
  utile per la corrispondenza diretta con esempi "vita reale" del tipo "mescola 3
  volte il composto", dove non serve sapere a che ripetizione ci si trova. Non
  sostituisce l'iterazione a contatore, che resta necessaria quando l'algoritmo usa
  l'indice (es. il fattoriale).
- **Commento**: riga di testo libero senza alcun effetto sull'esecuzione. Aggiunta
  rispetto al set minimo iniziale, per abituare da subito alla pratica di documentare
  il codice. Tradotto nella sintassi di commento reale di ciascun linguaggio (`//` in
  pseudocodice e C, `#` in Python), non solo come annotazione dell'editor.

### Espressioni
- Valori numerici letterali (solo interi in Fase 1)
- Riferimento a variabile
- Operatori aritmetici: addizione, sottrazione, moltiplicazione, divisione, modulo
- Operatori di confronto: uguale, diverso, minore, minore-uguale, maggiore,
  maggiore-uguale
- Operatori logici: e, o, negazione
- Valori booleani letterali (vero/falso)

Questo set deve coprire algoritmi da manuale di base: massimo/minimo tra numeri,
somma di una sequenza, ricerca lineare, calcolo di un fattoriale, verifica di
primalità elementare. Se un algoritmo di questo tipo non è esprimibile con il set di
blocchi, manca qualcosa.

## Requisiti sui tre output

- **Pseudocodice**: leggibile da uno studente italiano, senza sintassi reale di
  nessun linguaggio. Convenzione tipica dei libri di testo italiani (parole chiave
  come SE/ALLORA/ALTRIMENTI/MENTRE/PER, blocchi chiusi esplicitamente tipo
  FINE SE/FINE MENTRE) è un buon punto di partenza, ma va reso facile da adattare:
  ogni scuola/libro ha convenzioni leggermente diverse.
- **C**: codice compilabile con un compilatore C standard (es. gcc), con `#include`
  e `main` corretti, variabili dichiarate come `int`, lettura/scrittura con
  `scanf`/`printf`.
- **Python**: codice eseguibile con un interprete Python 3 standard, indentazione
  corretta, lettura con `input()` convertito a intero, scrittura con `print()`.

I tre output devono essere generati dallo **stesso modello di programma**, non da tre
implementazioni indipendenti che potrebbero divergere: la garanzia di coerenza è il
punto centrale dello strumento.

## Vincolo di dominio: solo interi

In Fase 1 tutte le variabili sono numeri interi. Nessuna stringa, nessun numero
decimale. È una scelta didattica deliberata, non un limite tecnico da "risolvere"
subito: l'obiettivo della Fase 1 è isolare la logica di controllo (sequenza,
selezione, iterazione) dal sistema dei tipi. Estensioni a stringhe/decimali sono in
`ROADMAP.md` come fase successiva, con la nota che vanno introdotte come blocchi
distinti (es. "testo", "numero decimale") piuttosto che rendere i blocchi esistenti
polimorfi, per restare chiari su "che tipo è questo valore" agli occhi di uno
studente.

## Persistenza (Fase 1)

Lo studente deve poter salvare il proprio lavoro e riprenderlo in una sessione
successiva, senza account né server: va bene un file scaricabile che poi si può
ricaricare (formato a scelta dell'implementazione).

## Fuori scope per la Fase 1

- Esecuzione reale del codice generato.
- Funzioni/procedure definite dallo studente.
- Gestione di errori "a runtime" (divisione per zero, overflow...): lo strumento
  traduce la logica, non simula l'esecuzione.
