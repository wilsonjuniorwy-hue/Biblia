import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { translationById } from '../data/bible';
import { parseReference } from '../data/books';
import { PageHeader } from '../components/ui';
import { SearchResults } from '../components/SearchResults';

const MAX = 100;

export default function SearchPage() {
  const { settings } = useApp();
  const tr = settings.translation;
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const urlQ = sp.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastWritten = useRef(urlQ);

  // Digitar atualiza a URL (com atraso, sem empilhar histórico)
  const onChange = (v: string) => {
    setQ(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastWritten.current = v.trim();
      setSp(v.trim() ? { q: v.trim() } : {}, { replace: true });
    }, 400);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  // Voltar/avançar do navegador (URL mudou por fora) atualiza o campo
  useEffect(() => {
    if (urlQ === lastWritten.current) return;
    lastWritten.current = urlQ;
    clearTimeout(timer.current);
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <>
      <PageHeader title="Buscar" sub={`em ${translationById(tr).name}`} back />
      <main className="page">
        <input
          ref={inputRef} className="search-input" type="search" value={q} onChange={(e) => onChange(e.target.value)}
          placeholder="Livro, palavra ou referência (João 3:16)" aria-label="Buscar"
          onKeyDown={(e) => {
            const ref = parseReference(q);
            if (e.key === 'Enter' && ref) nav(`/ler/${ref.book}/${ref.chapter}${ref.verse ? `?v=${ref.verse}` : ''}`);
          }}
        />
        <SearchResults q={q} verseLimit={MAX} />
      </main>
    </>
  );
}
