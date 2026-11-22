import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { Icon, type IconName } from '../components/icons';
import { PageHeader } from '../components/ui';
import { shareText } from '../lib/share';

/**
 * "Mais": só novidades e conteúdos extras. O que já tem lugar no app (plano, progresso, busca,
 * salvos, igreja, devocional, ajustes) NÃO se repete aqui.
 * Novos recursos entram como mais um item; use `soon` para anunciar o que está chegando.
 */
interface Item { label: string; icon: IconName; badge?: string; soon?: boolean }

const SOON: Item[] = [
  { label: 'Quiz bíblico', icon: 'info', badge: 'Em breve', soon: true },
  { label: 'Pedidos de oração', icon: 'note', badge: 'Em breve', soon: true },
  { label: 'Apoiar o app', icon: 'heart', badge: 'Em breve', soon: true },
];

export default function MoreMenu() {
  const { toast } = useApp();
  const shareApp = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const r = await shareText(`Farol de Fé: Bíblia, planos de leitura e devocional diário, de graça e sem internet.\n${url}`);
    if (r === 'copied') toast('Link copiado!');
    if (r === 'failed') toast('Não foi possível compartilhar');
  };

  return (
    <>
      <PageHeader title="Mais" sub="Novidades e conteúdos extras" back="/" />
      <main className="page">
        <div className="menu-grid">
          <Link className="menu-item" to="/videos">
            <span className="menu-icon"><Icon name="video" size={30} /><span className="menu-badge">Novidade</span></span>
            <span className="menu-label">Vídeos do canal</span>
          </Link>
          <button className="menu-item" onClick={() => void shareApp()}>
            <span className="menu-icon"><Icon name="share" size={30} /></span>
            <span className="menu-label">Compartilhar o app</span>
          </button>
          {SOON.map((it) => (
            <div key={it.label} className="menu-item soon" aria-disabled="true">
              <span className="menu-icon"><Icon name={it.icon} size={30} />{it.badge ? <span className="menu-badge soon-badge">{it.badge}</span> : null}</span>
              <span className="menu-label">{it.label}</span>
            </div>
          ))}
        </div>
        <p className="muted small center">Novos conteúdos chegam por aqui.</p>
      </main>
    </>
  );
}
