import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { devotionalFolders, devotionalMinutes, devotionalOfTheDay } from '../data/devotionals';
import { refLabel } from '../data/topics';
import { Icon } from '../components/icons';
import { PageHeader } from '../components/ui';
import { dayOfYear, formatDate } from '../lib/date';

/**
 * Área "Devocional": o devocional de hoje no topo e a biblioteca com todos eles, em pastas por tema.
 * Os temas ainda sem devocional aparecem como "Em breve". Devocional novo: src/data/devotionals.ts.
 */
export default function DevotionalHub() {
  const { today } = useApp();
  const dev = devotionalOfTheDay(dayOfYear(today));
  const folders = devotionalFolders();
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

        <h2 className="lib-title">Temas</h2>
        {folders.map(({ theme, items }) => items.length === 0 ? (
          <div key={theme.id} className="folder soon-folder" aria-disabled="true">
            <div className="folder-head">
              <Icon name="folder" size={22} className="folder-icon" />
              <span className="folder-name">{theme.name}<small className="muted">{theme.blurb}</small></span>
              <span className="badge muted-badge">Em breve</span>
            </div>
          </div>
        ) : (
          <details key={theme.id} className="folder" open={items.some((d) => d.id === dev.id)}>
            <summary>
              <Icon name="folder" size={22} className="folder-icon" />
              <span className="folder-name">{theme.name}<small className="muted">{theme.blurb}</small></span>
              <span className="folder-count">{items.length}</span>
            </summary>
            <ol className="devo-list">
              {items.map((d, i) => (
                <li key={d.id}>
                  <Link to={`/devocional/${d.id}`} className="devo-item">
                    <span className="devo-num">{i + 1}</span>
                    <span className="devo-info">
                      <strong>{d.title}</strong>
                      <small className="muted">{refLabel(d.ref)} · ~{devotionalMinutes(d)} min</small>
                    </span>
                    {d.id === dev.id ? <span className="badge ok">Hoje</span> : null}
                  </Link>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </main>
    </>
  );
}
