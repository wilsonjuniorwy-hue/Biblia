// Converte os arquivos USFM da Bíblia Livre (eBible.org, porbr2018) em data-source/BLIVRE.json,
// no mesmo formato das outras fontes: [{ abbrev, chapters: [[versículos]] }].
// Uso: node scripts/import-usfm.mjs <pasta-com-os-.usfm>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.argv[2];
if (!dir) throw new Error('informe a pasta com os arquivos .usfm');
const tb = JSON.parse(readFileSync('data-source/TB.json', 'utf8').replace(/^﻿/, ''));
const files = readdirSync(dir).filter((f) => /^\d\d-.*\.usfm$/.test(f)).sort();
if (files.length !== 66) throw new Error(`esperado 66 arquivos, vieram ${files.length}`);

const strip = (s) => s
  .replace(/([\p{L}])\\add (?!-)/gu, '$1 \\add ') // "afastou\add deles": a marca come o espaço, então devolve
  .replace(/\\rq\b.*?\\rq\*/g, '') // referências de citação ("Deuteronômio 6:16"): não fazem parte do texto
  // notas de rodapé: se a nota abre um "(" que só fecha depois dela ("(= força \f* )"), o ")" solto também sai
  .replace(/\\f\b((?:(?!\\f\*).)*?)\\f\*(\s*\))?/g, (m, body, close) => (close && (body.match(/\(/g) || []).length > (body.match(/\)/g) || []).length ? '' : close ?? ''))
  .replace(/\\(f|x)\b.*?\\\1\*/g, '') // demais notas e referências cruzadas
  .replace(/\\\+?[a-z]+\d?\*/g, '') // marcas de fechamento
  .replace(/\\\+?[a-z]+\d?\s?/g, '') // marcas de abertura (\add, \wj, \nd…)
  .replace(/\s+/g, ' ').trim();

const out = files.map((f, i) => {
  const chapters = [];
  let ch = -1;
  let v = -1;
  for (const line of readFileSync(join(dir, f), 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    let m;
    if ((m = line.match(/^\\c\s+(\d+)/))) { ch = Number(m[1]) - 1; chapters[ch] = []; v = -1; continue; }
    if (ch < 0) continue;
    if ((m = line.match(/^\\v\s+(\d+)(?:-(\d+))?\s*(.*)$/))) {
      const first = Number(m[1]);
      const last = Number(m[2] ?? m[1]);
      if (first !== chapters[ch].length + 1) throw new Error(`${f} ${ch + 1}:${first} fora de ordem`);
      for (let n = first; n <= last; n++) chapters[ch].push('');
      v = last - 1; // ponte "3-4": o texto fica no último versículo da ponte
      chapters[ch][v] = m[3];
      continue;
    }
    if (v < 0) continue;
    if (/^\\(p|q\d?|m|li\d?|pi\d?|b|nb)(\s|$)/.test(line)) chapters[ch][v] += ' ' + line.replace(/^\\\S+\s*/, '');
    else if (line.trim() && !line.startsWith('\\')) chapters[ch][v] += ' ' + line;
  }
  const text = chapters.map((c) => c.map(strip));
  // Cartas (Romanos–Hebreus): o último versículo traz a "assinatura" ("Escrita de Roma…"), que não é texto bíblico.
  if (i >= 44 && i <= 57) {
    const last = text[text.length - 1];
    last[last.length - 1] = last[last.length - 1]
      .replace(/\s*\(?(Escrita |Para os filipenses\.|A (primeira|segunda) carta |A carta a )[^]*$/i, '').trim();
  }
  return { abbrev: tb[i].abbrev, chapters: text };
});
writeFileSync('data-source/BLIVRE.json', JSON.stringify(out));

const empty = [];
out.forEach((b) => b.chapters.forEach((c, ci) => c.forEach((v, vi) => { if (!v) empty.push(`${b.abbrev} ${ci + 1}:${vi + 1}`); })));
const diff = [];
out.forEach((b, i) => {
  if (b.chapters.length !== tb[i].chapters.length) diff.push(`${b.abbrev}: capítulos ${b.chapters.length} (TB ${tb[i].chapters.length})`);
  else b.chapters.forEach((c, ci) => { if (c.length !== tb[i].chapters[ci].length) diff.push(`${b.abbrev} ${ci + 1}: ${c.length} versículos (TB ${tb[i].chapters[ci].length})`); });
});
console.log('vazios:', empty.length, empty.slice(0, 30).join(', '));
console.log('diferenças de estrutura vs TB:', diff.length);
diff.slice(0, 60).forEach((d) => console.log('  ', d));
