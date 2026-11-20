import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './app/AppContext';
import { db } from './db/db';
import { TabBar, Toasts, type Area } from './components/ui';
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
import { About, Saved } from './pages/Saved';

function Shell() {
  const { settings, ready } = useApp();
  const { pathname } = useLocation();

  // Área atual (Igreja ou Estudos): define a barra de abas nas telas compartilhadas, como a Bíblia.
  const [area, setArea] = useState<Area>(() => {
    try { return sessionStorage.getItem('area') === 'igreja' ? 'igreja' : 'estudos'; } catch { return 'estudos'; }
  });
  useEffect(() => {
    const next: Area | null = pathname.startsWith('/igreja') ? 'igreja'
      : ['/estudos', '/plano', '/progresso', '/mais'].some((p) => pathname.startsWith(p)) ? 'estudos' : null;
    if (next && next !== area) {
      setArea(next);
      try { sessionStorage.setItem('area', next); } catch { /* ignora */ }
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

  // Primeira abertura: registra a data
  useEffect(() => {
    if (!ready) return;
    void db.kv.get('startedAt').then((r) => { if (!r) void db.kv.put({ key: 'startedAt', value: Date.now() }); });
  }, [ready]);

  useEffect(() => { if (!pathname.startsWith('/ler/')) window.scrollTo(0, 0); }, [pathname]);

  if (!ready) return <div className="splash">📖</div>;
  const reading = pathname.startsWith('/ler/') || pathname === '/';
  return (
    <div className="app">
      <Outlet />
      {reading ? null : <TabBar area={area} />}
      <Toasts />
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
            <Route path="plano" element={<PlanPage />} />
            <Route path="progresso" element={<ProgressPage />} />
            <Route path="buscar" element={<SearchPage />} />
            <Route path="topicos/:id" element={<TopicPage />} />
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
