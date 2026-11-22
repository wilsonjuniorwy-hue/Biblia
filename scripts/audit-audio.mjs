import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const baseDir = resolve('public/audio/devocionais');
const dirs = readdirSync(baseDir).filter((f) => statSync(join(baseDir, f)).isDirectory());

console.log('='.repeat(70));
console.log('           AUDITORIA COMPLETA DE ÁUDIO DOS DEVOCIONAIS');
console.log('='.repeat(70));

let totalFiles = 0;
let totalSizeBytes = 0;
let totalDurationSeconds = 0;
let errorCount = 0;

function getAudioFiles(dir) {
  let results = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    if (statSync(full).isDirectory()) {
      results = results.concat(getAudioFiles(full));
    } else if (item.endsWith('.mp3')) {
      results.push(full);
    }
  }
  return results;
}

for (const d of dirs) {
  const dirPath = join(baseDir, d);
  const manifestPath = join(dirPath, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`[ERRO] Devocional sem manifest.json: ${d}`);
    errorCount++;
    continue;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  const mp3s = getAudioFiles(dirPath);
  totalFiles += mp3s.length;

  let devSize = 0;
  for (const f of mp3s) {
    const sz = statSync(f).size;
    devSize += sz;
    if (sz === 0) {
      console.error(`[ERRO] Arquivo zerado (0 bytes): ${f}`);
      errorCount++;
    }
  }
  totalSizeBytes += devSize;

  let devDuration = 0;
  const checkTracks = (obj) => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (!v || typeof v.duration !== 'number' || v.duration <= 0) {
        console.error(`[ERRO] Duração inválida no track '${k}' de ${d}:`, v?.duration);
        errorCount++;
      } else {
        devDuration += v.duration;
      }
    }
  };

  checkTracks(manifest.common);
  for (const [tr, verses] of Object.entries(manifest.translations || {})) {
    checkTracks(verses);
  }
  totalDurationSeconds += devDuration;

  console.log(`\n• Devocional: "${manifest.title || d}" (${d})`);
  console.log(`  - Voz / Provedor: ${manifest.voice} (${manifest.provider})`);
  console.log(`  - Arquivos MP3:   ${mp3s.length} faixas`);
  console.log(`  - Espaço em disco: ${(devSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  - Duração total:   ${Math.round(devDuration)}s (~${(devDuration / 60).toFixed(1)} min)`);
}

console.log('\n' + '='.repeat(70));
console.log('RESUMO FINAL:');
console.log(`- Devocionais auditados:    ${dirs.length}/7`);
console.log(`- Total de faixas MP3:     ${totalFiles}`);
console.log(`- Armazenamento total:     ${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB`);
console.log(`- Tempo total de narração: ${Math.round(totalDurationSeconds)}s (~${(totalDurationSeconds / 60).toFixed(1)} min)`);
console.log(`- Erros / Corrupções:      ${errorCount === 0 ? '0 (100% íntegro e validado)' : `${errorCount} erro(s)`}`);
console.log('='.repeat(70));

if (errorCount > 0) process.exit(1);
