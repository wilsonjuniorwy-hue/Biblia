import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import type { TranslationId } from '../data/bible';
import type { PlanConfig } from '../data/plans';
import { TOTAL_CHAPTERS } from '../data/books';
import { todayStr } from '../lib/date';

export interface ProgressRow { id: number; readAt: number; date: string }
export interface LogRow { key: string; date: string; chapter: number }
export interface MarkRow {
  key: string; // livro:capítulo:versículo
  book: number; chapter: number; verse: number;
  fav: 0 | 1;
  color: string | null;
  note: string;
  updatedAt: number;
}
export interface KV { key: string; value: unknown }

export type Theme = 'auto' | 'light' | 'dark' | 'sepia';
export interface Settings {
  translation: TranslationId;
  fontSize: number;
  theme: Theme;
  autoMark: boolean;
  reminderTime: string; // "HH:MM" ou "" (desligado)
  plan: PlanConfig | null;
  lastRead: { book: number; chapter: number } | null;
  completedReadings: number;
  lastBackupAt: number | null;
  startedAt: number;
}

export const DEFAULTS: Settings = {
  translation: 'tb',
  fontSize: 19,
  theme: 'auto',
  autoMark: false,
  reminderTime: '',
  plan: null,
  lastRead: null,
  completedReadings: 0,
  lastBackupAt: null,
  startedAt: 0,
};

class AppDB extends Dexie {
  progress!: Table<ProgressRow, number>;
  log!: Table<LogRow, string>;
  marks!: Table<MarkRow, string>;
  kv!: Table<KV, string>;
  constructor() {
    super('lampada');
    this.version(1).stores({
      progress: 'id',
      log: 'key, date, chapter',
      marks: 'key, fav, [book+chapter]',
      kv: 'key',
    });
  }
}
export const db = new AppDB();

// ---------------------------------------------------------------- Configurações
export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.kv.put({ key, value });
}

export function useSettings(): { settings: Settings; ready: boolean } {
  const rows = useLiveQuery(() => db.kv.toArray(), []);
  return useMemo(() => {
    const s: Settings = { ...DEFAULTS };
    if (rows) for (const r of rows) if (r.key in DEFAULTS) (s as unknown as Record<string, unknown>)[r.key] = r.value;
    return { settings: s, ready: rows !== undefined };
  }, [rows]);
}

// ------------------------------------------------------------------- Progresso
export function useProgress(): { read: Set<number>; rows: ProgressRow[]; ready: boolean } {
  const rows = useLiveQuery(() => db.progress.toArray(), []);
  return useMemo(() => ({
    read: new Set((rows ?? []).map((r) => r.id)),
    rows: rows ?? [],
    ready: rows !== undefined,
  }), [rows]);
}

export function useReadDates(): string[] {
  const rows = useLiveQuery(() => db.log.toArray(), []);
  return useMemo(() => (rows ?? []).map((r) => r.date), [rows]);
}

const valid = (id: number) => Number.isInteger(id) && id >= 0 && id < TOTAL_CHAPTERS;

export async function markRead(ids: number[]) {
  const date = todayStr();
  const now = Date.now();
  const list = ids.filter(valid);
  await db.transaction('rw', db.progress, db.log, async () => {
    const existing = new Set((await db.progress.bulkGet(list)).filter(Boolean).map((r) => r!.id));
    const fresh = list.filter((id) => !existing.has(id));
    await db.progress.bulkPut(fresh.map((id) => ({ id, readAt: now, date })));
    await db.log.bulkPut(fresh.map((id) => ({ key: `${date}:${id}`, date, chapter: id })));
  });
}

export async function unmarkRead(ids: number[]) {
  const list = ids.filter(valid);
  await db.transaction('rw', db.progress, db.log, async () => {
    const rows = (await db.progress.bulkGet(list)).filter(Boolean) as ProgressRow[];
    await db.progress.bulkDelete(list);
    await db.log.bulkDelete(rows.map((r) => `${r.date}:${r.id}`));
  });
}

/** Conclui a leitura completa: soma 1 ao contador e zera o progresso para uma nova leitura. */
export async function finishReading() {
  await db.transaction('rw', db.progress, db.kv, async () => {
    const row = await db.kv.get('completedReadings');
    await db.kv.put({ key: 'completedReadings', value: ((row?.value as number) ?? 0) + 1 });
    await db.progress.clear();
  });
}

// ------------------------------------------------------------- Marcações de versículo
export const markKey = (b: number, c: number, v: number) => `${b}:${c}:${v}`;

export function useChapterMarks(book: number, chapter: number): Map<number, MarkRow> {
  const rows = useLiveQuery(() => db.marks.where('[book+chapter]').equals([book, chapter]).toArray(), [book, chapter]);
  return useMemo(() => new Map((rows ?? []).map((r) => [r.verse, r])), [rows]);
}

export async function patchMark(book: number, chapter: number, verse: number, patch: Partial<Pick<MarkRow, 'fav' | 'color' | 'note'>>) {
  const key = markKey(book, chapter, verse);
  await db.transaction('rw', db.marks, async () => {
    const cur = (await db.marks.get(key)) ?? { key, book, chapter, verse, fav: 0 as const, color: null, note: '', updatedAt: 0 };
    const next: MarkRow = { ...cur, ...patch, updatedAt: Date.now() };
    if (!next.fav && !next.color && !next.note.trim()) await db.marks.delete(key);
    else await db.marks.put(next);
  });
}

// ----------------------------------------------------------------------- Backup
export interface BackupFile {
  app: 'lampada';
  version: 1;
  exportedAt: string;
  progress: ProgressRow[];
  log: LogRow[];
  marks: MarkRow[];
  kv: KV[];
}

export async function exportBackup(): Promise<BackupFile> {
  const [progress, log, marks, kv] = await Promise.all([db.progress.toArray(), db.log.toArray(), db.marks.toArray(), db.kv.toArray()]);
  return { app: 'lampada', version: 1, exportedAt: new Date().toISOString(), progress, log, marks, kv };
}

export function validateBackup(x: unknown): x is BackupFile {
  const b = x as BackupFile;
  return !!b && b.app === 'lampada' && b.version === 1 &&
    Array.isArray(b.progress) && Array.isArray(b.log) && Array.isArray(b.marks) && Array.isArray(b.kv) &&
    b.progress.every((r) => valid(r?.id) && typeof r.date === 'string') &&
    b.log.every((r) => typeof r?.key === 'string' && typeof r.date === 'string' && valid(r.chapter)) &&
    b.marks.every((r) => typeof r?.key === 'string' && Number.isInteger(r.book) && Number.isInteger(r.chapter) && Number.isInteger(r.verse)) &&
    b.kv.every((r) => typeof r?.key === 'string');
}

export async function importBackup(b: BackupFile) {
  await db.transaction('rw', db.progress, db.log, db.marks, db.kv, async () => {
    await Promise.all([db.progress.clear(), db.log.clear(), db.marks.clear(), db.kv.clear()]);
    await db.progress.bulkPut(b.progress);
    await db.log.bulkPut(b.log);
    await db.marks.bulkPut(b.marks);
    await db.kv.bulkPut(b.kv);
  });
}

export async function resetAll() {
  await db.transaction('rw', db.progress, db.log, db.marks, db.kv, async () => {
    await Promise.all([db.progress.clear(), db.log.clear(), db.marks.clear(), db.kv.clear()]);
  });
}
