# Mathe-Trainer

Übungs-App für Mathematik, Gymnasium Klasse 7. Schwerpunkt Bruchrechnen.

Läuft im Browser, funktioniert offline, speichert ausschließlich lokal und
schickt keine Daten nach außen.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run lint     # ESLint
npm test         # Vitest inklusive fast-check
npm run build    # Typprüfung und Produktions-Build
```

Vor jedem Commit laufen `npm run lint`, `npm test` und `npm run build`.

## Aufbau

- `src/core/` - exakte Bruchrechnung auf `bigint` und deutsche Schreibweise.
  Für Mathe-Logik werden nie Floats benutzt.
- `src/learning/` - deterministischer Zufall und die Übungsschleife als reine
  Funktionen, ohne React.
- `src/topics/` - ein Ordner je Thema, registriert in `src/topics/index.ts`.
  Daneben die gemeinsamen Bausteine: `antwort.ts` (Eingaben lesen),
  `aufgabe.ts` (Aufgaben bauen), `fehlermuster.ts` (Katalog).
- `src/ui/` - React-Komponenten ohne eigene Rechen-Logik.
- `docs/FEHLERMUSTER.md` - erkannte Fehlermuster und die passenden
  Rückmeldungen. Ein Test hält Code und Doku zusammen.

Der vollständige Plan steht in [PLAN.md](PLAN.md), die Projektregeln in
[CLAUDE.md](CLAUDE.md).

## Deployment

Push auf `main` startet GitHub Actions: Lint, Tests, Build und Deploy nach
GitHub Pages unter `mathe.rosenbaum.hamburg`. Die Datei `public/CNAME` hält
die Domain und darf nicht gelöscht werden.
