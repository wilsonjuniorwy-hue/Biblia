import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { useEvents } from '../db/db';
import { loadBook, translationById } from '../data/bible';
import { BOOKS, TOTAL_CHAPTERS, fromChapterId } from '../data/books';
import { PLAN_INFO, planStatus } from '../data/plans';
import { upcomingOccurrences, whenLabel } from '../lib/church';
import { overall } from '../lib/stats';
import { BookArt, ChurchArt, Dawn } from '../components/art';
import { useInstall } from '../lib/install';
import { Onboarding } from '../components/Onboarding';
import { estimateMinutes } from '../lib/stats';

function greeting(h: number) {
  return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Welcome() {
  const { settings, read, today, streak } = useApp();
  const inst = useInstall();
  const now = new Date();
  const nowHM = now.toTimeString().slice(0, 5);
  const { events } = useEvents();
  const next = upcomingOccurrences(events, today, nowHM)[0] ?? null;
  const stats = overall(read);
  const plan = settings.plan;
  const st = plan ? planStatus(plan, read, today) : null;

  // Texto do versículo na tradução escolhida (Salmos 119:105)
  const [verse, setVerse] = useState('');
  useEffect(() => {
    let alive = true;
    loadBook(settings.translation, 18).then((b) => { if (alive) setVerse(b[118]?.[104] ?? ''); }).catch(() => undefined);
    return () => { alive = false; };
  }, [settings.translation]);

  let studyMeta = 'Leia a Bíblia, siga um plano e veja seu progresso';
  if (stats.read > 0 || st) {
    const parts: string[] = [];
    if (st && st.today && !st.finished && !st.notStarted) {
      const ids = st.today.chapters;
      if (ids.length) {
        const f = fromChapterId(ids[0]);
        parts.push(`${st.todayDone ? '✓ ' : ''}Hoje: ${BOOKS[f.book].abbr} ${f.chapter}${ids.length > 1 ? ` +${ids.length - 1}` : ''} · ~${estimateMinutes(ids)} min`);
      }
    }
    parts.push(`${Math.floor(stats.pct * 100)}% lido`);
    if (streak.current > 0) parts.push(`🔥 ${streak.current}`);
    studyMeta = parts.join(' · ');
  }

  return (
    <div className="welcome">
      {!settings.onboarded ? <Onboarding /> : null}
      <header className="welcome-hero">
        <Dawn className="hero-art" />
        <div className="hero-fade" />
        <div className="hero-copy">
          <p className="brand">Lâmpada</p>
          <h1>{greeting(now.getHours())}!</h1>
          {verse ? (
            <blockquote>
              “{verse}”
              <cite>Salmos 119:105 · {translationById(settings.translation).short}</cite>
            </blockquote>
          ) : null}
        </div>
      </header>

      <main className="doors" aria-label="Escolha por onde começar">
        <Link to="/igreja" className="door">
          <ChurchArt className="door-art" />
          <div className="door-body">
            <h2>Igreja{settings.lastArea === 'igreja' ? <span className="last-badge">última vez</span> : null}</h2>
            <p>Seus eventos e a Bíblia</p>
            <span className="door-meta">
              {next ? `Próximo: ${next.event.title}, ${whenLabel(next.offset, next.date)}${next.event.time ? ` às ${next.event.time}` : ''}` : 'Cadastre seus cultos e compromissos'}
            </span>
            <span className="door-go">Entrar →</span>
          </div>
        </Link>

        <Link to="/estudos" className="door">
          <BookArt className="door-art" />
          <div className="door-body">
            <h2>Estudos bíblicos{settings.lastArea === 'estudos' ? <span className="last-badge">última vez</span> : null}</h2>
            <p>Bíblia completa, planos e progresso</p>
            <span className="door-meta">{studyMeta}</span>
            <span className="door-go">Entrar →</span>
          </div>
        </Link>
      </main>

      {!inst.standalone && !inst.dismissed && (inst.canPrompt || inst.ios) ? (
        <aside className="install-card">
          <div className="install-text">
            <strong>Instale no seu celular</strong>
            {inst.canPrompt ? (
              <span>Abre como um aplicativo, em tela cheia, e funciona sem internet.</span>
            ) : (
              <span>No iPhone, abra no <b>Safari</b>, toque em <b>Compartilhar</b> (o quadrado com a seta) e depois em <b>Adicionar à Tela de Início</b>.</span>
            )}
          </div>
          <div className="row gap">
            {inst.canPrompt ? <button className="btn primary small" onClick={() => void inst.install()}>Instalar</button> : null}
            <button className="btn ghost small" onClick={inst.dismiss}>Agora não</button>
          </div>
        </aside>
      ) : null}

      <footer className="welcome-foot">
        {plan && st && !st.finished ? <span>{PLAN_INFO[plan.type].name} · {stats.read}/{TOTAL_CHAPTERS} capítulos</span> : <span>Funciona offline · seus dados ficam no seu aparelho</span>}
        <Link to="/mais">Ajustes</Link>
      </footer>
    </div>
  );
}
