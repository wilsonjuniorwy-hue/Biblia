import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';
import { PageHeader, Sheet } from '../components/ui';
import { YOUTUBE_URL } from '../data/links';
import { refLabel } from '../data/topics';
import { embedUrl, isNewVideo, videoRef, videoUrl, visibleVideos, type Video } from '../data/videos';

/**
 * Vídeos do canal Farol de Fé. "Assistir" abre o player do YouTube numa janela do próprio app.
 * Nada é carregado do YouTube até a pessoa tocar em Assistir (o player só nasce com a janela aberta).
 */
export default function VideosPage() {
  const now = Date.now();
  const list = visibleVideos(now);
  const [playing, setPlaying] = useState<Video | null>(null);
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
                <button className="btn primary small ico" onClick={() => setPlaying(v)}><Icon name="play" size={16} /> Assistir</button>
                <Link className="btn ghost small" to={`/ler/${r.book}/${r.chapter}?v=${r.from}${r.to > r.from ? `-${r.to}` : ''}`}>Ler no app</Link>
              </div>
            </article>
          );
        })}
      </main>

      <Sheet open={!!playing} onClose={() => setPlaying(null)} title={playing?.title}>
        {playing ? <Player video={playing} /> : null}
      </Sheet>
    </>
  );
}

function Player({ video }: { video: Video }) {
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  return (
    <div className="player">
      {online ? (
        <div className={`video-frame ${video.short ? 'short' : ''}`}>
          <iframe
            title={video.title}
            src={embedUrl(video)}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      ) : (
        <p className="muted">Sem internet no momento. Os vídeos precisam de conexão: tente de novo quando estiver online.</p>
      )}
      <p className="muted small">O vídeo é carregado do YouTube (modo sem cookies) só quando você toca em Assistir.</p>
      <a className="btn ghost small" href={videoUrl(video)} target="_blank" rel="noopener noreferrer">Abrir no YouTube</a>
    </div>
  );
}
