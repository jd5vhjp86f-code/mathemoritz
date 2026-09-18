/**
 * Antwortprüfung für Kürzen und Erweitern.
 *
 * Die Prüfung vergleicht nicht nur richtig gegen falsch, sondern hält gezielt
 * nach bekannten Denkfehlern Ausschau. Jedes `errorPattern` ist in
 * `docs/FEHLERMUSTER.md` beschrieben. Gerechnet wird ausschließlich exakt
 * über `core/fraction.ts`.
 */

import type { CheckResult, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import { equals, fraction, isFullyReduced, isInteger, kuerzen, parseFraction } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';

/**
 * Alle Fehlermuster, die dieses Thema melden kann.
 *
 * Die Liste ist die Brücke zur Doku: ein Test vergleicht sie mit
 * `docs/FEHLERMUSTER.md`. Ein neues Muster ohne Eintrag dort lässt die Tests
 * rot werden.
 */
export const ERROR_PATTERNS = [
  'eingabe-leer',
  'eingabe-unlesbar',
  'dezimal-statt-bruch',
  'ganze-zahl-erwartet',
  'nicht-vollstaendig-gekuerzt',
  'nur-zaehler-gekuerzt',
  'nur-nenner-gekuerzt',
  'subtrahiert-statt-geteilt',
  'zaehler-nenner-vertauscht',
  'nicht-erweitert',
  'nur-zaehler-erweitert',
  'nur-nenner-erweitert',
  'addiert-statt-multipliziert',
  'falscher-nenner',
  'faktor-statt-zaehler',
  'zaehler-nicht-erweitert',
  'nenner-statt-faktor',
] as const;

export type ErrorPattern = (typeof ERROR_PATTERNS)[number];

export function check(task: Task, input: string): CheckResult {
  const text = input.trim();
  if (text === '') {
    return {
      correct: false,
      feedback: 'Da steht noch nichts. Schreib deine Antwort in das Feld.',
      errorPattern: 'eingabe-leer',
    };
  }

  const parsed = parseFraction(text);
  if (parsed === null) {
    return {
      correct: false,
      feedback: 'Das konnte ich nicht lesen. Schreib einen Bruch so: 3/4.',
      errorPattern: 'eingabe-unlesbar',
    };
  }

  if (task.answerKind === 'integer') {
    return checkInteger(task, parsed);
  }

  if (looksLikeDecimal(text)) {
    return {
      correct: false,
      feedback: 'Hier ist ein Bruch gefragt, keine Kommazahl. Schreib ihn so: 3/4.',
      errorPattern: 'dezimal-statt-bruch',
    };
  }

  return task.variant === 'kuerzen' ? checkKuerzen(task, parsed) : checkErweitern(task, parsed);
}

/* ------------------------------------------------------------------ */

function checkKuerzen(task: Task, parsed: Fraction): CheckResult {
  const aufgabe = task.given.aufgabe;
  const basis = task.given.basis;
  if (aufgabe === undefined || basis === undefined) {
    return vergleicheNurWert(task, parsed);
  }

  const k = aufgabe.d / basis.d;
  const richtig = equals(parsed, task.solution);

  if (richtig && isFullyReduced(parsed)) {
    return { correct: true, feedback: pickLob(parsed), errorPattern: null };
  }

  if (richtig) {
    return {
      correct: false,
      feedback: `Der Wert stimmt schon. Kürze noch weiter, bis nichts mehr geht: ${formatFractionText(kuerzen(parsed))}.`,
      errorPattern: 'nicht-vollstaendig-gekuerzt',
    };
  }

  if (equals(parsed, fraction(basis.n, aufgabe.d))) {
    return {
      correct: false,
      feedback: `Du hast nur den Zähler durch ${String(k)} geteilt. Kürzen heißt: Zähler und Nenner, immer beide.`,
      errorPattern: 'nur-zaehler-gekuerzt',
    };
  }

  if (equals(parsed, fraction(aufgabe.n, basis.d))) {
    return {
      correct: false,
      feedback: `Du hast nur den Nenner durch ${String(k)} geteilt. Der Zähler muss genauso geteilt werden.`,
      errorPattern: 'nur-nenner-gekuerzt',
    };
  }

  if (equals(parsed, fraction(basis.d, basis.n))) {
    return {
      correct: false,
      feedback: 'Da sind Zähler und Nenner vertauscht. Oben steht der Zähler, unten der Nenner.',
      errorPattern: 'zaehler-nenner-vertauscht',
    };
  }

  if (aufgabe.n > k && aufgabe.d > k && equals(parsed, fraction(aufgabe.n - k, aufgabe.d - k))) {
    return {
      correct: false,
      feedback: `Du hast ${String(k)} abgezogen. Beim Kürzen wird geteilt, nicht subtrahiert.`,
      errorPattern: 'subtrahiert-statt-geteilt',
    };
  }

  return {
    correct: false,
    feedback: `Noch nicht. Suche eine Zahl, durch die ${String(aufgabe.n)} und ${String(aufgabe.d)} beide teilbar sind.`,
    errorPattern: null,
  };
}

function checkErweitern(task: Task, parsed: Fraction): CheckResult {
  const basis = task.given.basis;
  const erweitert = task.given.erweitert;
  if (basis === undefined || erweitert === undefined) {
    return vergleicheNurWert(task, parsed);
  }

  const k = erweitert.d / basis.d;
  const zielNenner = task.requirement.kind === 'denominator' ? task.requirement.denominator : erweitert.d;

  if (equals(parsed, task.solution) && parsed.d === zielNenner) {
    return { correct: true, feedback: pickLob(parsed), errorPattern: null };
  }

  if (equals(parsed, basis) && parsed.d === basis.d) {
    return {
      correct: false,
      feedback: `Das ist der Bruch von vorher. Erweitere ihn: Zähler und Nenner mal ${String(k)}.`,
      errorPattern: 'nicht-erweitert',
    };
  }

  if (equals(parsed, fraction(erweitert.n, basis.d))) {
    return {
      correct: false,
      feedback: `Du hast nur den Zähler mal ${String(k)} genommen. Der Nenner muss mit.`,
      errorPattern: 'nur-zaehler-erweitert',
    };
  }

  if (equals(parsed, fraction(basis.n, erweitert.d))) {
    return {
      correct: false,
      feedback: `Der Nenner stimmt, aber der Zähler nicht. Nimm auch ihn mal ${String(k)}.`,
      errorPattern: 'nur-nenner-erweitert',
    };
  }

  if (equals(parsed, fraction(basis.n + k, basis.d + k))) {
    return {
      correct: false,
      feedback: `Du hast ${String(k)} addiert. Erweitern heißt multiplizieren, nicht addieren.`,
      errorPattern: 'addiert-statt-multipliziert',
    };
  }

  if (equals(parsed, task.solution)) {
    return {
      correct: false,
      feedback: `Der Wert stimmt, aber der Nenner soll ${String(zielNenner)} sein. Schreib den Bruch als ${formatFractionText(task.solution)}.`,
      errorPattern: 'falscher-nenner',
    };
  }

  return {
    correct: false,
    feedback: `Noch nicht. Rechne zuerst ${String(zielNenner)} : ${String(basis.d)} – das ist dein Erweiterungsfaktor.`,
    errorPattern: null,
  };
}

function checkInteger(task: Task, parsed: Fraction): CheckResult {
  if (!isInteger(parsed)) {
    return {
      correct: false,
      feedback: 'Hier ist eine ganze Zahl gefragt, kein Bruch.',
      errorPattern: 'ganze-zahl-erwartet',
    };
  }

  if (equals(parsed, task.solution)) {
    return { correct: true, feedback: pickLob(parsed), errorPattern: null };
  }

  const basis = task.given.basis;
  const erweitert = task.given.erweitert;
  if (basis === undefined || erweitert === undefined) {
    return vergleicheNurWert(task, parsed);
  }
  const k = erweitert.d / basis.d;

  if (task.variant === 'luecke') {
    if (equals(parsed, fraction(k, 1n))) {
      return {
        correct: false,
        feedback: `${String(k)} ist der Erweiterungsfaktor – richtig erkannt. Gesucht ist aber der neue Zähler: ${String(basis.n)} mal ${String(k)}.`,
        errorPattern: 'faktor-statt-zaehler',
      };
    }
    if (equals(parsed, fraction(basis.n, 1n))) {
      return {
        correct: false,
        feedback: `Das ist der alte Zähler. Er muss noch mal ${String(k)} genommen werden.`,
        errorPattern: 'zaehler-nicht-erweitert',
      };
    }
    return {
      correct: false,
      feedback: `Noch nicht. Der Nenner wurde mal ${String(k)} genommen – mit dem Zähler machst du dasselbe.`,
      errorPattern: null,
    };
  }

  if (equals(parsed, fraction(erweitert.d, 1n)) || equals(parsed, fraction(erweitert.n, 1n))) {
    return {
      correct: false,
      feedback: 'Das ist eine Zahl aus dem Bruch. Gesucht ist der Faktor: neuer Nenner geteilt durch alten Nenner.',
      errorPattern: 'nenner-statt-faktor',
    };
  }

  return {
    correct: false,
    feedback: `Noch nicht. Rechne ${String(erweitert.d)} : ${String(basis.d)}.`,
    errorPattern: null,
  };
}

/* ------------------------------------------------------------------ */

/** Rückfallebene, falls einem Task die gegebenen Brüche fehlen. */
function vergleicheNurWert(task: Task, parsed: Fraction): CheckResult {
  if (equals(parsed, task.solution)) {
    return { correct: true, feedback: pickLob(parsed), errorPattern: null };
  }
  return { correct: false, feedback: 'Noch nicht. Schau dir die Zahlen noch einmal in Ruhe an.', errorPattern: null };
}

const LOB: readonly string[] = ['Richtig!', 'Genau so.', 'Stimmt.', 'Sitzt.'];

/**
 * Wählt eine kurze Bestätigung. Abgeleitet aus der Antwort selbst, damit die
 * Funktion rein bleibt und Tests reproduzierbar sind.
 */
function pickLob(answer: Fraction): string {
  const index = Number(((answer.n < 0n ? -answer.n : answer.n) + answer.d) % BigInt(LOB.length));
  return LOB[index] ?? 'Richtig!';
}

function looksLikeDecimal(text: string): boolean {
  return /^[+-]?\d*[,.]\d+$/.test(text.replace(/\s/g, ''));
}
