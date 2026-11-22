import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { useEvents } from '../db/db';
import { loadBook, translationById } from '../data/bible';
import { BOOKS, TOTAL_CHAPTERS, fromChapterId } from '../data/books';
import { PLAN_INFO, planStatus } from '../data/plans';
import { upcomingOccurrences, whenLabel } from '../lib/church';
import { overall } from '../lib/stats';
import { BookArt, ChurchArt, Dawn, FarolArt, MoreArt } from '../components/art';
import { Icon } from '../components/icons';
import { devotionalMinutes, devotionalOfTheDay } from '../data/devotionals';
import { welcomeVerseOfTheDay } from '../data/welcomeVerses';
import { refLabel } from '../data/topics';
import { dayOfYear } from '../lib/date';
import { useInstall } from '../lib/install';
import { Onboarding } from '../components/Onboarding';
import { estimateMinutes } from '../lib/stats';

function greeting(h: number) {
  return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function Welcome() {
  const { settings, read, today, streak } = useApp();
  const inst = useInstall();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const now = new Date();
  const nowHM = now.toTimeString().slice(0, 5);
  const { events } = useEvents();
  const next = upcomingOccurrences(events, today, nowHM)[0] ?? null;
  const stats = overall(read);
  const plan = settings.plan;
  const st = plan ? planStatus(plan, read, today) : null;

  // Frase de entrada: um versículo novo por dia, na tradução escolhida
  const vref = welcomeVerseOfTheDay(dayOfYear(today));
  const [verse, setVerse] = useState('');
  useEffect(() => {
    let alive = true;
    setVerse('');
    loadBook(settings.translation, vref.book).then((b) => {
      if (alive) setVerse((b[vref.chapter - 1] ?? []).slice(vref.from - 1, vref.to).join(' '));
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [settings.translation, vref.book, vref.chapter, vref.from, vref.to]);

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

  const dev = devotionalOfTheDay(dayOfYear(today));

  return (
    <div className="welcome">
      {!settings.onboarded ? <Onboarding /> : null}
      <header className="welcome-hero">
        <Dawn className="hero-art" />
        <div className="hero-fade" />
        <div className="hero-copy">
          <p className="brand">Farol de Fé</p>
          <h1>{greeting(now.getHours())}!</h1>
          {verse ? (
            <blockquote>
              “{verse}”
              <cite>{refLabel(vref)} · {translationById(settings.translation).short}</cite>
            </blockquote>
          ) : null}
        </div>
      </header>

      <form className="home-search" role="search" onSubmit={(e) => { e.preventDefault(); nav(q.trim() ? `/buscar?q=${encodeURIComponent(q.trim())}` : '/buscar'); }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquise por palavra ou versículo" aria-label="Buscar na Bíblia" enterKeyHint="search" />
        <button type="submit" aria-label="Buscar"><Icon name="search" size={22} /></button>
      </form>

      <main className="tiles" aria-label="Escolha por onde começar">
        <Link to="/igreja" className="tile t-church">
          <ChurchArt className="tile-art" />
          <div className="tile-body">
          <h2>Igreja</h2>
          <span className="tile-meta">{next ? `${next.event.title}, ${whenLabel(next.offset, next.date)}${next.event.time ? ` às ${next.event.time}` : ''}` : 'Seus eventos e a Bíblia'}</span>
          </div>
          {settings.lastArea === 'igreja' ? <span className="last-badge">última vez</span> : null}
        </Link>
        <Link to="/estudos" className="tile t-study">
          <BookArt className="tile-art" />
          <div className="tile-body">
          <h2>Estudos</h2>
          <span className="tile-meta">{studyMeta}</span>
          </div>
          {settings.lastArea === 'estudos' ? <span className="last-badge">última vez</span> : null}
        </Link>
        <Link to="/devocional" className="tile t-devo">
          <FarolArt className="tile-art" />
          <div className="tile-body">
          <h2>Devocional</h2>
          <span className="tile-meta">{dev.title} · ~{devotionalMinutes(dev)} min</span>
          </div>
          {settings.lastArea === 'devocional' ? <span className="last-badge">última vez</span> : null}
        </Link>
        <Link to="/menu" className="tile t-more">
          <MoreArt className="tile-art" />
          <div className="tile-body">
          <h2>Mais</h2>
          <span className="tile-meta">Plano, tópicos, busca e ajustes</span>
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
