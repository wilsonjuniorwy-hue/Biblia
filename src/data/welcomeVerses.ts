import { parseVerseRef, type VerseRef } from './topics';

/**
 * Frases da tela de entrada: versículos curtos sobre luz, guia, esperança e cuidado de Deus.
 * Uma nova por dia. Cada um cabe na tela de entrada em qualquer tradução (≤ 160 caracteres).
 */
const REFS = [
  'Sl 119:105', 'Jo 8:12', 'Mt 5:14', 'Mt 5:16', 'Is 9:2', 'Jo 1:5', 'Sl 27:1', 'Sl 18:28', 'Sl 36:9', 'Sl 43:3',
  'Sl 37:5', 'Sl 46:1', 'Pv 3:5', 'Pv 3:6', 'Pv 4:18', 'Is 40:31', 'Is 41:10', 'Js 1:9', 'Sl 23:1', 'Sl 121:2',
  'Jr 29:11', 'Fp 4:13', 'Fp 4:6', 'Rm 15:13', 'Mt 11:28', 'Jo 14:27', 'Jo 16:33', 'Sl 34:8', '1Jo 1:5', 'Ef 5:8',
  'Lm 3:22', 'Sl 118:24', 'Sl 119:130', 'Sl 25:4', 'Sl 32:8', 'Is 60:1', 'Mq 7:8', 'Sl 112:4', 'Hb 11:1', 'Sl 16:8',
  'Sl 31:24', 'Rm 8:28', 'Rm 12:12', 'Mt 6:33', 'Sl 55:22', '1Pe 5:7', 'Dt 31:8', 'Sl 62:1', 'Jo 12:46', 'Ef 5:14',
  'Sl 119:114',
] as const;

export const WELCOME_VERSES: VerseRef[] = REFS.map(parseVerseRef);

/** Passo entre dias: primo com o tamanho da lista, então dias seguidos nunca caem em versículos parecidos nem repetem em ciclo curto. */
const STEP = 7;

/** Versículo de entrada do dia (dayIndex = dia do ano). */
export function welcomeVerseOfTheDay(dayIndex: number): VerseRef {
  const n = WELCOME_VERSES.length;
  return WELCOME_VERSES[(((dayIndex * STEP) % n) + n) % n];
}

export const WELCOME_STEP = STEP;
