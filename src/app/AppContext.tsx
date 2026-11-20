import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Dexie from 'dexie';
import { db, markRead, unmarkRead, useProgress, useReadDates, useSettings, type Settings } from '../db/db';
import { BOOKS, TOTAL_CHAPTERS, fromChapterId } from '../data/books';
import { bookProgress, streaks, weekProgress } from '../lib/stats';
import { planStatus } from '../data/plans';
import { todayStr } from '../lib/date';

interface Ctx {
  settings: Settings;
  ready: boolean;
  /** O navegador não deixa o app abrir o armazenamento (janela privada, bloqueio…). */
  dbError: boolean;
  read: Set<number>;
  readDates: string[];
  today: string;
  streak: { current: number; longest: number };
  readToday: boolean;
  mark: (ids: number[]) => Promise<void>;
  unmark: (ids: number[]) => Promise<void>;
  toast: (msg: string) => void;
  toasts: { id: number; msg: string }[];
  /** Sobe a cada comemoração (dia concluído, meta da semana); a tela dispara os confetes. */
  confetti: number;
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
  const [dbError, setDbError] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const nextId = useRef(1);
  const readRef = useRef(read);
  readRef.current = read;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const datesRef = useRef<string[]>([]);
  datesRef.current = readDates;

  const toast = useCallback((msg: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // Abre o banco logo de início: se não for possível, mostramos uma explicação em vez de ficar carregando para sempre.
  useEffect(() => {
    if (typeof indexedDB === 'undefined') { setDbError(true); return; }
    db.open().catch(() => setDbError(true));
  }, []);

  // Falha ao gravar (espaço cheio, banco bloqueado…) não pode passar em silêncio.
  useEffect(() => {
    let last = 0;
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { name?: string } | undefined;
      const storage = r instanceof Dexie.DexieError || r?.name === 'QuotaExceededError' || r?.name === 'DatabaseClosedError';
      if (!storage) return;
      e.preventDefault();
      if (Date.now() - last > 8000) { last = Date.now(); toast('Não foi possível salvar no aparelho. Verifique o espaço disponível.'); }
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, [toast]);

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

    // Comemora: leitura do dia do plano concluída e meta da semana batida
    let party = false;
    const t = todayStr();
    const plan = settingsRef.current.plan;
    if (plan) {
      const b = planStatus(plan, before, t);
      const a = planStatus(plan, after, t);
      if (b.today && b.today.chapters.length > 0 && !b.todayDone && a.todayDone) { toast('✅ Leitura de hoje concluída!'); party = true; }
    }
    const goal = settingsRef.current.weeklyGoal;
    const wb = weekProgress(datesRef.current, t).days;
    const wa = weekProgress([...datesRef.current, t], t).days;
    if (wb < goal && wa >= goal) { toast(`🌟 Meta da semana: ${goal} ${goal === 1 ? 'dia' : 'dias'} de leitura!`); party = true; }
    if (party) setConfetti((n) => n + 1);
  }, [toast]);

  const unmark = useCallback(async (ids: number[]) => { await unmarkRead(ids); }, []);

  const streak = useMemo(() => streaks(readDates, today), [readDates, today]);
  const readToday = useMemo(() => readDates.includes(today), [readDates, today]);

  const value: Ctx = {
    settings, ready: sReady && pReady, dbError, read, readDates, today, streak, readToday, mark, unmark, toast, toasts, confetti,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
