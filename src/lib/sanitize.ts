import { TOTAL_CHAPTERS, VERSE_COUNTS, isValidChapter } from '../data/books';
import { PLAN_INFO, type PlanConfig, type PlanType } from '../data/plans';
import type { TranslationId } from '../data/bible';
import type { EventRow, MarkRow, Settings, Theme } from '../db/db';

/**
 * Tudo que vem do armazenamento ou de um arquivo de backup é tratado como NÃO CONFIÁVEL:
 * um valor fora do esperado nunca pode travar o app. Valores inválidos viram o padrão.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_PLAN_DAYS = 730;
export const COLORS = ['yellow', 'green', 'blue', 'pink'] as const;
const THEMES: Theme[] = ['auto', 'light', 'dark', 'sepia'];
const TRANSLATION_IDS: TranslationId[] = ['tb', 'arc', 'blivre'];

export const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);

export function isValidDateStr(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return y >= 2000 && y <= 2200 && t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function sanitizePlan(x: unknown): PlanConfig | null {
  if (!x || typeof x !== 'object') return null;
  const p = x as Record<string, unknown>;
  if (typeof p.type !== 'string' || !Object.hasOwn(PLAN_INFO, p.type)) return null;
  if (!isInt(p.days) || p.days < 1 || p.days > MAX_PLAN_DAYS) return null;
  if (!isValidDateStr(p.startDate)) return null;
  const excluded = Array.isArray(p.excluded)
    ? [...new Set(p.excluded.filter((n): n is number => isInt(n) && n >= 0 && n < TOTAL_CHAPTERS))]
    : [];
  return { type: p.type as PlanType, days: p.days, startDate: p.startDate, excluded };
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Evento mínimo válido: título, data real e (se houver) horário HH:MM. */
export function isValidEvent(r: unknown): r is EventRow {
  const e = r as EventRow;
  return !!e && typeof e === 'object' && typeof e.id === 'string' && e.id.length > 0 && e.id.length <= 80
    && typeof e.title === 'string' && e.title.trim().length > 0
    && isValidDateStr(e.date) && (e.time === '' || (typeof e.time === 'string' && TIME_RE.test(e.time)));
}

export function sanitizeEvent(e: EventRow): EventRow {
  const cut = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  return {
    id: e.id.slice(0, 80),
    title: cut(e.title, 120),
    date: e.date,
    time: e.time,
    place: cut(e.place, 120),
    notes: cut(e.notes, 1000),
    weekly: e.weekly ? 1 : 0,
    createdAt: typeof e.createdAt === 'number' && Number.isFinite(e.createdAt) ? e.createdAt : 0,
  };
}

export function isValidMark(r: unknown): r is MarkRow {
  const m = r as MarkRow;
  return !!m && typeof m.key === 'string' && isInt(m.book) && isInt(m.chapter) && isInt(m.verse)
    && isValidChapter(m.book, m.chapter) && m.verse >= 1 && m.verse <= VERSE_COUNTS[m.book][m.chapter - 1];
}

export function sanitizeMark(r: MarkRow): MarkRow {
  return {
    key: `${r.book}:${r.chapter}:${r.verse}`,
    book: r.book, chapter: r.chapter, verse: r.verse,
    fav: r.fav ? 1 : 0,
    color: typeof r.color === 'string' && (COLORS as readonly string[]).includes(r.color) ? r.color : null,
    note: typeof r.note === 'string' ? r.note.slice(0, 5000) : '',
    updatedAt: typeof r.updatedAt === 'number' && Number.isFinite(r.updatedAt) ? r.updatedAt : 0,
  };
}

/** Recebe pares chave/valor soltos e devolve configurações completas e seguras. */
export function sanitizeSettings(raw: Record<string, unknown>, defaults: Settings): Settings {
  const s: Settings = { ...defaults };
  if (typeof raw.translation === 'string' && (TRANSLATION_IDS as string[]).includes(raw.translation)) s.translation = raw.translation as TranslationId;
  if (typeof raw.fontSize === 'number' && Number.isFinite(raw.fontSize)) s.fontSize = Math.min(32, Math.max(14, Math.round(raw.fontSize)));
  if (typeof raw.theme === 'string' && (THEMES as string[]).includes(raw.theme)) s.theme = raw.theme as Theme;
  if (typeof raw.autoMark === 'boolean') s.autoMark = raw.autoMark;
  if (typeof raw.reminderTime === 'string' && (raw.reminderTime === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.reminderTime))) s.reminderTime = raw.reminderTime;
  s.plan = sanitizePlan(raw.plan);
  const lr = raw.lastRead as { book?: unknown; chapter?: unknown } | null | undefined;
  s.lastRead = lr && isInt(lr.book) && isInt(lr.chapter) && isValidChapter(lr.book, lr.chapter) ? { book: lr.book, chapter: lr.chapter } : null;
  if (isInt(raw.completedReadings) && raw.completedReadings >= 0) s.completedReadings = Math.min(raw.completedReadings, 10000);
  s.lastBackupAt = typeof raw.lastBackupAt === 'number' && Number.isFinite(raw.lastBackupAt) ? raw.lastBackupAt : null;
  if (typeof raw.startedAt === 'number' && Number.isFinite(raw.startedAt)) s.startedAt = raw.startedAt;
  const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : d);
  s.readerFont = oneOf(raw.readerFont, ['serif', 'sans'], defaults.readerFont);
  s.lineHeight = oneOf(raw.lineHeight, ['compact', 'normal', 'wide'], defaults.lineHeight);
  s.textWidth = oneOf(raw.textWidth, ['narrow', 'normal', 'wide'], defaults.textWidth);
  s.startArea = oneOf(raw.startArea, ['ask', 'igreja', 'estudos'], defaults.startArea);
  s.lastArea = raw.lastArea === 'igreja' || raw.lastArea === 'estudos' ? raw.lastArea : null;
  if (typeof raw.compare === 'boolean') s.compare = raw.compare;
  if (typeof raw.onboarded === 'boolean') s.onboarded = raw.onboarded;
  if (isInt(raw.weeklyGoal)) s.weeklyGoal = Math.min(7, Math.max(1, raw.weeklyGoal));
  return s;
}
