import { useEffect, useState } from 'react';
import { loadBook, type TranslationId } from '../data/bible';

export interface Loaded<T> { data: T | null; error: string | null; loading: boolean }

/** Carrega os versículos de um capítulo (1-based). */
export function useChapter(tr: TranslationId, book: number, chapter: number, retryKey = 0): Loaded<string[]> {
  const [state, setState] = useState<Loaded<string[]> & { key: string }>({ data: null, error: null, loading: true, key: '' });
  const key = `${tr}:${book}:${chapter}:${retryKey}`;
  useEffect(() => {
    let alive = true;
    setState({ data: null, error: null, loading: true, key });
    loadBook(tr, book)
      .then((b) => { if (alive) setState({ data: b[chapter - 1] ?? [], error: null, loading: false, key }); })
      .catch(() => { if (alive) setState({ data: null, error: 'Não foi possível carregar o texto. Verifique a conexão e tente de novo.', loading: false, key }); });
    return () => { alive = false; };
  }, [key, tr, book, chapter]);
  // evita mostrar o texto do capítulo anterior enquanto o novo carrega
  return state.key === key ? state : { data: null, error: null, loading: true };
}
