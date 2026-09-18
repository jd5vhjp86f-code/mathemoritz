/**
 * Gemeinsames Einlesen von Antworten.
 *
 * Jedes Thema prüft seine Aufgaben selbst - aber „leer", „nicht lesbar" und
 * „Kommazahl statt Bruch" sind überall dieselben Fälle und sollen überall
 * dieselbe Rückmeldung geben. Deshalb liegen sie hier.
 */

import type { AnswerKind, CheckResult, Task } from './types.ts';
import type { Fehlermuster } from './fehlermuster.ts';
import type { Fraction } from '../core/fraction.ts';
import { ZERO, isInteger, parseFraction } from '../core/fraction.ts';

/** Ergebnis des Einlesens: entweder ein Wert oder ein fertiger Fehlerfall. */
export type Antwort =
  | { readonly ok: true; readonly wert: Fraction }
  | { readonly ok: false; readonly ergebnis: CheckResult };

/**
 * Liest die Eingabe und fängt die Fälle ab, die jedes Thema gleich behandelt.
 * Kommt `ok: true` zurück, kann das Thema mit dem Wert weiterarbeiten.
 */
export function leseAntwort(input: string, answerKind: AnswerKind): Antwort {
  const text = input.trim();

  if (text === '') {
    return abbruch(
      answerKind === 'choice'
        ? 'Wähl eine der Möglichkeiten aus.'
        : 'Da steht noch nichts. Schreib deine Antwort in das Feld.',
      'eingabe-leer',
    );
  }

  // Bei einer Auswahl steckt keine Zahl in der Eingabe, sondern eine der
  // vorgegebenen Beschriftungen. Die wertet das Thema selbst aus.
  if (answerKind === 'choice') {
    return { ok: true, wert: ZERO };
  }

  const wert = parseFraction(text);
  if (wert === null) {
    return abbruch(
      answerKind === 'integer'
        ? 'Das konnte ich nicht lesen. Schreib eine ganze Zahl, zum Beispiel 12.'
        : 'Das konnte ich nicht lesen. Schreib einen Bruch so: 3/4.',
      'eingabe-unlesbar',
    );
  }

  if (answerKind === 'integer') {
    if (!isInteger(wert)) {
      return abbruch('Hier ist eine ganze Zahl gefragt, kein Bruch.', 'ganze-zahl-erwartet');
    }
    return { ok: true, wert };
  }

  if (answerKind === 'decimal') {
    if (!istKommazahl(text) && !istGanzeZahl(text)) {
      return abbruch(
        'Hier ist eine Kommazahl gefragt, kein Bruch. Schreib sie mit Komma, zum Beispiel 0,75.',
        'bruch-statt-dezimal',
      );
    }
    return { ok: true, wert };
  }

  if (istKommazahl(text)) {
    return abbruch('Hier ist ein Bruch gefragt, keine Kommazahl. Schreib ihn so: 3/4.', 'dezimal-statt-bruch');
  }

  return { ok: true, wert };
}

/**
 * Prüft, ob die gewählte Möglichkeit die richtige ist.
 *
 * Bei `answerKind: 'choice'` steht in `solution` der Index der richtigen
 * Möglichkeit.
 */
export function gewaehlt(task: Task, input: string): { readonly index: number; readonly richtig: boolean } {
  const choices = task.choices ?? [];
  const index = choices.indexOf(input.trim());
  return { index, richtig: index >= 0 && BigInt(index) === task.solution.n };
}

/** Kurze Bestätigung, abgeleitet aus der Antwort - bleibt damit reproduzierbar. */
const LOB: readonly string[] = ['Richtig!', 'Genau so.', 'Stimmt.', 'Sitzt.'];

export function lob(antwort: Fraction): string {
  const index = Number(((antwort.n < 0n ? -antwort.n : antwort.n) + antwort.d) % BigInt(LOB.length));
  return LOB[index] ?? 'Richtig!';
}

/** Richtige Antwort, fertig verpackt. */
export function richtig(antwort: Fraction): CheckResult {
  return { correct: true, feedback: lob(antwort), errorPattern: null };
}

/** Falsche Antwort mit erkanntem Muster. */
export function falsch(feedback: string, errorPattern: Fehlermuster): CheckResult {
  return { correct: false, feedback, errorPattern };
}

/** Falsche Antwort ohne erkanntes Muster - dann zählt ein brauchbarer Hinweis. */
export function unklar(feedback: string): CheckResult {
  return { correct: false, feedback, errorPattern: null };
}

function abbruch(feedback: string, errorPattern: Fehlermuster): Antwort {
  return { ok: false, ergebnis: { correct: false, feedback, errorPattern } };
}

function istKommazahl(text: string): boolean {
  return /^[+-]?\d*[,.]\d+$/.test(text.replace(/\s/g, ''));
}

function istGanzeZahl(text: string): boolean {
  return /^[+-]?\d+$/.test(text.replace(/\s/g, ''));
}
