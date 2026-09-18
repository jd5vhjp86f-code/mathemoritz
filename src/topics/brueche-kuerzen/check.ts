/**
 * Antwortprüfung für Kürzen und Erweitern.
 *
 * Die Prüfung vergleicht nicht nur richtig gegen falsch, sondern hält gezielt
 * nach bekannten Denkfehlern Ausschau. Jedes gemeldete Muster steht im Katalog
 * in `topics/fehlermuster.ts` und in `docs/FEHLERMUSTER.md`. Gerechnet wird
 * ausschließlich exakt über `core/fraction.ts`.
 */

import type { CheckResult, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import { equals, fraction, isFullyReduced, kuerzen } from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { falsch, leseAntwort, richtig, unklar } from '../antwort.ts';

export function check(task: Task, input: string): CheckResult {
  const antwort = leseAntwort(input, task.answerKind);
  if (!antwort.ok) return antwort.ergebnis;

  if (task.answerKind === 'integer') {
    return checkGanzeZahl(task, antwort.wert);
  }
  return task.variant === 'kuerzen' ? checkKuerzen(task, antwort.wert) : checkErweitern(task, antwort.wert);
}

/* ------------------------------------------------------------------ */

function checkKuerzen(task: Task, parsed: Fraction): CheckResult {
  const aufgabe = task.given.aufgabe;
  const basis = task.given.basis;
  if (aufgabe === undefined || basis === undefined) {
    return nurWert(task, parsed);
  }

  const k = aufgabe.d / basis.d;

  if (equals(parsed, task.solution)) {
    if (isFullyReduced(parsed)) return richtig(parsed);
    return falsch(
      `Der Wert stimmt schon. Kürze noch weiter, bis nichts mehr geht: ${formatFractionText(kuerzen(parsed))}.`,
      'nicht-vollstaendig-gekuerzt',
    );
  }

  if (equals(parsed, fraction(basis.n, aufgabe.d))) {
    return falsch(
      `Du hast nur den Zähler durch ${String(k)} geteilt. Kürzen heißt: Zähler und Nenner, immer beide.`,
      'nur-zaehler-gekuerzt',
    );
  }

  if (equals(parsed, fraction(aufgabe.n, basis.d))) {
    return falsch(
      `Du hast nur den Nenner durch ${String(k)} geteilt. Der Zähler muss genauso geteilt werden.`,
      'nur-nenner-gekuerzt',
    );
  }

  if (equals(parsed, fraction(basis.d, basis.n))) {
    return falsch(
      'Da sind Zähler und Nenner vertauscht. Oben steht der Zähler, unten der Nenner.',
      'zaehler-nenner-vertauscht',
    );
  }

  if (aufgabe.n > k && aufgabe.d > k && equals(parsed, fraction(aufgabe.n - k, aufgabe.d - k))) {
    return falsch(
      `Du hast ${String(k)} abgezogen. Beim Kürzen wird geteilt, nicht subtrahiert.`,
      'subtrahiert-statt-geteilt',
    );
  }

  return unklar(
    `Noch nicht. Suche eine Zahl, durch die ${String(aufgabe.n)} und ${String(aufgabe.d)} beide teilbar sind.`,
  );
}

function checkErweitern(task: Task, parsed: Fraction): CheckResult {
  const basis = task.given.basis;
  const erweitert = task.given.erweitert;
  if (basis === undefined || erweitert === undefined) {
    return nurWert(task, parsed);
  }

  const k = erweitert.d / basis.d;
  const zielNenner = task.requirement.kind === 'denominator' ? task.requirement.denominator : erweitert.d;

  if (equals(parsed, task.solution) && parsed.d === zielNenner) {
    return richtig(parsed);
  }

  if (equals(parsed, basis) && parsed.d === basis.d) {
    return falsch(
      `Das ist der Bruch von vorher. Erweitere ihn: Zähler und Nenner mal ${String(k)}.`,
      'nicht-erweitert',
    );
  }

  if (equals(parsed, fraction(erweitert.n, basis.d))) {
    return falsch(`Du hast nur den Zähler mal ${String(k)} genommen. Der Nenner muss mit.`, 'nur-zaehler-erweitert');
  }

  if (equals(parsed, fraction(basis.n, erweitert.d))) {
    return falsch(
      `Der Nenner stimmt, aber der Zähler nicht. Nimm auch ihn mal ${String(k)}.`,
      'nur-nenner-erweitert',
    );
  }

  if (equals(parsed, fraction(basis.n + k, basis.d + k))) {
    return falsch(
      `Du hast ${String(k)} addiert. Erweitern heißt multiplizieren, nicht addieren.`,
      'addiert-statt-multipliziert',
    );
  }

  if (equals(parsed, task.solution)) {
    return falsch(
      `Der Wert stimmt, aber der Nenner soll ${String(zielNenner)} sein. Schreib den Bruch als ${formatFractionText(task.solution)}.`,
      'falscher-nenner',
    );
  }

  return unklar(
    `Noch nicht. Rechne zuerst ${String(zielNenner)} : ${String(basis.d)} – das ist dein Erweiterungsfaktor.`,
  );
}

function checkGanzeZahl(task: Task, parsed: Fraction): CheckResult {
  if (equals(parsed, task.solution)) return richtig(parsed);

  const basis = task.given.basis;
  const erweitert = task.given.erweitert;
  if (basis === undefined || erweitert === undefined) {
    return nurWert(task, parsed);
  }
  const k = erweitert.d / basis.d;

  if (task.variant === 'luecke') {
    if (equals(parsed, fraction(k, 1n))) {
      return falsch(
        `${String(k)} ist der Erweiterungsfaktor – richtig erkannt. Gesucht ist aber der neue Zähler: ${String(basis.n)} mal ${String(k)}.`,
        'faktor-statt-zaehler',
      );
    }
    if (equals(parsed, fraction(basis.n, 1n))) {
      return falsch(
        `Das ist der alte Zähler. Er muss noch mal ${String(k)} genommen werden.`,
        'zaehler-nicht-erweitert',
      );
    }
    return unklar(
      `Noch nicht. Der Nenner wurde mal ${String(k)} genommen – mit dem Zähler machst du dasselbe.`,
    );
  }

  if (equals(parsed, fraction(erweitert.d, 1n)) || equals(parsed, fraction(erweitert.n, 1n))) {
    return falsch(
      'Das ist eine Zahl aus dem Bruch. Gesucht ist der Faktor: neuer Nenner geteilt durch alten Nenner.',
      'nenner-statt-faktor',
    );
  }

  return unklar(`Noch nicht. Rechne ${String(erweitert.d)} : ${String(basis.d)}.`);
}

/** Rückfallebene, falls einem Task die gegebenen Brüche fehlen. */
function nurWert(task: Task, parsed: Fraction): CheckResult {
  if (equals(parsed, task.solution)) return richtig(parsed);
  return unklar('Noch nicht. Schau dir die Zahlen noch einmal in Ruhe an.');
}
