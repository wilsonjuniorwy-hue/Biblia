import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { loadBook, translationById, TRANSLATIONS } from '../data/bible';
import { BOOKS } from '../data/books';
import { refLabel, topicById, type VerseRef } from '../data/topics';
import { setSetting } from '../db/db';
import { copyText, shareText } from '../lib/share';
import { PageHeader } from '../components/ui';

export default function TopicPage() {
  const { id } = useParams();
  const topic = id ? topicById(id) : undefined;
  const { settings, toast } = useApp();
  if (!topic) return <Navigate to="/biblia" replace />;
  const tr = settings.translation;
  return (
    <>
      <PageHeader
        title={`${topic.icon} ${topic.title}`} sub={topic.blurb} back="/biblia"
        right={
          <div className="tr-switch" role="group" aria-label="Tradução">
            {TRANSLATIONS.map((t) => (
              <button key={t.id} className={t.id === tr ? 'on' : ''} onClick={() => void setSetting('translation', t.id)}>{t.short}</button>
            ))}
          </div>
        }
      />
      <main className="page">
        {topic.refs.map((r) => <VerseItem key={refLabel(r)} r={r} tr={tr} toast={toast} />)}
      </main>
    </>
  );
}

function VerseItem({ r, tr, toast }: { r: VerseRef; tr: 'tb' | 'arc'; toast: (m: string) => void }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setText(null);
    loadBook(tr, r.book)
      .then((b) => { if (alive) setText((b[r.chapter - 1] ?? []).slice(r.from - 1, r.to).join(' ')); })
      .catch(() => { if (alive) setText(''); });
    return () => { alive = false; };
  }, [tr, r.book, r.chapter, r.from, r.to]);
  const label = `${refLabel(r)} (${translationById(tr).short})`;
  return (
    <section className="card verse-card">
      {text === null ? <p className="muted">Carregando…</p> : text === '' ? <p className="muted">Texto indisponível no momento.</p> : <blockquote>“{text}”</blockquote>}
      <div className="row between center-y">
        <Link className="verse-ref" to={`/ler/${r.book}/${r.chapter}?v=${r.from}${r.to > r.from ? `-${r.to}` : ''}`}>
          {BOOKS[r.book].name} {r.chapter}:{r.from}{r.to > r.from ? `-${r.to}` : ''} · ler no capítulo
        </Link>
        {text ? (
          <span className="row gap">
            <button className="btn ghost small" onClick={async () => toast((await copyText(`“${text}”\n— ${label}`)) ? 'Copiado!' : 'Não foi possível copiar')}>Copiar</button>
            <button className="btn ghost small" onClick={async () => { const x = await shareText(`“${text}”\n— ${label}`); if (x === 'copied') toast('Copiado!'); }}>Enviar</button>
          </span>
        ) : null}
      </div>
    </section>
  );
}
