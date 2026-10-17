import { describe, expect, it } from 'vitest';
import type { Fortschritt, Stand } from './fortschritt.ts';
import { FORTSCHRITT_VERSION } from './fortschritt.ts';
import { speicherImArbeitsspeicher } from './speicher.ts';
import type { Ablage } from './sync.ts';
import { syncSpeicher, verschmelze } from './sync.ts';

const CODE = 'richtiger-code';

function stand(zuletzt: number, versuche = 1): Stand {
  return { versuche, richtig: versuche, aufAnhieb: versuche, serie: 1, box: 2, faellig: zuletzt + 1000, zuletzt };
}

function fortschritt(eintraege: Record<string, Stand>): Fortschritt {
  return { version: FORTSCHRITT_VERSION, staende: eintraege };
}

/** Nachbau des LernSync-Servers – gleiche Regeln wie der Worker. */
function fakeServer() {
  const daten = new Map<string, { data: unknown; updatedAt: number }>();
  let erreichbar = true;
  let anfragen = 0;
  const holen = ((eingabe: string, init?: RequestInit): Promise<Response> => {
    anfragen++;
    if (!erreichbar) return Promise.reject(new TypeError('Failed to fetch'));
    const url = new URL(eingabe);
    const kopf = new Headers(init?.headers);
    const antwort = (status: number, body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
    if (kopf.get('X-Familien-Code') !== CODE) return antwort(401, { error: 'Familien-Code falsch' });
    if (url.pathname === '/v1/check') return antwort(200, { ok: true });
    const schluessel = url.pathname;
    const methode = init?.method ?? 'GET';
    if (methode === 'GET') {
      const eintrag = daten.get(schluessel);
      return eintrag ? antwort(200, eintrag) : antwort(404, { error: 'kein Lernstand' });
    }
    if (methode === 'PUT') {
      const body = JSON.parse(typeof init?.body === 'string' ? init.body : 'null') as { data: unknown; updatedAt: number };
      const alt = daten.get(schluessel);
      if (alt && alt.updatedAt > body.updatedAt) return antwort(409, { status: 'server-neuer', ...alt });
      daten.set(schluessel, { data: body.data, updatedAt: body.updatedAt });
      return antwort(200, { status: 'gespeichert' });
    }
    if (methode === 'DELETE') {
      daten.delete(schluessel);
      return antwort(200, { status: 'gelöscht' });
    }
    return antwort(405, {});
  }) as unknown as typeof fetch;
  return {
    holen,
    daten,
    get anfragen() {
      return anfragen;
    },
    setzeErreichbar(wert: boolean) {
      erreichbar = wert;
    },
  };
}

function ablage(): Ablage {
  const inhalt = new Map<string, string>();
  return {
    getItem: (name) => inhalt.get(name) ?? null,
    setItem: (name, wert) => {
      inhalt.set(name, wert);
    },
    removeItem: (name) => {
      inhalt.delete(name);
    },
  };
}

function geraet(server: ReturnType<typeof fakeServer>, start: Fortschritt | null = null, uhr = { t: 1000 }) {
  const lokal = speicherImArbeitsspeicher(start);
  const sync = syncSpeicher(lokal, {
    server: 'https://sync.test',
    ablage: ablage(),
    holen: server.holen,
    jetzt: () => uhr.t,
    verzoegerung: 10_000_000,
  });
  return { lokal, sync, uhr };
}

const serverStand = (server: ReturnType<typeof fakeServer>) =>
  server.daten.get('/v1/mathemoritz/profile/standard')?.data as Fortschritt | undefined;

describe('verschmelze', () => {
  it('nimmt je Aufgabenart den zuletzt geübten Stand', () => {
    const a = fortschritt({ x: stand(10, 1), y: stand(50, 2) });
    const b = fortschritt({ x: stand(20, 3), z: stand(5, 4) });
    expect(verschmelze(a, b).staende).toEqual({ x: stand(20, 3), y: stand(50, 2), z: stand(5, 4) });
  });
});

describe('Sync-Speicher', () => {
  it('ohne Familien-Code: rein lokal, keine Anfrage', async () => {
    const server = fakeServer();
    const { sync } = geraet(server, fortschritt({ x: stand(1) }));
    expect(await sync.laden()).toEqual(fortschritt({ x: stand(1) }));
    await sync.sichern(fortschritt({ x: stand(2) }));
    await sync.jetztSenden();
    expect(server.anfragen).toBe(0);
    expect(sync.status()).toBe('aus');
  });

  it('falscher Code wird nicht gemerkt', async () => {
    const server = fakeServer();
    const { sync } = geraet(server);
    expect(await sync.codeSetzen('falsch')).toBe(false);
    expect(sync.hatCode()).toBe(false);
  });

  it('erstes Verbinden lädt den vorhandenen Fortschritt hoch, ein zweites Gerät bekommt ihn', async () => {
    const server = fakeServer();
    const a = geraet(server, fortschritt({ x: stand(100) }));
    await a.sync.laden();
    expect(await a.sync.codeSetzen(CODE)).toBe(true);
    expect(serverStand(server)).toEqual(fortschritt({ x: stand(100) }));

    const b = geraet(server);
    await b.sync.codeSetzen(CODE);
    expect(await b.sync.laden()).toEqual(fortschritt({ x: stand(100) }));
    expect(await b.lokal.laden()).toEqual(fortschritt({ x: stand(100) }));
  });

  it('ein Gerät mit eigenem Fortschritt wird beim ersten Verbinden zusammengeführt', async () => {
    const server = fakeServer();
    const a = geraet(server, fortschritt({ x: stand(100), y: stand(300) }));
    await a.sync.laden();
    await a.sync.codeSetzen(CODE);

    const b = geraet(server, fortschritt({ x: stand(200, 5), z: stand(50) }), { t: 5000 });
    await b.sync.laden();
    await b.sync.sichern(fortschritt({ x: stand(200, 5), z: stand(50) })); // noch ohne Code geübt
    const neu: Fortschritt[] = [];
    b.sync.beiNeuemStand((s) => neu.push(s));
    await b.sync.codeSetzen(CODE);

    const erwartet = fortschritt({ x: stand(200, 5), y: stand(300), z: stand(50) });
    expect(await b.lokal.laden()).toEqual(erwartet);
    expect(serverStand(server)).toEqual(erwartet);
    expect(neu).toEqual([erwartet]);
  });

  it('danach gewinnt der neuere Stand', async () => {
    const server = fakeServer();
    const a = geraet(server, fortschritt({ x: stand(1) }), { t: 1000 });
    await a.sync.laden();
    await a.sync.codeSetzen(CODE);
    const b = geraet(server, null, { t: 2000 });
    await b.sync.codeSetzen(CODE);
    await b.sync.laden();

    b.uhr.t = 3000;
    await b.sync.sichern(fortschritt({ x: stand(3000, 9) }));
    await b.sync.jetztSenden();

    // Gerät A öffnet die App erneut und übernimmt den Stand von B.
    expect(await a.sync.laden()).toEqual(fortschritt({ x: stand(3000, 9) }));

    // A hat einen älteren Stand offen (z. B. offline geübt) - B war neuer.
    a.uhr.t = 2500;
    server.setzeErreichbar(false);
    await a.sync.sichern(fortschritt({ x: stand(2500, 1) }));
    await a.sync.jetztSenden();
    expect(a.sync.status()).toBe('offline');
    b.uhr.t = 4000;
    server.setzeErreichbar(true);
    await b.sync.sichern(fortschritt({ x: stand(4000, 10) }));
    await b.sync.jetztSenden();
    await a.sync.jetztSenden(); // Server sagt 409 -> A übernimmt B
    expect(await a.lokal.laden()).toEqual(fortschritt({ x: stand(4000, 10) }));
  });

  it('ohne Netz läuft alles lokal weiter', async () => {
    const server = fakeServer();
    const a = geraet(server, fortschritt({ x: stand(1) }));
    await a.sync.laden();
    await a.sync.codeSetzen(CODE);
    server.setzeErreichbar(false);
    await a.sync.sichern(fortschritt({ x: stand(2) }));
    await a.sync.jetztSenden();
    expect(a.sync.status()).toBe('offline');
    expect(await a.lokal.laden()).toEqual(fortschritt({ x: stand(2) }));
    server.setzeErreichbar(true);
    await a.sync.laden();
    expect(serverStand(server)).toEqual(fortschritt({ x: stand(2) }));
  });

  it('Löschen entfernt den Stand auch auf dem Server', async () => {
    const server = fakeServer();
    const a = geraet(server, fortschritt({ x: stand(1) }));
    await a.sync.laden();
    await a.sync.codeSetzen(CODE);
    await a.sync.loeschen();
    expect(serverStand(server)).toBeUndefined();
    expect(await a.sync.laden()).toBeNull();
  });
});
