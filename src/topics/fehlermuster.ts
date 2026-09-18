/**
 * Katalog aller Fehlermuster, die irgendein Thema melden darf.
 *
 * Die Liste ist die Brücke zur Doku: `fehlermuster.test.ts` prüft, dass jeder
 * Eintrag in `docs/FEHLERMUSTER.md` beschrieben ist und dass kein Thema ein
 * Muster meldet, das hier fehlt. Ein neues Muster ohne Eintrag lässt die Tests
 * rot werden.
 */

export const FEHLERMUSTER = [
  // Eingabe
  'eingabe-leer',
  'eingabe-unlesbar',
  'dezimal-statt-bruch',
  'ganze-zahl-erwartet',

  // Überall gültig
  'nicht-vollstaendig-gekuerzt',

  // Kürzen
  'nur-zaehler-gekuerzt',
  'nur-nenner-gekuerzt',
  'subtrahiert-statt-geteilt',
  'zaehler-nenner-vertauscht',

  // Erweitern
  'nicht-erweitert',
  'nur-zaehler-erweitert',
  'nur-nenner-erweitert',
  'addiert-statt-multipliziert',
  'falscher-nenner',
  'faktor-statt-zaehler',
  'zaehler-nicht-erweitert',
  'nenner-statt-faktor',

  // Addieren und Subtrahieren
  'nenner-addiert',
  'nenner-subtrahiert',
  'nicht-gleichnamig-gemacht',
  'nur-einen-bruch-erweitert',
  'hauptnenner-stimmt-zaehler-nicht',
  'rechenzeichen-vertauscht',
  'minuend-subtrahend-vertauscht',

  // Hauptnenner bestimmen
  'nenner-multipliziert-statt-kgv',
  'gemeinsames-vielfaches-nicht-kleinstes',
  'hauptnenner-kein-vielfaches',

  // Multiplizieren
  'ueber-kreuz-multipliziert',
  'nenner-nicht-multipliziert',
  'zaehler-nicht-multipliziert',
  'summe-statt-produkt',

  // Dividieren
  'kehrwert-vergessen',
  'ersten-bruch-gestuerzt',
  'beide-brueche-gestuerzt',
] as const;

export type Fehlermuster = (typeof FEHLERMUSTER)[number];

const BEKANNT = new Set<string>(FEHLERMUSTER);

/** true, wenn die ID im Katalog steht. */
export function istBekanntesFehlermuster(id: string): id is Fehlermuster {
  return BEKANNT.has(id);
}
