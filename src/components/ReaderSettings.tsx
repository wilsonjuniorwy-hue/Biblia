import { useApp } from '../app/AppContext';
import { setSetting, type LineHeight, type ReaderFont, type TextWidth, type Theme } from '../db/db';
import { Segmented, Sheet } from './ui';

export const LINE_HEIGHT: Record<LineHeight, number> = { compact: 1.5, normal: 1.7, wide: 1.95 };
export const TEXT_WIDTH: Record<TextWidth, number> = { narrow: 540, normal: 640, wide: 780 };

/** Janela "Aparência": tudo que muda como o texto é mostrado no leitor. */
export function ReaderSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useApp();
  return (
    <Sheet open={open} onClose={onClose} title="Aparência do texto">
      <div className="field">
        <span>Tamanho da letra: {settings.fontSize}px</span>
        <div className="row gap">
          <button className="btn ghost" aria-label="Diminuir a letra" onClick={() => void setSetting('fontSize', Math.max(14, settings.fontSize - 1))}>A−</button>
          <input id="rs-size" aria-label="Tamanho da letra" className="grow" type="range" min={14} max={32} value={settings.fontSize} onChange={(e) => void setSetting('fontSize', Number(e.target.value))} />
          <button className="btn ghost" aria-label="Aumentar a letra" onClick={() => void setSetting('fontSize', Math.min(32, settings.fontSize + 1))}>A+</button>
        </div>
      </div>
      <div className="field">
        <span>Tipo de letra</span>
        <Segmented<ReaderFont> value={settings.readerFont} onChange={(v) => void setSetting('readerFont', v)} options={[{ value: 'serif', label: 'Com serifa' }, { value: 'sans', label: 'Sem serifa' }]} />
      </div>
      <div className="field">
        <span>Espaço entre linhas</span>
        <Segmented<LineHeight> value={settings.lineHeight} onChange={(v) => void setSetting('lineHeight', v)} options={[{ value: 'compact', label: 'Junto' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Folgado' }]} />
      </div>
      <div className="field">
        <span>Largura do texto (telas grandes)</span>
        <Segmented<TextWidth> value={settings.textWidth} onChange={(v) => void setSetting('textWidth', v)} options={[{ value: 'narrow', label: 'Estreita' }, { value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Larga' }]} />
      </div>
      <div className="field">
        <span>Tema</span>
        <Segmented<Theme> value={settings.theme} onChange={(v) => void setSetting('theme', v)} options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'sepia', label: 'Sépia' }]} />
      </div>
      <label className="check">
        <input type="checkbox" checked={settings.compare} onChange={(e) => void setSetting('compare', e.target.checked)} />
        <span>Comparar as duas traduções, verso a verso</span>
      </label>
      <button className="btn primary" onClick={onClose}>Pronto</button>
    </Sheet>
  );
}
