// Valori dell'applicazione (non dello pseudocodice: quelli stanno in
// pseudocode-config.js). Congelato per evitare modifiche accidentali a runtime.
export const appConfig = Object.freeze({
  // Versione dell'applicazione mostrata nel piè di pagina e scritta nei file
  // salvati come sola informazione di provenienza.
  version: '1.0.0',

  // Versione del formato dei file salvati (vedi persistence.js). Va aumentata
  // solo quando un cambio di formato rende illeggibili i file vecchi per il
  // codice nuovo (o viceversa), non a ogni rilascio dell'app.
  fileFormatVersion: 1,
});
