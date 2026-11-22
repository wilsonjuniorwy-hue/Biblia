/**
 * scripts/build-devotional-audio.mjs
 * 
 * Script de compilação de áudio pré-gerado para os devocionais do app Farol de Fé.
 * Roda no computador do desenvolvedor para alimentar a pasta public/audio/devocionais/<id>/
 * 
 * Voz escolhida: pt-BR-ThalitaMultilingualNeural (Microsoft Neural TTS)
 * Justificativa: Modelo neural multilíngue de última geração, com timbre aveludado,
 * natural e empático. Com velocidade ajustada (-14%), tom rebaixado (-1Hz) e micropausas
 * de respiração, oferece uma leitura serena e humanizada, sem rigidez digital.
 * 
 * Provedores suportados:
 * - edge: Usa edge-tts local (rede neural Microsoft, sem custo e sem chave de API).
 * - azure: Microsoft Azure Speech Services (requer AZURE_SPEECH_KEY e AZURE_SPEECH_REGION em .env).
 * - google: Google Cloud Text-to-Speech (requer GOOGLE_TTS_API_KEY em .env).
 * - elevenlabs: ElevenLabs API (requer ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID em .env).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Carrega variáveis do arquivo .env (se existir) sem expor segredos
function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const PROVIDER = process.env.TTS_PROVIDER || (process.env.AZURE_SPEECH_KEY ? 'azure' : 'edge');
const VOICE = process.env.TTS_VOICE || 'pt-BR-ThalitaMultilingualNeural';
const RATE = process.env.TTS_RATE || '-14%'; // ~0.86x velocidade pausada e calma
const PITCH = process.env.TTS_PITCH || '-1Hz'; // tom aveludado e suave
const TRANSLATIONS = ['blivre', 'tb', 'arc'];

console.log(`[build-devotional-audio] Provedor: ${PROVIDER} | Voz: ${VOICE} | Taxa: ${RATE} | Pitch: ${PITCH}`);

/**
 * Refina o texto para a síntese neural, introduzindo micropausas
 * de respiração nas vírgulas e conectivos sem alterar o sentido do texto original.
 */
function refineDevotionalSpeech(text) {
  return text
    // 1. Evita que o modelo multilíngue classifique "Oração." isolada como inglês:
    // Troca o ponto seco por reticências suaves que forçam prosódia e fonética em pt-BR
    .replace(/^Oração\./i, 'Oração...')
    .replace(/^Para pensar:/i, 'Para pensar...')
    .replace(/^Leitura bíblica:/i, 'Leitura bíblica...')
    // 2. Converte palavras bíblicas em ALL CAPS (ex.: "SENHOR", "DEUS") para TitleCase
    // para evitar que o sintetizador neural tente soletrar letra por letra como sigla
    .replace(/\b([A-ZÀ-Ú])([A-ZÀ-Ú]+)\b/g, (_, first, rest) => first + rest.toLowerCase())
    .replace(/[“”"]/g, '') // remove aspas que provocam quebra abrupta
    .replace(/\s+—\s+/g, '... ')
    .replace(/;\s*/g, '... ')
    .replace(/\.\.\.\s*/g, '... ')
    .trim();
}

// Provedores de síntese TTS
const providers = {
  // Edge TTS (Microsoft Neural via CLI local edge-tts com arquivo temporário UTF-8)
  async edge(text, outputFile) {
    const spokenText = refineDevotionalSpeech(text);
    const tempTextFile = `${outputFile}.tmp.txt`;
    writeFileSync(tempTextFile, spokenText, 'utf8');

    return new Promise((res, rej) => {
      const args = [
        '--voice', VOICE,
        `--rate=${RATE}`,
        '-f', tempTextFile,
        '--write-media', outputFile,
      ];
      if (PITCH) {
        args.push(`--pitch=${PITCH}`);
      }
      const child = spawn('edge-tts', args, { stdio: 'inherit' });
      child.on('close', (code) => {
        try { unlinkSync(tempTextFile); } catch {}
        if (code === 0) res();
        else rej(new Error(`edge-tts falhou com código ${code}`));
      });
      child.on('error', (err) => {
        try { unlinkSync(tempTextFile); } catch {}
        rej(err);
      });
    });
  },

  // Azure Cognitive Services Speech REST API
  async azure(text, outputFile) {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';
    if (!key) throw new Error('AZURE_SPEECH_KEY não encontrada no .env');

    const spokenText = refineDevotionalSpeech(text);
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
      <voice name="${VOICE}">
        <prosody rate="${RATE}" pitch="${PITCH}">${escapeXml(spokenText)}</prosody>
      </voice>
    </speak>`;

    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-48khz-96kbitrate-mono-mp3',
        'User-Agent': 'lampada-biblia',
      },
      body: ssml,
    });

    if (!res.ok) {
      throw new Error(`Azure TTS error ${res.status}: ${await res.text()}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(outputFile, buffer);
  },

  // Google Cloud Text-to-Speech REST API
  async google(text, outputFile) {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_TTS_API_KEY não encontrada no .env');

    const spokenText = refineDevotionalSpeech(text);
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: spokenText },
        voice: {
          languageCode: 'pt-BR',
          name: process.env.GOOGLE_TTS_VOICE || 'pt-BR-Neural2-A',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.88,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Google TTS error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const buffer = Buffer.from(data.audioContent, 'base64');
    writeFileSync(outputFile, buffer);
  },

  // ElevenLabs REST API
  async elevenlabs(text, outputFile) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey || !voiceId) throw new Error('ELEVENLABS_API_KEY ou ELEVENLABS_VOICE_ID não encontrada');

    const spokenText = refineDevotionalSpeech(text);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: spokenText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.80, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(outputFile, buffer);
  },
};

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Obtém duração precisa do arquivo MP3 via ffprobe
function getDuration(filePath) {
  try {
    const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, {
      encoding: 'utf8',
    }).trim();
    const val = parseFloat(out);
    return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  } catch (err) {
    console.warn(`[aviso] ffprobe não conseguiu ler a duração de ${filePath}: ${err.message}`);
    return 0;
  }
}

// Importa os devocionais a partir de src/data/devotionals.ts
async function loadDevotionals() {
  const tsContent = readFileSync(join(ROOT, 'src/data/devotionals.ts'), 'utf8');
  try {
    const mod = await import('../src/data/devotionals.ts');
    return mod.DEVOTIONALS;
  } catch {
    const match = tsContent.match(/export const DEVOTIONALS:\s*Devotional\[\]\s*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      const code = match[1];
      return eval(`(${code})`);
    }
    throw new Error('Não foi possível carregar DEVOTIONALS');
  }
}

function getBookName(bookIndex) {
  const names = [
    'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio',
    'Josué', 'Juízes', 'Rute', '1 Samuel', '2 Samuel',
    '1 Reis', '2 Reis', '1 Crônicas', '2 Crônicas', 'Esdras',
    'Neemias', 'Ester', 'Jó', 'Salmos', 'Provérbios',
    'Eclesiastes', 'Cantares', 'Isaías', 'Jeremias', 'Lamentações',
    'Ezequiel', 'Daniel', 'Oseias', 'Joel', 'Amós',
    'Obadias', 'Jonas', 'Miqueias', 'Naum', 'Habacuque',
    'Sofonias', 'Ageu', 'Zacarias', 'Malaquias',
    'Mateus', 'Marcos', 'Lucas', 'João', 'Atos',
    'Romanos', '1 Coríntios', '2 Coríntios', 'Gálatas', 'Efésios',
    'Filipenses', 'Colossenses', '1 Tessalonicenses', '2 Tessalonicenses',
    '1 Timóteo', '2 Timóteo', 'Tito', 'Filemom', 'Hebreus',
    'Tiago', '1 Pedro', '2 Pedro', '1 João', '2 João',
    '3 João', 'Judas', 'Apocalipse',
  ];
  return names[bookIndex] || `Livro ${bookIndex}`;
}

function formatRefLabel(ref) {
  const bName = getBookName(ref.book);
  const singularName = bName === 'Salmos' ? 'Salmo' : bName;
  if (ref.from === ref.to) return `${singularName} ${ref.chapter}:${ref.from}`;
  return `${singularName} ${ref.chapter}:${ref.from}-${ref.to}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function synthesizeText(text, filePath, force = false) {
  if (existsSync(filePath) && !force) {
    return;
  }
  const synthFn = providers[PROVIDER];
  if (!synthFn) throw new Error(`Provedor desconhecido: ${PROVIDER}`);

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await synthFn(text, filePath);
      await sleep(500); // pequeno intervalo para estabilidade do serviço
      return;
    } catch (err) {
      lastError = err;
      console.warn(`\n  [retry ${attempt}/3] Instabilidade temporária, tentando novamente em 2s... (${err.message})`);
      await sleep(2000);
    }
  }
  throw lastError;
}

async function main() {
  const force = process.argv.includes('--force');
  const devotionals = await loadDevotionals();
  const synth = providers[PROVIDER];
  if (!synth) throw new Error(`Provedor '${PROVIDER}' não suportado.`);

  console.log(`Carregados ${devotionals.length} devocionais.`);

  for (const dev of devotionals) {
    const devDir = join(ROOT, 'public/audio/devocionais', dev.id);
    mkdirSync(devDir, { recursive: true });

    const manifestPath = join(devDir, 'manifest.json');
    let devForce = force;

    // Regra anti-mistura de voz: se a voz gravada anteriormente for diferente, regera tudo
    if (existsSync(manifestPath) && !devForce) {
      try {
        const existingManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        if (existingManifest.voice && existingManifest.voice !== VOICE) {
          console.log(`  [consistência] Voz alterada de '${existingManifest.voice}' para '${VOICE}'. Forçando regeração completa para evitar mistura de vozes.`);
          devForce = true;
        }
      } catch {
        devForce = true;
      }
    }

    console.log(`\nProcessando devocional: "${dev.title}" (${dev.id})`);

    const manifest = {
      devotionalId: dev.id,
      title: dev.title,
      voice: VOICE,
      provider: PROVIDER,
      rate: 0.86,
      common: {},
      translations: {},
    };

    // 1. Trechos comuns
    const commonParts = [
      { id: 'titulo', text: dev.title },
      { id: 'leitura-intro', text: `Leitura bíblica: ${formatRefLabel(dev.ref)}.` },
    ];

    dev.paragraphs.forEach((p, idx) => {
      commonParts.push({ id: `p${idx}`, text: p });
    });

    commonParts.push({ id: 'pergunta', text: `Para pensar: ${dev.question}` });
    commonParts.push({ id: 'oracao', text: `Oração. ${dev.prayer}` });

    for (const part of commonParts) {
      const fileName = `${part.id}.mp3`;
      const filePath = join(devDir, fileName);
      process.stdout.write(`  [comum] Sintetizando '${part.id}'... `);
      await synthesizeText(part.text, filePath, devForce);
      const duration = getDuration(filePath);
      manifest.common[part.id] = {
        file: fileName,
        duration,
      };
      console.log(`ok (${duration}s)`);
    }

    // 2. Leitura bíblica por tradução
    for (const tr of TRANSLATIONS) {
      const trDir = join(devDir, tr);
      mkdirSync(trDir, { recursive: true });
      manifest.translations[tr] = {};

      const bibleJsonPath = join(ROOT, 'public/bible', tr, `${dev.ref.book}.json`);
      if (!existsSync(bibleJsonPath)) {
        console.warn(`[aviso] Arquivo da Bíblia não encontrado: ${bibleJsonPath}`);
        continue;
      }

      const bookData = JSON.parse(readFileSync(bibleJsonPath, 'utf8'));
      const chapterVerses = bookData[dev.ref.chapter - 1] || [];
      const verses = chapterVerses.slice(dev.ref.from - 1, dev.ref.to);

      for (let i = 0; i < verses.length; i++) {
        const vNum = dev.ref.from + i;
        const vId = `v${vNum}`;
        const vText = verses[i];
        const fileName = `${tr}/${vId}.mp3`;
        const filePath = join(devDir, fileName);

        process.stdout.write(`  [${tr}] Sintetizando '${vId}'... `);
        await synthesizeText(vText, filePath, devForce);
        const duration = getDuration(filePath);
        manifest.translations[tr][vId] = {
          file: fileName,
          duration,
        };
        console.log(`ok (${duration}s)`);
      }
    }

    // Salva o manifest.json
    const manifestPath = join(devDir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`Manifesto salvo em: ${manifestPath}`);
  }

  console.log('\n[concluído] Todos os devocionais foram processados com sucesso!');
}

main().catch((err) => {
  console.error('\nErro na execução do script:', err);
  process.exit(1);
});
