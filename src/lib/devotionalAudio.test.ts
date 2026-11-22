import { describe, expect, it } from 'vitest';
import { buildDevotionalPlaylist, isPlaylistComplete, type DevotionalManifest } from './devotionalAudio';

describe('buildDevotionalPlaylist', () => {
  const mockManifest: DevotionalManifest = {
    devotionalId: 'pastor-sl23',
    title: 'O Senhor é o meu Pastor',
    voice: 'pt-BR-FranciscaNeural',
    provider: 'edge',
    rate: 0.92,
    common: {
      titulo: { file: 'titulo.mp3', duration: 2.45 },
      'leitura-intro': { file: 'leitura-intro.mp3', duration: 4.54 },
      p0: { file: 'p0.mp3', duration: 29.81 },
      pergunta: { file: 'pergunta.mp3', duration: 8.9 },
      oracao: { file: 'oracao.mp3', duration: 18.4 },
    },
    translations: {
      blivre: {
        v1: { file: 'blivre/v1.mp3', duration: 3.1 },
        v2: { file: 'blivre/v2.mp3', duration: 4.2 },
      },
      tb: {
        v1: { file: 'tb/v1.mp3', duration: 3.3 },
        v2: { file: 'tb/v2.mp3', duration: 4.0 },
      },
    },
  };

  const sampleParts = [
    { id: 'titulo', text: 'O Senhor é o meu Pastor' },
    { id: 'leitura-intro', text: 'Leitura bíblica: Salmo 23:1-2.' },
    { id: 'v1', text: 'O Senhor é meu pastor...' },
    { id: 'v2', text: 'Ele me faz deitar...' },
    { id: 'p0', text: 'Davi conhecia...' },
    { id: 'pergunta', text: 'Para pensar...' },
    { id: 'oracao', text: 'Oração...' },
  ];

  it('mapeia corretamente trechos comuns e versículos de blivre', () => {
    const playlist = buildDevotionalPlaylist(sampleParts, mockManifest, 'blivre');
    expect(playlist).toHaveLength(7);
    expect(playlist[0].url).toBe('./audio/devocionais/pastor-sl23/titulo.mp3');
    expect(playlist[0].duration).toBe(2.45);

    // Versículos devem usar a pasta blivre
    expect(playlist[2].url).toBe('./audio/devocionais/pastor-sl23/blivre/v1.mp3');
    expect(playlist[2].duration).toBe(3.1);
    expect(playlist[3].url).toBe('./audio/devocionais/pastor-sl23/blivre/v2.mp3');

    // Parágrafos comuns
    expect(playlist[4].url).toBe('./audio/devocionais/pastor-sl23/p0.mp3');
    expect(playlist[5].url).toBe('./audio/devocionais/pastor-sl23/pergunta.mp3');
    expect(playlist[6].url).toBe('./audio/devocionais/pastor-sl23/oracao.mp3');

    expect(isPlaylistComplete(playlist)).toBe(true);
  });

  it('mapeia os versículos para a tradução TB quando selecionada', () => {
    const playlist = buildDevotionalPlaylist(sampleParts, mockManifest, 'tb');
    expect(playlist[2].url).toBe('./audio/devocionais/pastor-sl23/tb/v1.mp3');
    expect(playlist[2].duration).toBe(3.3);
    expect(playlist[3].url).toBe('./audio/devocionais/pastor-sl23/tb/v2.mp3');
    expect(playlist[3].duration).toBe(4.0);
  });

  it('retorna itens sem url quando manifest é nulo (modo fallback)', () => {
    const playlist = buildDevotionalPlaylist(sampleParts, null, 'blivre');
    expect(playlist).toHaveLength(7);
    expect(playlist[0].url).toBeUndefined();
    expect(playlist[2].url).toBeUndefined();
    expect(isPlaylistComplete(playlist)).toBe(false);
  });

  it('faz fallback para outra tradução se a escolhida não tiver o versículo', () => {
    const playlist = buildDevotionalPlaylist(sampleParts, mockManifest, 'arc');
    // arc não está no mock, então deve pegar de blivre ou tb
    expect(playlist[2].url).toBeDefined();
    expect(playlist[2].url).toMatch(/\/(blivre|tb)\/v1\.mp3$/);
  });
});
