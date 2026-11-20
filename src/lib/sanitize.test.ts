import { describe, expect, it } from 'vitest';
import { isValidDateStr, isValidEvent, isValidMark, sanitizeEvent, sanitizeMark, sanitizePlan, sanitizeSettings } from './sanitize';
import { DEFAULTS, validateBackup, type MarkRow } from '../db/db';

const S = (raw: Record<string, unknown>) => sanitizeSettings(raw, DEFAULTS);
const goodPlan = { type: 'misto', days: 365, startDate: '2026-11-20', excluded: [0, 1] };

describe('datas', () => {
  it('aceita datas reais e rejeita inválidas', () => {
    expect(isValidDateStr('2026-11-20')).toBe(true);
    expect(isValidDateStr('2024-02-29')).toBe(true);
    for (const bad of ['abc', '2026-13-01', '2026-02-30', '2026-2-3', '', null, 20261120, '1999-01-01']) expect(isValidDateStr(bad)).toBe(false);
  });
});

describe('plano', () => {
  it('plano válido passa', () => expect(sanitizePlan(goodPlan)).toEqual(goodPlan));
  it('rejeita tudo que poderia travar o app', () => {
    for (const bad of [null, undefined, 'x', [], {}, { ...goodPlan, days: 100_000_000 }, { ...goodPlan, days: -5 }, { ...goodPlan, days: 0 }, { ...goodPlan, days: 1.5 },
      { ...goodPlan, days: '365' }, { ...goodPlan, type: 'xyz' }, { ...goodPlan, type: '__proto__' }, { ...goodPlan, startDate: 'abc' }, { ...goodPlan, startDate: '2026-02-30' }]) {
      expect(sanitizePlan(bad)).toBeNull();
    }
  });
  it('limpa a lista de capítulos excluídos', () => {
    const p = sanitizePlan({ ...goodPlan, excluded: [3, 3, -1, 99999, 'a', 1.5, 7] });
    expect(p?.excluded).toEqual([3, 7]);
    expect(sanitizePlan({ ...goodPlan, excluded: 'x' })?.excluded).toEqual([]);
  });
});

describe('configurações', () => {
  it('padrão quando vazio', () => expect(S({})).toEqual(DEFAULTS));
  it('descarta valores inválidos', () => {
    const s = S({ translation: 'xx', fontSize: 9999, theme: 'neon', autoMark: 'sim', reminderTime: '25:99', plan: { type: 'x' }, lastRead: { book: 99, chapter: 1 }, completedReadings: -3, lastBackupAt: 'ontem' });
    expect(s.translation).toBe('tb');
    expect(s.fontSize).toBe(32);          // limitado, não descartado
    expect(s.theme).toBe('auto');
    expect(s.autoMark).toBe(false);
    expect(s.reminderTime).toBe('');
    expect(s.plan).toBeNull();
    expect(s.lastRead).toBeNull();
    expect(s.completedReadings).toBe(0);
    expect(s.lastBackupAt).toBeNull();
  });
  it('mantém valores válidos', () => {
    const s = S({ translation: 'arc', fontSize: 22, theme: 'sepia', autoMark: true, reminderTime: '07:30', plan: goodPlan, lastRead: { book: 18, chapter: 23 }, completedReadings: 2 });
    expect(s).toMatchObject({ translation: 'arc', fontSize: 22, theme: 'sepia', autoMark: true, reminderTime: '07:30', lastRead: { book: 18, chapter: 23 }, completedReadings: 2 });
    expect(s.plan?.days).toBe(365);
  });
  it('novos ajustes: valida e limita', () => {
    const s = S({ readerFont: 'comic', lineHeight: 'x', textWidth: 9, startArea: 'lua', lastArea: 'igreja', compare: 'sim', weeklyGoal: 50, onboarded: true });
    expect(s).toMatchObject({ readerFont: 'serif', lineHeight: 'normal', textWidth: 'normal', startArea: 'ask', lastArea: 'igreja', compare: false, weeklyGoal: 7, onboarded: true });
    expect(S({ weeklyGoal: 0 }).weeklyGoal).toBe(1);
  });
  it('NaN e Infinity não passam', () => {
    expect(S({ fontSize: NaN }).fontSize).toBe(DEFAULTS.fontSize);
    expect(S({ fontSize: Infinity }).fontSize).toBe(DEFAULTS.fontSize);
  });
});

describe('marcações', () => {
  const m = (o: Partial<MarkRow>): MarkRow => ({ key: '0:1:1', book: 0, chapter: 1, verse: 1, fav: 1, color: null, note: '', updatedAt: 1, ...o });
  it('valida livro, capítulo e versículo', () => {
    expect(isValidMark(m({}))).toBe(true);
    expect(isValidMark(m({ verse: 31 }))).toBe(true);
    for (const bad of [m({ book: 99 }), m({ chapter: 999 }), m({ verse: 32 }), m({ verse: 0 }), m({ verse: 1.5 }), null, 'x']) expect(isValidMark(bad)).toBe(false);
  });
  it('normaliza campos', () => {
    const c = sanitizeMark(m({ color: 'neon', note: 'x'.repeat(9000), fav: 7 as 1 }));
    expect(c.color).toBeNull();
    expect(c.note.length).toBe(5000);
    expect(c.fav).toBe(1);
    expect(c.key).toBe('0:1:1');
  });
});

describe('backup', () => {
  const ok = { app: 'lampada', version: 1, exportedAt: '', progress: [], log: [], marks: [], kv: [] };
  it('formato geral', () => {
    expect(validateBackup(ok)).toBe(true);
    for (const bad of [null, 'x', {}, { ...ok, app: 'outro' }, { ...ok, version: 2 }, { ...ok, marks: 'x' }, { ...ok, kv: Array(500).fill({}) }]) expect(validateBackup(bad)).toBe(false);
  });
});

describe('eventos', () => {
  const e = (o: Record<string, unknown> = {}) => ({ id: 'x1', title: 'Culto', date: '2026-11-22', time: '19:00', place: '', notes: '', weekly: 0, createdAt: 1, ...o });
  it('aceita evento válido (com e sem horário)', () => {
    expect(isValidEvent(e())).toBe(true);
    expect(isValidEvent(e({ time: '' }))).toBe(true);
  });
  it('rejeita o que não é evento', () => {
    for (const bad of [null, 'x', {}, e({ id: '' }), e({ title: '   ' }), e({ title: 5 }), e({ date: '2026-02-30' }), e({ date: 'abc' }), e({ time: '25:00' }), e({ time: '9:00' }), e({ time: 19 })]) {
      expect(isValidEvent(bad)).toBe(false);
    }
  });
  it('normaliza e limita os textos', () => {
    const c = sanitizeEvent(e({ title: `  ${'x'.repeat(500)}  `, notes: 'n'.repeat(5000), place: 'p'.repeat(500), weekly: 7 }) as never);
    expect(c.title.length).toBe(120);
    expect(c.notes.length).toBe(1000);
    expect(c.place.length).toBe(120);
    expect(c.weekly).toBe(1);
  });
});
