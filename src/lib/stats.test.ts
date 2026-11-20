import { describe, expect, it } from 'vitest';
import { bookProgress, dayCounts, estimateMinutes, heatmapWeeks, nextUnreadAfter, overall, streaks, weekProgress } from './stats';
import { addDays, diffDays } from './date';
import { chapterId } from '../data/books';

describe('datas', () => {
  it('soma e diferencia dias na virada de mês/ano', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(diffDays('2026-03-01', '2026-11-20')).toBe(264);
    expect(diffDays('2026-11-20', '2026-11-19')).toBe(-1);
  });
});

describe('sequência', () => {
  const today = '2026-11-20';
  it('vazio', () => expect(streaks([], today)).toEqual({ current: 0, longest: 0 }));
  it('dias seguidos até hoje', () => {
    expect(streaks(['2026-11-18', '2026-11-19', '2026-11-20'], today).current).toBe(3);
  });
  it('hoje pendente não quebra', () => {
    expect(streaks(['2026-11-18', '2026-11-19'], today).current).toBe(2);
  });
  it('um dia de graça não quebra', () => {
    expect(streaks(['2026-11-17', '2026-11-19', '2026-11-20'], today).current).toBe(3);
  });
  it('dois dias perdidos quebram', () => {
    expect(streaks(['2026-11-15', '2026-11-16', '2026-11-20'], today).current).toBe(1);
  });
  it('sequência morta', () => {
    expect(streaks(['2026-11-10', '2026-11-11'], today).current).toBe(0);
    expect(streaks(['2026-11-10', '2026-11-11'], today).longest).toBe(2);
  });
});

describe('progresso', () => {
  it('livro e total', () => {
    const read = new Set([chapterId(0, 1), chapterId(0, 2), chapterId(41, 1)]);
    expect(bookProgress(read, 0)).toMatchObject({ read: 2, total: 50, done: false, nextUnread: 3 });
    expect(overall(read)).toMatchObject({ read: 3, at: 2, nt: 1 });
  });
  it('próximo não lido faz a volta', () => {
    const last = 1188;
    expect(nextUnreadAfter(new Set([0]), last)).toBe(1);
    expect(nextUnreadAfter(new Set(Array.from({ length: 1189 }, (_, i) => i)), 5)).toBeNull();
  });
});

describe('leitura: tempo, calor e meta', () => {
  it('estimativa de minutos', () => {
    expect(estimateMinutes([])).toBe(0);
    expect(estimateMinutes([chapterId(18, 117)])).toBeGreaterThanOrEqual(1); // Salmo 117 (2 versículos)
    const gn1 = estimateMinutes([chapterId(0, 1)]);
    expect(gn1).toBeGreaterThanOrEqual(3);
    expect(gn1).toBeLessThanOrEqual(6);
    expect(estimateMinutes([chapterId(18, 119)])).toBeGreaterThan(gn1);
  });
  it('contagem por dia', () => {
    const m = dayCounts(['2026-11-20', '2026-11-20', '2026-11-19']);
    expect(m.get('2026-11-20')).toBe(2);
    expect(m.get('2026-11-19')).toBe(1);
  });
  it('mapa de calor: 12 semanas de segunda a domingo, terminando na semana de hoje', () => {
    const today = '2026-11-20'; // sexta
    const w = heatmapWeeks(new Map([[today, 7], ['2026-11-16', 1]]), today, 12);
    expect(w.length).toBe(12);
    expect(w.every((c) => c.length === 7)).toBe(true);
    const last = w[11];
    expect(last[0].date).toBe('2026-11-16');           // segunda
    expect(last[4].date).toBe(today);                  // sexta
    expect(last[4]).toMatchObject({ count: 7, level: 3, future: false });
    expect(last[0].level).toBe(1);
    expect(last[5].future).toBe(true);                 // sábado ainda não chegou
    expect(w[0][0].date).toBe('2026-08-31');           // 11 semanas antes
  });
  it('meta semanal conta dias distintos desta semana', () => {
    const p = weekProgress(['2026-11-16', '2026-11-16', '2026-11-18', '2026-11-20', '2026-11-10'], '2026-11-20');
    expect(p.days).toBe(3);
    expect(p.flags).toEqual([true, false, true, false, true, false, false]);
    expect(p.weekStart).toBe('2026-11-16');
    expect(weekProgress([], '2026-11-22').days).toBe(0); // domingo: ainda é a semana que começou dia 16
    expect(weekProgress([], '2026-11-22').weekStart).toBe('2026-11-16');
  });
});
