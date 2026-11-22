import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/icons';
import { PageHeader } from '../components/ui';

interface Item { to: string; label: string; icon: IconName; onClick?: () => void }

/** Abre a Bíblia já na aba de tópicos ("O que a Bíblia diz"). */
const openTopics = () => { try { sessionStorage.setItem('bibleTab', 'topicos'); } catch { /* ignora */ } };

/**
 * "Mais": grade de atalhos. Novos recursos entram aqui como mais um item
 * (use `badge` para marcar uma novidade).
 */
const ITEMS: Item[] = [
  { to: '/plano', label: 'Plano de leitura', icon: 'calendar' },
  { to: '/progresso', label: 'Meu progresso', icon: 'chart' },
  { to: '/biblia', label: 'O que a Bíblia diz', icon: 'list', onClick: openTopics },
  { to: '/buscar', label: 'Buscar', icon: 'search' },
  { to: '/salvos', label: 'Versículos e notas', icon: 'heart' },
  { to: '/igreja', label: 'Agenda da igreja', icon: 'church' },
  { to: '/devocional', label: 'Devocional', icon: 'lighthouse' },
  { to: '/mais', label: 'Configurações', icon: 'gear' },
  { to: '/sobre', label: 'Licenças e créditos', icon: 'info' },
];

export default function MoreMenu() {
  return (
    <>
      <PageHeader title="Mais" back="/" />
      <main className="page">
        <div className="menu-grid">
          {ITEMS.map((it) => (
            <Link key={it.to + it.label} to={it.to} className="menu-item" onClick={it.onClick}>
              <span className="menu-icon"><Icon name={it.icon} size={30} /></span>
              <span className="menu-label">{it.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
