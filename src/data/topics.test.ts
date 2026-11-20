import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TOPICS, VERSE_POOL_SIZE } from './topics';
import { VERSE_COUNTS } from './books';

function verses(tr: string, book: number): string[][] {
  return JSON.parse(readFileSync(`public/bible/${tr}/${book}.json`, 'utf8'));
}

describe('tópicos', () => {
  it('todas as referências existem nas duas traduções', () => {
    for (const tp of TOPICS) for (const r of tp.refs) {
      const label = `${tp.id} ${r.book}:${r.chapter}:${r.from}-${r.to}`;
      expect(r.chapter >= 1 && r.chapter <= VERSE_COUNTS[r.book].length, label).toBe(true);
      expect(r.from >= 1 && r.to >= r.from, label).toBe(true);
      for (const tr of ['tb', 'arc']) {
        const ch = verses(tr, r.book)[r.chapter - 1];
        expect(ch && ch.length >= r.to, `${tr} ${label}`).toBe(true);
      }
    }
  });
  it('ids únicos e mais de 50 versículos distintos', () => {
    expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
    expect(VERSE_POOL_SIZE).toBeGreaterThan(50);
  });
});
