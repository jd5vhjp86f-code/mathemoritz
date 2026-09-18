import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './App.tsx';

describe('App-Huelle', () => {
  const markup = renderToStaticMarkup(<App />);

  it('rendert ohne Fehler', () => {
    expect(markup).toContain('Mathe-Trainer');
  });

  it('nennt den Schwerpunkt', () => {
    expect(markup).toContain('Bruchrechnen');
  });

  it('bindet nichts Externes ein', () => {
    expect(markup).not.toMatch(/https?:\/\//);
  });
});
