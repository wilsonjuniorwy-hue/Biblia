import { describe, expect, it } from 'vitest';
import { formatCountdown, makeIcs, minutesUntil, nextOccurrence, pastEvents, upcomingOccurrences, weekdayOf, whenLabel } from './church';
import type { EventRow } from '../db/db';

const ev = (o: Partial<EventRow> = {}): EventRow => ({ id: 'e1', title: 'Culto', date: '2026-11-22', time: '19:00', place: '', notes: '', weekly: 0, createdAt: 1, ...o });

describe('agenda: próxima ocorrência', () => {
  it('dia da semana', () => {
    expect(weekdayOf('2026-11-20')).toBe(5); // sexta
    expect(weekdayOf('2026-11-22')).toBe(0); // domingo
  });
  it('evento único: hoje vale até o horário', () => {
    expect(nextOccurrence(ev(), '2026-11-22', '18:59')).toBe('2026-11-22');
    expect(nextOccurrence(ev(), '2026-11-22', '19:00')).toBeNull();   // já começou
    expect(nextOccurrence(ev(), '2026-11-21', '23:59')).toBe('2026-11-22');
    expect(nextOccurrence(ev(), '2026-11-23', '08:00')).toBeNull();
  });
  it('evento único sem horário vale o dia inteiro', () => {
    const e = ev({ time: '' });
    expect(nextOccurrence(e, '2026-11-22', '23:59')).toBe('2026-11-22');
    expect(nextOccurrence(e, '2026-11-23', '00:00')).toBeNull();
  });
  it('evento semanal: próxima data com o mesmo dia da semana', () => {
    const w = ev({ weekly: 1 });                                       // domingos, 19:00
    expect(nextOccurrence(w, '2026-11-20', '10:00')).toBe('2026-11-22'); // sexta -> domingo
    expect(nextOccurrence(w, '2026-11-22', '18:00')).toBe('2026-11-22'); // domingo antes do horário
    expect(nextOccurrence(w, '2026-11-22', '19:00')).toBe('2026-11-29'); // já começou -> próximo domingo
    expect(nextOccurrence(w, '2026-11-23', '10:00')).toBe('2026-11-29');
  });
  it('evento semanal ainda não começou: usa a 1ª data', () => {
    expect(nextOccurrence(ev({ weekly: 1, date: '2026-12-06' }), '2026-11-20', '10:00')).toBe('2026-12-06');
  });
  it('lista de próximos em ordem, e passados do mais recente ao mais antigo', () => {
    const list = [
      ev({ id: 'a', title: 'A', date: '2026-12-20', time: '19:00' }),
      ev({ id: 'b', title: 'B', date: '2026-11-22', time: '09:00' }),
      ev({ id: 'c', title: 'Semanal', date: '2026-11-04', time: '19:30', weekly: 1 }), // quartas
      ev({ id: 'd', title: 'Velho', date: '2026-10-01' }),
      ev({ id: 'e', title: 'Mais velho', date: '2026-09-01' }),
    ];
    const up = upcomingOccurrences(list, '2026-11-20', '10:00');
    expect(up.map((o) => o.event.id)).toEqual(['b', 'c', 'a']);       // 22/11, quarta 25/11, 20/12
    expect(up.map((o) => o.date)).toEqual(['2026-11-22', '2026-11-25', '2026-12-20']);
    expect(up[0].offset).toBe(2);
    expect(pastEvents(list, '2026-11-20', '10:00').map((e) => e.id)).toEqual(['d', 'e']);
  });
  it('rótulos', () => {
    expect(whenLabel(0, '2026-11-22')).toBe('hoje');
    expect(whenLabel(1, '2026-11-23')).toBe('amanhã');
    expect(whenLabel(3, '2026-11-25')).toBe('quarta');
  });
});

describe('contagem e calendário', () => {
  it('minutos até o evento', () => {
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
    const ics = makeIcs(ev({ id: 'abc', title: 'Ceia, do Senhor', date: '2026-12-06', place: 'Templo; sala 1', notes: 'Linha 1\nLinha 2' }), new Date(Date.UTC(2026, 10, 20, 12, 0)));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('UID:abc@lampada');
    expect(ics).toContain('DTSTART:20261206T190000');
    expect(ics).toContain('DTEND:20261206T210000');
    expect(ics).toContain('SUMMARY:Ceia\\, do Senhor');
    expect(ics).toContain('LOCATION:Templo\\; sala 1');
    expect(ics).toContain('Linha 1\\nLinha 2');
    expect(ics).toContain('DTSTAMP:20261120T120000Z');
    expect(ics).not.toContain('RRULE');
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
  it('semanal repete; sem horário vira dia inteiro; 23h não passa da meia-noite', () => {
    expect(makeIcs(ev({ weekly: 1 }))).toContain('RRULE:FREQ=WEEKLY');
    const all = makeIcs(ev({ time: '', date: '2026-12-31' }));
    expect(all).toContain('DTSTART;VALUE=DATE:20261231');
    expect(all).toContain('DTEND;VALUE=DATE:20270101');
    const late = makeIcs(ev({ time: '23:00', date: '2026-12-31' }));
    expect(late).toContain('DTSTART:20261231T230000');
    expect(late).toContain('DTEND:20261231T235900');
    expect(makeIcs(ev({ place: '', notes: '' }))).not.toContain('LOCATION');
  });
});
