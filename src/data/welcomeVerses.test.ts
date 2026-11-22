import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { WELCOME_STEP, WELCOME_VERSES, welcomeVerseOfTheDay } from './welcomeVerses';
import { VERSE_COUNTS } from './books';

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

describe('frases de entrada', () => {
  it('são referências válidas e únicas', () => {
    const keys = WELCOME_VERSES.map((r) => `${r.book}:${r.chapter}:${r.from}-${r.to}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of WELCOME_VERSES) expect(VERSE_COUNTS[r.book][r.chapter - 1]).toBeGreaterThanOrEqual(r.to);
  });
  it('cabem na tela de entrada em qualquer tradução (≤ 160 caracteres)', () => {
    for (const tr of ['blivre', 'tb', 'arc']) {
      const cache = new Map<number, string[][]>();
      for (const r of WELCOME_VERSES) {
        if (!cache.has(r.book)) cache.set(r.book, JSON.parse(readFileSync(`public/bible/${tr}/${r.book}.json`, 'utf8')));
        const text = cache.get(r.book)![r.chapter - 1].slice(r.from - 1, r.to).join(' ');
        expect(text.length, `${tr} ${r.book}:${r.chapter}:${r.from}`).toBeLessThanOrEqual(160);
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });
  it('muda todo dia e percorre a lista toda antes de repetir', () => {
    expect(gcd(WELCOME_STEP, WELCOME_VERSES.length)).toBe(1);
    for (let d = 0; d < 400; d++) expect(welcomeVerseOfTheDay(d)).not.toBe(welcomeVerseOfTheDay(d + 1));
    const seen = new Set(Array.from({ length: WELCOME_VERSES.length }, (_, d) => welcomeVerseOfTheDay(d)));
    expect(seen.size).toBe(WELCOME_VERSES.length);
    expect(WELCOME_VERSES).toContain(welcomeVerseOfTheDay(-5));
  });
});
