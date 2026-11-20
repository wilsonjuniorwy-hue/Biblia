import counts from './verseCounts.json';

export type Testament = 'AT' | 'NT';
export interface Book {
  id: number;
  name: string;
  abbr: string;
  testament: Testament;
  group: string;
  chapters: number;
}

/** Versículos por capítulo: VERSE_COUNTS[livro][capítulo-1] */
export const VERSE_COUNTS = counts as number[][];

const RAW: [string, string, string][] = [
  ['Gênesis', 'Gn', 'Pentateuco'], ['Êxodo', 'Êx', 'Pentateuco'], ['Levítico', 'Lv', 'Pentateuco'],
  ['Números', 'Nm', 'Pentateuco'], ['Deuteronômio', 'Dt', 'Pentateuco'],
  ['Josué', 'Js', 'Livros históricos'], ['Juízes', 'Jz', 'Livros históricos'], ['Rute', 'Rt', 'Livros históricos'],
  ['1 Samuel', '1Sm', 'Livros históricos'], ['2 Samuel', '2Sm', 'Livros históricos'],
  ['1 Reis', '1Rs', 'Livros históricos'], ['2 Reis', '2Rs', 'Livros históricos'],
  ['1 Crônicas', '1Cr', 'Livros históricos'], ['2 Crônicas', '2Cr', 'Livros históricos'],
  ['Esdras', 'Ed', 'Livros históricos'], ['Neemias', 'Ne', 'Livros históricos'], ['Ester', 'Et', 'Livros históricos'],
  ['Jó', 'Jó', 'Poesia e sabedoria'], ['Salmos', 'Sl', 'Poesia e sabedoria'], ['Provérbios', 'Pv', 'Poesia e sabedoria'],
  ['Eclesiastes', 'Ec', 'Poesia e sabedoria'], ['Cantares', 'Ct', 'Poesia e sabedoria'],
  ['Isaías', 'Is', 'Profetas maiores'], ['Jeremias', 'Jr', 'Profetas maiores'], ['Lamentações', 'Lm', 'Profetas maiores'],
  ['Ezequiel', 'Ez', 'Profetas maiores'], ['Daniel', 'Dn', 'Profetas maiores'],
  ['Oseias', 'Os', 'Profetas menores'], ['Joel', 'Jl', 'Profetas menores'], ['Amós', 'Am', 'Profetas menores'],
  ['Obadias', 'Ob', 'Profetas menores'], ['Jonas', 'Jn', 'Profetas menores'], ['Miqueias', 'Mq', 'Profetas menores'],
  ['Naum', 'Na', 'Profetas menores'], ['Habacuque', 'Hc', 'Profetas menores'], ['Sofonias', 'Sf', 'Profetas menores'],
  ['Ageu', 'Ag', 'Profetas menores'], ['Zacarias', 'Zc', 'Profetas menores'], ['Malaquias', 'Ml', 'Profetas menores'],
  ['Mateus', 'Mt', 'Evangelhos'], ['Marcos', 'Mc', 'Evangelhos'], ['Lucas', 'Lc', 'Evangelhos'], ['João', 'Jo', 'Evangelhos'],
  ['Atos', 'At', 'Atos'],
  ['Romanos', 'Rm', 'Cartas de Paulo'], ['1 Coríntios', '1Co', 'Cartas de Paulo'], ['2 Coríntios', '2Co', 'Cartas de Paulo'],
  ['Gálatas', 'Gl', 'Cartas de Paulo'], ['Efésios', 'Ef', 'Cartas de Paulo'], ['Filipenses', 'Fp', 'Cartas de Paulo'],
  ['Colossenses', 'Cl', 'Cartas de Paulo'], ['1 Tessalonicenses', '1Ts', 'Cartas de Paulo'],
  ['2 Tessalonicenses', '2Ts', 'Cartas de Paulo'], ['1 Timóteo', '1Tm', 'Cartas de Paulo'],
  ['2 Timóteo', '2Tm', 'Cartas de Paulo'], ['Tito', 'Tt', 'Cartas de Paulo'], ['Filemom', 'Fm', 'Cartas de Paulo'],
  ['Hebreus', 'Hb', 'Cartas gerais'], ['Tiago', 'Tg', 'Cartas gerais'], ['1 Pedro', '1Pe', 'Cartas gerais'],
  ['2 Pedro', '2Pe', 'Cartas gerais'], ['1 João', '1Jo', 'Cartas gerais'], ['2 João', '2Jo', 'Cartas gerais'],
  ['3 João', '3Jo', 'Cartas gerais'], ['Judas', 'Jd', 'Cartas gerais'],
  ['Apocalipse', 'Ap', 'Profecia'],
];

export const BOOKS: Book[] = RAW.map(([name, abbr, group], id) => ({
  id, name, abbr, group,
  testament: id < 39 ? 'AT' : 'NT',
  chapters: VERSE_COUNTS[id].length,
}));

export const TOTAL_CHAPTERS = BOOKS.reduce((a, b) => a + b.chapters, 0);

/** Grupos de livros, na ordem de exibição. */
export const GROUPS: { name: string; testament: Testament; books: Book[] }[] = (() => {
  const out: { name: string; testament: Testament; books: Book[] }[] = [];
  for (const b of BOOKS) {
    let g = out.find((x) => x.name === b.group);
    if (!g) { g = { name: b.group, testament: b.testament, books: [] }; out.push(g); }
    g.books.push(b);
  }
  return out;
})();

const OFFSETS: number[] = [];
{ let acc = 0; for (const b of BOOKS) { OFFSETS.push(acc); acc += b.chapters; } }

/** Id global (0..1188) de um capítulo. `chapter` é 1-based. */
export const chapterId = (book: number, chapter: number) => OFFSETS[book] + chapter - 1;

export function fromChapterId(id: number): { book: number; chapter: number } {
  let b = BOOKS.length - 1;
  while (b > 0 && OFFSETS[b] > id) b--;
  return { book: b, chapter: id - OFFSETS[b] + 1 };
}
export const bookOffset = (book: number) => OFFSETS[book];
export const chapterWeight = (id: number) => {
  const { book, chapter } = fromChapterId(id);
  return VERSE_COUNTS[book][chapter - 1];
};
export const isValidChapter = (book: number, chapter: number) =>
  Number.isInteger(book) && Number.isInteger(chapter) && book >= 0 && book < BOOKS.length && chapter >= 1 && chapter <= BOOKS[book].chapters;

export function chapterLabel(id: number): string {
  const { book, chapter } = fromChapterId(id);
  return `${BOOKS[book].name} ${chapter}`;
}

/** Agrupa ids consecutivos do mesmo livro: "Gênesis 1–3". */
export interface Segment { book: number; from: number; to: number }
export function toSegments(ids: number[]): Segment[] {
  const out: Segment[] = [];
  for (const id of ids) {
    const { book, chapter } = fromChapterId(id);
    const last = out[out.length - 1];
    if (last && last.book === book && last.to === chapter - 1) last.to = chapter;
    else out.push({ book, from: chapter, to: chapter });
  }
  return out;
}
export function segmentLabel(s: Segment, abbr = false): string {
  const name = abbr ? BOOKS[s.book].abbr : BOOKS[s.book].name;
  return s.from === s.to ? `${name} ${s.from}` : `${name} ${s.from}–${s.to}`;
}

/** Remove acentos, caixa e espaços extras (para busca). */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Nomes alternativos comuns (já sem acento e sem espaços). */
const ALIASES: Record<string, string> = {
  canticos: 'Ct', canticodoscanticos: 'Ct', canticodecantares: 'Ct', cantares: 'Ct', cantaresdesalomao: 'Ct',
  atosdosapostolos: 'At', apocalipsedejoao: 'Ap', revelacao: 'Ap', salmo: 'Sl', proverbio: 'Pv', eclesiastes: 'Ec',
};

/**
 * Interpreta "João 3:16", "1 Co 13", "II Coríntios 5:17", "Cânticos 1:1", "Atos dos Apóstolos 2".
 * Retorna null se não for uma referência válida (livro, capítulo e versículo existentes).
 * Prioriza a grafia exata (com acento) para distinguir "Jo" (João) de "Jó".
 */
export function parseReference(input: string): { book: number; chapter: number; verse?: number } | null {
  const m = input.toLowerCase().trim().match(/^(.+?)\.?\s*(\d+)(?:\s*[:.,]\s*(\d+))?\s*$/u);
  if (!m) return null;
  // numeral romano no começo ("II Coríntios") vira algarismo
  const roman = m[1].trim().replace(/^(iii|ii|i)(?=\s|\.)\.?\s*/u, (_, r: string) => r.length + ' ');
  const exact = roman.replace(/[\s.]/g, '');
  if (!/^[\p{L}\d]+$/u.test(exact)) return null;
  const plain = normalize(exact);
  const sq = (x: string) => x.toLowerCase().replace(/\s/g, '');
  const flat = (x: string) => normalize(x).replace(/\s/g, '');
  let book = BOOKS.findIndex((b) => sq(b.name) === exact || sq(b.abbr) === exact);
  if (book < 0) book = BOOKS.findIndex((b) => flat(b.name) === plain || flat(b.abbr) === plain);
  if (book < 0 && ALIASES[plain]) book = BOOKS.findIndex((b) => b.abbr === ALIASES[plain]);
  if (book < 0 && plain.length >= 3) book = BOOKS.findIndex((b) => flat(b.name).startsWith(plain));
  if (book < 0) return null;
  const chapter = Number(m[2]);
  if (!isValidChapter(book, chapter)) return null;
  if (m[3]) {
    const verse = Number(m[3]);
    if (verse < 1 || verse > VERSE_COUNTS[book][chapter - 1]) return null;
    return { book, chapter, verse };
  }
  return { book, chapter };
}
