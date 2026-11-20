import { BOOKS, TOTAL_CHAPTERS, bookOffset, chapterId, chapterWeight, toSegments, type Segment } from './books';
import { addDays, diffDays } from '../lib/date';

export type PlanType = 'sequencial' | 'cronologico' | 'misto';

export interface PlanConfig {
  type: PlanType;
  /** Duração total em dias. */
  days: number;
  /** AAAA-MM-DD */
  startDate: string;
  /** Capítulos (ids globais) ignorados no plano, p.ex. os que já foram lidos. */
  excluded: number[];
}

export const PLAN_INFO: Record<PlanType, { name: string; short: string; desc: string }> = {
  sequencial: {
    name: 'Sequencial',
    short: 'De Gênesis a Apocalipse',
    desc: 'Segue a ordem dos livros, de Gênesis a Apocalipse. Simples e direto.',
  },
  cronologico: {
    name: 'Cronológico',
    short: 'Na ordem dos acontecimentos',
    desc: 'Lê a Bíblia na ordem aproximada em que os fatos aconteceram (Jó junto aos patriarcas, profetas junto aos reis…).',
  },
  misto: {
    name: 'Misto',
    short: 'AT + Salmos/Provérbios + NT todo dia',
    desc: 'Todo dia um pouco do Antigo Testamento, um Salmo ou Provérbio e um trecho do Novo Testamento.',
  },
};

export const DURATIONS = [365, 180, 90] as const;

// ---------------------------------------------------------------------------
// Fluxos de leitura (listas ordenadas de ids de capítulo)
// ---------------------------------------------------------------------------

/** [livro, capInicial, capFinal] — livros usam o índice canônico (0 = Gênesis). */
type Range = [number, number, number];
const B = (abbr: string) => {
  const i = BOOKS.findIndex((b) => b.abbr === abbr);
  if (i < 0) throw new Error(`Livro desconhecido: ${abbr}`);
  return i;
};
const all = (abbr: string): Range => [B(abbr), 1, BOOKS[B(abbr)].chapters];
const part = (abbr: string, a: number, z: number): Range => [B(abbr), a, z];

function expand(ranges: Range[]): number[] {
  const out: number[] = [];
  for (const [b, a, z] of ranges) for (let c = a; c <= z; c++) out.push(chapterId(b, c));
  return out;
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const SEQUENTIAL: number[] = range(0, TOTAL_CHAPTERS - 1);

/**
 * Ordem cronológica aproximada. Existem vários arranjos aceitos; este segue o
 * padrão da maioria dos planos cronológicos (Jó com os patriarcas, Salmos
 * distribuídos por época, profetas junto aos reis, cartas dentro de Atos).
 */
export const CHRONOLOGICAL: number[] = expand([
  part('Gn', 1, 11), all('Jó'), part('Gn', 12, 50),
  all('Êx'), all('Lv'), all('Nm'), all('Dt'), part('Sl', 90, 90),
  all('Js'), all('Jz'), all('Rt'),
  all('1Sm'), all('2Sm'), all('1Cr'),
  part('Sl', 1, 89),
  part('1Rs', 1, 4), all('Ct'), all('Pv'), all('Ec'), part('1Rs', 5, 11), part('2Cr', 1, 9),
  part('1Rs', 12, 22), part('2Cr', 10, 20),
  part('2Rs', 1, 14), all('Jl'), part('2Cr', 21, 25),
  all('Jn'), part('2Rs', 15, 15), all('Am'), all('Os'), part('2Cr', 26, 27),
  all('Is'), all('Mq'),
  part('2Rs', 16, 20), part('2Cr', 28, 32),
  all('Na'), part('2Rs', 21, 21), part('2Cr', 33, 33),
  part('2Rs', 22, 23), part('2Cr', 34, 35), all('Sf'),
  all('Jr'), all('Hc'), part('2Rs', 24, 25), part('2Cr', 36, 36), all('Lm'), all('Ob'),
  all('Ez'), all('Dn'),
  part('Ed', 1, 6), all('Ag'), all('Zc'), all('Et'),
  part('Ed', 7, 10), all('Ne'), part('Sl', 91, 150), all('Ml'),
  all('Mt'), all('Mc'), all('Lc'), all('Jo'),
  part('At', 1, 12), all('Tg'), part('At', 13, 14), all('Gl'), part('At', 15, 17),
  all('1Ts'), all('2Ts'), part('At', 18, 18), all('1Co'), part('At', 19, 20), all('2Co'), all('Rm'),
  part('At', 21, 28), all('Cl'), all('Fm'), all('Ef'), all('Fp'),
  all('1Tm'), all('Tt'), all('1Pe'), all('Hb'), all('2Tm'), all('2Pe'), all('Jd'),
  all('1Jo'), all('2Jo'), all('3Jo'), all('Ap'),
]);

const NT_START = bookOffset(B('Mt'));
const SL = B('Sl');
const PV = B('Pv');
const isWisdom = (id: number) => {
  const b = BOOKS.findIndex((_, i) => id >= bookOffset(i) && id < bookOffset(i) + BOOKS[i].chapters);
  return b === SL || b === PV;
};
const MIXED_STREAMS: number[][] = [
  SEQUENTIAL.filter((id) => id < NT_START && !isWisdom(id)), // Antigo Testamento (sem Salmos/Provérbios)
  SEQUENTIAL.filter((id) => isWisdom(id)),                   // Salmos e Provérbios
  SEQUENTIAL.filter((id) => id >= NT_START),                 // Novo Testamento
];

export function streamsFor(type: PlanType): number[][] {
  if (type === 'cronologico') return [CHRONOLOGICAL];
  if (type === 'misto') return MIXED_STREAMS;
  return [SEQUENTIAL];
}

// ---------------------------------------------------------------------------
// Distribuição por dias
// ---------------------------------------------------------------------------

/**
 * Divide um fluxo em `days` blocos de tamanho parecido (peso = nº de versículos).
 * Cada capítulo vai para o dia em que cai o seu "ponto médio", o que mantém a ordem
 * e equilibra a carga diária.
 */
export function distribute(ids: number[], days: number): number[][] {
  const out: number[][] = Array.from({ length: days }, () => []);
  const total = ids.reduce((a, id) => a + chapterWeight(id), 0);
  if (total === 0) return out;
  let acc = 0;
  for (const id of ids) {
    const w = chapterWeight(id);
    const day = Math.min(days - 1, Math.floor(((acc + w / 2) / total) * days));
    out[day].push(id);
    acc += w;
  }
  return out;
}

const memo = new Map<string, number[][]>();

/** Capítulos de cada dia do plano (índice 0 = primeiro dia). */
export function planChapters(cfg: Pick<PlanConfig, 'type' | 'days' | 'excluded'>): number[][] {
  const key = `${cfg.type}|${cfg.days}|${cfg.excluded.join(',')}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const skip = new Set(cfg.excluded);
  const perStream = streamsFor(cfg.type).map((s) => distribute(s.filter((id) => !skip.has(id)), cfg.days));
  const days = Array.from({ length: cfg.days }, (_, d) => perStream.flatMap((s) => s[d]));
  if (memo.size > 20) memo.clear();
  memo.set(key, days);
  return days;
}

export interface PlanDay {
  index: number;
  date: string;
  chapters: number[];
  segments: Segment[];
}

export function planDays(cfg: PlanConfig): PlanDay[] {
  return planChapters(cfg).map((chapters, index) => ({
    index,
    date: addDays(cfg.startDate, index),
    chapters,
    segments: toSegments(chapters),
  }));
}

// ---------------------------------------------------------------------------
// Situação do plano
// ---------------------------------------------------------------------------

export interface PlanStatus {
  days: PlanDay[];
  /** Índice do dia de hoje (pode ser <0 se ainda não começou, ou >= days se acabou). */
  todayIndex: number;
  notStarted: boolean;
  finished: boolean;
  /** Dias anteriores a hoje com leitura pendente. */
  overdue: PlanDay[];
  today: PlanDay | null;
  todayDone: boolean;
  /** >0: dias de atraso; <0: dias de adiantamento. */
  behind: number;
  totalChapters: number;
  readChapters: number;
  endDate: string;
}

export function planStatus(cfg: PlanConfig, read: Set<number>, today: string): PlanStatus {
  const days = planDays(cfg);
  const todayIndex = diffDays(cfg.startDate, today);
  const isDone = (d: PlanDay) => d.chapters.every((id) => read.has(id));

  const limit = Math.min(Math.max(todayIndex, 0), days.length);
  const overdue = days.slice(0, limit).filter((d) => !isDone(d) && d.chapters.length > 0);
  const t = todayIndex >= 0 && todayIndex < days.length ? days[todayIndex] : null;

  // Dias consecutivos concluídos a partir do início (dias vazios contam como concluídos).
  let through = 0;
  while (through < days.length && isDone(days[through])) through++;
  // Dias que já deveriam estar concluídos (todos antes de hoje).
  const expected = Math.min(Math.max(todayIndex, 0), days.length);
  let behind = 0;
  if (todayIndex >= 0) {
    if (through < expected) behind = expected - through;       // atrasado
    else if (through > expected) behind = -(through - expected - 1); // hoje feito (+ adiantado)
  }
  const planIds = days.flatMap((d) => d.chapters);
  return {
    days,
    todayIndex,
    notStarted: todayIndex < 0,
    finished: todayIndex >= days.length,
    overdue,
    today: t,
    todayDone: t ? isDone(t) : false,
    behind,
    totalChapters: planIds.length,
    readChapters: planIds.filter((id) => read.has(id)).length,
    endDate: addDays(cfg.startDate, cfg.days - 1),
  };
}

/** Configuração para redistribuir o que falta ler até a data final original. */
export function rebalance(cfg: PlanConfig, read: Set<number>, today: string): PlanConfig | null {
  const idx = diffDays(cfg.startDate, today);
  const remaining = cfg.days - Math.max(idx, 0);
  if (remaining < 1) return null;
  const planned = new Set(streamsFor(cfg.type).flat());
  const skip = new Set(cfg.excluded);
  for (const id of read) if (planned.has(id)) skip.add(id);
  return { type: cfg.type, days: remaining, startDate: today > cfg.startDate ? today : cfg.startDate, excluded: [...skip] };
}

export function suggestedPerDay(type: PlanType, days: number, excluded: number[] = []): number {
  const skip = new Set(excluded);
  const n = streamsFor(type).reduce((a, s) => a + s.filter((id) => !skip.has(id)).length, 0);
  return n / days;
}
