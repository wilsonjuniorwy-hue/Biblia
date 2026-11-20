import { describe, expect, it } from 'vitest';
import { bookProgress, nextUnreadAfter, overall, streaks } from './stats';
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
