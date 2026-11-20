import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { deleteEvent, newEventId, saveEvent, type EventRow } from '../db/db';
import { isValidDateStr } from '../lib/sanitize';
import { Sheet } from './ui';

const SUGGESTIONS = ['Culto', 'Célula', 'Escola Bíblica', 'Ensaio', 'Oração', 'Reunião'];
const TIME_OK = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Cadastro e edição de um evento da agenda (tudo fica só neste aparelho). */
export function EventSheet({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: EventRow | null }) {
  const { today, toast } = useApp();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [weekly, setWeekly] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Preenche o formulário toda vez que a janela abre
  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDate(initial?.date ?? today);
    setTime(initial?.time ?? '');
    setPlace(initial?.place ?? '');
    setNotes(initial?.notes ?? '');
    setWeekly(initial?.weekly === 1);
    setError('');
    setConfirming(false);
  }, [open, initial, today]);

  // Corrigiu o campo: a mensagem de erro some
  useEffect(() => { setError(''); }, [title, date, time]);

  const save = async () => {
    if (!title.trim()) { setError('Dê um nome ao evento.'); return; }
    if (!isValidDateStr(date)) { setError('Escolha uma data válida.'); return; }
    if (time && !TIME_OK.test(time)) { setError('Horário inválido.'); return; }
    await saveEvent({
      id: initial?.id ?? newEventId(), title, date, time, place, notes,
      weekly: weekly ? 1 : 0, createdAt: initial?.createdAt ?? Date.now(),
    });
    toast(initial ? 'Evento atualizado.' : 'Evento salvo.');
    onClose();
  };

  const remove = async () => {
    if (!initial) return;
    await deleteEvent(initial.id);
    toast('Evento excluído.');
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={confirming ? 'Excluir este evento?' : initial ? 'Editar evento' : 'Novo evento'}>
      {confirming ? (
        <>
          <p className="muted">“{initial?.title}” será removido da sua agenda. Isso não pode ser desfeito.</p>
          <div className="row gap">
            <button className="btn ghost grow" onClick={() => setConfirming(false)}>Cancelar</button>
            <button className="btn danger grow" onClick={() => void remove()}>Excluir</button>
          </div>
        </>
      ) : (
        <form className="event-form" onSubmit={(e) => { e.preventDefault(); void save(); }} noValidate>
          <label className="field">
            <span>Nome do evento</span>
            <input id="ev-title" type="text" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Culto de domingo" autoComplete="off" />
          </label>
          {!initial ? (
            <div className="row gap wrap" aria-label="Sugestões de nome">
              {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => setTitle(s)}>{s}</button>)}
            </div>
          ) : null}
          <div className="row gap">
            <label className="field grow">
              <span>Data</span>
              <input id="ev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field grow">
              <span>Horário (opcional)</span>
              <input id="ev-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
          </div>
          <label className="check">
            <input id="ev-weekly" type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} />
            <span>Repetir toda semana (no mesmo dia da semana)</span>
          </label>
          <label className="field">
            <span>Local (opcional)</span>
            <input id="ev-place" type="text" value={place} maxLength={120} onChange={(e) => setPlace(e.target.value)} placeholder="Ex.: Templo, casa do João" autoComplete="off" />
          </label>
          <label className="field">
            <span>Anotações (opcional)</span>
            <textarea id="ev-notes" rows={3} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} placeholder="Tema, o que levar, quem convidar…" />
          </label>
          {error ? <p className="alert" role="alert">{error}</p> : null}
          <div className="row gap">
            {initial ? <button type="button" className="btn ghost danger" onClick={() => setConfirming(true)}>Excluir</button> : null}
            <span className="grow" />
            <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn primary">Salvar</button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
