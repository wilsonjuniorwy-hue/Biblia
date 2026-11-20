import { BOOKS } from './books';

export interface VerseRef { book: number; chapter: number; from: number; to: number }

/** "Fp 4:6-7" → { book, chapter, from, to } */
export function parseVerseRef(s: string): VerseRef {
  const m = s.match(/^(\S+)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`Referência inválida: ${s}`);
  const book = BOOKS.findIndex((b) => b.abbr === m[1]);
  if (book < 0) throw new Error(`Livro desconhecido em: ${s}`);
  const from = Number(m[3]);
  return { book, chapter: Number(m[2]), from, to: m[4] ? Number(m[4]) : from };
}

export function refLabel(r: VerseRef): string {
  const name = BOOKS[r.book].name;
  return r.from === r.to ? `${name} ${r.chapter}:${r.from}` : `${name} ${r.chapter}:${r.from}-${r.to}`;
}

export interface Topic { id: string; title: string; icon: string; blurb: string; refs: VerseRef[] }

const t = (id: string, title: string, icon: string, blurb: string, refs: string[]): Topic => ({
  id, title, icon, blurb, refs: refs.map(parseVerseRef),
});

export const TOPICS: Topic[] = [
  t('ansiedade', 'Ansiedade', '🌿', 'Quando a mente não descansa', ['Fp 4:6-7', '1Pe 5:7', 'Mt 6:25-34', 'Sl 94:19', 'Is 41:10', 'Jo 14:27']),
  t('medo', 'Medo e coragem', '🛡️', 'Para enfrentar o que assusta', ['Js 1:9', 'Sl 27:1', 'Sl 23:4', '2Tm 1:7', 'Is 43:1-2', 'Dt 31:6']),
  t('paz', 'Paz', '🕊️', 'Descanso para o coração', ['Jo 14:27', 'Is 26:3', 'Fp 4:7', 'Cl 3:15', 'Sl 4:8', 'Jo 16:33']),
  t('forca', 'Força nas dificuldades', '⛰️', 'Quando tudo pesa demais', ['Fp 4:13', 'Is 40:29-31', '2Co 12:9-10', 'Sl 46:1-2', 'Rm 8:37-39', 'Tg 1:2-4']),
  t('esperanca', 'Esperança', '🌅', 'Um novo amanhecer', ['Jr 29:11', 'Rm 15:13', 'Rm 8:28', 'Lm 3:22-23', 'Hb 11:1', 'Sl 42:11']),
  t('consolo', 'Consolo e luto', '🤍', 'Palavras para a dor e a perda', ['Sl 34:18', 'Mt 5:4', 'Ap 21:4', '2Co 1:3-4', 'Sl 147:3', 'Jo 11:25-26']),
  t('solidao', 'Solidão', '🌙', 'Você não está sozinho', ['Dt 31:8', 'Sl 25:16-17', 'Mt 28:20', 'Hb 13:5', 'Sl 68:5-6', 'Is 41:10']),
  t('perdao', 'Perdão', '🤝', 'Perdoar e ser perdoado', ['Ef 4:32', 'Cl 3:13', 'Mt 6:14-15', '1Jo 1:9', 'Sl 103:12', 'Mt 18:21-22']),
  t('gratidao', 'Gratidão', '🙏', 'Um coração agradecido', ['1Ts 5:18', 'Sl 107:1', 'Sl 100:4-5', 'Cl 3:15-17', 'Sl 136:1', 'Sl 103:2']),
  t('alegria', 'Alegria', '☀️', 'Alegria que não depende das circunstâncias', ['Ne 8:10', 'Sl 16:11', 'Fp 4:4', 'Jo 15:11', 'Sl 30:5', 'Sl 118:24']),
  t('amor', 'Amor', '❤️', 'O maior de todos', ['1Co 13:4-7', 'Jo 3:16', '1Jo 4:7-8', 'Rm 5:8', 'Jo 15:12-13', '1Jo 4:18']),
  t('fe', 'Fé', '🌱', 'Confiar sem ver', ['Hb 11:1', 'Hb 11:6', 'Rm 10:17', 'Mc 9:23-24', '2Co 5:7', 'Mt 17:20']),
  t('oracao', 'Oração', '🕯️', 'Conversar com Deus', ['Mt 6:9-13', '1Ts 5:16-18', 'Tg 5:16', 'Mt 7:7-8', 'Jr 33:3', 'Fp 4:6']),
  t('sabedoria', 'Sabedoria', '📖', 'Direção para decidir bem', ['Pv 3:5-6', 'Tg 1:5', 'Pv 9:10', 'Pv 16:3', 'Sl 119:105', 'Pv 4:7']),
  t('proposito', 'Propósito e direção', '🧭', 'Para quando falta rumo', ['Pv 16:9', 'Sl 32:8', 'Is 30:21', 'Sl 37:4-5', 'Rm 12:2', 'Ef 2:10']),
  t('paciencia', 'Paciência e espera', '⏳', 'Aprender a aguardar', ['Sl 27:14', 'Is 40:31', 'Tg 5:7-8', 'Rm 8:25', 'Sl 37:7', 'Lm 3:25-26']),
  t('tentacao', 'Tentação', '⚔️', 'Resistir e vencer', ['1Co 10:13', 'Tg 4:7', 'Mt 26:41', 'Hb 4:15-16', 'Sl 119:11', 'Tg 1:12']),
  t('humildade', 'Humildade', '🌾', 'Grandeza no servir', ['Fp 2:3-4', 'Tg 4:10', 'Pv 11:2', 'Mq 6:8', '1Pe 5:5-6', 'Mt 23:12']),
  t('familia', 'Família', '🏡', 'Casa, pais e filhos', ['Js 24:15', 'Pv 22:6', 'Ef 6:1-4', 'Sl 127:3', 'Cl 3:18-21', 'Ef 5:25']),
  t('trabalho', 'Trabalho', '🛠️', 'Fazer tudo de coração', ['Cl 3:23', 'Ec 9:10', 'Pv 12:24', 'Sl 90:17', 'Pv 14:23', 'Ec 3:13']),
  t('dinheiro', 'Dinheiro e generosidade', '🪙', 'Contentamento e partilha', ['Mt 6:19-21', 'Pv 3:9-10', 'Lc 6:38', '2Co 9:6-7', '1Tm 6:6-10', 'Hb 13:5']),
  t('saude', 'Saúde e cura', '🩹', 'Cuidado para o corpo e a alma', ['Sl 103:2-3', 'Jr 17:14', 'Tg 5:14-15', 'Sl 147:3', '3Jo 1:2', 'Is 53:5']),
];

export const topicById = (id: string) => TOPICS.find((x) => x.id === id);

/** Versículo do dia: determinístico pela data, sai da seleção dos tópicos. */
const VERSE_POOL: VerseRef[] = (() => {
  const seen = new Set<string>();
  const out: VerseRef[] = [];
  for (const tp of TOPICS) for (const r of tp.refs) {
    const k = refLabel(r);
    if (!seen.has(k)) { seen.add(k); out.push(r); }
  }
  return out;
})();

export function verseOfTheDay(dayIndex: number): VerseRef {
  // multiplicador primo com o tamanho do conjunto: dias vizinhos caem em tópicos diferentes
  return VERSE_POOL[(dayIndex * 37) % VERSE_POOL.length];
}
export const VERSE_POOL_SIZE = VERSE_POOL.length;
