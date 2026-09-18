import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { Einstellungen } from './einstellungen.ts';
import { STANDARD, ausJson, ausUnbekannt, ladeEinstellungen, sichereEinstellungen } from './einstellungen.ts';

describe('Standard', () => {
  it('hat Töne aus und den Rest an', () => {
    expect(STANDARD).toEqual({ animationen: true, toene: false, motivation: true });
  });
});

describe('Lesen', () => {
  it('übersteht den Weg durch JSON (Property)', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (animationen, toene, motivation) => {
        const einstellungen: Einstellungen = { animationen, toene, motivation };
        expect(ausJson(JSON.stringify(einstellungen))).toEqual(einstellungen);
      }),
    );
  });

  it('ersetzt fehlende Felder durch den Standard', () => {
    expect(ausUnbekannt({ toene: true })).toEqual({ ...STANDARD, toene: true });
    expect(ausUnbekannt({})).toEqual(STANDARD);
  });

  it('ignoriert Felder mit falschem Typ', () => {
    expect(ausUnbekannt({ animationen: 'ja', toene: 1, motivation: null })).toEqual(STANDARD);
  });

  it('fällt bei Unsinn auf den Standard zurück, ohne zu werfen (Property)', () => {
    fc.assert(
      fc.property(fc.anything(), (roh) => {
        expect(() => ausUnbekannt(roh)).not.toThrow();
        const gelesen = ausUnbekannt(roh);
        expect(typeof gelesen.animationen).toBe('boolean');
        expect(typeof gelesen.toene).toBe('boolean');
        expect(typeof gelesen.motivation).toBe('boolean');
      }),
    );
  });

  it('verkraftet kaputten Text', () => {
    expect(ausJson('{')).toEqual(STANDARD);
    expect(ausJson('')).toEqual(STANDARD);
  });
});

describe('Ohne localStorage', () => {
  it('liefert den Standard und wirft beim Sichern nicht', () => {
    expect(typeof localStorage).toBe('undefined');
    expect(ladeEinstellungen()).toEqual(STANDARD);
    expect(() => {
      sichereEinstellungen({ animationen: false, toene: true, motivation: false });
    }).not.toThrow();
  });
});
