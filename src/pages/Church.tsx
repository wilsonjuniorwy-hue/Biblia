import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { BOOKS } from '../data/books';
import { CHURCH, type ChurchEvent } from '../data/church';
import { WEEKDAYS, formatCountdown, liveNow, makeIcs, minutesUntil, nextService, upcomingEvents, whenLabel } from '../lib/church';
import { toDateStr, formatDate } from '../lib/date';
import { download } from '../lib/cards';
import { copyText, shareText } from '../lib/share';
import { ChurchArt } from '../components/art';
import { Icon } from '../components/icons';
import { PageHeader, Sheet } from '../components/ui';

/** Hora atual, atualizada a cada 30 s (para "Ao vivo agora" e a contagem regressiva). */
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
  const now = useNow();
  const today = toDateStr(now);
  const nowHM = now.toTimeString().slice(0, 5);
  const last = settings.lastRead;
  const live = liveNow(CHURCH.schedule, today, nowHM, CHURCH.liveMinutes);
  const next = nextService(CHURCH.schedule, today, nowHM);
  const events = upcomingEvents(CHURCH.events, today);
  const byDay = WEEKDAYS.map((name, day) => ({ name, items: CHURCH.schedule.filter((s) => s.day === day).sort((a, b) => a.time.localeCompare(b.time)) })).filter((d) => d.items.length);
  const waDigits = CHURCH.whatsapp.replace(/\D/g, '');
  const wa = waDigits ? `https://wa.me/${waDigits}` : '';
  const [prayer, setPrayer] = useState('');
  const [photo, setPhoto] = useState<number | null>(null);

  const addToCalendar = (e: ChurchEvent) => {
    const ics = makeIcs(e, CHURCH.name);
    const ok = download(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), `${e.date}-evento.ics`);
    toast(ok ? 'Arquivo de calendário baixado. Abra-o para adicionar.' : 'Não foi possível gerar o arquivo.');
  };
  const shareEvent = async (e: ChurchEvent) => {
    const when = `${formatDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' })}${e.time ? ` às ${e.time}` : ''}`;
    const text = `${e.title}\n${when}${e.place ? `\n${e.place}` : ''}\n${CHURCH.name}`;
    const r = await shareText(text);
    if (r === 'copied') toast('Texto copiado!');
    if (r === 'failed') toast('Não foi possível compartilhar');
  };

  return (
    <>
      <PageHeader title={CHURCH.name} sub={CHURCH.tagline} back="/" />
      <main className="page">
        {CHURCH.demo ? (
          <div className="banner warn">Conteúdo de exemplo. Edite <strong>src/data/church.ts</strong> com os dados reais da igreja.</div>
        ) : null}

        {live ? (
          <section className="card live-card" aria-live="polite">
            <span className="live-dot"><Icon name="live" size={16} /> AO VIVO AGORA</span>
            <h2>{live.title}</h2>
            <p className="muted">Começou às {live.time}{live.note ? ` · ${live.note}` : ''}</p>
            {CHURCH.liveUrl ? <a className="btn primary" href={CHURCH.liveUrl} target="_blank" rel="noopener noreferrer">Assistir agora</a> : null}
          </section>
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
            <Link to="/biblia" className="btn primary grow"><span className="row gap"><Icon name="book" size={18} /> Abrir a Bíblia</span></Link>
            {last ? <Link to={`/ler/${last.book}/${last.chapter}`} className="btn ghost grow">Continuar: {BOOKS[last.book].name} {last.chapter}</Link> : null}
          </div>
        </section>

        {next && !live ? (
          <section className="card next">
            <small className="eyebrow">Próximo encontro · {formatCountdown(minutesUntil(next.date, next.item.time, now))}</small>
            <h2>{next.item.title}</h2>
            <p>
              <strong>{whenLabel(next.offset, next.date)}</strong>, {formatDate(next.date, { day: 'numeric', month: 'long' })} às {next.item.time}
              {next.item.note ? <span className="muted"> · {next.item.note}</span> : null}
            </p>
            {CHURCH.liveUrl ? <a className="btn ghost" href={CHURCH.liveUrl} target="_blank" rel="noopener noreferrer">Link da transmissão</a> : null}
          </section>
        ) : null}

        {CHURCH.devotional ? (
          <>
            <h2 className="section-title">Mensagem da semana</h2>
            <section className="card devotional">
              <h3>{CHURCH.devotional.title}</h3>
              {CHURCH.devotional.verse ? <p className="verse-ref">{CHURCH.devotional.verse}</p> : null}
              <p>{CHURCH.devotional.text}</p>
              {CHURCH.devotional.author ? <p className="muted small">— {CHURCH.devotional.author}</p> : null}
            </section>
          </>
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
                  <div className="event-body">
                    <h3>{e.title}</h3>
                    <p className="muted small">{formatDate(e.date, { weekday: 'long' })}{e.time ? ` · ${e.time}` : ''}{e.place ? ` · ${e.place}` : ''}</p>
                    {e.text ? <p>{e.text}</p> : null}
                    <div className="row gap wrap">
                      <button className="btn ghost small" onClick={() => addToCalendar(e)}><span className="row gap"><Icon name="calendar" size={16} /> Calendário</span></button>
                      <button className="btn ghost small" onClick={() => void shareEvent(e)}><span className="row gap"><Icon name="share" size={16} /> Compartilhar</span></button>
                    </div>
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

        {CHURCH.ministries.length ? (
          <>
            <h2 className="section-title">Ministérios</h2>
            <div className="ministries">
              {CHURCH.ministries.map((m) => (
                <article key={m.name} className="ministry">
                  <span className="ministry-badge" aria-hidden>{m.name.charAt(0)}</span>
                  <div><h3>{m.name}</h3><p className="muted small">{m.text}</p></div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        {CHURCH.photos.length ? (
          <>
            <h2 className="section-title">Galeria</h2>
            <div className="gallery">
              {CHURCH.photos.map((p, i) => (
                <button key={p.src} className="gallery-item" onClick={() => setPhoto(i)} aria-label={p.caption ? `Ampliar foto: ${p.caption}` : `Ampliar foto ${i + 1}`}>
                  <img src={`${import.meta.env.BASE_URL}${p.src}`} alt={p.caption ?? ''} loading="lazy" />
                </button>
              ))}
            </div>
          </>
        ) : null}

        {CHURCH.bulletinUrl ? (
          <a className="btn ghost" href={CHURCH.bulletinUrl} target="_blank" rel="noopener noreferrer"><span className="row gap"><Icon name="note" size={18} /> Abrir o boletim da semana (PDF)</span></a>
        ) : null}

        {CHURCH.prayerRequests && wa ? (
          <>
            <h2 className="section-title">Pedido de oração</h2>
            <section className="card">
              <label className="field">
                <span>Escreva seu pedido</span>
                <textarea id="prayer-text" rows={3} maxLength={600} value={prayer} onChange={(e) => setPrayer(e.target.value)} placeholder="Como podemos orar por você?" />
              </label>
              <a
                className={`btn primary ${prayer.trim() ? '' : 'disabled'}`} aria-disabled={!prayer.trim()}
                href={prayer.trim() ? `${wa}?text=${encodeURIComponent(`Pedido de oração:\n${prayer.trim()}`)}` : undefined}
                target="_blank" rel="noopener noreferrer"
                onClick={(e) => { if (!prayer.trim()) e.preventDefault(); }}
              >Enviar pelo WhatsApp</a>
              <p className="muted small">Seu pedido vai direto para o WhatsApp da igreja. O app não guarda nada.</p>
            </section>
          </>
        ) : null}

        <h2 className="section-title">Contato e localização</h2>
        <section className="card contact">
          {CHURCH.address ? <p className="row gap"><Icon name="pin" size={18} /> <span>{CHURCH.address}</span></p> : null}
          <div className="row gap wrap">
            {CHURCH.mapsUrl ? <a className="btn ghost grow" href={CHURCH.mapsUrl} target="_blank" rel="noopener noreferrer">Como chegar</a> : null}
            {wa ? <a className="btn ghost grow" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a> : null}
            {CHURCH.phone ? <a className="btn ghost grow" href={`tel:${CHURCH.phone.replace(/[^\d+]/g, '')}`}>Ligar {CHURCH.phone}</a> : null}
          </div>
          {CHURCH.email ? <p className="muted small row gap"><Icon name="mail" size={16} /> {CHURCH.email}</p> : null}
          <div className="row gap wrap">
            {CHURCH.instagram ? <a className="chip" href={CHURCH.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}
            {CHURCH.youtube ? <a className="chip" href={CHURCH.youtube} target="_blank" rel="noopener noreferrer">YouTube</a> : null}
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

      <Sheet open={photo !== null} onClose={() => setPhoto(null)} title="Foto">
        {photo !== null && CHURCH.photos[photo] ? (
          <>
            <img className="photo-big" src={`${import.meta.env.BASE_URL}${CHURCH.photos[photo].src}`} alt={CHURCH.photos[photo].caption ?? ''} />
            {CHURCH.photos[photo].caption ? <p className="muted center">{CHURCH.photos[photo].caption}</p> : null}
            <button className="btn primary" onClick={() => setPhoto(null)}>Fechar</button>
          </>
        ) : null}
      </Sheet>
    </>
  );
}
