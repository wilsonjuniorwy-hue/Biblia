import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS } from '../data/books';
import { useEvents, type EventRow } from '../db/db';
import { WEEKDAYS, formatCountdown, makeIcs, minutesUntil, pastEvents, upcomingOccurrences, weekdayOf, whenLabel } from '../lib/church';
import { toDateStr, formatDate } from '../lib/date';
import { download } from '../lib/cards';
import { shareText } from '../lib/share';
import { ChurchArt } from '../components/art';
import { EventSheet } from '../components/EventSheet';
import { Icon } from '../components/icons';
import { Empty, PageHeader } from '../components/ui';

/** Hora atual, atualizada a cada 30 s (para a contagem regressiva). */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Church() {
  const { toast, settings } = useApp();
  const { events } = useEvents();
  const now = useNow();
  const today = toDateStr(now);
  const nowHM = now.toTimeString().slice(0, 5);
  const last = settings.lastRead;
  const upcoming = upcomingOccurrences(events, today, nowHM);
  const past = pastEvents(events, today, nowHM);
  const next = upcoming[0] ?? null;
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (e: EventRow) => { setEditing(e); setSheetOpen(true); };

  const addToCalendar = (e: EventRow) => {
    const ok = download(new Blob([makeIcs(e)], { type: 'text/calendar;charset=utf-8' }), `${e.date}-evento.ics`);
    toast(ok ? 'Arquivo de calendário baixado. Abra-o para adicionar.' : 'Não foi possível gerar o arquivo.');
  };
  const shareEvent = async (e: EventRow, date: string) => {
    const when = e.weekly ? `Toda ${WEEKDAYS[weekdayOf(e.date)].toLowerCase()}` : formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' });
    const text = [e.title, `${when}${e.time ? ` às ${e.time}` : ''}`, e.place].filter(Boolean).join('\n');
    const r = await shareText(text);
    if (r === 'copied') toast('Texto copiado!');
    if (r === 'failed') toast('Não foi possível compartilhar');
  };

  return (
    <>
      <PageHeader title="Igreja" sub="Seus eventos e a Bíblia" back="/" />
      <main className="page">
        <div className="church-hero">
          <ChurchArt className="church-art" />
        </div>

        <section className="card bible-cta">
          <div className="bible-cta-text">
            <small className="eyebrow">Modo Bíblia</small>
            <h2>Leia a Bíblia</h2>
            <p className="muted">Bíblia completa, tópicos para o dia a dia e busca. Funciona offline.</p>
          </div>
          <div className="row gap wrap">
            <Link to="/biblia" className="btn primary grow"><span className="row gap"><Icon name="book" size={18} /> Abrir a Bíblia</span></Link>
            {last ? <Link to={`/ler/${last.book}/${last.chapter}`} className="btn ghost grow">Continuar: {BOOKS[last.book].name} {last.chapter}</Link> : null}
          </div>
        </section>

        {next ? (
          <section className="card next" aria-label="Próximo evento">
            <small className="eyebrow">Próximo evento{next.event.time ? ` · ${formatCountdown(minutesUntil(next.date, next.event.time, now))}` : ''}</small>
            <h2>{next.event.title}</h2>
            <p>
              <strong>{whenLabel(next.offset, next.date)}</strong>, {formatDate(next.date, { day: 'numeric', month: 'long' })}{next.event.time ? ` às ${next.event.time}` : ''}
              {next.event.place ? <span className="muted"> · {next.event.place}</span> : null}
            </p>
          </section>
        ) : null}

        <div className="row between center-y">
          <h2 className="section-title">Meus eventos</h2>
          <button className="btn primary small" onClick={openNew}><span className="row gap"><Icon name="plus" size={16} /> Novo evento</span></button>
        </div>

        {events.length === 0 ? (
          <Empty icon="📅" title="Nenhum evento ainda" text="Cadastre seus cultos, reuniões e compromissos da igreja. Eles ficam só neste aparelho.">
            <button className="btn primary" onClick={openNew}>Cadastrar o primeiro evento</button>
          </Empty>
        ) : null}

        <div className="events">
          {upcoming.map(({ event: e, date }) => (
            <article key={e.id} className="card event">
              <div className="date-badge" aria-hidden>
                <strong>{formatDate(date, { day: '2-digit' })}</strong>
                <span>{formatDate(date, { month: 'short' }).replace('.', '')}</span>
              </div>
              <div className="event-body">
                <h3>{e.title}</h3>
                <p className="muted small">
                  {e.weekly ? `Toda ${WEEKDAYS[weekdayOf(e.date)].toLowerCase()}` : formatDate(date, { weekday: 'long' })}
                  {e.time ? ` · ${e.time}` : ''}{e.place ? ` · ${e.place}` : ''}
                </p>
                {e.notes ? <p className="event-notes">{e.notes}</p> : null}
                <div className="row gap wrap">
                  <button className="btn ghost small" onClick={() => openEdit(e)}>Editar</button>
                  <button className="btn ghost small" onClick={() => addToCalendar(e)}><span className="row gap"><Icon name="calendar" size={16} /> Calendário</span></button>
                  <button className="btn ghost small" onClick={() => void shareEvent(e, date)}><span className="row gap"><Icon name="share" size={16} /> Compartilhar</span></button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {past.length ? (
          <details className="past">
            <summary>Eventos passados ({past.length})</summary>
            <div className="events">
              {past.map((e) => (
                <article key={e.id} className="card event past-item">
                  <div className="date-badge muted-badge" aria-hidden>
                    <strong>{formatDate(e.date, { day: '2-digit' })}</strong>
                    <span>{formatDate(e.date, { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <div className="event-body">
                    <h3>{e.title}</h3>
                    <p className="muted small">{formatDate(e.date, { weekday: 'long', year: 'numeric' })}{e.time ? ` · ${e.time}` : ''}{e.place ? ` · ${e.place}` : ''}</p>
                    <div className="row gap wrap"><button className="btn ghost small" onClick={() => openEdit(e)}>Editar ou excluir</button></div>
                  </div>
                </article>
              ))}
            </div>
          </details>
        ) : null}
      </main>

      <EventSheet open={sheetOpen} onClose={() => setSheetOpen(false)} initial={editing} />
    </>
  );
}
