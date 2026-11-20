import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/favicon.svg');
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png');
await sharp(svg).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png');
// maskable: fundo sólido até a borda, ícone reduzido dentro da zona segura
const inner = await sharp(svg).resize(380, 380).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#14213d' } })
  .composite([{ input: inner, gravity: 'center' }]).png().toFile('public/icons/maskable-512.png');
console.log('icons ok');
