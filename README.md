# Mathe-Trainer

Uebungs-App fuer Mathematik, Gymnasium Klasse 7. Schwerpunkt Bruchrechnen.

Laeuft im Browser, funktioniert offline, speichert ausschliesslich lokal und
schickt keine Daten nach aussen.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run lint     # ESLint
npm test         # Vitest inklusive fast-check
npm run build    # Typpruefung und Produktions-Build
```

Vor jedem Commit laufen `npm run lint`, `npm test` und `npm run build`.

## Aufbau

- `src/core/` - exakte Bruchrechnung auf `bigint` und deutsche Schreibweise.
  Fuer Mathe-Logik werden nie Floats benutzt.
- `src/learning/` - Aufgabenauswahl und Lernfortschritt.
- `src/topics/` - ein Ordner je Thema, registriert in `src/topics/index.ts`.
- `src/ui/` - React-Komponenten ohne eigene Rechen-Logik.
- `docs/FEHLERMUSTER.md` - erkannte Fehlermuster und die passenden
  Rueckmeldungen.

Der vollstaendige Plan steht in [PLAN.md](PLAN.md), die Projektregeln in
[CLAUDE.md](CLAUDE.md).

## Deployment

Push auf `main` startet GitHub Actions: Lint, Tests, Build und Deploy nach
GitHub Pages unter `mathe.rosenbaum.hamburg`. Die Datei `public/CNAME` haelt
die Domain und darf nicht geloescht werden.
