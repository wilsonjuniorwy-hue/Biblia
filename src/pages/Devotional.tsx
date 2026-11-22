import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { translationById } from '../data/bible';
import { devotionalMinutes, devotionalOfTheDay } from '../data/devotionals';
import { refLabel } from '../data/topics';
import { Icon } from '../components/icons';
import { PageHeader, Skeleton } from '../components/ui';
import { dayOfYear, formatDate } from '../lib/date';
import { shareText } from '../lib/share';
import { useChapter } from '../lib/useChapter';
import { DEVOTIONAL_RATES, useDevotionalAudio } from '../lib/useDevotionalAudio';

/** Trecho do devocional na ordem em que é lido em voz alta. */
type Part = { id: string; text: string };

export default function DevotionalPage() {
  const { settings, today, toast } = useApp();
  const dev = devotionalOfTheDay(dayOfYear(today));
  const tr = settings.translation;
  const { data: verses, error, loading } = useChapter(tr, dev.ref.book, dev.ref.chapter);

  const passage = useMemo(() => (verses ? verses.slice(dev.ref.from - 1, dev.ref.to) : null), [verses, dev]);
  const label = `${refLabel(dev.ref)} (${translationById(tr).short})`;

  // O que a voz lê: título, passagem (versículo a versículo), reflexão, pergunta e oração.
  const parts: Part[] = useMemo(() => {
    const out: Part[] = [{ id: 'titulo', text: dev.title }];
    if (passage) {
      out.push({ id: 'leitura-intro', text: `Leitura bíblica: ${refLabel(dev.ref)}.` });
      passage.forEach((v, i) => out.push({ id: `v${dev.ref.from + i}`, text: v }));
    }
    dev.paragraphs.forEach((p, i) => out.push({ id: `p${i}`, text: p }));
    out.push({ id: 'pergunta', text: `Para pensar: ${dev.question}` });
    out.push({ id: 'oracao', text: dev.prayer });
    return out;
  }, [dev, passage]);

  const audio = useDevotionalAudio({
    devotionalId: dev.id,
    title: dev.title,
    parts,
    translation: tr,
  });

  const activeId = audio.currentId;
  const cls = (id: string) => (activeId === id ? 'speaking' : '');

  const shareAll = async () => {
    const body = `${dev.title}\n\n${label}\n\n${dev.paragraphs.join('\n\n')}\n\nPara pensar: ${dev.question}\n\nOração: ${dev.prayer}\n\n— Farol de Fé`;
    const r = await shareText(body);
    if (r === 'copied') toast('Copiado!');
    if (r === 'failed') toast('Não foi possível compartilhar');
  };

  return (
    <>
      <PageHeader title="Devocional" back="/devocional" sub={formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} />
      <main className="page devotional">
        <section className="card hero">
          <small className="eyebrow">Devocional de hoje · ~{devotionalMinutes(dev)} min</small>
          <h2 className={cls('titulo')}>{dev.title}</h2>
          {audio.supported ? (
            <>
              <div className="row gap wrap center-y">
                {audio.state === 'idle' ? (
                  <button className="btn primary" onClick={audio.play} disabled={loading || !!error}><Icon name="volume" size={18} /> Ouvir devocional</button>
                ) : (
                  <>
                    {audio.state === 'playing'
                      ? <button className="btn primary" onClick={audio.pause}><Icon name="pause" size={18} /> Pausar</button>
                      : <button className="btn primary" onClick={audio.resume}><Icon name="play" size={18} /> Continuar</button>}
                    <button className="btn ghost" onClick={audio.stop}><Icon name="stop" size={18} /> Parar</button>
                  </>
                )}
                <div className="rate" role="group" aria-label="Velocidade da voz">
                  {DEVOTIONAL_RATES.map((r) => (
                    <button key={r} className={r === audio.rate ? 'on' : ''} onClick={() => audio.setRate(r)}>{r === 1 ? '1×' : `${r}×`}</button>
                  ))}
                </div>
                <button
                  className={`btn ghost ${audio.musicEnabled ? 'on' : ''}`}
                  onClick={audio.toggleMusic}
                  title={audio.musicEnabled ? 'Música de fundo ligada' : 'Música de fundo desligada'}
                  aria-label="Alternar música instrumental de fundo"
                  style={{ padding: '6px 10px' }}
                >
                  <Icon name="music" size={18} />
                </button>
              </div>
              {!audio.isCustomAudio && !audio.hasPtVoice ? <p className="muted small">Seu aparelho não tem uma voz em português instalada. Instale uma nas configurações de voz do sistema para ouvir.</p> : null}
            </>
          ) : <p className="muted small">Este aparelho não oferece leitura em voz alta.</p>}
        </section>

        <section className="card">
          <small className="eyebrow">Leitura bíblica</small>
          {loading ? <Skeleton lines={4} /> : error ? <p className="muted">{error}</p> : (
            <div className="dev-verses">
              {passage?.map((v, i) => {
                const n = dev.ref.from + i;
                return <p key={n} className={cls(`v${n}`)}><sup className="vnum">{n}</sup>{v}</p>;
              })}
            </div>
          )}
          <Link className="verse-ref" to={`/ler/${dev.ref.book}/${dev.ref.chapter}`}>{label} · abrir o capítulo</Link>
        </section>

        <section className="card dev-text">
          <small className="eyebrow">Reflexão</small>
          {dev.paragraphs.map((p, i) => <p key={i} className={cls(`p${i}`)}>{p}</p>)}
        </section>

        <section className="card">
          <small className="eyebrow">Para pensar</small>
          <p className={`dev-question ${cls('pergunta')}`}>{dev.question}</p>
        </section>

        <section className="card">
          <small className="eyebrow">Oração</small>
          <p className={`dev-prayer ${cls('oracao')}`}>{dev.prayer}</p>
        </section>

        <button className="btn ghost" onClick={() => void shareAll()}><Icon name="share" size={18} /> Compartilhar devocional</button>
      </main>
    </>
  );
}
