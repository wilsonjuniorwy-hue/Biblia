import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechState = 'idle' | 'playing' | 'paused';

export const supportsSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => /^pt[-_]BR/i.test(v.lang)) ?? voices.find((v) => /^pt/i.test(v.lang)) ?? null;
}

/**
 * Lê o capítulo em voz alta, um versículo por vez (a voz do próprio aparelho, sem custo).
 * Falar versículo a versículo evita o corte de falas longas que alguns navegadores fazem.
 */
export function useSpeech() {
  const supported = supportsSpeech();
  const [state, setState] = useState<SpeechState>('idle');
  const [current, setCurrent] = useState<number | null>(null); // índice do versículo (0-based)
  const [hasPtVoice, setHasPtVoice] = useState(true);
  const run = useRef(0);
  const texts = useRef<string[]>([]);

  useEffect(() => {
    if (!supported) return;
    const check = () => setHasPtVoice(pickVoice() !== null || window.speechSynthesis.getVoices().length === 0);
    check();
    window.speechSynthesis.addEventListener?.('voiceschanged', check);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', check);
      run.current++;
      window.speechSynthesis.cancel(); // sair da tela (ou trocar de capítulo) para a leitura
    };
  }, [supported]);

  const speakFrom = useCallback((list: string[], start: number, rate: number) => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    texts.current = list;
    const id = ++run.current;
    synth.cancel();
    const at = (i: number) => {
      if (id !== run.current) return;
      if (i >= list.length) { setState('idle'); setCurrent(null); return; }
      const u = new SpeechSynthesisUtterance(list[i]);
      u.lang = 'pt-BR';
      u.rate = rate;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onstart = () => { if (id === run.current) setCurrent(i); };
      u.onend = () => at(i + 1);
      u.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        if (id === run.current) { setState('idle'); setCurrent(null); }
      };
      synth.speak(u);
    };
    setState('playing');
    at(start);
  }, [supported]);

  const pause = useCallback(() => { if (supported) { window.speechSynthesis.pause(); setState('paused'); } }, [supported]);
  const resume = useCallback(() => { if (supported) { window.speechSynthesis.resume(); setState('playing'); } }, [supported]);
  const stop = useCallback(() => {
    if (!supported) return;
    run.current++;
    window.speechSynthesis.cancel();
    setState('idle');
    setCurrent(null);
  }, [supported]);

  return { supported, state, current, hasPtVoice, speakFrom, pause, resume, stop, texts };
}
