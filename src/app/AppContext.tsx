import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { markRead, unmarkRead, useProgress, useReadDates, useSettings, type Settings } from '../db/db';
import { BOOKS, TOTAL_CHAPTERS, fromChapterId } from '../data/books';
import { bookProgress, streaks } from '../lib/stats';
import { todayStr } from '../lib/date';

interface Ctx {
  settings: Settings;
  ready: boolean;
  read: Set<number>;
  readDates: string[];
  today: string;
  streak: { current: number; longest: number };
  readToday: boolean;
  mark: (ids: number[]) => Promise<void>;
  unmark: (ids: number[]) => Promise<void>;
  toast: (msg: string) => void;
  toasts: { id: number; msg: string }[];
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp fora do provider');
  return c;
};

/** Data de hoje que se atualiza sozinha quando o dia vira (app aberto à meia-noite ou retomado). */
function useToday() {
  const [today, setToday] = useState(todayStr());
  useEffect(() => {
    const tick = () => setToday((t) => { const n = todayStr(); return n === t ? t : n; });
    const id = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, []);
  return today;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { settings, ready: sReady } = useSettings();
  const { read, ready: pReady } = useProgress();
  const readDates = useReadDates();
  const today = useToday();
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const nextId = useRef(1);
  const readRef = useRef(read);
  readRef.current = read;

  const toast = useCallback((msg: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const mark = useCallback(async (ids: number[]) => {
    const before = readRef.current;
    const after = new Set(before);
    ids.forEach((i) => after.add(i));
    await markRead(ids);
    // Pede ao navegador para não apagar os dados (ação do usuário; pode ser ignorado)
    void navigator.storage?.persist?.().catch(() => undefined);
    // Celebra livros concluídos agora
    const touched = new Set(ids.map((i) => fromChapterId(i).book));
    for (const b of touched) {
      if (!bookProgress(before, b).done && bookProgress(after, b).done) toast(`🎉 Você concluiu ${BOOKS[b].name}!`);
    }
    if (before.size < TOTAL_CHAPTERS && after.size >= TOTAL_CHAPTERS) toast('🏆 Bíblia completa! Veja em Progresso.');
  }, [toast]);

  const unmark = useCallback(async (ids: number[]) => { await unmarkRead(ids); }, []);

  const streak = useMemo(() => streaks(readDates, today), [readDates, today]);
  const readToday = useMemo(() => readDates.includes(today), [readDates, today]);

  const value: Ctx = {
    settings, ready: sReady && pReady, read, readDates, today, streak, readToday, mark, unmark, toast, toasts,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
