import { describe, expect, it } from 'vitest';
import { BOOK_INTROS } from './bookIntros';
import { BOOKS } from './books';

describe('introdução dos livros', () => {
  it('tem uma entrada para cada um dos 66 livros, todas completas', () => {
    expect(BOOK_INTROS.length).toBe(BOOKS.length);
    BOOK_INTROS.forEach((b, i) => {
      for (const k of ['author', 'when', 'theme', 'summary'] as const) expect(b[k].trim().length, `${BOOKS[i].name}.${k}`).toBeGreaterThan(3);
      expect(b.summary.length, BOOKS[i].name).toBeGreaterThan(40);
      expect(b.summary.length, BOOKS[i].name).toBeLessThan(260);
    });
  });
  it('autores conferem em livros conhecidos', () => {
    const by = (abbr: string) => BOOK_INTROS[BOOKS.findIndex((b) => b.abbr === abbr)];
    expect(by('Gn').author).toContain('Moisés');
    expect(by('Rm').author).toBe('Paulo');
    expect(by('Jo').author).toContain('João');
    expect(by('Ap').author).toContain('João');
    expect(by('Mt').author).toContain('Mateus');
    expect(by('Lc').author).toContain('Lucas');
    expect(by('At').author).toBe('Lucas');
    expect(by('Tg').author).toContain('Tiago');
    expect(by('Is').author).toBe('Isaías');
    expect(by('Hb').author).toBe('Desconhecido');
  });
});
