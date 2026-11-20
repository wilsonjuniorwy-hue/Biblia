import Dexie, { type Table } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import type { TranslationId } from '../data/bible';
import type { PlanConfig } from '../data/plans';
import { TOTAL_CHAPTERS } from '../data/books';
import { todayStr } from '../lib/date';
import { isValidDateStr, isValidEvent, isValidMark, sanitizeEvent, sanitizeMark, sanitizeSettings } from '../lib/sanitize';

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
/** Evento da agenda do próprio usuário (cultos, reuniões, compromissos da igreja). */
export interface EventRow {
  id: string;
  title: string;
  date: string;   // AAAA-MM-DD (para evento semanal, é a 1ª data: define o dia da semana)
  time: string;   // HH:MM ou '' (dia inteiro)
  place: string;
  notes: string;
  weekly: 0 | 1;  // repete toda semana
  createdAt: number;
}

export type Theme = 'auto' | 'light' | 'dark' | 'sepia';
export type ReaderFont = 'serif' | 'sans';
export type LineHeight = 'compact' | 'normal' | 'wide';
export type TextWidth = 'narrow' | 'normal' | 'wide';
export type StartArea = 'ask' | 'igreja' | 'estudos';
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
  readerFont: ReaderFont;
  lineHeight: LineHeight;
  textWidth: TextWidth;
  /** Mostra as duas traduções, verso a verso. */
  compare: boolean;
  /** Para onde o app abre. */
  startArea: StartArea;
  lastArea: 'igreja' | 'estudos' | null;
  /** Meta de dias de leitura por semana. */
  weeklyGoal: number;
  onboarded: boolean;
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
  readerFont: 'serif',
  lineHeight: 'normal',
  textWidth: 'normal',
  compare: false,
  startArea: 'ask',
  lastArea: null,
  weeklyGoal: 5,
  onboarded: false,
};

class AppDB extends Dexie {
  progress!: Table<ProgressRow, number>;
  log!: Table<LogRow, string>;
  marks!: Table<MarkRow, string>;
  kv!: Table<KV, string>;
  events!: Table<EventRow, string>;
  constructor() {
    super('lampada');
    this.version(1).stores({
      progress: 'id',
      log: 'key, date, chapter',
      marks: 'key, fav, [book+chapter]',
      kv: 'key',
    });
    // v2: agenda de eventos (só acrescenta uma tabela; nada do que já existe muda)
    this.version(2).stores({ events: 'id, date' });
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
    const raw: Record<string, unknown> = {};
    if (rows) for (const r of rows) if (Object.hasOwn(DEFAULTS, r.key)) raw[r.key] = r.value;
    // Nunca confia no que está gravado: valores inválidos viram o padrão
    return { settings: sanitizeSettings(raw, DEFAULTS), ready: rows !== undefined };
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
  return useMemo(() => new Map((rows ?? []).filter(isValidMark).map((r) => [r.verse, r])), [rows]);
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
  /** Opcional: backups antigos não têm eventos. */
  events?: EventRow[];
}

export async function exportBackup(): Promise<BackupFile> {
  const [progress, log, marks, kv, events] = await Promise.all([db.progress.toArray(), db.log.toArray(), db.marks.toArray(), db.kv.toArray(), db.events.toArray()]);
  return { app: 'lampada', version: 1, exportedAt: new Date().toISOString(), progress, log, marks, kv, events };
}

/** Confere só o formato geral e os tamanhos. Linhas individuais inválidas são ignoradas na importação. */
export function validateBackup(x: unknown): x is BackupFile {
  const b = x as BackupFile;
  return !!b && typeof b === 'object' && b.app === 'lampada' && b.version === 1 &&
    Array.isArray(b.progress) && Array.isArray(b.log) && Array.isArray(b.marks) && Array.isArray(b.kv) && (b.events === undefined || Array.isArray(b.events)) &&
    b.progress.length <= TOTAL_CHAPTERS * 2 && b.log.length <= 300_000 && b.marks.length <= 100_000 && b.kv.length <= 200 && (b.events?.length ?? 0) <= 5_000;
}

/** Importa só o que é válido. Devolve quantos itens foram ignorados. */
export async function importBackup(b: BackupFile): Promise<{ skipped: number }> {
  const progress: ProgressRow[] = b.progress
    .filter((r) => r && valid(r.id) && isValidDateStr(r.date))
    .map((r) => ({ id: r.id, readAt: typeof r.readAt === 'number' && Number.isFinite(r.readAt) ? r.readAt : 0, date: r.date }));
  const log: LogRow[] = b.log
    .filter((r) => r && isValidDateStr(r.date) && valid(r.chapter))
    .map((r) => ({ key: `${r.date}:${r.chapter}`, date: r.date, chapter: r.chapter }));
  const marks: MarkRow[] = b.marks.filter(isValidMark).map(sanitizeMark);
  const events: EventRow[] = (b.events ?? []).filter(isValidEvent).map(sanitizeEvent);
  const rawKv: Record<string, unknown> = {};
  for (const r of b.kv) if (r && typeof r.key === 'string' && Object.hasOwn(DEFAULTS, r.key)) rawKv[r.key] = r.value;
  const clean = sanitizeSettings(rawKv, DEFAULTS);
  const kv: KV[] = Object.keys(rawKv).map((key) => ({ key, value: clean[key as keyof Settings] }));

  await db.transaction('rw', db.progress, db.log, db.marks, db.kv, db.events, async () => {
    await Promise.all([db.progress.clear(), db.log.clear(), db.marks.clear(), db.kv.clear(), db.events.clear()]);
    await db.progress.bulkPut(progress);
    await db.log.bulkPut(log);
    await db.marks.bulkPut(marks);
    await db.kv.bulkPut(kv);
    await db.events.bulkPut(events);
  });
  return { skipped: b.progress.length - progress.length + (b.log.length - log.length) + (b.marks.length - marks.length) + ((b.events?.length ?? 0) - events.length) };
}

export async function resetAll() {
  await db.transaction('rw', db.progress, db.log, db.marks, db.kv, db.events, async () => {
    await Promise.all([db.progress.clear(), db.log.clear(), db.marks.clear(), db.kv.clear(), db.events.clear()]);
  });
}

// -------------------------------------------------------------------- Eventos
export function useEvents(): { events: EventRow[]; ready: boolean } {
  const rows = useLiveQuery(() => db.events.toArray(), []);
  return useMemo(() => ({ events: (rows ?? []).filter(isValidEvent), ready: rows !== undefined }), [rows]);
}

export const newEventId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `e${Date.now()}${Math.random().toString(36).slice(2, 8)}`);

export async function saveEvent(e: EventRow) { await db.events.put(sanitizeEvent(e)); }
export async function deleteEvent(id: string) { await db.events.delete(id); }
