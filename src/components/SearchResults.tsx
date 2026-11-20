import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS, VERSE_COUNTS, isValidChapter, matchBooks, normalize, parseReference } from '../data/books';
import { TOPICS } from '../data/topics';
import { buildIndex, onIndexProgress, searchTerms, searchVerses, type Entry } from '../lib/searchIndex';

/** Marca os termos no texto ignorando acentos. */
function highlight(text: string, terms: string[]): ReactNode {
  if (terms.length === 0) return text;
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
    else merged.push([r[0], r[1]]);
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
}

/**
 * Lista que aparece enquanto se digita: livros primeiro, depois tópicos e versículos.
 * Os livros respondem na hora (não dependem de download); os versículos entram quando o índice estiver pronto.
 */
export function SearchResults({ q, verseLimit, allHref }: { q: string; verseLimit: number; allHref?: string }) {
  const { settings } = useApp();
  const tr = settings.translation;
  const trimmed = q.trim();
  const deferred = useDeferredValue(trimmed);

  const sugg = useMemo(() => matchBooks(trimmed), [trimmed]);
  const ref = useMemo(() => parseReference(trimmed), [trimmed]);
  const topics = useMemo(() => {
    const n = normalize(trimmed);
    if (n.length < 2) return [];
    return TOPICS.filter((t) => normalize(t.title).includes(n)).slice(0, 4);
  }, [trimmed]);

  const terms = useMemo(() => searchTerms(deferred), [deferred]);
  const wantVerses = !ref && trimmed.length >= 3 && terms.length > 0;

  const [index, setIndex] = useState<Entry[] | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!wantVerses) return;
    let alive = true;
    setError(false);
    setIndex(null);
    setLoaded(0);
    const off = onIndexProgress((t, n) => { if (alive && t === tr) setLoaded(n); });
    buildIndex(tr).then((i) => { if (alive) setIndex(i); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; off(); };
  }, [wantVerses, tr, retry]);

  const verses = useMemo(() => (index && wantVerses ? searchVerses(index, terms, verseLimit) : { list: [], total: 0 }), [index, wantVerses, terms, verseLimit]);

  if (!trimmed) return null;

  const linkFor = (bookId: number) => {
    const { chapter, verse } = sugg;
    if (chapter && isValidChapter(bookId, chapter)) {
      const okVerse = verse && verse >= 1 && verse <= VERSE_COUNTS[bookId][chapter - 1];
      return { to: `/ler/${bookId}/${chapter}${okVerse ? `?v=${verse}` : ''}`, label: `${BOOKS[bookId].name} ${chapter}${okVerse ? `:${verse}` : ''}`, go: true };
    }
    return { to: `/biblia/${bookId}`, label: BOOKS[bookId].name, go: false };
  };

  return (
    <div className="suggest">
      {sugg.matches.length > 0 ? (
        <section aria-label="Livros">
          <h2 className="group-title">Livros</h2>
          <ul className="results">
            {sugg.matches.map((b) => {
              const l = linkFor(b.id);
              return (
                <li key={b.id}>
                  <Link to={l.to} className="suggest-book">
                    <strong>{l.label}</strong>
                    <span className="muted small">{l.go ? 'abrir leitura' : `${b.chapters} capítulos · ${b.group}`}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {topics.length > 0 ? (
        <section aria-label="Tópicos">
          <h2 className="group-title">Tópicos</h2>
          <ul className="results">
            {topics.map((t) => (
              <li key={t.id}>
                <Link to={`/topicos/${t.id}`} className="suggest-book">
                  <strong>{t.icon} {t.title}</strong>
                  <span className="muted small">{t.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {wantVerses ? (
        <section aria-label="Versículos">
          <h2 className="group-title">Versículos</h2>
          {error ? (
            <div className="center">
              <p>Não foi possível carregar o texto. Verifique a conexão.</p>
              <button className="btn primary" onClick={() => setRetry((n) => n + 1)}>Tentar de novo</button>
            </div>
          ) : !index ? (
            <p className="muted small">Procurando nos versículos… {Math.round((loaded / 66) * 100)}% (só na primeira vez)</p>
          ) : (
            <>
              <p className="muted small">
                {verses.total === 0 ? 'Nenhum versículo encontrado.' : verses.total > verseLimit ? `${verses.total} resultados (mostrando ${verseLimit}).` : `${verses.total} ${verses.total === 1 ? 'resultado' : 'resultados'}.`}
              </p>
              <ul className="results">
                {verses.list.map((e) => (
                  <li key={`${e.book}:${e.chapter}:${e.verse}`}>
                    <Link to={`/ler/${e.book}/${e.chapter}?v=${e.verse}`}>
                      <strong>{BOOKS[e.book].name} {e.chapter}:{e.verse}</strong>
                      <span>{highlight(e.text, terms)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {allHref && verses.total > verseLimit ? <Link className="btn ghost" to={allHref}>Ver todos os {verses.total} resultados</Link> : null}
            </>
          )}
        </section>
      ) : trimmed.length < 3 && sugg.matches.length === 0 && topics.length === 0 ? (
        <p className="muted small">Digite pelo menos 3 letras para procurar nos versículos.</p>
      ) : null}
    </div>
  );
}
