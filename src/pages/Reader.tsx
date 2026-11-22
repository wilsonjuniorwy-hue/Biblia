import { useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS, TOTAL_CHAPTERS, chapterId, fromChapterId, isValidChapter } from '../data/books';
import { TRANSLATIONS, translationById } from '../data/bible';
import { patchMark, setSetting, useChapterMarks } from '../db/db';
import { useChapter } from '../lib/useChapter';
import { copyText, shareText } from '../lib/share';
import { buzz } from '../lib/cards';
import { Icon } from '../components/icons';
import { ReaderSettings, LINE_HEIGHT, TEXT_WIDTH } from '../components/ReaderSettings';
import { ShareImageSheet, type CardSpec } from '../components/ShareImageSheet';
import { Sheet, Skeleton } from '../components/ui';

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
  const location = useLocation();
  const [sp] = useSearchParams();
  const { settings, read, mark, unmark, toast } = useApp();
  const tr = settings.translation;
  const [retry, setRetry] = useState(0);
  const { data: verses, error, loading } = useChapter(tr, book, chapter, retry);
  // Comparação: as demais traduções (a lista é fixa, então a ordem dos hooks não muda entre renderizações).
  const others = TRANSLATIONS.map((t) => ({ t, verses: useChapter(t.id, book, chapter, retry, settings.compare && t.id !== tr).data }))
    .filter((o) => o.t.id !== tr);
  const marks = useChapterMarks(book, chapter);
  const [sel, setSel] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [appearance, setAppearance] = useState(false);
  const [card, setCard] = useState<CardSpec | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [pastQuarter, setPastQuarter] = useState(false);
  const [endVisible, setEndVisible] = useState(false);
  const focus = parseFocus(sp.get('v'));
  const id = chapterId(book, chapter);
  const isRead = read.has(id);
  const bookInfo = BOOKS[book];
  const endRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

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
  }, [verses, sp]);

  // Barra de progresso do capítulo (atualiza direto no elemento, sem redesenhar o texto)
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      setPastQuarter(p > 0.25);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    window.addEventListener('scroll', onScroll, { passive: true });
    calc();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [verses]);

  // Sabe se o fim do capítulo está na tela (some o botão flutuante) e, se ativado, marca automaticamente
  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const obs = new IntersectionObserver(([e]) => {
      setEndVisible(e.isIntersecting);
      clearTimeout(timer);
      if (settings.autoMark && verses && !isRead && e.intersectionRatio >= 1) timer = setTimeout(() => { void mark([id]); }, 2500);
    }, { threshold: [0.1, 1] });
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, [settings.autoMark, verses, isRead, id, mark]);

  const go = useCallback((delta: number) => {
    const n = id + delta;
    if (n < 0 || n >= TOTAL_CHAPTERS) return;
    const t = fromChapterId(n);
    nav(`/ler/${t.book}/${t.chapter}`, { replace: true }); // não empilha histórico: "voltar" leva à origem
  }, [id, nav]);

  // Navegação por setas do teclado (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sel !== null || appearance || cardOpen || (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, sel, appearance, cardOpen]);

  // Deslizar para os lados troca de capítulo
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, t: Date.now() } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s || sel !== null || appearance || cardOpen) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > 90 && Math.abs(dy) < 45 && Math.abs(dx) > Math.abs(dy) * 2.5 && Date.now() - s.t < 600 && !window.getSelection()?.toString()) {
      go(dx < 0 ? 1 : -1);
    }
  };

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
    if (isRead) await unmark([id]); else { buzz(20); await mark([id]); }
  };

  const prev = id > 0 ? fromChapterId(id - 1) : null;
  const next = id < TOTAL_CHAPTERS - 1 ? fromChapterId(id + 1) : null;
  const count = Math.max(verses?.length ?? 0, settings.compare ? Math.max(0, ...others.map((o) => o.verses?.length ?? 0)) : 0);
  const rootStyle = {
    '--lh': LINE_HEIGHT[settings.lineHeight],
    '--w': `${TEXT_WIDTH[settings.textWidth]}px`,
    '--rf': settings.readerFont === 'sans' ? 'var(--sans)' : 'var(--serif)',
  } as CSSProperties;

  return (
    <div className="reader" style={rootStyle} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="reader-top">
        <button className="icon-btn" aria-label="Voltar ao livro" onClick={() => (location.key !== 'default' ? nav(-1) : nav(`/biblia/${book}`))}>‹</button>
        <Link to={`/biblia/${book}`} className="reader-title">
          <span className="rt-name">{bookInfo.name}</span> <strong className="rt-chap">{chapter}</strong>
        </Link>
        <div className="tr-switch" role="group" aria-label="Tradução">
          {TRANSLATIONS.map((t) => (
            <button key={t.id} className={t.id === tr ? 'on' : ''} onClick={() => void setSetting('translation', t.id)} title={t.name}>
              {t.short}
            </button>
          ))}
        </div>
        <div className="font-btns">
          <button className="icon-btn" aria-label="Aparência do texto" onClick={() => setAppearance(true)}><Icon name="type" size={20} /></button>
        </div>
        <div className="read-progress" aria-hidden><span ref={barRef} /></div>
      </header>

      <main>
        <h1 className="sr-only">{bookInfo.name} {chapter}</h1>
        <article className="verses" style={{ fontSize: settings.fontSize }}>
          {loading ? <Skeleton lines={10} /> : null}
          {error ? (
            <div className="center pad">
              <p>{error}</p>
              <button className="btn primary" onClick={() => setRetry((n) => n + 1)}>Tentar de novo</button>
            </div>
          ) : null}
          {verses ? Array.from({ length: count }, (_, i) => {
            const v = i + 1;
            const text = verses[i];
            const m = marks.get(v);
            const focused = focus && v >= focus[0] && v <= focus[1];
            return (
              <p
                key={v} id={`v${v}`}
                className={`verse ${m?.color ? `hl-${m.color}` : ''} ${focused ? 'focus' : ''} ${sel === v ? 'selected' : ''}`}
                role="button" tabIndex={0}
                onClick={() => text !== undefined && openVerse(v)}
                onKeyDown={(e) => { if (text !== undefined && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openVerse(v); } }}
              >
                <sup className="vnum">{v}</sup>
                {text ?? <span className="muted">—</span>}
                {m?.fav ? <span className="vflag" aria-label="Favorito"> ❤</span> : null}
                {m?.note ? <span className="vflag" aria-label="Tem nota"> 📝</span> : null}
                {settings.compare ? others.map((o) => (o.verses ? <span key={o.t.id} className="alt"><b>{o.t.short}</b> {o.verses[i] ?? '—'}</span> : null)) : null}
              </p>
            );
          }) : null}
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
          <p className="muted small center">Toque em um versículo para favoritar, destacar, anotar ou compartilhar. Deslize para os lados para trocar de capítulo.</p>
        </div>
      </main>

      {verses && !isRead && pastQuarter && !endVisible && sel === null ? (
        <button className="mark-fab" onClick={() => void toggleRead()}><Icon name="check" size={18} /> Marcar lido</button>
      ) : null}

      <ReaderSettings open={appearance} onClose={() => setAppearance(false)} />
      <ShareImageSheet open={cardOpen} onClose={() => setCardOpen(false)} spec={card} />

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
              <button className="btn ghost grow" onClick={() => { setCard({ kind: 'verse', text: selText, ref: `${ref(sel)} (${translationById(tr).short})` }); closeSheet(); setCardOpen(true); }}>Como imagem</button>
            </div>
            <button className="btn primary" onClick={closeSheet}>Concluir</button>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
