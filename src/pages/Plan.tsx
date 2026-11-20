import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { chapterId, segmentLabel } from '../data/books';
import { DURATIONS, PLAN_INFO, planDays, planStatus, rebalance, suggestedPerDay, type PlanConfig, type PlanType } from '../data/plans';
import { setSetting } from '../db/db';
import { addDays, formatDate } from '../lib/date';
import { Confirm, PageHeader, ProgressBar } from '../components/ui';

export default function PlanPage() {
  const { settings, read, today } = useApp();
  const plan = settings.plan;
  return (
    <>
      <PageHeader title="Plano de leitura" sub={plan ? PLAN_INFO[plan.type].name : 'Escolha como quer ler'} />
      <main className="page">
        {plan ? <ActivePlan plan={plan} read={read} today={today} /> : <Setup />}
      </main>
    </>
  );
}

function Setup({ initial, onDone }: { initial?: PlanType; onDone?: () => void }) {
  const { read, today, toast } = useApp();
  const [type, setType] = useState<PlanType>(initial ?? 'misto');
  const [days, setDays] = useState<number>(365);
  const [start, setStart] = useState(today);
  const [skipRead, setSkipRead] = useState(read.size > 0);
  const excluded = useMemo(() => (skipRead ? [...read] : []), [skipRead, read]);
  const perDay = suggestedPerDay(type, days, excluded);

  const begin = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) { toast('Escolha uma data de início válida.'); return; }
    const cfg: PlanConfig = { type, days, startDate: start, excluded };
    await setSetting('plan', cfg);
    toast('Plano iniciado! Boa leitura 🙏');
    onDone?.();
  };

  return (
    <>
      <div className="plan-options">
        {(Object.keys(PLAN_INFO) as PlanType[]).map((t) => (
          <button key={t} className={`plan-card ${type === t ? 'on' : ''}`} onClick={() => setType(t)} aria-pressed={type === t}>
            <strong>{PLAN_INFO[t].name}</strong>
            <span className="small">{PLAN_INFO[t].short}</span>
            <span className="muted small">{PLAN_INFO[t].desc}</span>
          </button>
        ))}
      </div>

      <section className="card">
        <h3>Duração</h3>
        <div className="row gap wrap">
          {DURATIONS.map((d) => (
            <button key={d} className={`chip ${days === d ? 'on' : ''}`} onClick={() => setDays(d)}>
              {d === 365 ? '1 ano (365 dias)' : `${d} dias`}
            </button>
          ))}
        </div>
        <p className="muted small">≈ {perDay.toFixed(1).replace('.', ',')} capítulos por dia{days < 365 ? ' — um ritmo mais intenso' : ''}.</p>

        <label className="field">
          <span>Data de início</span>
          <input type="date" value={start} min={addDays(today, -365)} onChange={(e) => setStart(e.target.value)} />
        </label>

        {read.size > 0 ? (
          <label className="check">
            <input type="checkbox" checked={skipRead} onChange={(e) => setSkipRead(e.target.checked)} />
            <span>Pular os {read.size} capítulos que já li</span>
          </label>
        ) : null}
        <button className="btn primary" onClick={() => void begin()}>Iniciar plano</button>
      </section>
      <p className="muted small">Seu progresso vale para todos os planos: um capítulo lido conta em qualquer um deles, e você pode trocar de plano quando quiser sem perder nada.</p>
    </>
  );
}

function ActivePlan({ plan, read, today }: { plan: PlanConfig; read: Set<number>; today: string }) {
  const { mark, toast } = useApp();
  const st = useMemo(() => planStatus(plan, read, today), [plan, read, today]);
  const [dlg, setDlg] = useState<null | 'change' | 'stop' | 'rebalance'>(null);
  const [showAll, setShowAll] = useState(false);
  const [changing, setChanging] = useState(false);

  if (changing) {
    return (
      <>
        <button className="btn ghost" onClick={() => setChanging(false)}>‹ Cancelar</button>
        <Setup initial={plan.type} onDone={() => setChanging(false)} />
      </>
    );
  }

  const days = planDays(plan);
  const from = showAll ? 0 : Math.max(0, st.todayIndex - 3);
  const to = showAll ? days.length : Math.min(days.length, Math.max(st.todayIndex, 0) + 15);
  const list = days.slice(from, to);
  const pct = st.totalChapters ? st.readChapters / st.totalChapters : 0;
  const nb = rebalance(plan, read, today);

  return (
    <>
      <section className="card">
        <div className="row between">
          <strong>{PLAN_INFO[plan.type].name} · {plan.days} dias</strong>
          <span className="muted">{Math.floor(pct * 100)}%</span>
        </div>
        <ProgressBar value={pct} />
        <p className="muted small">
          {formatDate(plan.startDate, { day: 'numeric', month: 'short', year: 'numeric' })} → {formatDate(st.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}{st.readChapters}/{st.totalChapters} capítulos do plano lidos
        </p>
        {st.notStarted ? <p>O plano começa em {formatDate(plan.startDate, { day: 'numeric', month: 'long' })}.</p> : null}
        {st.finished ? <p><strong>O período do plano terminou.</strong> {st.readChapters < st.totalChapters ? 'Você pode reiniciar com o que falta.' : 'Parabéns, plano concluído! 🎉'}</p> : null}
        {st.behind > 0 ? <p className="alert"><strong>{st.behind} {st.behind === 1 ? 'dia atrasado' : 'dias atrasado'}.</strong> Você pode ler as pendências ou reajustar o plano.</p> : null}
        {st.behind < 0 ? <p>👏 {-st.behind} {st.behind === -1 ? 'dia adiantado' : 'dias adiantado'}.</p> : null}
        {!st.notStarted && st.behind === 0 && !st.finished ? <p>✅ No ritmo.</p> : null}
        <div className="row gap wrap">
          {nb && (st.behind > 0 || st.finished) ? <button className="btn primary grow" onClick={() => setDlg('rebalance')}>Reajustar o que falta</button> : null}
          {st.finished && !nb ? <button className="btn primary grow" onClick={() => setChanging(true)}>Novo plano</button> : null}
          <button className="btn ghost grow" onClick={() => setDlg('change')}>Trocar plano</button>
          <button className="btn ghost grow" onClick={() => setDlg('stop')}>Encerrar</button>
        </div>
      </section>

      <h2 className="section-title">Calendário</h2>
      {from > 0 ? <button className="btn ghost small" onClick={() => setShowAll(true)}>Mostrar desde o início</button> : null}
      <ol className="days">
        {list.map((d) => {
          const done = d.chapters.length > 0 && d.chapters.every((id) => read.has(id));
          const isToday = d.index === st.todayIndex;
          const late = !done && d.index < st.todayIndex && d.chapters.length > 0;
          return (
            <li key={d.index} className={`day ${done ? 'done' : ''} ${isToday ? 'today' : ''} ${late ? 'late' : ''}`}>
              <div className="day-head">
                <strong>Dia {d.index + 1}</strong>
                <span className="muted small">{formatDate(d.date, { weekday: 'short', day: '2-digit', month: 'short' })}{isToday ? ' · hoje' : ''}</span>
                {done ? <span className="badge ok">✓</span> : late ? <span className="badge warn">pendente</span> : null}
              </div>
              {d.chapters.length === 0 ? <span className="muted small">Dia livre</span> : (
                <div className="chips">
                  {d.segments.map((s) => (
                    <Link key={`${s.book}:${s.from}`} className={`chip ${Array.from({ length: s.to - s.from + 1 }, (_, i) => s.from + i).every((c) => read.has(chapterId(s.book, c))) ? 'ok' : ''}`} to={`/ler/${s.book}/${s.from}`}>
                      {segmentLabel(s, true)}
                    </Link>
                  ))}
                  {!done && (isToday || late) ? (
                    <button className="chip" onClick={async () => { await mark(d.chapters); toast(`Dia ${d.index + 1} marcado como lido`); }}>marcar dia</button>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {to < days.length ? (
        <button className="btn ghost" onClick={() => setShowAll(true)}>Mostrar todos os {days.length} dias</button>
      ) : null}

      <Confirm
        open={dlg === 'rebalance'} title="Reajustar plano?"
        text={nb ? `Os capítulos que ainda faltam serão redistribuídos a partir de hoje até ${formatDate(st.endDate, { day: 'numeric', month: 'long', year: 'numeric' })} (${nb.days} dias). O que você já leu continua contando.` : ''}
        confirmLabel="Reajustar" onNo={() => setDlg(null)}
        onYes={async () => { setDlg(null); if (nb) { await setSetting('plan', nb); toast('Plano reajustado.'); } }}
      />
      <Confirm
        open={dlg === 'change'} title="Trocar de plano?"
        text="Seu progresso de leitura é mantido. Apenas o calendário muda."
        confirmLabel="Escolher outro" onNo={() => setDlg(null)}
        onYes={() => { setDlg(null); setChanging(true); }}
      />
      <Confirm
        open={dlg === 'stop'} title="Encerrar o plano?"
        text="O calendário será removido. O que você já leu continua marcado."
        confirmLabel="Encerrar" danger onNo={() => setDlg(null)}
        onYes={async () => { setDlg(null); await setSetting('plan', null); }}
      />
    </>
  );
}

