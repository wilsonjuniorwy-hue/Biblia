import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS, TOTAL_CHAPTERS, chapterId, fromChapterId, isValidChapter } from '../data/books';
import { TRANSLATIONS, translationById } from '../data/bible';
import { patchMark, setSetting, useChapterMarks } from '../db/db';
import { useChapter } from '../lib/useChapter';
import { copyText, shareText, shareVerseImage } from '../lib/share';
import { Sheet } from '../components/ui';

const COLORS: { id: string; label: string }[] = [
  { id: 'yellow', label: 'Amarelo' },
  { id: 'green', label: 'Verde' },
  { id: 'blue', label: 'Azul' },
  { id: 'pink', label: 'Rosa' },
];

function parseFocus(v: string | null): [number, number] | null {
  if (!v) return null;
  const m = v.match(/^(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  const a = Number(m[1]);
  return [a, m[2] ? Number(m[2]) : a];
}

export default function Reader() {
  const params = useParams();
  const book = Number(params.book);
  const chapter = Number(params.chapter);
  if (!isValidChapter(book, chapter)) return <Navigate to="/biblia" replace />;
  return <ReaderInner key={`${book}:${chapter}`} book={book} chapter={chapter} />;
}

function ReaderInner({ book, chapter }: { book: number; chapter: number }) {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { settings, read, mark, unmark, toast } = useApp();
  const tr = settings.translation;
  const [retry, setRetry] = useState(0);
  const { data: verses, error, loading } = useChapter(tr, book, chapter, retry);
  const marks = useChapterMarks(book, chapter);
  const [sel, setSel] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const focus = parseFocus(sp.get('v'));
  const id = chapterId(book, chapter);
  const isRead = read.has(id);
  const bookInfo = BOOKS[book];
  const endRef = useRef<HTMLDivElement>(null);

  // Guarda onde parou
  useEffect(() => { void setSetting('lastRead', { book, chapter }); }, [book, chapter]);

  // Rola ao topo (ou ao versículo pedido) quando o texto chega
  useEffect(() => {
    if (!verses) return;
    if (focus) {
      document.getElementById(`v${focus[0]}`)?.scrollIntoView({ block: 'center' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [verses]);

  // Marcação automática ao chegar no fim (opcional)
  useEffect(() => {
    if (!settings.autoMark || !verses || isRead || !endRef.current) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const obs = new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (e.isIntersecting) timer = setTimeout(() => { void mark([id]); }, 2500);
    }, { threshold: 1 });
    obs.observe(endRef.current);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, [settings.autoMark, verses, isRead, id, mark]);

  const go = useCallback((delta: number) => {
    const n = id + delta;
    if (n < 0 || n >= TOTAL_CHAPTERS) return;
    const t = fromChapterId(n);
    nav(`/ler/${t.book}/${t.chapter}`);
  }, [id, nav]);

  // Navegação por setas do teclado (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sel !== null || (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, sel]);

  const ref = (v: number) => `${bookInfo.name} ${chapter}:${v}`;
  const selText = sel !== null && verses ? verses[sel - 1] : '';
  const selMark = sel !== null ? marks.get(sel) : undefined;

  const openVerse = (v: number) => { setSel(v); setNoteDraft(marks.get(v)?.note ?? ''); };
  const closeSheet = () => {
    if (sel !== null && noteDraft !== (marks.get(sel)?.note ?? '')) void patchMark(book, chapter, sel, { note: noteDraft });
    setSel(null);
  };
  const fullText = () => `“${selText}”\n— ${ref(sel!)} (${translationById(tr).short})`;

  const toggleRead = async () => {
    if (isRead) await unmark([id]); else await mark([id]);
  };

  const prev = id > 0 ? fromChapterId(id - 1) : null;
  const next = id < TOTAL_CHAPTERS - 1 ? fromChapterId(id + 1) : null;

  return (
    <div className="reader">
      <header className="reader-top">
        <button className="icon-btn" aria-label="Voltar ao livro" onClick={() => nav(`/biblia/${book}`)}>‹</button>
        <Link to={`/biblia/${book}`} className="reader-title">
          {bookInfo.name} <strong>{chapter}</strong>
        </Link>
        <div className="tr-switch" role="group" aria-label="Tradução">
          {TRANSLATIONS.map((t) => (
            <button key={t.id} className={t.id === tr ? 'on' : ''} onClick={() => void setSetting('translation', t.id)} title={t.name}>
              {t.short}
            </button>
          ))}
        </div>
        <button className="icon-btn" aria-label="Diminuir letra" onClick={() => void setSetting('fontSize', Math.max(14, settings.fontSize - 1))}>A−</button>
        <button className="icon-btn" aria-label="Aumentar letra" onClick={() => void setSetting('fontSize', Math.min(32, settings.fontSize + 1))}>A+</button>
      </header>

      <article className="verses" style={{ fontSize: settings.fontSize }}>
        {loading ? <p className="muted center pad">Carregando…</p> : null}
        {error ? (
          <div className="center pad">
            <p>{error}</p>
            <button className="btn primary" onClick={() => setRetry((n) => n + 1)}>Tentar de novo</button>
          </div>
        ) : null}
        {verses?.map((text, i) => {
          const v = i + 1;
          const m = marks.get(v);
          const focused = focus && v >= focus[0] && v <= focus[1];
          return (
            <p
              key={v} id={`v${v}`}
              className={`verse ${m?.color ? `hl-${m.color}` : ''} ${focused ? 'focus' : ''} ${sel === v ? 'selected' : ''}`}
              role="button" tabIndex={0} aria-label={`Versículo ${v}: ${text}`}
              onClick={() => openVerse(v)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVerse(v); } }}
            >
              <sup className="vnum">{v}</sup>
              {text}
              {m?.fav ? <span className="vflag" aria-label="Favorito"> ❤</span> : null}
              {m?.note ? <span className="vflag" aria-label="Tem nota"> 📝</span> : null}
            </p>
          );
        })}
      </article>

      <div ref={endRef} className="reader-end">
        <button className={`btn big ${isRead ? 'done' : 'primary'}`} onClick={() => void toggleRead()} disabled={loading || !!error}>
          {isRead ? '✓ Capítulo lido (toque para desfazer)' : 'Marcar como lido'}
        </button>
        <div className="row gap">
          <button className="btn ghost grow" disabled={!prev} onClick={() => go(-1)}>
            ‹ {prev ? `${BOOKS[prev.book].abbr} ${prev.chapter}` : ''}
          </button>
          <button className="btn ghost grow" disabled={!next} onClick={() => go(1)}>
            {next ? `${BOOKS[next.book].abbr} ${next.chapter}` : ''} ›
          </button>
        </div>
        <p className="muted small center">Dica: toque em um versículo para favoritar, destacar, anotar ou compartilhar.</p>
      </div>

      <Sheet open={sel !== null} onClose={closeSheet} title={sel !== null ? ref(sel) : ''}>
        {sel !== null ? (
          <>
            <blockquote className="quote">{selText}</blockquote>
            <div className="row gap wrap">
              <button className={`chip ${selMark?.fav ? 'on' : ''}`} onClick={() => void patchMark(book, chapter, sel, { fav: selMark?.fav ? 0 : 1 })}>
                {selMark?.fav ? '❤ Favorito' : '♡ Favoritar'}
              </button>
              {COLORS.map((c) => (
                <button
                  key={c.id} aria-label={`Destacar de ${c.label}`} aria-pressed={selMark?.color === c.id}
                  className={`swatch hl-${c.id} ${selMark?.color === c.id ? 'on' : ''}`}
                  onClick={() => void patchMark(book, chapter, sel, { color: selMark?.color === c.id ? null : c.id })}
                />
              ))}
            </div>
            <label className="field">
              <span>Minha nota</span>
              <textarea rows={3} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onBlur={() => { if (sel !== null && noteDraft !== (marks.get(sel)?.note ?? '')) void patchMark(book, chapter, sel, { note: noteDraft }); }} placeholder="Escreva o que esse versículo diz para você…" />
            </label>
            <div className="row gap wrap">
              <button className="btn ghost grow" onClick={async () => { toast((await copyText(fullText())) ? 'Copiado!' : 'Não foi possível copiar'); }}>Copiar</button>
              <button className="btn ghost grow" onClick={async () => { const r = await shareText(fullText()); if (r === 'copied') toast('Copiado!'); if (r === 'failed') toast('Não foi possível compartilhar'); }}>Compartilhar</button>
              <button className="btn ghost grow" onClick={async () => { const r = await shareVerseImage(selText, `${ref(sel)} (${translationById(tr).short})`); if (r === 'saved') toast('Imagem salva'); if (r === 'failed') toast('Não foi possível gerar a imagem'); }}>Como imagem</button>
            </div>
            <button className="btn primary" onClick={closeSheet}>Concluir</button>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
