import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { loadBook, translationById, type TranslationId } from '../data/bible';
import { BOOKS, normalize, parseReference } from '../data/books';
import { PageHeader } from '../components/ui';

interface Entry { book: number; chapter: number; verse: number; text: string; norm: string }
const indexCache = new Map<TranslationId, Entry[]>();

async function buildIndex(tr: TranslationId, onProgress: (n: number) => void): Promise<Entry[]> {
  const hit = indexCache.get(tr);
  if (hit) return hit;
  const out: Entry[] = [];
  for (let b = 0; b < BOOKS.length; b++) {
    const book = await loadBook(tr, b);
    book.forEach((ch, ci) => ch.forEach((text, vi) => out.push({ book: b, chapter: ci + 1, verse: vi + 1, text, norm: normalize(text) })));
    onProgress(b + 1);
  }
  indexCache.set(tr, out);
  return out;
}

const MAX = 100;

export default function SearchPage() {
  const { settings } = useApp();
  const tr = settings.translation;
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const initial = sp.get('q') ?? '';
  const [q, setQ] = useState(initial);
  const [index, setIndex] = useState<Entry[] | null>(indexCache.get(tr) ?? null);
  const [loadedBooks, setLoadedBooks] = useState(0);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mantém o texto da URL em sincronia (com atraso, para não poluir o histórico)
  useEffect(() => {
    const t = setTimeout(() => {
      const cur = sp.get('q') ?? '';
      if (q.trim() !== cur) setSp(q.trim() ? { q: q.trim() } : {}, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [q, sp, setSp]);

  useEffect(() => {
    let alive = true;
    setError(false);
    const cached = indexCache.get(tr);
    if (cached) { setIndex(cached); return; }
    setIndex(null);
    setLoadedBooks(0);
    buildIndex(tr, (n) => { if (alive) setLoadedBooks(n); })
      .then((i) => { if (alive) setIndex(i); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [tr]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const ref = useMemo(() => parseReference(q), [q]);
  const terms = useMemo(() => normalize(q).split(' ').filter((t) => t.length >= 2), [q]);

  const results = useMemo(() => {
    if (!index || terms.length === 0 || ref) return { list: [] as Entry[], total: 0 };
    const list: Entry[] = [];
    let total = 0;
    for (const e of index) {
      if (terms.every((t) => e.norm.includes(t))) {
        total++;
        if (list.length < MAX) list.push(e);
      }
    }
    return { list, total };
  }, [index, terms, ref]);

  const highlight = (text: string) => {
    if (terms.length === 0) return text;
    // marca os termos ignorando acentos: percorre o texto normalizado caractere a caractere
    // mapeia posições do texto sem acentos de volta ao texto original
    const map: number[] = [];
    let plain = '';
    let orig = 0;
    for (const ch of text) {
      const d = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      for (let k = 0; k < d.length; k++) { plain += d[k]; map.push(orig); }
      orig += ch.length;
    }
    const ranges: [number, number][] = [];
    for (const t of terms) {
      let from = 0;
      for (;;) {
        const i = plain.indexOf(t, from);
        if (i < 0) break;
        ranges.push([map[i], (map[i + t.length - 1] ?? text.length - 1) + 1]);
        from = i + t.length;
      }
    }
    if (!ranges.length) return text;
    ranges.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const r of ranges) {
      const last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([...r]);
    }
    const parts: ReactNode[] = [];
    let pos = 0;
    merged.forEach(([a, b], i) => {
      if (a > pos) parts.push(text.slice(pos, a));
      parts.push(<mark key={i}>{text.slice(a, b)}</mark>);
      pos = b;
    });
    if (pos < text.length) parts.push(text.slice(pos));
    return parts;
  };

  return (
    <>
      <PageHeader title="Buscar" sub={`em ${translationById(tr).name}`} back />
      <main className="page">
        <input
          ref={inputRef} className="search-input" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Palavra, frase ou referência (João 3:16)" aria-label="Buscar"
          onKeyDown={(e) => { if (e.key === 'Enter' && ref) nav(`/ler/${ref.book}/${ref.chapter}${ref.verse ? `?v=${ref.verse}` : ''}`); }}
        />
        {error ? <p className="center">Não foi possível carregar o texto. Verifique a conexão.</p> : null}
        {!index && !error ? <p className="muted">Preparando a busca… {Math.round((loadedBooks / 66) * 100)}% (só na primeira vez)</p> : null}

        {ref ? (
          <Link className="card link-card" to={`/ler/${ref.book}/${ref.chapter}${ref.verse ? `?v=${ref.verse}` : ''}`}>
            <small className="eyebrow">Ir para</small>
            <h3>{BOOKS[ref.book].name} {ref.chapter}{ref.verse ? `:${ref.verse}` : ''} →</h3>
          </Link>
        ) : null}

        {index && !ref && terms.length > 0 ? (
          <p className="muted small">
            {results.total === 0 ? 'Nenhum versículo encontrado.' : results.total > MAX ? `${results.total} resultados (mostrando os ${MAX} primeiros — refine a busca).` : `${results.total} ${results.total === 1 ? 'resultado' : 'resultados'}.`}
          </p>
        ) : null}
        {!ref && q.trim().length === 1 ? <p className="muted small">Digite pelo menos 2 letras.</p> : null}

        <ul className="results">
          {results.list.map((e) => (
            <li key={`${e.book}:${e.chapter}:${e.verse}`}>
              <Link to={`/ler/${e.book}/${e.chapter}?v=${e.verse}`}>
                <strong>{BOOKS[e.book].name} {e.chapter}:{e.verse}</strong>
                <span>{highlight(e.text)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
