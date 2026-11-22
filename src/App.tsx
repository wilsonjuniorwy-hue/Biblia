import { useEffect, useRef, useState } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './app/AppContext';
import { db, setSetting } from './db/db';
import { Confetti, TabBar, Toasts, type Area } from './components/ui';
import { StorageProblem } from './components/ErrorBoundary';
import Home from './pages/Home';
import Welcome from './pages/Welcome';
import Church from './pages/Church';
import { Bible, BookPage } from './pages/Bible';
import Reader from './pages/Reader';
import PlanPage from './pages/Plan';
import ProgressPage from './pages/Progress';
import SearchPage from './pages/Search';
import TopicPage from './pages/Topic';
import More from './pages/More';
import DevotionalPage from './pages/Devotional';
import DevotionalHub from './pages/DevotionalHub';
import MoreMenu from './pages/MoreMenu';
import VideosPage from './pages/Videos';
import { About, Saved } from './pages/Saved';

function Shell() {
  const { settings, ready, dbError, confetti } = useApp();
  const [slow, setSlow] = useState(false);
  const { pathname } = useLocation();
  const nav = useNavigate();

  // Área atual (Igreja ou Estudos): define a barra de abas nas telas compartilhadas, como a Bíblia.
  const [area, setArea] = useState<Area>(() => {
    try { const a = sessionStorage.getItem('area'); return a === 'igreja' || a === 'devocional' ? a : 'estudos'; } catch { return 'estudos'; }
  });
  useEffect(() => {
    const next: Area | null = pathname.startsWith('/igreja') ? 'igreja'
      : pathname.startsWith('/devocional') ? 'devocional'
      : ['/estudos', '/plano', '/progresso', '/mais'].some((p) => pathname.startsWith(p)) ? 'estudos' : null;
    if (next && next !== area) {
      setArea(next);
      try { sessionStorage.setItem('area', next); } catch { /* ignora */ }
      void setSetting('lastArea', next);
    } else if (next) {
      try { sessionStorage.setItem('area', next); } catch { /* ignora */ }
    }
  }, [pathname, area]);

  // Tema
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = { auto: '#14213d', light: '#faf7f0', dark: '#0f1626', sepia: '#f1e6cc' }[settings.theme];
    meta?.setAttribute('content', bg);
  }, [settings.theme]);

  // Abertura do app: vai direto para a área escolhida em Mais (só na primeira tela da sessão; "Início" sempre mostra a entrada)
  const started = useRef(false);
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    let first = true;
    try { first = sessionStorage.getItem('startHandled') === null; sessionStorage.setItem('startHandled', '1'); } catch { /* ignora */ }
    if (first && pathname === '/' && settings.startArea !== 'ask') nav(settings.startArea === 'igreja' ? '/igreja' : settings.startArea === 'devocional' ? '/devocional' : '/estudos', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Primeira abertura: registra a data
  useEffect(() => {
    if (!ready) return;
    void db.kv.get('startedAt').then((r) => { if (!r) void db.kv.put({ key: 'startedAt', value: Date.now() }); });
  }, [ready]);

  useEffect(() => { if (!pathname.startsWith('/ler/')) window.scrollTo(0, 0); }, [pathname]);

  // Se o armazenamento não responde em alguns segundos, explica em vez de carregar para sempre
  useEffect(() => {
    if (ready) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 7000);
    return () => clearTimeout(t);
  }, [ready]);

  if (dbError) return <StorageProblem />;
  if (!ready) return slow ? <StorageProblem slow /> : <div className="splash" role="status" aria-label="Carregando">📖</div>;
  const reading = pathname.startsWith('/ler/') || pathname === '/' || pathname === '/menu' || pathname === '/videos';
  return (
    <div className="app">
      <Outlet />
      {reading ? null : <TabBar area={area} />}
      <Toasts />
      <Confetti trigger={confetti} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Welcome />} />
            <Route path="igreja" element={<Church />} />
            <Route path="estudos" element={<Home />} />
            <Route path="biblia" element={<Bible />} />
            <Route path="biblia/:book" element={<BookPage />} />
            <Route path="ler/:book/:chapter" element={<Reader />} />
            <Route path="devocional" element={<DevotionalHub />} />
            <Route path="devocional/:id" element={<DevotionalPage />} />
            <Route path="plano" element={<PlanPage />} />
            <Route path="progresso" element={<ProgressPage />} />
            <Route path="buscar" element={<SearchPage />} />
            <Route path="topicos/:id" element={<TopicPage />} />
            <Route path="menu" element={<MoreMenu />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="mais" element={<More />} />
            <Route path="salvos" element={<Saved />} />
            <Route path="sobre" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
