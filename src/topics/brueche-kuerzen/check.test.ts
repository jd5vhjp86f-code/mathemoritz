import { describe, expect, it } from 'vitest';
import type { Level, Task } from '../types.ts';
import { generate } from './generate.ts';
import { check } from './check.ts';
import { createRandom } from '../../learning/random.ts';
import { formatFractionText } from '../../core/format.ts';
import { fraction } from '../../core/fraction.ts';
import type { Fraction } from '../../core/fraction.ts';

/** Sucht die erste Aufgabe einer Variante. Die Generierung ist deterministisch. */
function findTask(level: Level, variant: string): Task {
  for (let seed = 0; seed < 2000; seed += 1) {
    const task = generate(level, createRandom(seed));
    if (task.variant === variant) return task;
  }
  throw new Error(`Keine Aufgabe der Variante ${variant} auf Stufe ${String(level)} gefunden.`);
}

function need(task: Task, key: string): Fraction {
  const value = task.given[key];
  if (value === undefined) throw new Error(`Aufgabe ohne '${key}'.`);
  return value;
}

describe('Eingabe lesen', () => {
  const task = findTask(1, 'kuerzen');

  it('meldet eine leere Eingabe freundlich', () => {
    const result = check(task, '   ');
    expect(result.correct).toBe(false);
    expect(result.errorPattern).toBe('eingabe-leer');
    expect(result.feedback).not.toMatch(/falsch/i);
  });

  it('meldet unlesbare Eingaben mit einem Beispiel', () => {
    const result = check(task, 'weiß nicht');
    expect(result.errorPattern).toBe('eingabe-unlesbar');
    expect(result.feedback).toContain('3/4');
  });

  it('weist Kommazahlen ab, wo ein Bruch gefragt ist', () => {
    const result = check(task, '0,75');
    expect(result.errorPattern).toBe('dezimal-statt-bruch');
  });

  it('akzeptiert Leerzeichen um den Bruchstrich', () => {
    expect(check(task, ` ${formatFractionText(task.solution)} `).correct).toBe(true);
  });
});

describe('Kuerzen', () => {
  const task = findTask(1, 'kuerzen');
  const aufgabe = need(task, 'aufgabe');
  const basis = need(task, 'basis');
  const k = aufgabe.d / basis.d;

  it('nimmt die vollständig gekürzte Antwort an', () => {
    const result = check(task, formatFractionText(basis));
    expect(result.correct).toBe(true);
    expect(result.errorPattern).toBeNull();
  });

  it('erkennt eine nur teilweise gekürzte Antwort', () => {
    const teilweise = fraction(basis.n * 2n, basis.d * 2n);
    if (teilweise.d === aufgabe.d) return; // wäre die Aufgabe selbst
    const result = check(task, formatFractionText(teilweise));
    expect(result.correct).toBe(false);
    expect(result.errorPattern).toBe('nicht-vollstaendig-gekuerzt');
    expect(result.feedback).toContain(formatFractionText(basis));
  });

  it('erkennt, wenn nur der Zähler geteilt wurde', () => {
    const result = check(task, formatFractionText(fraction(basis.n, aufgabe.d)));
    expect(result.errorPattern).toBe('nur-zaehler-gekuerzt');
    expect(result.feedback).toContain('beide');
  });

  it('erkennt, wenn nur der Nenner geteilt wurde', () => {
    const result = check(task, formatFractionText(fraction(aufgabe.n, basis.d)));
    expect(result.errorPattern).toBe('nur-nenner-gekuerzt');
  });

  it('erkennt vertauschten Zähler und Nenner', () => {
    const result = check(task, formatFractionText(fraction(basis.d, basis.n)));
    expect(result.errorPattern).toBe('zaehler-nenner-vertauscht');
  });

  it('erkennt Subtrahieren statt Teilen', () => {
    if (aufgabe.n <= k || aufgabe.d <= k) return;
    const result = check(task, formatFractionText(fraction(aufgabe.n - k, aufgabe.d - k)));
    expect(result.errorPattern).toBe('subtrahiert-statt-geteilt');
  });

  it('bleibt auch ohne erkanntes Muster konkret', () => {
    const result = check(task, '97/101');
    expect(result.correct).toBe(false);
    expect(result.errorPattern).toBeNull();
    expect(result.feedback).toContain(String(aufgabe.d));
  });
});

describe('Erweitern', () => {
  const task = findTask(1, 'erweitern');
  const basis = need(task, 'basis');
  const erweitert = need(task, 'erweitert');
  const k = erweitert.d / basis.d;

  it('nimmt den richtig erweiterten Bruch an', () => {
    expect(check(task, formatFractionText(erweitert)).correct).toBe(true);
  });

  it('weist den wertgleichen, aber nicht erweiterten Bruch zurück', () => {
    const result = check(task, formatFractionText(basis));
    expect(result.correct).toBe(false);
    expect(result.errorPattern).toBe('nicht-erweitert');
  });

  it('erkennt, wenn nur der Zähler erweitert wurde', () => {
    const result = check(task, formatFractionText(fraction(erweitert.n, basis.d)));
    expect(result.errorPattern).toBe('nur-zaehler-erweitert');
  });

  it('erkennt, wenn nur der Nenner erweitert wurde', () => {
    const result = check(task, formatFractionText(fraction(basis.n, erweitert.d)));
    expect(result.errorPattern).toBe('nur-nenner-erweitert');
  });

  it('erkennt Addieren statt Multiplizieren', () => {
    const falsch = fraction(basis.n + k, basis.d + k);
    const result = check(task, formatFractionText(falsch));
    expect(result.errorPattern).toBe('addiert-statt-multipliziert');
  });

  it('nennt bei falschem Nenner den geforderten Nenner', () => {
    const result = check(task, '1/1000');
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain(String(erweitert.d));
  });
});

describe('Luecke', () => {
  const task = findTask(2, 'luecke');
  const basis = need(task, 'basis');
  const erweitert = need(task, 'erweitert');
  const k = erweitert.d / basis.d;

  it('nimmt den fehlenden Zähler an', () => {
    expect(check(task, erweitert.n.toString()).correct).toBe(true);
  });

  it('weist Brüche ab, wo eine ganze Zahl gefragt ist', () => {
    const result = check(task, '3/4');
    expect(result.errorPattern).toBe('ganze-zahl-erwartet');
  });

  it('erkennt den Erweiterungsfaktor als Antwort und lobt den Ansatz', () => {
    if (k === erweitert.n) return;
    const result = check(task, k.toString());
    expect(result.errorPattern).toBe('faktor-statt-zaehler');
    expect(result.feedback).toContain('richtig erkannt');
  });

  it('erkennt den nicht erweiterten Zähler', () => {
    const result = check(task, basis.n.toString());
    expect(result.errorPattern).toBe('zaehler-nicht-erweitert');
  });
});

describe('Erweiterungsfaktor', () => {
  const task = findTask(3, 'faktor');
  const basis = need(task, 'basis');
  const erweitert = need(task, 'erweitert');

  it('nimmt den Faktor an', () => {
    const k = erweitert.d / basis.d;
    expect(check(task, k.toString()).correct).toBe(true);
  });

  it('erkennt einen Nenner statt des Faktors', () => {
    const result = check(task, erweitert.d.toString());
    expect(result.errorPattern).toBe('nenner-statt-faktor');
  });
});

describe('Rueckmeldungen', () => {
  it('sagt nie nur "Falsch"', () => {
    for (let seed = 0; seed < 150; seed += 1) {
      const task = generate(((seed % 3) + 1) as Level, createRandom(seed));
      for (const eingabe of ['', 'abc', '1/1000', '0', '999']) {
        const result = check(task, eingabe);
        expect(result.feedback.trim().length).toBeGreaterThan(10);
        expect(result.feedback.toLowerCase()).not.toBe('falsch');
        expect(result.feedback).not.toMatch(/dumm|bloed|schlecht/i);
      }
    }
  });
});
