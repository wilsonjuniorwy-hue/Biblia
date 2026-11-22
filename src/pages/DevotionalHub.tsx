import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { devotionalMinutes, devotionalOfTheDay } from '../data/devotionals';
import { refLabel } from '../data/topics';
import { PageHeader } from '../components/ui';
import { dayOfYear, formatDate } from '../lib/date';

/**
 * Área "Devocional": reúne os conteúdos devocionais. Hoje só há o devocional diário;
 * novos tipos de conteúdo entram aqui como mais cartões da lista.
 */
export default function DevotionalHub() {
  const { today } = useApp();
  const dev = devotionalOfTheDay(dayOfYear(today));
  return (
    <>
      <PageHeader title="Devocional" back="/" sub={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} />
      <main className="page">
        <Link to="/devocional/hoje" className="card hero devo-hero">
          <small className="eyebrow">Devocional de hoje · ~{devotionalMinutes(dev)} min · com áudio</small>
          <h2>{dev.title}</h2>
          <p className="muted">{refLabel(dev.ref)}</p>
          <span className="btn primary">Abrir devocional</span>
        </Link>

        <section className="card soon">
          <h3>Em breve</h3>
          <p className="muted">Novos conteúdos para o seu dia, como orações, meditações e séries por tema, vão aparecer aqui.</p>
        </section>
      </main>
    </>
  );
}
