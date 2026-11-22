import { useMemo, useState } from 'react';
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
import { useSpeech } from '../lib/speech';

const RATES = [0.85, 1, 1.15] as const;

/** Trecho do devocional na ordem em que é lido em voz alta. */
type Part = { id: string; text: string };

export default function DevotionalPage() {
  const { settings, today, toast } = useApp();
  const dev = devotionalOfTheDay(dayOfYear(today));
  const tr = settings.translation;
  const { data: verses, error, loading } = useChapter(tr, dev.ref.book, dev.ref.chapter);
  const [rate, setRate] = useState<(typeof RATES)[number]>(1);
  const speech = useSpeech();

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
    out.push({ id: 'oracao', text: `Oração. ${dev.prayer}` });
    return out;
  }, [dev, passage]);

  const activeId = speech.current !== null ? parts[speech.current]?.id : null;
  const cls = (id: string) => (activeId === id ? 'speaking' : '');
  const play = () => speech.speakFrom(parts.map((p) => p.text), 0, rate);
  const changeRate = (r: (typeof RATES)[number]) => {
    setRate(r);
    if (speech.state !== 'idle' && speech.current !== null) speech.speakFrom(parts.map((p) => p.text), speech.current, r);
  };

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
          {speech.supported ? (
            <>
              <div className="row gap wrap center-y">
                {speech.state === 'idle' ? (
                  <button className="btn primary" onClick={play} disabled={loading || !!error}><Icon name="volume" size={18} /> Ouvir devocional</button>
                ) : (
                  <>
                    {speech.state === 'playing'
                      ? <button className="btn primary" onClick={speech.pause}><Icon name="pause" size={18} /> Pausar</button>
                      : <button className="btn primary" onClick={speech.resume}><Icon name="play" size={18} /> Continuar</button>}
                    <button className="btn ghost" onClick={speech.stop}><Icon name="stop" size={18} /> Parar</button>
                  </>
                )}
                <div className="rate" role="group" aria-label="Velocidade da voz">
                  {RATES.map((r) => (
                    <button key={r} className={r === rate ? 'on' : ''} onClick={() => changeRate(r)}>{r === 1 ? '1×' : `${r}×`}</button>
                  ))}
                </div>
              </div>
              {!speech.hasPtVoice ? <p className="muted small">Seu aparelho não tem uma voz em português instalada. Instale uma nas configurações de voz do sistema para ouvir.</p> : null}
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
