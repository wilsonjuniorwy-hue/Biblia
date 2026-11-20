import type { ChurchEvent, ServiceItem } from '../data/church';
import { addDays, weekdayOf } from './date';
export { weekdayOf };

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface NextService { date: string; offset: number; item: ServiceItem }

/** Próxima reunião a partir de agora (hoje conta se o horário ainda não passou). */
export function nextService(schedule: ServiceItem[], today: string, nowHM: string): NextService | null {
  let best: NextService | null = null;
  for (let offset = 0; offset <= 7; offset++) {
    const date = addDays(today, offset);
    const wd = weekdayOf(date);
    const items = schedule.filter((s) => s.day === wd && (offset > 0 || s.time > nowHM)).sort((a, b) => a.time.localeCompare(b.time));
    if (items.length) { best = { date, offset, item: items[0] }; break; }
  }
  return best;
}

/** Eventos de hoje em diante, em ordem de data. */
export function upcomingEvents(events: ChurchEvent[], today: string): ChurchEvent[] {
  return events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
}

export function whenLabel(offset: number, date: string): string {
  if (offset === 0) return 'hoje';
  if (offset === 1) return 'amanhã';
  return WEEKDAYS[weekdayOf(date)].toLowerCase();
}

export const toMinutes = (hm: string): number => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};

/** Reunião acontecendo agora (de `time` até `time + minutes`), ou null. */
export function liveNow(schedule: ServiceItem[], today: string, nowHM: string, minutes: number): ServiceItem | null {
  const wd = weekdayOf(today);
  const now = toMinutes(nowHM);
  return schedule.find((s) => s.day === wd && toMinutes(s.time) <= now && now < toMinutes(s.time) + minutes) ?? null;
}

/** Minutos de agora até o início da reunião (horário local). */
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

/** Arquivo .ics (calendário) de um evento. Com horário: 2 h de duração; sem horário: dia inteiro. */
export function makeIcs(ev: ChurchEvent, church: string, now: Date = new Date()): string {
  const d = ev.date.replace(/-/g, '');
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const slug = ev.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lampada//Igreja//PT-BR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${ev.date}-${slug}@lampada`, `DTSTAMP:${stamp}`];
  if (ev.time) {
    const [h, m] = ev.time.split(':').map(Number);
    const endH = h + 2;
    // até as 23:59 do mesmo dia, para não virar o dia no calendário
    const end = endH >= 24 ? '235900' : `${pad(endH)}${pad(m)}00`;
    lines.push(`DTSTART:${d}T${pad(h)}${pad(m)}00`, `DTEND:${d}T${end}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDays(ev.date, 1).replace(/-/g, '')}`);
  }
  lines.push(`SUMMARY:${icsEscape(ev.title)}`);
  if (ev.place) lines.push(`LOCATION:${icsEscape(`${ev.place} — ${church}`)}`);
  lines.push(`DESCRIPTION:${icsEscape([ev.text, church].filter(Boolean).join('\n'))}`, 'END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
