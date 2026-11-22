import { describe, expect, it } from 'vitest';
import { VIDEOS, embedUrl, isNewVideo, videoRef, visibleVideos } from './videos';
import { VERSE_COUNTS } from './books';

const at = (iso: string) => Date.parse(iso);

describe('vídeos do canal', () => {
  it('ids únicos de 11 caracteres e passagens válidas', () => {
    expect(new Set(VIDEOS.map((v) => v.id)).size).toBe(VIDEOS.length);
    for (const v of VIDEOS) {
      expect(v.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      const r = videoRef(v);
      expect(VERSE_COUNTS[r.book][r.chapter - 1]).toBeGreaterThanOrEqual(r.to);
      expect(v.title.trim()).not.toBe('');
    }
  });
  it('só mostra o agendado depois da hora de publicação (horário de Brasília)', () => {
    const base = VIDEOS.filter((v) => !v.publishAt).length;
    expect(visibleVideos(at('2026-11-22T11:59:00-03:00'))).toHaveLength(base);
    expect(visibleVideos(at('2026-11-22T12:00:00-03:00'))).toHaveLength(base + 1);
    expect(visibleVideos(at('2026-12-31T00:00:00-03:00'))).toHaveLength(VIDEOS.length);
  });
  it('lista os mais recentes primeiro e marca como novo por 72 horas', () => {
    const list = visibleVideos(at('2026-11-30T13:00:00-03:00'));
    expect(list[0].id).toBe('PMeBSpYqDOs');
    const v = VIDEOS.find((x) => x.id === 'PMeBSpYqDOs')!;
    expect(isNewVideo(v, at('2026-11-30T13:00:00-03:00'))).toBe(true);
    expect(isNewVideo(v, at('2026-12-05T13:00:00-03:00'))).toBe(false);
    expect(isNewVideo(VIDEOS[0], at('2026-11-30T13:00:00-03:00'))).toBe(false);
  });
  it('o player usa só o domínio sem cookies do YouTube, com o id do vídeo', () => {
    for (const v of VIDEOS) {
      const u = new URL(embedUrl(v));
      expect(u.origin).toBe('https://www.youtube-nocookie.com');
      expect(u.pathname).toBe('/embed/' + v.id);
    }
  });
});
