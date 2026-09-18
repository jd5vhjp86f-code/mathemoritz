/**
 * Antwortprüfung für Addieren und Subtrahieren.
 *
 * Der wichtigste Fehler hier ist der Klassiker: Zähler und Nenner einzeln
 * addieren. Er bekommt deshalb eine eigene, sehr konkrete Rückmeldung.
 */

import type { CheckResult, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import {
  absBigInt,
  add,
  equals,
  fraction,
  hauptnenner,
  isFullyReduced,
  kuerzen,
  neg,
  sub,
} from '../../core/fraction.ts';
import { formatFractionText } from '../../core/format.ts';
import { falsch, leseAntwort, richtig, unklar } from '../antwort.ts';
import { operatorVon } from '../aufgabe.ts';

export function check(task: Task, input: string): CheckResult {
  const antwort = leseAntwort(input, task.answerKind);
  if (!antwort.ok) return antwort.ergebnis;

  const a = task.given.a;
  const b = task.given.b;
  if (a === undefined || b === undefined) return nurWert(task, antwort.wert);

  if (task.variant === 'hauptnenner') {
    return checkHauptnenner(task, antwort.wert, a, b);
  }
  return checkRechnung(task, antwort.wert, a, b);
}

/* ------------------------------------------------------------------ */

function checkRechnung(task: Task, parsed: Fraction, a: Fraction, b: Fraction): CheckResult {
  const plus = operatorVon(task) === '+';
  const hn = hauptnenner([a, b]);
  const gleichnamig = a.d === b.d;

  if (equals(parsed, task.solution)) {
    if (isFullyReduced(parsed)) return richtig(parsed);
    return falsch(
      `Richtig gerechnet! Jetzt noch kürzen: ${formatFractionText(kuerzen(parsed))}.`,
      'nicht-vollstaendig-gekuerzt',
    );
  }

  // Der Klassiker: Zähler und Nenner getrennt verrechnet.
  const getrennt = plus
    ? fraction(a.n + b.n, a.d + b.d)
    : a.d === b.d
      ? null
      : fraction(a.n - b.n, a.d - b.d);
  if (getrennt !== null && equals(parsed, getrennt)) {
    return falsch(
      plus
        ? `Du hast die Nenner mitaddiert. Nenner werden nie addiert – bring beide Brüche zuerst auf den Hauptnenner ${hn.toString()}.`
        : `Du hast die Nenner mitsubtrahiert. Nenner werden nie subtrahiert – bring beide Brüche zuerst auf den Hauptnenner ${hn.toString()}.`,
      plus ? 'nenner-addiert' : 'nenner-subtrahiert',
    );
  }

  // Falsches Rechenzeichen benutzt.
  const andersherum = plus ? sub(a, b) : add(a, b);
  if (equals(parsed, andersherum)) {
    return falsch(
      plus ? 'Hier steht ein Plus. Du hast subtrahiert.' : 'Hier steht ein Minus. Du hast addiert.',
      'rechenzeichen-vertauscht',
    );
  }

  if (!plus && equals(parsed, neg(task.solution))) {
    return falsch(
      `Du hast andersherum gerechnet. Vom ersten Bruch wird abgezogen: ${formatFractionText(a)} minus ${formatFractionText(b)}.`,
      'minuend-subtrahend-vertauscht',
    );
  }

  if (!gleichnamig) {
    const zaehlerRoh = plus ? a.n + b.n : a.n - b.n;
    const alterNenner = [fraction(zaehlerRoh, a.d), fraction(zaehlerRoh, b.d)];
    const nurEinerErweitert = [
      fraction(plus ? a.n * (hn / a.d) + b.n : a.n * (hn / a.d) - b.n, hn),
      fraction(plus ? a.n + b.n * (hn / b.d) : a.n - b.n * (hn / b.d), hn),
    ];

    // Steht die Antwort auf dem Hauptnenner, zählt der geschriebene Zähler.
    // Ein reiner Wertvergleich könnte hier danebengreifen: „nur einen Bruch
    // erweitert" und „alten Nenner übernommen" ergeben gelegentlich dieselbe
    // Zahl (etwa bei 3/4 + 3/6). Was der Schüler hingeschrieben hat, ist
    // eindeutig - also wird das ausgewertet.
    if (parsed.d === hn) {
      if (nurEinerErweitert.some((kandidat) => parsed.n === kandidat.n)) {
        return falsch(
          `Ein Bruch ist schon auf ${hn.toString()} erweitert, der andere noch nicht. Beide müssen umgerechnet werden.`,
          'nur-einen-bruch-erweitert',
        );
      }
      return falsch(
        `Der Hauptnenner ${hn.toString()} stimmt \u2013 gut. Rechne die Zähler noch einmal nach.`,
        'hauptnenner-stimmt-zaehler-nicht',
      );
    }

    if (alterNenner.some((kandidat) => equals(parsed, kandidat))) {
      return falsch(
        `Die Nenner sind noch verschieden. Erweitere beide Brüche erst auf ${hn.toString()}, dann darfst du die Zähler verrechnen.`,
        'nicht-gleichnamig-gemacht',
      );
    }

    if (nurEinerErweitert.some((kandidat) => equals(parsed, kandidat))) {
      return falsch(
        `Ein Bruch ist schon auf ${hn.toString()} erweitert, der andere noch nicht. Beide müssen umgerechnet werden.`,
        'nur-einen-bruch-erweitert',
      );
    }
  }

  return unklar(
    gleichnamig
      ? `Noch nicht. Die Nenner sind gleich, also bleibt ${a.d.toString()} stehen und du rechnest nur mit den Zählern.`
      : `Noch nicht. Bring beide Brüche zuerst auf den Hauptnenner ${hn.toString()}.`,
  );
}

function checkHauptnenner(task: Task, parsed: Fraction, a: Fraction, b: Fraction): CheckResult {
  if (equals(parsed, task.solution)) return richtig(parsed);

  const hn = hauptnenner([a, b]);
  const wert = absBigInt(parsed.n);
  if (wert === 0n) {
    return unklar(`Noch nicht. Der Hauptnenner muss durch ${a.d.toString()} und ${b.d.toString()} teilbar sein.`);
  }

  if (wert === a.d * b.d) {
    return falsch(
      `${wert.toString()} ist die Nenner mal genommen. Das geht zwar auf, ist aber nicht der kleinste gemeinsame Nenner – der ist ${hn.toString()}.`,
      'nenner-multipliziert-statt-kgv',
    );
  }

  if (wert % a.d === 0n && wert % b.d === 0n) {
    return falsch(
      `${wert.toString()} ist durch beide Nenner teilbar – richtig gedacht. Gesucht ist aber das kleinste, und das ist ${hn.toString()}.`,
      'gemeinsames-vielfaches-nicht-kleinstes',
    );
  }

  const passtNicht = wert % a.d === 0n ? b.d : a.d;
  return falsch(
    `${wert.toString()} lässt sich nicht durch ${passtNicht.toString()} teilen. Der Hauptnenner muss durch beide Nenner teilbar sein.`,
    'hauptnenner-kein-vielfaches',
  );
}

function nurWert(task: Task, parsed: Fraction): CheckResult {
  if (equals(parsed, task.solution)) return richtig(parsed);
  return unklar('Noch nicht. Schau dir die Nenner noch einmal an.');
}
