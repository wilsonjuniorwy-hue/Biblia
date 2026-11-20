import { describe, expect, it } from 'vitest';
import { formatCountdown, liveNow, makeIcs, minutesUntil, nextService, upcomingEvents, weekdayOf, whenLabel } from './church';
import type { ServiceItem } from '../data/church';

const sched: ServiceItem[] = [
  { day: 0, time: '09:00', title: 'EBD' },
  { day: 0, time: '19:00', title: 'Culto' },
  { day: 3, time: '19:30', title: 'Oração' },
];

describe('igreja', () => {
  it('dia da semana', () => {
    expect(weekdayOf('2026-11-20')).toBe(5); // sexta
    expect(weekdayOf('2026-11-22')).toBe(0); // domingo
  });
  it('próximo culto: hoje se ainda não passou', () => {
    const n = nextService(sched, '2026-11-22', '08:00')!; // domingo
    expect(n.offset).toBe(0);
    expect(n.item.title).toBe('EBD');
    expect(nextService(sched, '2026-11-22', '10:00')!.item.title).toBe('Culto');
  });
  it('próximo culto: passa para o próximo dia com reunião', () => {
    const n = nextService(sched, '2026-11-22', '21:00')!; // domingo à noite -> quarta
    expect(n.date).toBe('2026-11-25');
    expect(n.item.title).toBe('Oração');
    expect(whenLabel(n.offset, n.date)).toBe('quarta');
  });
  it('sem agenda', () => expect(nextService([], '2026-11-22', '10:00')).toBeNull());
  it('eventos futuros ordenados, passados somem', () => {
    const ev = upcomingEvents([
      { title: 'c', date: '2026-12-20' }, { title: 'a', date: '2026-11-01' }, { title: 'b', date: '2026-11-22', time: '10:00' },
    ], '2026-11-22');
    expect(ev.map((e) => e.title)).toEqual(['b', 'c']);
  });
  it('rótulos', () => {
    expect(whenLabel(0, '2026-11-22')).toBe('hoje');
    expect(whenLabel(1, '2026-11-23')).toBe('amanhã');
  });
});

describe('ao vivo, contagem e calendário', () => {
  const sc: ServiceItem[] = [{ day: 0, time: '19:00', title: 'Culto' }, { day: 3, time: '19:30', title: 'Oração' }];
  it('ao vivo: só dentro da janela do horário', () => {
    expect(liveNow(sc, '2026-11-22', '18:59', 90)).toBeNull();
    expect(liveNow(sc, '2026-11-22', '19:00', 90)?.title).toBe('Culto');
    expect(liveNow(sc, '2026-11-22', '20:29', 90)?.title).toBe('Culto');
    expect(liveNow(sc, '2026-11-22', '20:30', 90)).toBeNull();
    expect(liveNow(sc, '2026-11-23', '19:30', 90)).toBeNull();
  });
  it('minutos até a reunião', () => {
    const now = new Date(2026, 10, 22, 17, 30);
    expect(minutesUntil('2026-11-22', '19:00', now)).toBe(90);
    expect(minutesUntil('2026-11-22', '17:30', now)).toBe(0);
    expect(minutesUntil('2026-11-23', '17:30', now)).toBe(1440);
  });
  it('texto da contagem', () => {
    expect(formatCountdown(0)).toBe('agora');
    expect(formatCountdown(-5)).toBe('agora');
    expect(formatCountdown(12)).toBe('em 12 min');
    expect(formatCountdown(135)).toBe('em 2 h 15 min');
    expect(formatCountdown(120)).toBe('em 2 h');
    expect(formatCountdown(1440)).toBe('em 1 dia');
    expect(formatCountdown(3 * 1440 + 5)).toBe('em 3 dias');
  });
  it('arquivo .ics válido', () => {
    const ics = makeIcs({ title: 'Ceia, do Senhor', date: '2026-12-06', time: '19:00', place: 'Templo; sala 1', text: 'Linha 1\nLinha 2' }, 'Igreja X', new Date(Date.UTC(2026, 10, 20, 12, 0)));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('DTSTART:20261206T190000');
    expect(ics).toContain('DTEND:20261206T210000');
    expect(ics).toContain('SUMMARY:Ceia\\, do Senhor');
    expect(ics).toContain('LOCATION:Templo\\; sala 1');
    expect(ics).toContain('Linha 1\\nLinha 2');
    expect(ics).toContain('DTSTAMP:20261120T120000Z');
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
  it('evento sem horário vira dia inteiro', () => {
    const ics = makeIcs({ title: 'Retiro', date: '2026-12-31' }, 'Igreja X');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231');
    expect(ics).toContain('DTEND;VALUE=DATE:20270101');
  });
  it('evento às 23h não passa da meia-noite', () => {
    const ics = makeIcs({ title: 'Vigília', date: '2026-12-31', time: '23:00' }, 'Igreja X');
    expect(ics).toContain('DTSTART:20261231T230000');
    expect(ics).toContain('DTEND:20261231T235900');
  });
});
