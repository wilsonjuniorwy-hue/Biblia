// Gera os arquivos por livro (public/bible/<trad>/<n>.json) e a estrutura de versículos.
// Os textos de origem têm defeitos conhecidos: as correções ficam em data-source/fixes.json e nas regras abaixo.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
const SRC = { tb: 'data-source/TB.json', arc: 'data-source/ALM1911.json', blivre: 'data-source/BLIVRE.json' };
const fixes = JSON.parse(readFileSync('data-source/fixes.json', 'utf8'));
const clean = (s) => s.replace(/\s+/g, ' ').trim();

/** Asteriscos do ARC: sobras de quebra de linha do original. */
const fixStars = (s) => s
  .replace(/-\*\s+\*?/g, '') // palavra partida: "holo-* *causto" → "holocausto"
  .replace(/che\*astes/g, 'chegastes').replace(/co\*uo/g, 'como').replace(/fru\*ctos/g, 'fructos')
  .replace(/\bdas\*/g, 'das').replace(/dize-o\*/g, 'dize-o').replace(/Paddan\*-aram/g, 'Paddan-aram')
  .replace(/deze-\*seis/g, 'dezeseis').replace(/povo-\*será/g, 'povo será').replace(/sobre-\*puj/g, 'sobrepuj')
  .replace(/-\*/g, '-').replace(/\*/g, ''); // o resto era hífen de verdade ("peço-*te")
/** Espaço antes de pontuação. */
const fixPunct = (s) => s.replace(/\s+([,.;:!?])/g, '$1');

/** BLIVRE: falta de espaço depois da pontuação e palavras repetidas por engano ("sobre sobre"). */
const KEEP_REPEAT = new Set(['se', 'a', 'o', 'os', 'as', 'no', 'na', 'nos', 'um']); // repetições legítimas ("deu-a a", "se se"…)
const fixBlivre = (s) => s
  .replace(/([,;:!?])(?=[A-Za-zÀ-ú])/g, '$1 ')
  .replace(/([a-zà-ú])\.(?=[A-ZÀ-Ú])/g, '$1. ')
  .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')') // "( dizia ele )" → "(dizia ele)"
  .replace(/ -(?=[a-zà-ú])/g, '-') // "Declarando -as" → "Declarando-as"
  .replace(/([\p{L}]) - (?=(?:o|os|a|as|lo|los|la|las|lhe|lhes|me|te|se|nos|vos)(?![\p{L}]))/gu, '$1-') // "trazei - os" → "trazei-os"
  .replace(/^- /, '').replace(/ - /g, ' — ') // travessão de verdade; "- " no início era marca de poesia
  .replace(/\.(?=\()/g, '. ').replace(/\.\.(?!\.)/g, '.').replace(/:;/g, ';').replace(/,\./g, '.')
  .replace(/(?<![\p{L}-])([\p{L}]+) \1(?![\p{L}-])/giu, (m, w) => (KEEP_REPEAT.has(w.toLowerCase()) ? m : w));

let counts = null;
let abbrevs = null;
for (const [id, file] of Object.entries(SRC)) {
  const raw = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (raw.length !== 66) throw new Error(`${id}: esperado 66 livros, veio ${raw.length}`);
  if (id === 'tb') abbrevs = raw.map((b) => b.abbrev);
  const bookIdx = (a) => { const i = abbrevs.indexOf(a); if (i < 0) throw new Error(`livro desconhecido em fixes: ${a}`); return i; };
  const books = raw.map((b) => b.chapters.map((c) => c.map((v) => {
    const t = clean(v);
    return id === 'arc' ? fixStars(t) : t;
  })));
  const verse = (a, ch, v) => { const arr = books[bookIdx(a)][ch - 1]; if (!arr || arr[v - 1] === undefined) throw new Error(`fixes: ${a} ${ch}:${v} não existe`); return arr; };

  for (const [tr, a, ch, v, from, to] of fixes.replace) {
    if (tr !== id) continue;
    const arr = verse(a, ch, v);
    if (!arr[v - 1].includes(from)) throw new Error(`fixes: "${from}" não encontrado em ${id} ${a} ${ch}:${v}`);
    arr[v - 1] = arr[v - 1].replace(from, to);
  }
  for (const [tr, a, ch, v, at] of fixes.split) {
    if (tr !== id) continue;
    const arr = verse(a, ch, v);
    const k = arr[v - 1].indexOf(at);
    if (k < 0) throw new Error(`fixes: ponto de divisão não encontrado em ${id} ${a} ${ch}:${v}`);
    const cut = k + at.indexOf('.') + 1;
    arr.splice(v - 1, 1, arr[v - 1].slice(0, cut).trim(), arr[v - 1].slice(cut).trim());
  }
  for (const [tr, a, ch, v] of fixes.merge) {
    if (tr !== id) continue;
    const arr = verse(a, ch, v);
    arr.splice(v - 1, 2, `${arr[v - 1]} ${arr[v]}`);
  }

  rmSync(`public/bible/${id}`, { recursive: true, force: true });
  mkdirSync(`public/bible/${id}`, { recursive: true });
  const out = books.map((chs) => chs.map((c) => c.map((v) => clean(fixPunct(id === 'blivre' ? fixBlivre(v) : v)))));
  out.forEach((chapters, i) => {
    chapters.forEach((c, ci) => c.forEach((v, vi) => { if (!v) throw new Error(`${id} ${i}:${ci + 1}:${vi + 1} vazio`); }));
    writeFileSync(`public/bible/${id}/${i}.json`, JSON.stringify(chapters));
  });
  const shape = out.map((b) => b.map((c) => c.length));
  if (id === 'tb') counts = shape;
  else {
    if (shape.some((b, i) => b.length !== counts[i].length)) throw new Error('capítulos divergentes entre traduções');
    shape.forEach((b, i) => b.forEach((n, c) => { if (n !== counts[i][c]) throw new Error(`versículos divergentes: ${abbrevs[i]} ${c + 1} (tb ${counts[i][c]}, arc ${n})`); }));
  }
}
writeFileSync('src/data/verseCounts.json', JSON.stringify(counts));
console.log('ok:', counts.reduce((a, b) => a + b.length, 0), 'capítulos');
