import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Icon, type IconName } from './icons';

export function PageHeader({ title, sub, back, right }: { title: string; sub?: string; back?: boolean | string; right?: ReactNode }) {
  const nav = useNavigate();
  const location = useLocation();
  // back=true volta ao histórico; se a tela foi aberta direto (sem histórico), vai para o início
  const goBack = () => (typeof back === 'string' ? nav(back) : location.key !== 'default' ? nav(-1) : nav('/'));
  return (
    <header className="page-header">
      {back ? (
        <button className="icon-btn" aria-label="Voltar" onClick={goBack}>
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

export type Area = 'igreja' | 'estudos' | 'devocional';

const STUDY_TABS: [string, string, string][] = [
  ['/estudos', 'Hoje', 'sun'],
  ['/biblia', 'Bíblia', 'book'],
  ['/plano', 'Plano', 'calendar'],
  ['/progresso', 'Progresso', 'chart'],
  ['/mais', 'Ajustes', 'gear'],
];
const DEVO_TABS: [string, string, string][] = [
  ['/devocional', 'Devocional', 'sun'],
  ['/biblia', 'Bíblia', 'book'],
  ['/salvos', 'Meu conteúdo', 'heart'],
  ['/', 'Início', 'home'],
];
const CHURCH_TABS: [string, string, string][] = [
  ['/igreja', 'Igreja', 'church'],
  ['/biblia', 'Bíblia', 'book'],
  ['/salvos', 'Meu conteúdo', 'heart'],
  ['/', 'Início', 'home'],
];

export function TabBar({ area }: { area: Area }) {
  const { pathname } = useLocation();
  const inMore = pathname.startsWith('/mais') || pathname.startsWith('/salvos') || pathname.startsWith('/sobre');
  const inBible = pathname.startsWith('/biblia') || pathname.startsWith('/topicos') || pathname.startsWith('/buscar');
  const items = area === 'igreja' ? CHURCH_TABS : area === 'devocional' ? DEVO_TABS : STUDY_TABS;
  const isActive = (to: string) => {
    if (to === '/biblia') return inBible;
    if (to === '/mais') return inMore;
    if (to === '/salvos') return pathname.startsWith('/salvos');
    if (to === '/devocional') return pathname.startsWith('/devocional');
    return pathname === to;
  };
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {items.map(([to, label, icon]) => (
        <NavLink key={to} to={to} end className={isActive(to) ? 'tab active' : 'tab'}>
          <Icon name={icon as IconName} className="tab-icon" />
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

export function ProgressBar({ value, label, className = '' }: { value: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`bar ${className}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.floor(pct)}>
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

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const box = ref.current;
    // foco inicial: o primeiro campo/botão da janela (ou a própria janela)
    (box?.querySelector<HTMLElement>(FOCUSABLE) ?? box)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !box) return;
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); box.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.({ preventScroll: true }); // devolve o foco a quem abriu
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
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
      <h2>{title}</h2>
      {text ? <p className="muted">{text}</p> : null}
      {children}
    </div>
  );
}

/** Placeholder de carregamento (linhas cinzas que pulsam). */
export function Skeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="skeleton" role="status" aria-label="Carregando">
      {Array.from({ length: lines }, (_, i) => <span key={i} className="sk-line" style={{ width: `${96 - ((i * 13) % 38)}%` }} />)}
    </div>
  );
}

const CONFETTI_COLORS = ['#fca311', '#d98200', '#52c38d', '#4d8be0', '#e0627a', '#f5ecd7'];

/** Chuva rápida de confetes quando `trigger` muda. Não aparece para quem prefere menos movimento. */
export function Confetti({ trigger }: { trigger: number }) {
  const [show, setShow] = useState(0);
  useEffect(() => {
    if (!trigger || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setShow(trigger);
    const t = setTimeout(() => setShow(0), 2400);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!show) return null;
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <span key={i} style={{
          left: `${(i * 97) % 100}%`, background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDelay: `${(i % 9) * 0.07}s`, animationDuration: `${1.5 + (i % 5) * 0.2}s`,
          transform: `rotate(${(i * 41) % 360}deg)`, width: `${6 + (i % 3) * 3}px`, height: `${10 + (i % 4) * 3}px`,
        }} />
      ))}
    </div>
  );
}
