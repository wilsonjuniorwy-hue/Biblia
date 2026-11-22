// Gera as imagens da ficha da Google Play em play-store/:
//  - icone-512.png: ícone quadrado, sem cantos arredondados (a loja arredonda sozinha)
//  - imagem-destaque-1024x500.png: gráfico de recursos
// Uso: node scripts/gen-store-assets.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';

mkdirSync('play-store', { recursive: true });
const fav = readFileSync('public/favicon.svg', 'utf8');

// 1) ícone: o mesmo farol, mas com o fundo preenchendo o quadrado inteiro
const square = fav.replace('rx="112"', 'rx="0"');
await sharp(Buffer.from(square)).resize(512, 512).png().toFile('play-store/icone-512.png');

// 2) imagem de destaque 1024x500: céu ao amanhecer, farol e texto
const inner = fav
  .replace(/<svg[^>]*>/, '')
  .replace('</svg>', '')
  .replace(/<rect width="512" height="512" rx="112" fill="#14213d"\/>/, '');
const feature = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1530"/><stop offset=".62" stop-color="#25407a"/><stop offset="1" stop-color="#e0873a"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#sky)"/>
  <g fill="#fff6dc">
    <circle cx="70" cy="60" r="2"/><circle cx="210" cy="120" r="1.6"/><circle cx="400" cy="40" r="2"/>
    <circle cx="520" cy="110" r="1.5"/><circle cx="640" cy="50" r="2"/><circle cx="960" cy="80" r="2"/><circle cx="120" cy="210" r="1.5"/>
  </g>
  <svg x="520" y="14" width="472" height="472" viewBox="0 0 512 512">${inner}</svg>
  <text x="64" y="205" font-family="Georgia, 'Times New Roman', serif" font-size="92" font-weight="700" fill="#fff6dc">Farol de Fé</text>
  <text x="68" y="262" font-family="Segoe UI, Arial, sans-serif" font-size="32" fill="#fff6dc">Bíblia, planos de leitura</text>
  <text x="68" y="304" font-family="Segoe UI, Arial, sans-serif" font-size="32" fill="#fff6dc">e devocional diário</text>
  <text x="68" y="372" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="600" fill="#ffd27a">Funciona offline  ·  Sem anúncios</text>
</svg>`;
await sharp(Buffer.from(feature)).png().toFile('play-store/imagem-destaque-1024x500.png');
console.log('imagens da loja ok');
