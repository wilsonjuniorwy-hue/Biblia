import type { EventRow } from '../db/db';
import { addDays, weekdayOf } from './date';
export { weekdayOf };

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface Occurrence { event: EventRow; date: string; offset: number }

/**
 * Próxima data do evento a partir de agora, ou null se já passou.
 * - Evento único: vale hoje até o horário (sem horário, vale o dia todo).
 * - Evento semanal: a próxima data com o mesmo dia da semana do cadastro.
 */
export function nextOccurrence(ev: EventRow, today: string, nowHM: string): string | null {
  const over = (date: string) => date === today && ev.time !== '' && ev.time <= nowHM;
  if (!ev.weekly) {
    if (ev.date < today || over(ev.date)) return null;
    return ev.date;
  }
  const wd = weekdayOf(ev.date);
  let d = ev.date > today ? ev.date : today;
  while (weekdayOf(d) !== wd) d = addDays(d, 1);
  return over(d) ? addDays(d, 7) : d;
}

const byWhen = (a: Occurrence, b: Occurrence) => a.date.localeCompare(b.date) || (a.event.time || '99:99').localeCompare(b.event.time || '99:99') || a.event.title.localeCompare(b.event.title);

/** Eventos que ainda vão acontecer, do mais próximo para o mais distante. */
export function upcomingOccurrences(events: EventRow[], today: string, nowHM: string): Occurrence[] {
  const out: Occurrence[] = [];
  for (const event of events) {
    const date = nextOccurrence(event, today, nowHM);
    if (date) out.push({ event, date, offset: 0 });
  }
  out.sort(byWhen);
  return out.map((o) => ({ ...o, offset: dayOffset(today, o.date) }));
}

/** Eventos únicos que já passaram, do mais recente para o mais antigo. */
export function pastEvents(events: EventRow[], today: string, nowHM: string): EventRow[] {
  return events
    .filter((e) => !e.weekly && nextOccurrence(e, today, nowHM) === null)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || ''));
}

function dayOffset(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function whenLabel(offset: number, date: string): string {
  if (offset === 0) return 'hoje';
  if (offset === 1) return 'amanhã';
  return WEEKDAYS[weekdayOf(date)].toLowerCase();
}

/** Minutos de agora até o início (horário local). */
export function minutesUntil(date: string, time: string, now: Date): number {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return Math.ceil((new Date(y, m - 1, d, h, mi).getTime() - now.getTime()) / 60000);
}

export function formatCountdown(min: number): string {
  if (min <= 0) return 'agora';
  if (min < 60) return `em ${min} min`;
  if (min < 24 * 60) {
    const h = Math.floor(min / 60);
    const r = min % 60;
    return r ? `em ${h} h ${r} min` : `em ${h} h`;
  }
  const days = Math.floor(min / 1440);
  return `em ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

const icsEscape = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const fold = (line: string) => (line.length <= 73 ? line : (line.match(/.{1,73}/g) as string[]).join('\r\n '));
const pad = (n: number) => String(n).padStart(2, '0');

/** Arquivo .ics (calendário) do evento. Com horário: 2 h; sem horário: dia inteiro; semanal: repete toda semana. */
export function makeIcs(ev: EventRow, now: Date = new Date()): string {
  const d = ev.date.replace(/-/g, '');
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lampada//Agenda//PT-BR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${ev.id}@lampada`, `DTSTAMP:${stamp}`];
  if (ev.time) {
    const [h, m] = ev.time.split(':').map(Number);
    const endH = h + 2;
    // até as 23:59 do mesmo dia, para não virar o dia no calendário
    const end = endH >= 24 ? '235900' : `${pad(endH)}${pad(m)}00`;
    lines.push(`DTSTART:${d}T${pad(h)}${pad(m)}00`, `DTEND:${d}T${end}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDays(ev.date, 1).replace(/-/g, '')}`);
  }
  if (ev.weekly) lines.push('RRULE:FREQ=WEEKLY');
  lines.push(`SUMMARY:${icsEscape(ev.title)}`);
  if (ev.place) lines.push(`LOCATION:${icsEscape(ev.place)}`);
  if (ev.notes) lines.push(`DESCRIPTION:${icsEscape(ev.notes)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
