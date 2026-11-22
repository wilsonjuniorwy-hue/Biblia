import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';
import { PageHeader } from '../components/ui';
import { YOUTUBE_URL } from '../data/links';
import { refLabel } from '../data/topics';
import { isNewVideo, videoRef, videoUrl, visibleVideos } from '../data/videos';

/** Vídeos do canal Farol de Fé. Cada um abre no YouTube; a passagem pode ser lida no próprio app. */
export default function VideosPage() {
  const now = Date.now();
  const list = visibleVideos(now);
  return (
    <>
      <PageHeader title="Vídeos" sub="Canal Farol de Fé no YouTube" back="/menu" />
      <main className="page">
        <a className="card channel-card" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
          <small className="eyebrow">Canal Farol de Fé</small>
          <h2>Mensagens de fé todos os dias</h2>
          <p className="muted">Inscreva-se e ative o sininho para receber as novas palavras.</p>
          <span className="btn primary ico"><Icon name="video" size={18} /> Abrir o canal</span>
        </a>

        {list.map((v) => {
          const r = videoRef(v);
          return (
            <article key={v.id} className="card video-card">
              <div className="row between center-y">
                <small className="eyebrow">{refLabel(r)}</small>
                {isNewVideo(v, now) ? <span className="badge ok">Novo</span> : null}
              </div>
              <h3>{v.title}</h3>
              <div className="row gap wrap">
                <a className="btn primary small ico" href={videoUrl(v)} target="_blank" rel="noopener noreferrer"><Icon name="play" size={16} /> Assistir</a>
                <Link className="btn ghost small" to={`/ler/${r.book}/${r.chapter}?v=${r.from}${r.to > r.from ? `-${r.to}` : ''}`}>Ler no app</Link>
              </div>
            </article>
          );
        })}
      </main>
    </>
  );
}
