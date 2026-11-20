// Gera os arquivos por livro (public/bible/<trad>/<n>.json) e a estrutura de versículos.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
const SRC = { tb: 'data-source/TB.json', arc: 'data-source/ALM1911.json' };
const clean = (s) => s.replace(/\s+/g, ' ').trim();
let counts = null;
for (const [id, file] of Object.entries(SRC)) {
  const raw = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (raw.length !== 66) throw new Error(`${id}: esperado 66 livros, veio ${raw.length}`);
  rmSync(`public/bible/${id}`, { recursive: true, force: true });
  mkdirSync(`public/bible/${id}`, { recursive: true });
  raw.forEach((book, i) => {
    const chapters = book.chapters.map((c) => c.map(clean));
    chapters.forEach((c, ci) => c.forEach((v, vi) => { if (!v) throw new Error(`${id} ${i}:${ci + 1}:${vi + 1} vazio`); }));
    writeFileSync(`public/bible/${id}/${i}.json`, JSON.stringify(chapters));
  });
  const shape = raw.map((b) => b.chapters.map((c) => c.length));
  if (id === 'tb') counts = shape;
  else if (shape.some((b, i) => b.length !== counts[i].length)) throw new Error('capítulos divergentes entre traduções');
}
writeFileSync('src/data/verseCounts.json', JSON.stringify(counts));
console.log('ok:', counts.reduce((a, b) => a + b.length, 0), 'capítulos');
