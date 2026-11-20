import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { TRANSLATIONS, loadBook, type TranslationId } from '../data/bible';
import { PLAN_INFO, type PlanType } from '../data/plans';
import { setSetting } from '../db/db';
import { Sheet } from './ui';

const PLAN_CHOICES: PlanType[] = ['misto', 'sequencial', 'cronologico'];

/** Primeiro uso: escolher tradução, tamanho da letra e (se quiser) um plano. Tudo pode ser pulado e mudado depois. */
export function Onboarding() {
  const { settings, today } = useApp();
  const [step, setStep] = useState(0);
  const [samples, setSamples] = useState<Partial<Record<TranslationId, string>>>({});
  const [plan, setPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    let alive = true;
    for (const t of TRANSLATIONS) {
      loadBook(t.id, 18).then((b) => { if (alive) setSamples((s) => ({ ...s, [t.id]: b[22]?.[0] ?? '' })); }).catch(() => undefined);
    }
    return () => { alive = false; };
  }, []);

  const finish = async (withPlan: boolean) => {
    if (withPlan && plan) await setSetting('plan', { type: plan, days: 365, startDate: today, excluded: [] });
    await setSetting('onboarded', true);
  };
  const last = step === 2;

  return (
    <Sheet open onClose={() => void finish(false)} title={['Qual tradução você prefere?', 'Tamanho da letra', 'Quer um plano de leitura?'][step]}>
      <div className="onboarding">
        <p className="muted small">Passo {step + 1} de 3 · você pode mudar tudo depois em Mais.</p>

        {step === 0 ? (
          <div className="plan-options">
            {TRANSLATIONS.map((t) => (
              <button key={t.id} className={`plan-card ${settings.translation === t.id ? 'on' : ''}`} aria-pressed={settings.translation === t.id} onClick={() => void setSetting('translation', t.id)}>
                <strong>{t.short} · {t.name}</strong>
                <span className="muted small">{t.note}</span>
                <span className="sample">“{samples[t.id] ?? '…'}”</span>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="field">
            <div className="row gap">
              <button className="btn ghost" aria-label="Diminuir a letra" onClick={() => void setSetting('fontSize', Math.max(14, settings.fontSize - 1))}>A−</button>
              <input aria-label="Tamanho da letra" className="grow" type="range" min={14} max={32} value={settings.fontSize} onChange={(e) => void setSetting('fontSize', Number(e.target.value))} />
              <button className="btn ghost" aria-label="Aumentar a letra" onClick={() => void setSetting('fontSize', Math.min(32, settings.fontSize + 1))}>A+</button>
            </div>
            <p className="verse-preview" style={{ fontSize: settings.fontSize }}>{samples[settings.translation] ?? 'O Senhor é o meu pastor; nada me faltará.'}</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="plan-options">
            {PLAN_CHOICES.map((t) => (
              <button key={t} className={`plan-card ${plan === t ? 'on' : ''}`} aria-pressed={plan === t} onClick={() => setPlan(plan === t ? null : t)}>
                <strong>{PLAN_INFO[t].name}</strong>
                <span className="small">{PLAN_INFO[t].short}</span>
              </button>
            ))}
            <p className="muted small">A Bíblia inteira em 1 ano. Começa hoje; dá para trocar ou ajustar a duração na aba Plano.</p>
          </div>
        ) : null}

        <div className="row gap">
          {step > 0 ? <button className="btn ghost" onClick={() => setStep(step - 1)}>Voltar</button> : <button className="btn ghost" onClick={() => void finish(false)}>Pular</button>}
          <span className="grow" />
          {last ? (
            <button className="btn primary" onClick={() => void finish(true)}>{plan ? 'Começar' : 'Concluir'}</button>
          ) : (
            <button className="btn primary" onClick={() => setStep(step + 1)}>Próximo</button>
          )}
        </div>
        {step > 0 ? <button className="btn ghost small" onClick={() => void finish(false)}>Pular o resto</button> : null}
      </div>
    </Sheet>
  );
}
