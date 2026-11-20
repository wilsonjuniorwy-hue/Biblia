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
