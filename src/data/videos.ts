import { parseVerseRef, type VerseRef } from './topics';

/**
 * Vídeos do canal Farol de Fé no YouTube.
 * - Os já publicados não têm `publishAt` e aparecem sempre.
 * - Os agendados trazem `publishAt` (horário de Brasília) e só aparecem a partir desse momento,
 *   para o app nunca mostrar um link que ainda não abre.
 * Para incluir um vídeo novo: acrescente uma linha (o id é o trecho depois de youtu.be/).
 */
export interface Video {
  id: string;
  title: string;
  /** Passagem do vídeo, no formato "Sl 37:25" (abre a leitura no app). */
  ref: string;
  /** Data e hora de publicação, só para os agendados. */
  publishAt?: string;
}

export const VIDEOS: Video[] = [
  { id: 'f1HrYafLgzw', title: 'A Parábola da Madrugada: Deus Não Esquece de Você!', ref: 'Mt 6:26' },
  { id: '5Ee4yV2PVng', title: 'A Parábola do Pão: O Justo Jamais Desamparado', ref: 'Sl 37:25', publishAt: '2026-11-22T12:00:00-03:00' },
  { id: 'ss7Bxg_aXJE', title: 'Do Poço ao Palácio: Quando Deus Transforma a Dor em Propósito', ref: 'Gn 50:20' },
  { id: 'ou6XJJ0Nxf4', title: 'Por que Davi pegou 5 pedras se só precisava de uma?', ref: '1Sm 17:40' },
  { id: '_76Yhf6vzGQ', title: 'Oração de 30 Segundos Contra a Ansiedade', ref: 'Fp 4:6-7' },
  { id: 'GMyjIGx8WSE', title: 'A Tempestade que Jesus Acalmou no Barco', ref: 'Mc 4:39' },
  { id: 'sX5YF4AZ7oY', title: 'Deus Tem Planos de Esperança Para Você', ref: 'Jr 29:11' },
  { id: 'qctfmw0ybm4', title: 'Ainda Que a Figueira Não Floresça, Eu Me Alegrarei no Senhor', ref: 'Hc 3:17-18', publishAt: '2026-11-22T14:00:00-03:00' },
  { id: 'wQzfUtmbtMY', title: 'Encontre Descanso Para a Sua Alma Cansada', ref: 'Mt 11:28-29', publishAt: '2026-11-22T18:00:00-03:00' },
  { id: 'SDfotj_UN-U', title: 'Oração para Dormir em Paz', ref: 'Sl 4:8', publishAt: '2026-11-22T20:00:00-03:00' },
  { id: '2Gs9l9hzdAc', title: 'A Decisão sobre a sua Família', ref: 'Js 24:15', publishAt: '2026-11-23T07:00:00-03:00' },
  { id: '2O87gh0MEV0', title: 'O Caminho no Deserto', ref: 'Is 43:19', publishAt: '2026-11-23T12:00:00-03:00' },
  { id: 'TRPUGklA6Oo', title: 'O Esconderijo do Altíssimo', ref: 'Sl 91:1-2', publishAt: '2026-11-23T20:00:00-03:00' },
  { id: 'wTx3hXaBWZU', title: 'Nada Pode Separar Você do Amor de Deus', ref: 'Rm 8:38-39', publishAt: '2026-11-24T12:00:00-03:00' },
  { id: '0wpbhes31LU', title: 'Todas as Coisas Cooperam Para o Seu Bem', ref: 'Rm 8:28', publishAt: '2026-11-25T12:00:00-03:00' },
  { id: '_K6bZR9P__8', title: 'O Senhor é o Meu Pastor: Meu Cálice Transborda', ref: 'Sl 23:5', publishAt: '2026-11-26T12:00:00-03:00' },
  { id: 'eVUSGKZVl50', title: 'Com Amor Eterno Eu Te Amei: O Cuidado de Deus', ref: 'Jr 31:3', publishAt: '2026-11-27T12:00:00-03:00' },
  { id: '8-gAX-_y4jY', title: 'Não Temas: Seja Forte e Muito Corajoso', ref: 'Js 1:9', publishAt: '2026-11-28T12:00:00-03:00' },
  { id: 'G3NReMOJwBA', title: 'Um Cântico Novo na Sua Boca: Ele Tirou Meus Pés do Lamaçal', ref: 'Sl 40:2-3', publishAt: '2026-11-29T12:00:00-03:00' },
  { id: 'PMeBSpYqDOs', title: 'Sob as Asas do Altíssimo Você Encontrará Refúgio', ref: 'Sl 91:4', publishAt: '2026-11-30T12:00:00-03:00' },
];

export const videoUrl = (v: Video) => `https://youtu.be/${v.id}`;
export const videoRef = (v: Video): VerseRef => parseVerseRef(v.ref);

/** Vídeos já no ar em `now`: mais recentes primeiro (os agendados por data; os antigos, sem data, no fim, na ordem da lista). */
export function visibleVideos(now: number = Date.now()): Video[] {
  const live = VIDEOS.filter((v) => !v.publishAt || Date.parse(v.publishAt) <= now);
  const dated = live.filter((v) => v.publishAt).sort((a, b) => Date.parse(b.publishAt!) - Date.parse(a.publishAt!));
  const older = live.filter((v) => !v.publishAt);
  return [...dated, ...older];
}

/** "Novo": publicado nas últimas 72 horas. */
export const isNewVideo = (v: Video, now: number = Date.now()) =>
  !!v.publishAt && Date.parse(v.publishAt) <= now && now - Date.parse(v.publishAt) < 72 * 3600 * 1000;
