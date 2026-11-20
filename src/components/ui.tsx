import { useEffect, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';

export function PageHeader({ title, sub, back, right }: { title: string; sub?: string; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="page-header">
      {back ? (
        <button className="icon-btn" aria-label="Voltar" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}>
          ‹
        </button>
      ) : null}
      <div className="page-title">
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {right ? <div className="page-right">{right}</div> : null}
    </header>
  );
}

export type Area = 'igreja' | 'estudos';

const STUDY_TABS: [string, string, string][] = [
  ['/estudos', 'Hoje', '☀︎'],
  ['/biblia', 'Bíblia', '📖'],
  ['/plano', 'Plano', '🗓'],
  ['/progresso', 'Progresso', '📊'],
  ['/mais', 'Mais', '☰'],
];
const CHURCH_TABS: [string, string, string][] = [
  ['/igreja', 'Igreja', '⛪'],
  ['/biblia', 'Bíblia', '📖'],
  ['/salvos', 'Meu conteúdo', '❤'],
  ['/', 'Início', '⌂'],
];

export function TabBar({ area }: { area: Area }) {
  const { pathname } = useLocation();
  const inMore = pathname.startsWith('/mais') || pathname.startsWith('/salvos') || pathname.startsWith('/sobre');
  const inBible = pathname.startsWith('/biblia') || pathname.startsWith('/topicos') || pathname.startsWith('/buscar');
  const items = area === 'igreja' ? CHURCH_TABS : STUDY_TABS;
  const isActive = (to: string) => {
    if (to === '/biblia') return inBible;
    if (to === '/mais') return inMore;
    if (to === '/salvos') return pathname.startsWith('/salvos');
    return pathname === to;
  };
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {items.map(([to, label, icon]) => (
        <NavLink key={to} to={to} end className={isActive(to) ? 'tab active' : 'tab'}>
          <span className="tab-icon" aria-hidden>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`bar ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(pct)}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${Math.floor(v * 100)}% concluído`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        {v > 0 ? <circle
          cx={size / 2} cy={size / 2} r={r} className="ring-fg"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        /> : null}
      </svg>
      <div className="ring-label"><strong>{Math.floor(v * 100)}%</strong>{label ? <small>{label}</small> : null}</div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}

export function Confirm({ open, title, text, confirmLabel = 'Confirmar', danger, onYes, onNo }: {
  open: boolean; title: string; text?: string; confirmLabel?: string; danger?: boolean; onYes: () => void; onNo: () => void;
}) {
  return (
    <Sheet open={open} onClose={onNo} title={title}>
      {text ? <p className="muted">{text}</p> : null}
      <div className="row gap">
        <button className="btn ghost grow" onClick={onNo}>Cancelar</button>
        <button className={`btn grow ${danger ? 'danger' : 'primary'}`} onClick={onYes}>{confirmLabel}</button>
      </div>
    </Sheet>
  );
}

export function Empty({ icon, title, text, children }: { icon: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>{icon}</div>
      <h3>{title}</h3>
      {text ? <p className="muted">{text}</p> : null}
      {children}
    </div>
  );
}
