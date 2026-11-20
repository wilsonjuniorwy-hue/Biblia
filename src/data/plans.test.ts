import { describe, expect, it } from 'vitest';
import { TOTAL_CHAPTERS, chapterId, fromChapterId, matchBooks, parseReference, toSegments, segmentLabel } from './books';
import { CHRONOLOGICAL, DURATIONS, SEQUENTIAL, planChapters, planStatus, rebalance, streamsFor, type PlanConfig, type PlanType } from './plans';

const TYPES: PlanType[] = ['sequencial', 'cronologico', 'misto'];

describe('estrutura', () => {
  it('tem 1189 capítulos e ids ida-e-volta', () => {
    expect(TOTAL_CHAPTERS).toBe(1189);
    for (let id = 0; id < TOTAL_CHAPTERS; id++) {
      const { book, chapter } = fromChapterId(id);
      expect(chapterId(book, chapter)).toBe(id);
    }
  });
  it('interpreta referências', () => {
    expect(parseReference('João 3:16')).toEqual({ book: 42, chapter: 3, verse: 16 });
    expect(parseReference('1 Co 13')).toEqual({ book: 45, chapter: 13, verse: undefined });
    expect(parseReference('sl 23')?.book).toBe(18);
    expect(parseReference('Gênesis 99')).toBeNull();
    expect(parseReference('amor')).toBeNull();
    expect(parseReference('Jo 3:16')?.book).toBe(42); // João
    expect(parseReference('Jó 3')?.book).toBe(17);
    expect(parseReference('jo 3')?.book).toBe(42);
    expect(parseReference('Jn 1')?.book).toBe(31); // Jonas
    expect(parseReference('Êx 20')?.book).toBe(1);
    expect(parseReference('ex 20')?.book).toBe(1);
    expect(parseReference('2 timoteo 3:16')).toEqual({ book: 54, chapter: 3, verse: 16 });
  });
  it('referências: versículo inexistente, romanos e nomes alternativos', () => {
    expect(parseReference('Gn 1:999')).toBeNull();
    expect(parseReference('Gn 1:0')).toBeNull();
    expect(parseReference('Gn 1:31')).toEqual({ book: 0, chapter: 1, verse: 31 });
    expect(parseReference('II Coríntios 5:17')).toEqual({ book: 46, chapter: 5, verse: 17 });
    expect(parseReference('I João 4:8')?.book).toBe(61);
    expect(parseReference('III João 1')?.book).toBe(63);
    expect(parseReference('ii reis 2')?.book).toBe(11);
    expect(parseReference('Cânticos 1:1')?.book).toBe(21);
    expect(parseReference('Cântico dos Cânticos 2')?.book).toBe(21);
    expect(parseReference('Atos dos Apóstolos 2:1')).toEqual({ book: 43, chapter: 2, verse: 1 });
    expect(parseReference('Salmo 23')?.book).toBe(18);
    expect(parseReference('o amor de deus 3')).toBeNull();
    expect(parseReference('Isaías 41:10')?.book).toBe(22);
  });
  it('autocompletar de livros', () => {
    const names = (q: string) => matchBooks(q).matches.map((b) => b.name);
    expect(names('cor')).toEqual(['1 Coríntios', '2 Coríntios']);
    expect(names('mat')).toEqual(['Mateus']);
    expect(names('jo')[0]).toBe('João');           // abreviação exata primeiro
    expect(names('jo')).toContain('Jó');
    expect(names('jo')).toContain('Josué');
    expect(names('sal')).toEqual(['Salmos']);
    expect(names('1 co')).toEqual(['1 Coríntios']);
    expect(names('II co')).toEqual(['2 Coríntios']);
    expect(names('1')).toEqual(['1 Samuel', '1 Reis', '1 Crônicas', '1 Coríntios', '1 Tessalonicenses', '1 Timóteo', '1 Pedro', '1 João']);
    expect(names('cant')).toEqual(['Cantares']);
    expect(names('apoc')).toEqual(['Apocalipse']);
    expect(names('xyz')).toEqual([]);
    expect(names('')).toEqual([]);
    const j = matchBooks('joão 3:16');
    expect(j.matches[0].name).toBe('João');
    expect(j.chapter).toBe(3);
    expect(j.verse).toBe(16);
    expect(matchBooks('1 co 13').chapter).toBe(13);
    expect(matchBooks('1 co 13').matches[0].name).toBe('1 Coríntios');
  });
  it('agrupa segmentos', () => {
    const ids = [chapterId(0, 1), chapterId(0, 2), chapterId(0, 3), chapterId(1, 1)];
    expect(toSegments(ids).map((s) => segmentLabel(s))).toEqual(['Gênesis 1–3', 'Êxodo 1']);
  });
});

describe('planos', () => {
  it('cada fluxo cobre todos os capítulos exatamente uma vez', () => {
    for (const t of TYPES) {
      const flat = streamsFor(t).flat();
      expect(flat.length).toBe(TOTAL_CHAPTERS);
      expect(new Set(flat).size).toBe(TOTAL_CHAPTERS);
    }
    expect([...CHRONOLOGICAL].sort((a, b) => a - b)).toEqual(SEQUENTIAL);
  });

  it('a distribuição diária preserva todos os capítulos e a ordem', () => {
    for (const t of TYPES) for (const d of DURATIONS) {
      const days = planChapters({ type: t, days: d, excluded: [] });
      expect(days.length).toBe(d);
      const flat = days.flat();
      expect(flat.length).toBe(TOTAL_CHAPTERS);
      expect(new Set(flat).size).toBe(TOTAL_CHAPTERS);
      if (t !== 'misto') expect(flat).toEqual(t === 'sequencial' ? SEQUENTIAL : CHRONOLOGICAL);
    }
  });

  it('carga diária é razoável no plano de 365 dias', () => {
    const days = planChapters({ type: 'sequencial', days: 365, excluded: [] });
    expect(days.every((d) => d.length >= 1 && d.length <= 12)).toBe(true);
  });

  it('exclui capítulos já lidos', () => {
    const ex = [0, 1, 2, 3];
    const flat = planChapters({ type: 'sequencial', days: 100, excluded: ex }).flat();
    expect(flat.length).toBe(TOTAL_CHAPTERS - 4);
    expect(flat.includes(0)).toBe(false);
  });
});

describe('situação do plano', () => {
  const cfg: PlanConfig = { type: 'sequencial', days: 365, startDate: '2026-01-01', excluded: [] };
  it('antes do início', () => {
    const s = planStatus(cfg, new Set(), '2025-12-30');
    expect(s.notStarted).toBe(true);
    expect(s.today).toBeNull();
    expect(s.behind).toBe(0);
  });
  it('no primeiro dia: hoje pendente, sem atraso', () => {
    const s = planStatus(cfg, new Set(), '2026-01-01');
    expect(s.todayIndex).toBe(0);
    expect(s.today?.chapters.length).toBeGreaterThan(0);
    expect(s.todayDone).toBe(false);
    expect(s.overdue.length).toBe(0);
    expect(s.behind).toBe(0);
  });
  it('detecta atraso e redistribui', () => {
    const s = planStatus(cfg, new Set(), '2026-01-11');
    expect(s.overdue.length).toBe(10);
    expect(s.behind).toBe(10);
    const nc = rebalance(cfg, new Set(), '2026-01-11')!;
    expect(nc.days).toBe(355);
    expect(nc.startDate).toBe('2026-01-11');
  });
  it('adiantamento', () => {
    const read = new Set(planChapters(cfg).slice(0, 5).flat()); // 5 primeiros dias lidos
    const s = planStatus(cfg, read, '2026-01-01');
    expect(s.todayDone).toBe(true);
    expect(s.behind).toBe(-4);
  });
  it('plano terminado', () => {
    const s = planStatus(cfg, new Set(), '2027-03-01');
    expect(s.finished).toBe(true);
    expect(rebalance(cfg, new Set(), '2027-03-01')).toBeNull();
  });
  it('redistribuição conserva só o que falta', () => {
    const read = new Set(planChapters(cfg).slice(0, 3).flat());
    const nc = rebalance(cfg, read, '2026-01-04')!;
    const flat = planChapters(nc).flat();
    expect(flat.length).toBe(TOTAL_CHAPTERS - read.size);
  });
});

describe('planos curtos', () => {
  const cases: [PlanType, number, number][] = [['salmos30', 150, 30], ['proverbios31', 31, 31], ['evangelhos30', 89, 30], ['nt90', 260, 90]];
  it.each(cases)('%s cobre exatamente os capítulos do tema', (type, chapters, days) => {
    const flat = streamsFor(type).flat();
    expect(flat.length).toBe(chapters);
    expect(new Set(flat).size).toBe(chapters);
    const plan = planChapters({ type, days, excluded: [] });
    expect(plan.length).toBe(days);
    expect(plan.flat()).toEqual(flat);               // todos, sem repetir, na ordem
  });
  it('Provérbios: 1 capítulo por dia (Pv 1 no dia 1 … Pv 31 no dia 31)', () => {
    const plan = planChapters({ type: 'proverbios31', days: 31, excluded: [] });
    expect(plan.every((d) => d.length === 1)).toBe(true);
    expect(fromChapterId(plan[0][0])).toEqual({ book: 19, chapter: 1 });
    expect(fromChapterId(plan[30][0])).toEqual({ book: 19, chapter: 31 });
  });
  it('Salmos: 5 por dia, mesmo com o Salmo 119 enorme', () => {
    const plan = planChapters({ type: 'salmos30', days: 30, excluded: [] });
    expect(plan.every((d) => d.length === 5)).toBe(true);
  });
  it('Evangelhos e NT: nenhum dia vazio e carga equilibrada', () => {
    for (const [t, days, max] of [['evangelhos30', 30, 8], ['nt90', 90, 6]] as [PlanType, number, number][]) {
      const plan = planChapters({ type: t, days, excluded: [] });
      expect(plan.every((d) => d.length >= 1 && d.length <= max), t).toBe(true);
    }
  });
  it('reajustar um plano curto só redistribui o que falta', () => {
    const cfg: PlanConfig = { type: 'salmos30', days: 30, startDate: '2026-11-01', excluded: [] };
    const read = new Set(planChapters(cfg).slice(0, 4).flat());          // 20 salmos lidos
    const nc = rebalance(cfg, read, '2026-11-05')!;
    expect(nc.days).toBe(26);
    expect(planChapters(nc).flat().length).toBe(130);
  });
});
