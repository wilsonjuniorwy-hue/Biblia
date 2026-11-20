import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS } from '../data/books';
import { CHURCH } from '../data/church';
import { WEEKDAYS, nextService, upcomingEvents, whenLabel } from '../lib/church';
import { formatDate } from '../lib/date';
import { copyText } from '../lib/share';
import { ChurchArt } from '../components/art';
import { PageHeader } from '../components/ui';

export default function Church() {
  const { today, toast, settings } = useApp();
  const last = settings.lastRead;
  const nowHM = new Date().toTimeString().slice(0, 5);
  const next = nextService(CHURCH.schedule, today, nowHM);
  const events = upcomingEvents(CHURCH.events, today);
  const byDay = WEEKDAYS.map((name, day) => ({ name, items: CHURCH.schedule.filter((s) => s.day === day).sort((a, b) => a.time.localeCompare(b.time)) })).filter((d) => d.items.length);
  const wa = CHURCH.whatsapp ? `https://wa.me/${CHURCH.whatsapp.replace(/\D/g, '')}` : '';

  return (
    <>
      <PageHeader title={CHURCH.name} sub={CHURCH.tagline} back="/" />
      <main className="page">
        {CHURCH.demo ? (
          <div className="banner warn">Conteúdo de exemplo. Edite <strong>src/data/church.ts</strong> com os dados reais da igreja.</div>
        ) : null}

        <div className="church-hero">
          {CHURCH.image ? <img src={`${import.meta.env.BASE_URL}${CHURCH.image}`} alt={`Foto de ${CHURCH.name}`} /> : <ChurchArt className="church-art" />}
        </div>
        <p className="lead">{CHURCH.welcome}</p>

        <section className="card bible-cta">
          <div className="bible-cta-text">
            <small className="eyebrow">Modo Bíblia</small>
            <h2>Leia a Bíblia</h2>
            <p className="muted">Bíblia completa, tópicos para o dia a dia e busca. Funciona offline.</p>
          </div>
          <div className="row gap wrap">
            <Link to="/biblia" className="btn primary grow">📖 Abrir a Bíblia</Link>
            {last ? <Link to={`/ler/${last.book}/${last.chapter}`} className="btn ghost grow">Continuar: {BOOKS[last.book].name} {last.chapter}</Link> : null}
          </div>
        </section>

        {next ? (
          <section className="card next">
            <small className="eyebrow">Próximo encontro</small>
            <h2>{next.item.title}</h2>
            <p>
              <strong>{whenLabel(next.offset, next.date)}</strong>, {formatDate(next.date, { day: 'numeric', month: 'long' })} às {next.item.time}
              {next.item.note ? <span className="muted"> · {next.item.note}</span> : null}
            </p>
            {CHURCH.liveUrl ? <a className="btn primary" href={CHURCH.liveUrl} target="_blank" rel="noreferrer">▶ Assistir ao vivo</a> : null}
          </section>
        ) : null}

        <h2 className="section-title">Programação semanal</h2>
        <section className="card">
          {byDay.length === 0 ? <p className="muted">Em breve.</p> : null}
          <ul className="schedule">
            {byDay.map((d) => d.items.map((s, i) => (
              <li key={`${d.name}${s.time}`}>
                <span className="sch-day">{i === 0 ? d.name : ''}</span>
                <span className="sch-time">{s.time}</span>
                <span className="sch-title">{s.title}{s.note ? <small className="muted"> · {s.note}</small> : null}</span>
              </li>
            )))}
          </ul>
        </section>

        {events.length ? (
          <>
            <h2 className="section-title">Próximos eventos</h2>
            <div className="events">
              {events.map((e) => (
                <article key={e.title + e.date} className="card event">
                  <div className="date-badge" aria-hidden>
                    <strong>{formatDate(e.date, { day: '2-digit' })}</strong>
                    <span>{formatDate(e.date, { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <div>
                    <h3>{e.title}</h3>
                    <p className="muted small">{formatDate(e.date, { weekday: 'long' })}{e.time ? ` · ${e.time}` : ''}{e.place ? ` · ${e.place}` : ''}</p>
                    {e.text ? <p>{e.text}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {CHURCH.notices.length ? (
          <>
            <h2 className="section-title">Avisos</h2>
            {CHURCH.notices.map((n) => (
              <section key={n.title} className="card">
                <h3>{n.title}</h3>
                <p>{n.text}</p>
              </section>
            ))}
          </>
        ) : null}

        <h2 className="section-title">Contato e localização</h2>
        <section className="card contact">
          {CHURCH.address ? <p>📍 {CHURCH.address}</p> : null}
          <div className="row gap wrap">
            {CHURCH.mapsUrl ? <a className="btn ghost grow" href={CHURCH.mapsUrl} target="_blank" rel="noreferrer">Como chegar</a> : null}
            {wa ? <a className="btn ghost grow" href={wa} target="_blank" rel="noreferrer">WhatsApp</a> : null}
            {CHURCH.phone ? <a className="btn ghost grow" href={`tel:${CHURCH.phone.replace(/[^\d+]/g, '')}`}>Ligar {CHURCH.phone}</a> : null}
          </div>
          {CHURCH.email ? <p className="muted small">✉ {CHURCH.email}</p> : null}
          <div className="row gap wrap">
            {CHURCH.instagram ? <a className="chip" href={CHURCH.instagram} target="_blank" rel="noreferrer">Instagram</a> : null}
            {CHURCH.youtube ? <a className="chip" href={CHURCH.youtube} target="_blank" rel="noreferrer">YouTube</a> : null}
          </div>
        </section>

        {CHURCH.pix.key ? (
          <>
            <h2 className="section-title">Dízimos e ofertas</h2>
            <section className="card">
              <p className="muted">{CHURCH.pix.note}</p>
              <div className="pix">
                <small className="eyebrow">Chave PIX</small>
                <code>{CHURCH.pix.key}</code>
                <span className="muted small">{CHURCH.pix.holder}</span>
              </div>
              <button className="btn primary" onClick={async () => toast((await copyText(CHURCH.pix.key)) ? 'Chave PIX copiada!' : 'Não foi possível copiar')}>Copiar chave PIX</button>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
