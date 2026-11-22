import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../app/AppContext';
import { TRANSLATIONS, downloadAll } from '../data/bible';
import { exportBackup, importBackup, resetAll, setSetting, validateBackup, type StartArea, type Theme } from '../db/db';
import { toDateStr } from '../lib/date';
import { useInstall } from '../lib/install';
import { Confirm, PageHeader, Segmented } from '../components/ui';

export default function More() {
  const { settings, toast } = useApp();
  const nav = useNavigate();
  const [dl, setDl] = useState<null | { done: number; total: number }>(null);
  const [dlError, setDlError] = useState(false);
  const [dlg, setDlg] = useState<null | 'reset' | { backup: Awaited<ReturnType<typeof exportBackup>> }>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inst = useInstall();
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);


  const doExport = async () => {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lampada-backup-${toDateStr()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    await setSetting('lastBackupAt', Date.now());
    toast('Backup salvo. Guarde o arquivo em local seguro.');
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const parsed: unknown = JSON.parse(await f.text());
      if (!validateBackup(parsed)) { toast('Arquivo inválido: não é um backup do Lâmpada.'); return; }
      setDlg({ backup: parsed });
    } catch {
      toast('Não foi possível ler o arquivo.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const download = async () => {
    setDlError(false);
    setDl({ done: 0, total: 66 });
    try {
      await downloadAll(settings.translation, (done, total) => setDl({ done, total }));
      toast('Pronto! A tradução está disponível offline.');
    } catch {
      setDlError(true);
    } finally {
      setDl(null);
    }
  };

  const persist = async () => {
    const ok = await navigator.storage?.persist?.();
    setPersisted(!!ok);
    toast(ok ? 'Armazenamento protegido.' : 'O navegador não concedeu proteção extra. Instale o app e faça backups.');
  };

  return (
    <>
      <PageHeader title="Mais" />
      <main className="page">
        <section className="card">
          <h2 className="card-title">Leitura</h2>
          <div className="field">
            <span>Tradução</span>
            {TRANSLATIONS.map((t) => (
              <label key={t.id} className="radio">
                <input type="radio" name="tr" checked={settings.translation === t.id} onChange={() => void setSetting('translation', t.id)} />
                <span><strong>{t.short}</strong> — {t.name}<br /><small className="muted">{t.note}</small></span>
              </label>
            ))}
          </div>
          <div className="field">
            <span>Tamanho da letra: {settings.fontSize}px</span>
            <input id="font-size" aria-label="Tamanho da letra" type="range" min={14} max={32} value={settings.fontSize} onChange={(e) => void setSetting('fontSize', Number(e.target.value))} />
            <p className="verse-preview" style={{ fontSize: settings.fontSize }}>No princípio, criou Deus o céu e a terra.</p>
          </div>
          <div className="field">
            <span>Tema</span>
            <Segmented<Theme> value={settings.theme} onChange={(v) => void setSetting('theme', v)}
              options={[{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'sepia', label: 'Sépia' }]} />
          </div>
          <label className="check">
            <input type="checkbox" checked={settings.autoMark} onChange={(e) => void setSetting('autoMark', e.target.checked)} />
            <span>Marcar capítulo como lido ao chegar no final dele</span>
          </label>
          <div className="field">
            <span>Lembrete diário (aviso dentro do app)</span>
            <div className="row gap">
              <input id="reminder-time" aria-label="Horário do lembrete diário" type="time" value={settings.reminderTime} onChange={(e) => void setSetting('reminderTime', e.target.value)} />
              {settings.reminderTime ? <button className="btn ghost small" onClick={() => void setSetting('reminderTime', '')}>Desligar</button> : null}
            </div>
            <small className="muted">Mostra um aviso na tela inicial se você ainda não leu depois desse horário.</small>
          </div>
          <div className="field">
            <span>Meta de leitura: {settings.weeklyGoal} {settings.weeklyGoal === 1 ? 'dia' : 'dias'} por semana</span>
            <input id="weekly-goal" aria-label="Meta de dias de leitura por semana" type="range" min={1} max={7} value={settings.weeklyGoal} onChange={(e) => void setSetting('weeklyGoal', Number(e.target.value))} />
          </div>
          <div className="field">
            <span>Ao abrir o app</span>
            <Segmented<StartArea> value={settings.startArea} onChange={(v) => void setSetting('startArea', v)}
              options={[{ value: 'ask', label: 'Perguntar' }, { value: 'igreja', label: 'Igreja' }, { value: 'estudos', label: 'Estudos' }, { value: 'devocional', label: 'Devocional' }]} />
            <small className="muted">“Início” na barra da Igreja sempre volta para a tela de escolha.</small>
          </div>
          <button className="btn ghost" onClick={() => void setSetting('onboarded', false).then(() => nav('/'))}>Rever o guia inicial</button>
        </section>

        <section className="card">
          <h2 className="card-title">Meu conteúdo</h2>
          <Link to="/salvos" className="btn ghost">❤ Favoritos, destaques e notas</Link>
        </section>

        <section className="card">
          <h2 className="card-title">Uso offline</h2>
          <p className="muted small">O texto lido é guardado automaticamente. Baixe tudo para ler sem internet.</p>
          <button className="btn ghost" disabled={!!dl} onClick={() => void download()}>
            {dl ? `Baixando… ${Math.round((dl.done / dl.total) * 100)}%` : `Baixar ${TRANSLATIONS.find((t) => t.id === settings.translation)!.short} para offline`}
          </button>
          {dlError ? <p className="alert">Falha no download. Verifique a conexão e tente de novo.</p> : null}
          {!inst.standalone ? (
            inst.canPrompt ? (
              <button className="btn primary" onClick={() => void inst.install()}>Instalar o app</button>
            ) : inst.ios ? (
              <p className="muted small">No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”. Instalado, o app guarda seus dados com mais segurança.</p>
            ) : null
          ) : <p className="muted small">✓ App instalado.</p>}
        </section>

        <section className="card">
          <h2 className="card-title">Backup</h2>
          <p className="muted small">Seu progresso, favoritos e notas ficam <strong>somente neste aparelho</strong>. Se limpar os dados do navegador ou trocar de celular, você os perde — a menos que tenha um backup.</p>
          <p className="muted small">Último backup: {settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleDateString('pt-BR') : 'nunca'}</p>
          <div className="row gap wrap">
            <button className="btn primary grow" onClick={() => void doExport()}>Exportar backup</button>
            <button className="btn ghost grow" onClick={() => fileRef.current?.click()}>Importar backup</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>
          {persisted === false ? <button className="btn ghost small" onClick={() => void persist()}>Proteger armazenamento do navegador</button> : null}
        </section>

        <section className="card">
          <h2 className="card-title">Sobre</h2>
          <Link to="/sobre" className="btn ghost">Licenças e créditos</Link>
          <button className="btn danger ghost" onClick={() => setDlg('reset')}>Apagar todos os meus dados</button>
        </section>
      </main>

      <Confirm
        open={dlg === 'reset'} title="Apagar tudo?"
        text="Progresso, plano, favoritos, notas e ajustes serão removidos deste aparelho. Não dá para desfazer (a menos que você tenha um backup)."
        confirmLabel="Apagar tudo" danger onNo={() => setDlg(null)}
        onYes={async () => { setDlg(null); await resetAll(); toast('Dados apagados.'); }}
      />
      <Confirm
        open={typeof dlg === 'object' && dlg !== null} title="Importar backup?"
        text="Os dados atuais deste aparelho serão substituídos pelos do arquivo."
        confirmLabel="Importar" danger onNo={() => setDlg(null)}
        onYes={async () => {
          const d = dlg;
          setDlg(null);
          if (d && typeof d === 'object') {
            const { skipped } = await importBackup(d.backup);
            toast(skipped > 0 ? `Backup restaurado. ${skipped} item(ns) inválido(s) foram ignorados.` : 'Backup restaurado.');
          }
        }}
      />
    </>
  );
}
