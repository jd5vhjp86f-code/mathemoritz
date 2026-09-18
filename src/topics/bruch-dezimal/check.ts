/**
 * Antwortprüfung für Brüche und Dezimalzahlen.
 *
 * Die Fehler hier sind fast alle Stellenwert-Fehler: das Komma sitzt falsch,
 * der Zähler wandert hinter das Komma, oder es wird abgeschnitten statt
 * gerundet. Entsprechend nennen die Rückmeldungen immer die Stelle, um die es
 * geht.
 */

import type { CheckResult, Task } from '../types.ts';
import type { Fraction } from '../../core/fraction.ts';
import {
  absBigInt,
  compare,
  decimalExpansion,
  equals,
  fraction,
  isFullyReduced,
  kehrwert,
  kuerzen,
  mul,
} from '../../core/fraction.ts';
import { formatDecimalText, formatFractionText } from '../../core/format.ts';
import { falsch, gewaehlt, leseAntwort, richtig, unklar } from '../antwort.ts';

export function check(task: Task, input: string): CheckResult {
  if (task.variant === 'vergleichen') {
    return checkVergleich(task, input);
  }

  const antwort = leseAntwort(input, task.answerKind);
  if (!antwort.ok) return antwort.ergebnis;
  const parsed = antwort.wert;

  switch (task.variant) {
    case 'bruch-zu-dezimal':
      return checkBruchZuDezimal(task, parsed);
    case 'dezimal-zu-bruch':
      return checkDezimalZuBruch(task, parsed);
    case 'runden':
      return checkRunden(task, parsed, input);
    case 'periode':
      return checkPeriode(task, parsed);
    default:
      return equals(parsed, task.solution) ? richtig(parsed) : unklar('Noch nicht. Rechne es noch einmal nach.');
  }
}

/* ------------------------------------------------------------------ */

function checkBruchZuDezimal(task: Task, parsed: Fraction): CheckResult {
  const aufgabe = task.given.aufgabe;
  if (aufgabe === undefined) return nurWert(task, parsed);

  if (equals(parsed, task.solution)) return richtig(parsed);

  const verrutscht = kommaVerrutscht(parsed, task.solution);
  if (verrutscht !== null) {
    return falsch(
      `Die Ziffern stimmen, aber das Komma sitzt falsch. Richtig ist ${formatDecimalText(task.solution)}.`,
      'komma-verrutscht',
    );
  }

  if (aufgabe.n !== 0n && equals(parsed, kehrwert(aufgabe))) {
    return falsch(
      `Du hast andersherum geteilt. Es ist ${aufgabe.n.toString()} durch ${aufgabe.d.toString()}, nicht umgekehrt.`,
      'nenner-durch-zaehler-geteilt',
    );
  }

  if (istZaehlerHinterKomma(parsed, aufgabe)) {
    return falsch(
      'Der Zähler wird nicht einfach hinter das Komma geschrieben. Erweitere den Bruch auf Zehntel, Hundertstel oder Tausendstel.',
      'zaehler-als-nachkommastelle',
    );
  }

  return unklar(
    `Noch nicht. Erweitere ${formatFractionText(aufgabe)} so, dass unten eine 10, 100 oder 1000 steht.`,
  );
}

function checkDezimalZuBruch(task: Task, parsed: Fraction): CheckResult {
  const aufgabe = task.given.aufgabe;
  const ungekuerzt = task.given.ungekuerzt;

  if (equals(parsed, task.solution)) {
    if (isFullyReduced(parsed)) return richtig(parsed);
    return falsch(
      `Der Wert stimmt. Kürze noch: ${formatFractionText(kuerzen(parsed))}.`,
      'nicht-vollstaendig-gekuerzt',
    );
  }

  if (kommaVerrutscht(parsed, task.solution) !== null) {
    return falsch(
      'Die Ziffern stimmen, aber der Nenner ist um eine Zehnerpotenz daneben. Zähl die Stellen nach dem Komma noch einmal.',
      'komma-verrutscht',
    );
  }

  if (aufgabe !== undefined && ungekuerzt !== undefined && equals(parsed, kehrwert(ungekuerzt))) {
    return falsch(
      'Zähler und Nenner sind vertauscht. Die Nachkommastellen gehören nach oben, die 10, 100 oder 1000 nach unten.',
      'zaehler-nenner-vertauscht',
    );
  }

  return unklar(
    ungekuerzt === undefined
      ? 'Noch nicht. Zähl die Stellen nach dem Komma.'
      : `Noch nicht. Schreib die Zahl zuerst als ${ungekuerzt.n.toString()}/${ungekuerzt.d.toString()} und kürze dann.`,
  );
}

function checkRunden(task: Task, parsed: Fraction, input: string): CheckResult {
  const aufgabe = task.given.aufgabe;
  const einheit = task.given.einheit;
  if (aufgabe === undefined || einheit === undefined) return nurWert(task, parsed);

  const stellen = einheit.d.toString().length - 1;

  if (equals(parsed, task.solution)) {
    const geschrieben = nachkommastellen(input);
    if (geschrieben > stellen) {
      return falsch(
        `Der Wert stimmt, aber es sind zu viele Stellen. Gefragt sind ${stellen.toString()} nach dem Komma.`,
        'nicht-gerundet',
      );
    }
    return richtig(parsed);
  }

  if (nachkommastellen(input) > stellen) {
    return falsch(
      `Du hast nicht gerundet, sondern weitergerechnet. Gefragt sind ${stellen.toString()} Stellen nach dem Komma.`,
      'nicht-gerundet',
    );
  }

  if (equals(parsed, abgeschnitten(aufgabe, stellen))) {
    return falsch(
      `Du hast abgeschnitten statt gerundet. Schau dir die ${(stellen + 1).toString()}. Stelle an: ab 5 wird aufgerundet.`,
      'abgeschnitten-statt-gerundet',
    );
  }

  if (kommaVerrutscht(parsed, task.solution) !== null) {
    return falsch(
      `Die Ziffern stimmen, aber das Komma sitzt falsch. Richtig ist ${formatDecimalText(task.solution)}.`,
      'komma-verrutscht',
    );
  }

  return unklar(
    `Noch nicht. Rechne zuerst ${aufgabe.n.toString()} : ${aufgabe.d.toString()} aus und schau dann auf die ${(stellen + 1).toString()}. Stelle.`,
  );
}

function checkPeriode(task: Task, parsed: Fraction): CheckResult {
  const aufgabe = task.given.aufgabe;
  if (aufgabe === undefined) return nurWert(task, parsed);

  if (equals(parsed, task.solution)) return richtig(parsed);

  const e = decimalExpansion(aufgabe);
  const eingabe = absBigInt(parsed.n).toString();

  if (e.preperiod !== '' && eingabe === e.preperiod) {
    return falsch(
      `${e.preperiod} steht vor der Periode und wiederholt sich nicht. Gesucht sind die Ziffern, die immer wiederkommen.`,
      'vorperiode-als-periode',
    );
  }

  if (eingabe === `${e.preperiod}${e.period}`) {
    return falsch(
      'Das ist die ganze Zahl hinter dem Komma. Gesucht ist nur der Teil, der sich wiederholt.',
      'ganze-dezimalzahl-statt-periode',
    );
  }

  return unklar(
    `Noch nicht. Teile ${aufgabe.n.toString()} durch ${aufgabe.d.toString()} und schau, ab wann sich die Ziffern wiederholen.`,
  );
}

function checkVergleich(task: Task, input: string): CheckResult {
  const links = task.given.links;
  const rechts = task.given.rechts;
  if (input.trim() === '') {
    return { correct: false, feedback: 'Wähl eines der drei Zeichen aus.', errorPattern: 'eingabe-leer' };
  }

  const wahl = gewaehlt(task, input);
  if (wahl.richtig) {
    return richtig(task.solution);
  }
  if (wahl.index < 0 || links === undefined || rechts === undefined) {
    return unklar('Wähl eines der drei Zeichen aus: kleiner, gleich oder größer.');
  }

  const richtigeOrdnung = compare(links, rechts);
  const gewaehlteOrdnung = wahl.index - 1;

  // Zuerst die genauere Erklärung: Wenn die Wahl genau dem Vergleich der
  // Nachkommastellen als ganze Zahlen entspricht, ist das der eigentliche
  // Denkfehler. Sonst bliebe nur das unspezifische „andersherum".
  if (gewaehlteOrdnung === vergleichNurNachkomma(links, rechts) && gewaehlteOrdnung !== richtigeOrdnung) {
    return falsch(
      `Nachkommastellen werden nicht wie ganze Zahlen verglichen. 0,5 ist größer als 0,25, obwohl 25 größer als 5 ist. Hier geht es um ${formatDecimalText(links)} und ${formatDecimalText(rechts)}.`,
      'nachkommastellen-als-zahl-verglichen',
    );
  }

  if (gewaehlteOrdnung === -richtigeOrdnung && richtigeOrdnung !== 0) {
    return falsch(
      `Andersherum. Die Spitze des Zeichens zeigt immer zur kleineren Zahl: ${formatDecimalText(links)} und ${formatDecimalText(rechts)}.`,
      'groesser-kleiner-verwechselt',
    );
  }

  return unklar(
    `Noch nicht. Schreib beide Zahlen als Dezimalzahl auf: ${formatDecimalText(links)} und ${formatDecimalText(rechts)}.`,
  );
}

/* ------------------------------------------------------------------ */

/** Liefert die Zehnerpotenz, um die die Antwort danebenliegt, sonst `null`. */
function kommaVerrutscht(parsed: Fraction, solution: Fraction): number | null {
  if (parsed.n === 0n) return null;
  for (const k of [-3, -2, -1, 1, 2, 3]) {
    const faktor = k > 0 ? fraction(10n ** BigInt(k), 1n) : fraction(1n, 10n ** BigInt(-k));
    if (equals(mul(parsed, faktor), solution)) return k;
  }
  return null;
}

/** true, wenn der Zähler einfach hinter das Komma geschrieben wurde. */
function istZaehlerHinterKomma(parsed: Fraction, aufgabe: Fraction): boolean {
  const zaehler = absBigInt(aufgabe.n).toString();
  const nenner = aufgabe.d.toString();
  const kandidaten = [
    fraction(BigInt(zaehler), 10n ** BigInt(zaehler.length)),
    fraction(BigInt(`${zaehler}${nenner}`), 10n ** BigInt(zaehler.length + nenner.length)),
  ];
  return kandidaten.some((kandidat) => equals(parsed, kandidat));
}

/** Der Wert, wenn nach `stellen` Nachkommastellen einfach abgeschnitten wird. */
function abgeschnitten(wert: Fraction, stellen: number): Fraction {
  const skala = 10n ** BigInt(stellen);
  return fraction((absBigInt(wert.n) * skala) / wert.d, skala);
}

/** Zählt die Stellen nach dem Komma in der Eingabe. */
function nachkommastellen(input: string): number {
  const treffer = /[,.](\d*)$/.exec(input.trim().replace(/\s/g, ''));
  return treffer?.[1]?.length ?? 0;
}

/**
 * Vergleicht nur die Nachkommastellen, als wären sie ganze Zahlen - also genau
 * der Denkfehler, der 0,25 für größer als 0,5 hält.
 */
function vergleichNurNachkomma(links: Fraction, rechts: Fraction): number {
  const ziffern = (f: Fraction): bigint => {
    const e = decimalExpansion(f);
    const text = `${e.preperiod}${e.period.repeat(4)}`.replace(/^0+(?=\d)/, '');
    return text === '' ? 0n : BigInt(text.slice(0, 6));
  };
  const a = ziffern(links);
  const b = ziffern(rechts);
  return a < b ? -1 : a > b ? 1 : 0;
}

function nurWert(task: Task, parsed: Fraction): CheckResult {
  if (equals(parsed, task.solution)) return richtig(parsed);
  return unklar('Noch nicht. Schau dir die Zahlen noch einmal an.');
}
