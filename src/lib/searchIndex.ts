import { loadBook, type TranslationId } from '../data/bible';
import { BOOKS, normalize } from '../data/books';

export interface Entry { book: number; chapter: number; verse: number; text: string; norm: string }

// Guarda a promessa em andamento: remontagens rápidas reaproveitam a mesma indexação.
const indexCache = new Map<TranslationId, Promise<Entry[]>>();
const progressListeners = new Set<(tr: TranslationId, n: number) => void>();

export function onIndexProgress(fn: (tr: TranslationId, n: number) => void): () => void {
  progressListeners.add(fn);
  return () => { progressListeners.delete(fn); };
}

export function buildIndex(tr: TranslationId): Promise<Entry[]> {
  let p = indexCache.get(tr);
  if (!p) {
    p = (async () => {
      const out: Entry[] = [];
      for (let b = 0; b < BOOKS.length; b++) {
        const book = await loadBook(tr, b);
        book.forEach((ch, ci) => ch.forEach((text, vi) => out.push({ book: b, chapter: ci + 1, verse: vi + 1, text, norm: normalize(text) })));
        progressListeners.forEach((l) => l(tr, b + 1));
      }
      return out;
    })();
    p.catch(() => indexCache.delete(tr)); // permite tentar de novo
    indexCache.set(tr, p);
  }
  return p;
}

/** Versículos que contêm TODOS os termos (já normalizados). */
export function searchVerses(index: Entry[], terms: string[], max: number): { list: Entry[]; total: number } {
  const list: Entry[] = [];
  let total = 0;
  if (terms.length === 0) return { list, total };
  for (const e of index) {
    if (terms.every((t) => e.norm.includes(t))) {
      total++;
      if (list.length < max) list.push(e);
    }
  }
  return { list, total };
}

export const searchTerms = (q: string) => normalize(q).split(' ').filter((t) => t.length >= 2);
