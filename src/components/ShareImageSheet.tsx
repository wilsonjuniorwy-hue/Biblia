import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { TEMPLATES, canvasToBlob, download, drawProgressCard, drawVerseCard, shareBlob, type ProgressCard, type Template } from '../lib/cards';
import { Icon } from './icons';
import { Sheet } from './ui';

export type CardSpec = { kind: 'verse'; text: string; ref: string } | { kind: 'progress'; data: ProgressCard };

const KEY = 'cardTemplate';
const loadTpl = (): Template => {
  try { const v = localStorage.getItem(KEY); return TEMPLATES.some((t) => t.id === v) ? (v as Template) : 'amanhecer'; } catch { return 'amanhecer'; }
};

/** Janela de pré-visualização com escolha de modelo, para compartilhar ou baixar a imagem. */
export function ShareImageSheet({ open, onClose, spec }: { open: boolean; onClose: () => void; spec: CardSpec | null }) {
  const { toast } = useApp();
  const [tpl, setTpl] = useState<Template>(loadTpl);
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!open || !spec) return;
    let alive = true;
    try {
      const canvas = spec.kind === 'verse' ? drawVerseCard(tpl, spec.text, spec.ref) : drawProgressCard(tpl, spec.data);
      setUrl(canvas.toDataURL('image/png'));
      void canvasToBlob(canvas).then((b) => { if (alive) setBlob(b); });
    } catch {
      setUrl(null); setBlob(null);
    }
    return () => { alive = false; };
  }, [open, spec, tpl]);

  const pick = (t: Template) => { setTpl(t); try { localStorage.setItem(KEY, t); } catch { /* ignora */ } };
  const name = spec?.kind === 'progress' ? 'progresso.png' : 'versiculo.png';

  return (
    <Sheet open={open} onClose={onClose} title="Compartilhar como imagem">
      <div className="card-preview">
        {url ? <img src={url} alt="Pré-visualização da imagem" /> : <p className="muted center pad">Não foi possível gerar a imagem neste aparelho.</p>}
      </div>
      <div className="tpl-row" role="group" aria-label="Modelo">
        {TEMPLATES.map((t) => (
          <button key={t.id} className={`tpl ${t.id === tpl ? 'on' : ''}`} aria-pressed={t.id === tpl} onClick={() => pick(t.id)}>
            <span className="tpl-swatch" style={{ background: t.swatch }} aria-hidden />
            <span>{t.name}</span>
          </button>
        ))}
      </div>
      <div className="row gap">
        <button className="btn primary grow" disabled={!blob} onClick={async () => {
          if (!blob) return;
          const r = await shareBlob(blob, name);
          if (r === 'saved') toast('Imagem salva');
          if (r === 'failed') toast('Não foi possível compartilhar');
        }}><span className="row gap"><Icon name="share" size={18} /> Compartilhar</span></button>
        <button className="btn ghost grow" disabled={!blob} onClick={() => { if (blob) toast(download(blob, name) ? 'Imagem salva' : 'Não foi possível salvar'); }}>
          <span className="row gap"><Icon name="download" size={18} /> Baixar</span>
        </button>
      </div>
    </Sheet>
  );
}
