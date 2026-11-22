import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildDevotionalPlaylist,
  isPlaylistComplete,
  type DevotionalManifest,
  type DevotionalPlayItem,
} from './devotionalAudio';
import { useSpeech } from './speech';

export type DevotionalAudioState = 'idle' | 'playing' | 'paused';
export const DEVOTIONAL_RATES = [0.85, 1, 1.15] as const;
export type DevotionalRate = (typeof DEVOTIONAL_RATES)[number];

const STORAGE_KEY_MUSIC = 'lampada_devotional_bgm';
const BG_VOLUME = 0.15; // 15% do volume para não disputar com a voz
const DEFAULT_BG_MUSIC = './audio/musica/quiet-devotion.mp3';

function getStoredMusicPref(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY_MUSIC);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

function setStoredMusicPref(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_MUSIC, String(enabled));
  } catch {
    // ignora restrições de localStorage
  }
}

interface UseDevotionalAudioProps {
  devotionalId: string;
  title: string;
  parts: { id: string; text: string }[];
  translation: string;
  bgMusicSrc?: string;
}

export function useDevotionalAudio({
  devotionalId,
  title,
  parts,
  translation,
  bgMusicSrc = DEFAULT_BG_MUSIC,
}: UseDevotionalAudioProps) {
  const [state, setState] = useState<DevotionalAudioState>('idle');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [rate, setRateState] = useState<DevotionalRate>(1);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(getStoredMusicPref);
  const [manifest, setManifest] = useState<DevotionalManifest | null>(null);
  const [manifestLoaded, setManifestLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Instância do sintetizador nativo para fallback
  const speechFallback = useSpeech();

  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<DevotionalPlayItem[]>([]);
  const currentIndexRef = useRef<number>(-1);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionActiveRef = useRef(0);

  // Carrega o manifest.json do devocional
  useEffect(() => {
    let alive = true;
    setManifestLoaded(false);
    setUseFallback(false);

    const manifestUrl = `./audio/devocionais/${devotionalId}/manifest.json`;
    fetch(manifestUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<DevotionalManifest>;
      })
      .then((data) => {
        if (!alive) return;
        setManifest(data);
        setManifestLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setManifest(null);
        setManifestLoaded(true);
        setUseFallback(true);
      });

    return () => {
      alive = false;
    };
  }, [devotionalId]);

  // Atualiza a playlist quando o manifest, partes ou tradução mudarem
  useEffect(() => {
    const list = buildDevotionalPlaylist(parts, manifest, translation);
    playlistRef.current = list;
    if (manifestLoaded && !isPlaylistComplete(list)) {
      setUseFallback(true);
    }
  }, [parts, manifest, translation, manifestLoaded]);

  // Fade suave na música de fundo
  const fadeBgMusic = useCallback((targetVolume: number, durationMs = 600) => {
    const bg = bgAudioRef.current;
    if (!bg) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const steps = 15;
    const stepTime = durationMs / steps;
    const startVolume = bg.volume;
    const delta = (targetVolume - startVolume) / steps;
    let step = 0;

    fadeIntervalRef.current = setInterval(() => {
      step++;
      const nextVol = Math.max(0, Math.min(1, startVolume + delta * step));
      if (bg) bg.volume = nextVol;
      if (step >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (targetVolume === 0 && bg) {
          bg.pause();
        }
      }
    }, stepTime);
  }, []);

  // Inicializa ou reaproveita os elementos de áudio
  const getAudioElements = useCallback(() => {
    if (!voiceAudioRef.current) {
      const va = new Audio();
      va.preload = 'auto';
      voiceAudioRef.current = va;
    }
    if (!bgAudioRef.current) {
      const bg = new Audio();
      bg.preload = 'auto';
      bg.loop = true;
      bg.volume = 0;
      bgAudioRef.current = bg;
    }
    return { voice: voiceAudioRef.current, bg: bgAudioRef.current };
  }, []);

  // Limpeza de timers e áudios
  const clearTimers = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = null;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    fadeIntervalRef.current = null;
  }, []);

  // Parada completa
  const stop = useCallback(() => {
    sessionActiveRef.current++;
    clearTimers();

    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.removeAttribute('src');
      voiceAudioRef.current.load();
    }
    if (bgAudioRef.current) {
      fadeBgMusic(0, 300);
    }
    if (useFallback) {
      speechFallback.stop();
    }

    currentIndexRef.current = -1;
    setCurrentId(null);
    setState('idle');

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }, [clearTimers, fadeBgMusic, useFallback, speechFallback]);

  // Toca um item específico da playlist por índice
  const playItemAt = useCallback((index: number, sessionId: number) => {
    if (sessionId !== sessionActiveRef.current) return;
    const playlist = playlistRef.current;
    if (index < 0 || index >= playlist.length) {
      // Chegou ao fim da leitura
      if (bgAudioRef.current && musicEnabled) {
        // Deixa a música ecoar um instante e depois faz fade-out
        pauseTimerRef.current = setTimeout(() => {
          fadeBgMusic(0, 1500);
          pauseTimerRef.current = setTimeout(() => {
            stop();
          }, 1600);
        }, 1200);
      } else {
        stop();
      }
      return;
    }

    currentIndexRef.current = index;
    const item = playlist[index];
    setCurrentId(item.id);

    const { voice } = getAudioElements();

    if (!item.url) {
      // Se faltar o áudio deste trecho, cai para fallback nativo
      setUseFallback(true);
      speechFallback.speakFrom(playlist.map((p) => p.text), index, rate);
      return;
    }

    voice.src = item.url;
    voice.playbackRate = rate;

    voice.onended = () => {
      if (sessionId !== sessionActiveRef.current) return;
      // Pausa natural de 300ms entre as partes
      pauseTimerRef.current = setTimeout(() => {
        playItemAt(index + 1, sessionId);
      }, 300);
    };

    voice.onerror = () => {
      if (sessionId !== sessionActiveRef.current) return;
      // Em caso de falha de carregamento do arquivo, ativa o fallback gracioso
      setUseFallback(true);
      speechFallback.speakFrom(playlist.map((p) => p.text), index, rate);
    };

    voice.play().catch(() => {
      // Falha no play (ex.: restrição do navegador)
      if (sessionId === sessionActiveRef.current) {
        setState('idle');
      }
    });
  }, [getAudioElements, musicEnabled, rate, fadeBgMusic, stop, speechFallback]);

  // Inicia a reprodução
  const play = useCallback(() => {
    const sessionId = ++sessionActiveRef.current;
    clearTimers();

    if (useFallback) {
      speechFallback.speakFrom(parts.map((p) => p.text), 0, rate);
      setState('playing');
      return;
    }

    const { bg } = getAudioElements();

    // Configura a música de fundo
    if (musicEnabled) {
      if (!bg.src || !bg.src.includes(bgMusicSrc)) {
        bg.src = bgMusicSrc;
      }
      bg.volume = 0;
      bg.play()
        .then(() => {
          fadeBgMusic(BG_VOLUME, 600);
        })
        .catch(() => undefined);
    } else {
      bg.pause();
    }

    setState('playing');

    // Suporte à Media Session API
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title,
          artist: 'Farol de Fé',
          album: 'Devocional Diário',
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch {
        // ignora navegadores que não suportam totalmente
      }
    }

    // A voz entra suavemente 400ms após o início da música (ou imediatamente se sem música)
    const voiceDelay = musicEnabled ? 400 : 50;
    pauseTimerRef.current = setTimeout(() => {
      playItemAt(0, sessionId);
    }, voiceDelay);
  }, [useFallback, getAudioElements, musicEnabled, bgMusicSrc, fadeBgMusic, title, playItemAt, clearTimers, speechFallback, parts, rate]);

  // Pausa a reprodução
  const pause = useCallback(() => {
    clearTimers();
    if (useFallback) {
      speechFallback.pause();
    } else {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      if (bgAudioRef.current && musicEnabled) fadeBgMusic(0, 400);
    }
    setState('paused');
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }, [clearTimers, useFallback, speechFallback, musicEnabled, fadeBgMusic]);

  // Continua a reprodução
  const resume = useCallback(() => {
    if (useFallback) {
      speechFallback.resume();
      setState('playing');
      return;
    }

    const { voice, bg } = getAudioElements();
    if (musicEnabled && bg) {
      bg.play().then(() => fadeBgMusic(BG_VOLUME, 500)).catch(() => undefined);
    }
    if (voice && voice.src) {
      voice.playbackRate = rate;
      voice.play().catch(() => undefined);
    } else {
      const idx = currentIndexRef.current >= 0 ? currentIndexRef.current : 0;
      playItemAt(idx, sessionActiveRef.current);
    }
    setState('playing');
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  }, [useFallback, speechFallback, getAudioElements, musicEnabled, fadeBgMusic, rate, playItemAt]);

  // Altera a velocidade de reprodução
  const setRate = useCallback((newRate: DevotionalRate) => {
    setRateState(newRate);
    if (voiceAudioRef.current) {
      voiceAudioRef.current.playbackRate = newRate;
    }
    if (useFallback && speechFallback.state !== 'idle' && speechFallback.current !== null) {
      speechFallback.speakFrom(parts.map((p) => p.text), speechFallback.current, newRate);
    }
  }, [useFallback, speechFallback, parts]);

  // Liga/desliga a música de fundo
  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      setStoredMusicPref(next);
      const bg = bgAudioRef.current;
      if (bg) {
        if (!next) {
          fadeBgMusic(0, 300);
        } else if (state === 'playing') {
          if (!bg.src || !bg.src.includes(bgMusicSrc)) {
            bg.src = bgMusicSrc;
          }
          bg.play().then(() => fadeBgMusic(BG_VOLUME, 500)).catch(() => undefined);
        }
      }
      return next;
    });
  }, [fadeBgMusic, state, bgMusicSrc]);

  // Integração com Media Session Handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (state === 'paused') resume();
        else if (state === 'idle') play();
      });
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('stop', () => stop());
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const next = currentIndexRef.current + 1;
        if (next < playlistRef.current.length) {
          playItemAt(next, sessionActiveRef.current);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prev = Math.max(0, currentIndexRef.current - 1);
        playItemAt(prev, sessionActiveRef.current);
      });
    } catch {
      // ignora erros de handlers não suportados
    }
    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('stop', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
        } catch {
          // ignora
        }
      }
    };
  }, [state, play, pause, resume, stop, playItemAt]);

  // Parar o áudio ao sair da tela e ao trocar de devocional
  useEffect(() => {
    return () => {
      sessionActiveRef.current++;
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.removeAttribute('src');
      }
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.volume = 0;
      }
    };
  }, [devotionalId]);

  // Se estiver em fallback, sincroniza estado e current
  const activeCurrentId = useFallback
    ? (speechFallback.current !== null ? parts[speechFallback.current]?.id : null)
    : currentId;
  const activeState = useFallback ? speechFallback.state : state;

  return {
    state: activeState,
    currentId: activeCurrentId,
    rate,
    setRate,
    musicEnabled,
    toggleMusic,
    play,
    pause,
    resume,
    stop,
    isCustomAudio: !useFallback,
    hasPtVoice: speechFallback.hasPtVoice,
    supported: true,
  };
}
