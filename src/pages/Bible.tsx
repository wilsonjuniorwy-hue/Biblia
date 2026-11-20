import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS, GROUPS, bookOffset, chapterId } from '../data/books';
import { TOPICS } from '../data/topics';
import { bookProgress } from '../lib/stats';
import { Confirm, PageHeader, ProgressBar, Segmented } from '../components/ui';

export function Bible() {
  const { read } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState<'livros' | 'topicos'>(() => {
    try { return sessionStorage.getItem('bibleTab') === 'topicos' ? 'topicos' : 'livros'; } catch { return 'livros'; }
  });
  const [q, setQ] = useState('');
  const change = (v: 'livros' | 'topicos') => {
    setTab(v);
    try { sessionStorage.setItem('bibleTab', v); } catch { /* ignora */ }
  };

  return (
    <>
      <PageHeader title="Bíblia" />
      <main className="page">
        <form className="searchbox" onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/buscar?q=${encodeURIComponent(q.trim())}`); }}>
          <input type="search" placeholder="Buscar palavra ou referência (ex.: João 3:16)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
          <button className="btn primary" type="submit">Buscar</button>
        </form>

        <Segmented value={tab} onChange={change} options={[{ value: 'livros', label: 'Livros' }, { value: 'topicos', label: 'Tópicos' }]} />

        {tab === 'livros' ? (
          (['AT', 'NT'] as const).map((t) => (
            <section key={t}>
              <h2 className="section-title">{t === 'AT' ? 'Antigo Testamento' : 'Novo Testamento'}</h2>
              {GROUPS.filter((g) => g.testament === t).map((g) => (
                <div key={g.name} className="group">
                  <h3 className="group-title">{g.name}</h3>
                  <div className="book-grid">
                    {g.books.map((b) => {
                      const p = bookProgress(read, b.id);
                      return (
                        <Link key={b.id} to={`/biblia/${b.id}`} className={`book-tile ${p.done ? 'done' : ''}`}>
                          <span className="book-name">{b.name}</span>
                          <span className="muted small">{p.done ? '✓ concluído' : `${p.read}/${p.total}`}</span>
                          <ProgressBar value={p.read / p.total} />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ))
        ) : (
          <section>
            <p className="muted">Versículos escolhidos para o dia a dia. Toque em um tema.</p>
            <div className="topic-grid">
              {TOPICS.map((t) => (
                <Link key={t.id} to={`/topicos/${t.id}`} className="topic-card">
                  <span className="topic-icon" aria-hidden>{t.icon}</span>
                  <strong>{t.title}</strong>
                  <span className="muted small">{t.blurb}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export function BookPage() {
  const params = useParams();
  const id = Number(params.book);
  if (!Number.isInteger(id) || id < 0 || id >= BOOKS.length) return <Navigate to="/biblia" replace />;
  return <BookInner id={id} />;
}

function BookInner({ id }: { id: number }) {
  const { read, mark, unmark, toast } = useApp();
  const nav = useNavigate();
  const book = BOOKS[id];
  const p = bookProgress(read, id);
  const [confirm, setConfirm] = useState<null | 'all' | 'none'>(null);
  const ids = Array.from({ length: book.chapters }, (_, i) => chapterId(id, i + 1));
  const off = bookOffset(id);

  return (
    <>
      <PageHeader title={book.name} sub={`${book.group} · ${book.chapters} capítulos`} back="/biblia" />
      <main className="page">
        <section className="card">
          <div className="row between">
            <strong>{p.done ? '✓ Livro concluído' : `${p.read} de ${p.total} lidos`}</strong>
            <span className="muted">{Math.floor((p.read / p.total) * 100)}%</span>
          </div>
          <ProgressBar value={p.read / p.total} />
          <div className="row gap wrap">
            {!p.done ? (
              <button className="btn primary grow" onClick={() => nav(`/ler/${id}/${p.nextUnread ?? 1}`)}>
                {p.read === 0 ? 'Começar a ler' : `Continuar no capítulo ${p.nextUnread}`}
              </button>
            ) : null}
          </div>
        </section>

        <h2 className="section-title">Capítulos</h2>
        <div className="chapter-grid">
          {ids.map((cid, i) => (
            <Link key={cid} to={`/ler/${id}/${i + 1}`} className={`chap ${read.has(off + i) ? 'read' : ''}`} aria-label={`Capítulo ${i + 1}${read.has(cid) ? ', lido' : ''}`}>
              {i + 1}
            </Link>
          ))}
        </div>
        <p className="muted small">Verde = capítulo lido.</p>

        <div className="row gap wrap">
          {!p.done ? <button className="btn ghost grow" onClick={() => setConfirm('all')}>Marcar livro todo como lido</button> : null}
          {p.read > 0 ? <button className="btn ghost grow" onClick={() => setConfirm('none')}>Desmarcar livro</button> : null}
        </div>
      </main>

      <Confirm
        open={confirm === 'all'} title={`Marcar ${book.name} como lido?`}
        text="Use isto se você já leu este livro antes. Todos os capítulos serão marcados como lidos hoje."
        confirmLabel="Marcar tudo"
        onNo={() => setConfirm(null)}
        onYes={async () => { setConfirm(null); await mark(ids); toast(`${book.name} marcado como lido`); }}
      />
      <Confirm
        open={confirm === 'none'} title={`Desmarcar ${book.name}?`}
        text="Os capítulos deste livro voltam a aparecer como não lidos."
        confirmLabel="Desmarcar" danger
        onNo={() => setConfirm(null)}
        onYes={async () => { setConfirm(null); await unmark(ids); toast(`${book.name} desmarcado`); }}
      />
    </>
  );
}
