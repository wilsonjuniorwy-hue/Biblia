import { BOOKS, TOTAL_CHAPTERS, bookOffset } from '../data/books';
import { addDays, diffDays } from './date';

/**
 * Sequência de dias lendo. Regra "dia de graça": perder UM dia isolado não quebra a
 * sequência (mas o dia perdido não conta); dois dias seguidos sem leitura quebram.
 * Hoje ainda pendente nunca é considerado falta.
 */
export function streaks(dates: Iterable<string>, today: string): { current: number; longest: number } {
  const set = new Set(dates);
  if (set.size === 0) return { current: 0, longest: 0 };
  const sorted = [...set].sort();

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && diffDays(prev, d) <= 2 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  let current = 0;
  let misses = 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  const first = sorted[0];
  while (diffDays(first, cursor) >= 0) {
    if (set.has(cursor)) { current++; misses = 0; }
    else if (++misses >= 2) break;
    cursor = addDays(cursor, -1);
  }
  return { current, longest };
}

export interface BookProgress { read: number; total: number; done: boolean; nextUnread: number | null }

export function bookProgress(read: Set<number>, book: number): BookProgress {
  const total = BOOKS[book].chapters;
  const off = bookOffset(book);
  let n = 0;
  let next: number | null = null;
  for (let c = 0; c < total; c++) {
    if (read.has(off + c)) n++;
    else if (next === null) next = c + 1;
  }
  return { read: n, total, done: n === total, nextUnread: next };
}

export function overall(read: Set<number>) {
  let at = 0, nt = 0;
  for (const id of read) {
    if (id < 0 || id >= TOTAL_CHAPTERS) continue;
    if (id < bookOffset(39)) at++; else nt++;
  }
  const atTotal = bookOffset(39);
  return {
    read: at + nt,
    total: TOTAL_CHAPTERS,
    pct: (at + nt) / TOTAL_CHAPTERS,
    at, atTotal, atPct: at / atTotal,
    nt, ntTotal: TOTAL_CHAPTERS - atTotal, ntPct: nt / (TOTAL_CHAPTERS - atTotal),
  };
}

/** Primeiro capítulo não lido depois de `afterId` (volta ao início se chegar ao fim). */
export function nextUnreadAfter(read: Set<number>, afterId: number): number | null {
  for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
    const id = (afterId + i) % TOTAL_CHAPTERS;
    if (!read.has(id)) return id;
  }
  return null;
}

export const pctText = (x: number) => `${Math.floor(x * 100)}%`;
