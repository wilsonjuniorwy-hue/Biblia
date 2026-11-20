import { BOOKS, TOTAL_CHAPTERS, bookOffset, chapterWeight } from '../data/books';
import { addDays, diffDays, weekdayOf } from './date';

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

/** Tempo estimado de leitura em minutos (média de ~20 palavras por versículo, ~170 palavras/min). */
export function estimateMinutes(chapterIds: number[]): number {
  const verses = chapterIds.reduce((a, id) => a + chapterWeight(id), 0);
  return verses === 0 ? 0 : Math.max(1, Math.round((verses * 20) / 170));
}

/** Quantos capítulos foram lidos em cada dia (o log tem uma linha por capítulo/dia). */
export function dayCounts(dates: Iterable<string>): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of dates) m.set(d, (m.get(d) ?? 0) + 1);
  return m;
}

export interface HeatCell { date: string; count: number; level: 0 | 1 | 2 | 3 | 4; future: boolean }

const levelOf = (n: number): HeatCell['level'] => (n <= 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);

/** Colunas = semanas (segunda a domingo), da mais antiga para a atual. */
export function heatmapWeeks(counts: Map<string, number>, today: string, weeks = 12): HeatCell[][] {
  const dow = (weekdayOf(today) + 6) % 7;               // segunda = 0
  const start = addDays(today, -dow - (weeks - 1) * 7);  // segunda da semana mais antiga
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d);
      const count = counts.get(date) ?? 0;
      return { date, count, level: levelOf(count), future: diffDays(today, date) > 0 };
    }));
}

/** Dias lidos na semana atual (segunda a domingo). */
export function weekProgress(dates: Iterable<string>, today: string): { days: number; flags: boolean[]; weekStart: string } {
  const set = new Set(dates);
  const dow = (weekdayOf(today) + 6) % 7;
  const weekStart = addDays(today, -dow);
  const flags = Array.from({ length: 7 }, (_, i) => set.has(addDays(weekStart, i)));
  return { days: flags.filter(Boolean).length, flags, weekStart };
}
