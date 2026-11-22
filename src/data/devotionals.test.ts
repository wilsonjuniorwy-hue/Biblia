import { describe, expect, it } from 'vitest';
import { DEVOTIONALS, DEVOTIONAL_THEMES, devotionalById, devotionalFolders, devotionalMinutes, devotionalOfTheDay } from './devotionals';
import { parseVerseRef } from './topics';
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
  it('toda pasta tem nome e a biblioteca junta todos os devocionais, achados pelo id', () => {
    for (const d of DEVOTIONALS) {
      expect(DEVOTIONAL_THEMES.some((t) => t.id === d.theme)).toBe(true);
      expect(devotionalById(d.id)).toBe(d);
    }
    const folders = devotionalFolders();
    expect(folders.flatMap((f) => f.items)).toHaveLength(DEVOTIONALS.length);
    expect(folders).toHaveLength(DEVOTIONAL_THEMES.length);
    expect(devotionalById('nao-existe')).toBeUndefined();
  });
});

describe('temas', () => {
  it('têm id único, nome e um roteiro de passagens válidas, sem repetir devocionais já escritos', () => {
    expect(new Set(DEVOTIONAL_THEMES.map((t) => t.id)).size).toBe(DEVOTIONAL_THEMES.length);
    const written = new Set(DEVOTIONALS.map((d) => `${d.ref.book}:${d.ref.chapter}:${d.ref.from}-${d.ref.to}`));
    const planned = new Set<string>();
    for (const t of DEVOTIONAL_THEMES) {
      expect(t.name.trim()).not.toBe('');
      expect(t.blurb.trim()).not.toBe('');
      for (const p of t.planned) {
        const r = parseVerseRef(p); // lança se a abreviação ou o formato estiver errado
        const k = `${r.book}:${r.chapter}:${r.from}-${r.to}`;
        expect(written.has(k), `${p} já foi escrito`).toBe(false);
        expect(planned.has(k), `${p} repetido no roteiro`).toBe(false);
        planned.add(k);
      }
    }
  });
});
