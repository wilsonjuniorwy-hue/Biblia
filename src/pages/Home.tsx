import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS, TOTAL_CHAPTERS, chapterId, fromChapterId, segmentLabel } from '../data/books';
import { PLAN_INFO, planStatus, rebalance } from '../data/plans';
import { verseOfTheDay, refLabel } from '../data/topics';
import { loadBook, translationById } from '../data/bible';
import { setSetting } from '../db/db';
import { dayOfYear, formatDate } from '../lib/date';
import { nextUnreadAfter, overall } from '../lib/stats';
import { shareText, shareVerseImage } from '../lib/share';
import { PageHeader, Ring } from '../components/ui';

export default function Home() {
  const { settings, read, today, streak, readToday, mark, toast } = useApp();
  const nav = useNavigate();
  const stats = overall(read);
  const plan = settings.plan;
  const st = plan ? planStatus(plan, read, today) : null;

  const last = settings.lastRead;
  const lastId = last ? chapterId(last.book, last.chapter) : null;
  const nextId = nextUnreadAfter(read, lastId ?? -1);

  // Avisos
  const daysSinceBackup = settings.lastBackupAt ? (Date.now() - settings.lastBackupAt) / 86400000 : null;
  const needsBackup = read.size >= 10 && (daysSinceBackup === null ? Date.now() - (settings.startedAt || Date.now()) > 7 * 86400000 : daysSinceBackup > 30);
  const nowHM = new Date().toTimeString().slice(0, 5);
  const reminder = !!settings.reminderTime && nowHM >= settings.reminderTime && !readToday;

  return (
    <>
      <PageHeader
        title="Estudos bíblicos"
        back="/"
        sub={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
        right={<Link to="/buscar" className="icon-btn" aria-label="Buscar">🔎</Link>}
      />
      <main className="page">
        {reminder ? (
          <div className="banner info">🔔 Você ainda não leu hoje. Que tal agora?</div>
        ) : null}
        {needsBackup ? (
          <Link to="/mais" className="banner warn">💾 Faça um backup do seu progresso (ele fica só neste aparelho). Toque para abrir.</Link>
        ) : null}

        {/* Plano de hoje */}
        {!plan || !st ? (
          <section className="card hero">
            <h2>Comece seu plano de leitura</h2>
            <p className="muted">Leia a Bíblia inteira em 1 ano, com uma leitura curta por dia. Escolha entre o plano sequencial, cronológico ou misto.</p>
            <Link to="/plano" className="btn primary">Escolher plano</Link>
          </section>
        ) : st.notStarted ? (
          <section className="card hero">
            <h2>Plano {PLAN_INFO[plan.type].name}</h2>
            <p className="muted">Começa em {formatDate(plan.startDate, { day: 'numeric', month: 'long' })}. Enquanto isso, leia livremente.</p>
            <Link to="/plano" className="btn ghost">Ver plano</Link>
          </section>
        ) : st.finished ? (
          <section className="card hero">
            <h2>Plano encerrado</h2>
            <p className="muted">{st.readChapters} de {st.totalChapters} capítulos do plano foram lidos.</p>
            <Link to="/plano" className="btn primary">Ver / reiniciar plano</Link>
          </section>
        ) : (
          <section className="card hero">
            <div className="row between">
              <div>
                <small className="eyebrow">Dia {st.todayIndex + 1} de {plan.days} · {PLAN_INFO[plan.type].name}</small>
                <h2>{st.today && st.today.chapters.length > 0 ? 'Leitura de hoje' : 'Hoje é dia livre'}</h2>
              </div>
              {st.todayDone && st.today!.chapters.length > 0 ? <span className="badge ok">✓ Feito</span> : null}
            </div>
            <div className="chips">
              {st.today?.chapters.map((id) => {
                const { book, chapter } = fromChapterId(id);
                return (
                  <Link key={id} to={`/ler/${book}/${chapter}`} className={`chip ${read.has(id) ? 'ok' : ''}`}>
                    {read.has(id) ? '✓ ' : ''}{BOOKS[book].abbr} {chapter}
                  </Link>
                );
              })}
            </div>
            {st.today && st.today.chapters.length > 0 && !st.todayDone ? (
              <div className="row gap">
                <button className="btn primary grow" onClick={() => {
                  const first = st.today!.chapters.find((i) => !read.has(i)) ?? st.today!.chapters[0];
                  const t = fromChapterId(first);
                  nav(`/ler/${t.book}/${t.chapter}`);
                }}>Ler agora</button>
                <button className="btn ghost" onClick={async () => { await mark(st.today!.chapters); toast('Dia concluído!'); }}>Já li tudo</button>
              </div>
            ) : null}
            {st.behind > 0 ? (
              <div className="alert">
                <strong>Você está {st.behind} {st.behind === 1 ? 'dia' : 'dias'} atrasado.</strong>
                <div className="row gap wrap">
                  <button className="btn ghost small" onClick={() => {
                    const d = st.overdue[0];
                    const target = d.chapters.find((i) => !read.has(i)) ?? d.chapters[0];
                    const t = fromChapterId(target);
                    nav(`/ler/${t.book}/${t.chapter}`);
                  }}>Ler o mais antigo ({segmentLabel(st.overdue[0].segments[0], true)}…)</button>
                  <button className="btn ghost small" onClick={async () => {
                    const nc = rebalance(plan, read, today);
                    if (nc) { await setSetting('plan', nc); toast('Plano reajustado até a data final.'); }
                  }}>Reajustar plano</button>
                </div>
              </div>
            ) : st.behind < 0 ? (
              <p className="muted small">👏 Você está {-st.behind} {st.behind === -1 ? 'dia' : 'dias'} adiantado.</p>
            ) : null}
          </section>
        )}

        {/* Continuar */}
        <section className="card">
          <div className="row between">
            <h3>Continuar lendo</h3>
          </div>
          <div className="row gap wrap">
            {last ? (
              <Link to={`/ler/${last.book}/${last.chapter}`} className="btn ghost grow">
                Onde parei<br /><strong>{BOOKS[last.book].name} {last.chapter}</strong>
              </Link>
            ) : null}
            {nextId !== null ? (
              <Link to={`/ler/${fromChapterId(nextId).book}/${fromChapterId(nextId).chapter}`} className="btn ghost grow">
                Próximo não lido<br /><strong>{BOOKS[fromChapterId(nextId).book].name} {fromChapterId(nextId).chapter}</strong>
              </Link>
            ) : (
              <p className="muted">Você leu todos os capítulos! 🎉</p>
            )}
          </div>
        </section>

        {/* Progresso */}
        <Link to="/progresso" className="card row gap center-y link-card">
          <Ring value={stats.pct} label="lido" />
          <div className="grow">
            <h3>Seu progresso</h3>
            <p className="muted">{stats.read} de {TOTAL_CHAPTERS} capítulos<br />Faltam {TOTAL_CHAPTERS - stats.read}</p>
            <p className="streak">{streak.current > 0 ? `🔥 ${streak.current} ${streak.current === 1 ? 'dia' : 'dias'} seguidos${readToday ? '' : ' · leia hoje para manter'}` : '🔥 Leia hoje para começar sua sequência'}</p>
          </div>
        </Link>

        <VerseOfDay toast={toast} />

        {settings.completedReadings > 0 ? <p className="muted center small">📚 Bíblias completas lidas: {settings.completedReadings}</p> : null}
      </main>
    </>
  );
}

function VerseOfDay({ toast }: { toast: (m: string) => void }) {
  const { settings, today } = useApp();
  const ref = verseOfTheDay(dayOfYear(today));
  const [text, setText] = useState<string | null>(null);
  const tr = settings.translation;
  useEffect(() => {
    let alive = true;
    setText(null);
    loadBook(tr, ref.book).then((b) => {
      if (!alive) return;
      const vs = b[ref.chapter - 1]?.slice(ref.from - 1, ref.to) ?? [];
      setText(vs.join(' '));
    }).catch(() => { if (alive) setText(''); });
    return () => { alive = false; };
  }, [tr, ref.book, ref.chapter, ref.from, ref.to]);

  const label = `${refLabel(ref)} (${translationById(tr).short})`;
  return (
    <section className="card verse-card">
      <small className="eyebrow">Versículo do dia</small>
      {text === null ? <p className="muted">Carregando…</p> : text === '' ? <p className="muted">Texto indisponível no momento.</p> : <blockquote>“{text}”</blockquote>}
      <div className="row between center-y">
        <Link to={`/ler/${ref.book}/${ref.chapter}?v=${ref.from}${ref.to > ref.from ? `-${ref.to}` : ''}`} className="verse-ref">{label}</Link>
        {text ? (
          <span className="row gap">
            <button className="btn ghost small" onClick={async () => { const r = await shareText(`“${text}”\n— ${label}`); if (r === 'copied') toast('Copiado!'); if (r === 'failed') toast('Não foi possível compartilhar'); }}>Compartilhar</button>
            <button className="btn ghost small" onClick={async () => { const r = await shareVerseImage(text, label); if (r === 'saved') toast('Imagem salva'); if (r === 'failed') toast('Não foi possível gerar a imagem'); }}>Imagem</button>
          </span>
        ) : null}
      </div>
    </section>
  );
}
