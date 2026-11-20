import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS, GROUPS, TOTAL_CHAPTERS, bookOffset } from '../data/books';
import { finishReading } from '../db/db';
import { bookProgress, overall } from '../lib/stats';
import { Confirm, PageHeader, ProgressBar, Ring, Segmented } from '../components/ui';

export default function ProgressPage() {
  const { read, streak, settings, readDates, toast } = useApp();
  const [view, setView] = useState<'tudo' | 'falta'>('tudo');
  const [finishDlg, setFinishDlg] = useState(false);
  const s = overall(read);
  const booksDone = BOOKS.filter((b) => bookProgress(read, b.id).done);
  const complete = s.read >= TOTAL_CHAPTERS;
  const activeDays = new Set(readDates).size;

  const achievements: { icon: string; label: string; ok: boolean }[] = [
    { icon: '🌱', label: 'Primeiro capítulo', ok: s.read >= 1 },
    { icon: '📗', label: '1º livro concluído', ok: booksDone.length >= 1 },
    { icon: '🔥', label: '7 dias seguidos', ok: streak.longest >= 7 },
    { icon: '🔥', label: '30 dias seguidos', ok: streak.longest >= 30 },
    { icon: '💯', label: '100 capítulos', ok: s.read >= 100 },
    { icon: '📜', label: 'Pentateuco completo', ok: [0, 1, 2, 3, 4].every((i) => bookProgress(read, i).done) },
    { icon: '✝️', label: 'Evangelhos completos', ok: [39, 40, 41, 42].every((i) => bookProgress(read, i).done) },
    { icon: '🏛️', label: 'Antigo Testamento', ok: s.at >= s.atTotal },
    { icon: '🕊️', label: 'Novo Testamento', ok: s.nt >= s.ntTotal },
    { icon: '🏆', label: 'Bíblia completa', ok: complete || settings.completedReadings > 0 },
  ];

  return (
    <>
      <PageHeader title="Progresso" sub="O que você já leu e o que falta" />
      <main className="page">
        <section className="card row gap center-y">
          <Ring value={s.pct} size={110} label="da Bíblia" />
          <div className="grow">
            <p><strong>{s.read}</strong> de {TOTAL_CHAPTERS} capítulos lidos</p>
            <p className="muted">Faltam <strong>{TOTAL_CHAPTERS - s.read}</strong> capítulos · {booksDone.length}/66 livros</p>
            <p className="streak">🔥 {streak.current} {streak.current === 1 ? 'dia' : 'dias'} seguidos <span className="muted small">(recorde {streak.longest})</span></p>
          </div>
        </section>

        <section className="card">
          <div className="row between"><span>Antigo Testamento</span><span className="muted">{s.at}/{s.atTotal}</span></div>
          <ProgressBar value={s.atPct} />
          <div className="row between"><span>Novo Testamento</span><span className="muted">{s.nt}/{s.ntTotal}</span></div>
          <ProgressBar value={s.ntPct} />
          <p className="muted small">Você leu em {activeDays} {activeDays === 1 ? 'dia' : 'dias'} diferentes{settings.completedReadings ? ` · já completou a Bíblia ${settings.completedReadings}×` : ''}.</p>
        </section>

        {complete ? (
          <section className="card hero">
            <h2>🏆 Você leu a Bíblia inteira!</h2>
            <p className="muted">Quer registrar essa leitura e começar uma nova do zero?</p>
            <button className="btn primary" onClick={() => setFinishDlg(true)}>Concluir e recomeçar</button>
          </section>
        ) : null}

        <h2 className="section-title">Conquistas</h2>
        <div className="ach-grid">
          {achievements.map((a) => (
            <div key={a.label} className={`ach ${a.ok ? 'on' : ''}`}>
              <span aria-hidden>{a.ok ? a.icon : '🔒'}</span>
              <small>{a.label}</small>
            </div>
          ))}
        </div>

        <h2 className="section-title">Mapa da Bíblia</h2>
        <Segmented value={view} onChange={setView} options={[{ value: 'tudo', label: 'Tudo' }, { value: 'falta', label: 'O que falta' }]} />
        {GROUPS.map((g) => {
          const books = view === 'falta' ? g.books.filter((b) => !bookProgress(read, b.id).done) : g.books;
          if (books.length === 0) return null;
          return (
            <div key={g.name} className="group">
              <h3 className="group-title">{g.name}</h3>
              {books.map((b) => {
                const p = bookProgress(read, b.id);
                const off = bookOffset(b.id);
                return (
                  <div key={b.id} className="map-book">
                    <div className="row between">
                      <Link to={`/biblia/${b.id}`}><strong>{b.name}</strong></Link>
                      <span className="muted small">{p.done ? '✓' : `${p.read}/${p.total}`}</span>
                    </div>
                    <div className="map-cells">
                      {Array.from({ length: b.chapters }, (_, i) => {
                        const isRead = read.has(off + i);
                        if (view === 'falta' && isRead) return null;
                        return <Link key={i} to={`/ler/${b.id}/${i + 1}`} className={`cell ${isRead ? 'read' : ''}`} aria-label={`${b.name} ${i + 1}${isRead ? ' lido' : ' não lido'}`}>{view === 'falta' ? i + 1 : ''}</Link>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {view === 'falta' && complete ? <p className="center">Nada falta! 🎉</p> : null}
      </main>

      <Confirm
        open={finishDlg} title="Recomeçar a leitura?"
        text="A leitura será contada como concluída e o mapa volta a zero. Favoritos e notas são mantidos."
        confirmLabel="Concluir e recomeçar" onNo={() => setFinishDlg(false)}
        onYes={async () => { setFinishDlg(false); await finishReading(); toast('Nova leitura iniciada. Que Deus abençoe!'); }}
      />
    </>
  );
}
