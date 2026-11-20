import { describe, expect, it } from 'vitest';
import { nextService, upcomingEvents, weekdayOf, whenLabel } from './church';
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
