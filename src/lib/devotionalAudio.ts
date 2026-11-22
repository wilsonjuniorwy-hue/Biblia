/**
 * src/lib/devotionalAudio.ts
 *
 * Tipos e helpers puros para o sistema de áudio pré-gerado dos devocionais.
 */

export interface AudioPartMeta {
  file: string;
  duration: number;
}

export interface DevotionalManifest {
  devotionalId: string;
  title: string;
  voice: string;
  provider: string;
  rate: number;
  common: Record<string, AudioPartMeta>;
  translations: Record<string, Record<string, AudioPartMeta>>;
}

export interface DevotionalPlayItem {
  id: string;
  text: string;
  file?: string;
  url?: string;
  duration?: number;
}

/**
 * Constrói a lista ordenada de faixas a serem reproduzidas, mapeando
 * cada trecho do devocional com o arquivo correspondente no manifest
 * (comum ou específico da tradução ativa).
 */
export function buildDevotionalPlaylist(
  parts: { id: string; text: string }[],
  manifest: DevotionalManifest | null,
  translation: string,
  basePath = './audio/devocionais'
): DevotionalPlayItem[] {
  if (!manifest) {
    return parts.map((p) => ({ ...p }));
  }

  const cleanBase = basePath.replace(/\/+$/, '');
  const devBase = `${cleanBase}/${manifest.devotionalId}`;

  return parts.map((p) => {
    // 1. Procura em trechos comuns (titulo, intro, paragrafos, pergunta, oracao)
    let meta = manifest.common[p.id];

    // 2. Se não estiver em comum, procura nos versículos da tradução escolhida
    if (!meta && manifest.translations?.[translation]) {
      meta = manifest.translations[translation][p.id];
    }

    // 3. Fallback: se a tradução solicitada não tiver o versículo, tenta qualquer tradução disponível
    if (!meta && manifest.translations) {
      for (const trKey of Object.keys(manifest.translations)) {
        if (manifest.translations[trKey]?.[p.id]) {
          meta = manifest.translations[trKey][p.id];
          break;
        }
      }
    }

    if (meta && meta.file) {
      return {
        id: p.id,
        text: p.text,
        file: meta.file,
        url: `${devBase}/${meta.file}`,
        duration: meta.duration,
      };
    }

    return {
      id: p.id,
      text: p.text,
    };
  });
}

/**
 * Verifica se todas as partes essenciais de uma playlist possuem URL de áudio.
 */
export function isPlaylistComplete(items: DevotionalPlayItem[]): boolean {
  if (!items.length) return false;
  return items.every((item) => Boolean(item.url));
}
