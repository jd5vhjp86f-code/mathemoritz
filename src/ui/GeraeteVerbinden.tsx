import { useEffect, useState } from 'react';
import type { SyncSpeicher, SyncStatus } from '../learning/sync.ts';

interface Props {
  readonly sync: SyncSpeicher;
}

const TEXT: Record<SyncStatus, string> = {
  aus: 'Nicht verbunden – der Fortschritt bleibt auf diesem Gerät.',
  ok: 'Verbunden ✓ – der Fortschritt wird auf euren Geräten abgeglichen.',
  offline: 'Gerade kein Netz – wird später abgeglichen.',
  'code-falsch': 'Der Familien-Code stimmt nicht mehr. Bitte neu eingeben.',
};

/**
 * Für Eltern: einmal pro Gerät den Familien-Code eingeben, dann wird der
 * Fortschritt zwischen den Geräten abgeglichen. Ohne Code bleibt alles lokal.
 */
export function GeraeteVerbinden({ sync }: Props) {
  const [status, setStatus] = useState<SyncStatus>(sync.status());
  const [code, setCode] = useState('');
  const [meldung, setMeldung] = useState('');
  const [prueft, setPrueft] = useState(false);

  useEffect(() => sync.beiStatus(setStatus), [sync]);

  return (
    <section className="card verbinden" aria-labelledby="verbinden-titel">
      <h3 id="verbinden-titel" className="schalter__titel">
        Geräte verbinden
      </h3>
      <p className="schalter__erklaerung">
        Für Eltern: Mit dem Familien-Code wird der Fortschritt auf allen euren Geräten abgeglichen. Einmal pro Gerät
        eingeben.
      </p>
      <form
        className="verbinden__zeile"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim() === '') return;
          setPrueft(true);
          setMeldung('Prüfe …');
          void sync.codeSetzen(code).then((ok) => {
            setPrueft(false);
            setMeldung(ok ? '' : 'Code falsch oder kein Netz.');
            if (ok) setCode('');
            setStatus(sync.status());
          });
        }}
      >
        <input
          className="verbinden__eingabe"
          type="password"
          autoComplete="off"
          placeholder="Familien-Code"
          aria-label="Familien-Code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
          }}
        />
        <button type="submit" className="knopf" disabled={prueft}>
          Verbinden
        </button>
      </form>
      <p className="hinweis" role="status">
        {meldung !== '' ? meldung : TEXT[status]}
      </p>
      {sync.hatCode() ? (
        <button
          type="button"
          className="knopf knopf--leise knopf--klein"
          onClick={() => {
            sync.codeEntfernen();
            setStatus('aus');
          }}
        >
          Dieses Gerät trennen
        </button>
      ) : null}
    </section>
  );
}
