import { describe, expect, it } from 'vitest';
import { DEVOTIONALS, devotionalMinutes, devotionalOfTheDay } from './devotionals';
import { VERSE_COUNTS } from './books';

describe('devocionais', () => {
  it('têm ids únicos, referência válida e conteúdo completo', () => {
    expect(new Set(DEVOTIONALS.map((d) => d.id)).size).toBe(DEVOTIONALS.length);
    for (const d of DEVOTIONALS) {
      const { book, chapter, from, to } = d.ref;
      expect(VERSE_COUNTS[book]?.[chapter - 1]).toBeGreaterThanOrEqual(to);
      expect(from).toBeGreaterThanOrEqual(1);
      expect(to).toBeGreaterThanOrEqual(from);
      expect(d.title.trim()).not.toBe('');
      expect(d.paragraphs.length).toBeGreaterThanOrEqual(4);
      expect(d.question.trim()).not.toBe('');
      expect(d.prayer.trim()).not.toBe('');
      // não pode ser curto demais: pelo menos ~400 palavras de reflexão
      expect(d.paragraphs.join(' ').split(/\s+/).length).toBeGreaterThanOrEqual(400);
      expect(devotionalMinutes(d)).toBeGreaterThanOrEqual(2);
    }
  });
  it('escolhe o devocional do dia em ciclo, mesmo com índice negativo', () => {
    expect(devotionalOfTheDay(0)).toBe(DEVOTIONALS[0]);
    expect(DEVOTIONALS).toContain(devotionalOfTheDay(-3));
    expect(DEVOTIONALS).toContain(devotionalOfTheDay(400));
  });
});
