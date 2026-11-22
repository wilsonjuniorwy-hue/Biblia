import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { VERSE_COUNTS } from './books';

const load = (tr: string, i: number): string[][] => JSON.parse(readFileSync(`public/bible/${tr}/${i}.json`, 'utf8'));

describe('texto da Bíblia gerado', () => {
  for (const tr of ['tb', 'arc', 'blivre']) {
    it(`${tr}: sem resíduos de formatação e com a estrutura esperada`, () => {
      for (let b = 0; b < 66; b++) {
        const chapters = load(tr, b);
        expect(chapters.map((c) => c.length)).toEqual(VERSE_COUNTS[b]);
        for (const c of chapters) for (const v of c) {
          expect(v).not.toMatch(/\*/);
          expect(v).not.toMatch(/\s[,.;:!?]/);
          expect(v).not.toMatch(/[,;:!?][A-Za-zÀ-ú]/);
          expect(v).not.toMatch(/^\s|\s$|\s\s/);
        }
      }
    });
  }
});
