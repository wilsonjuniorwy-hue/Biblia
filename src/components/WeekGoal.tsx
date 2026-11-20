import { useApp } from '../app/AppContext';
import { weekProgress } from '../lib/stats';
import { ProgressBar } from './ui';

const DAY_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // segunda a domingo
const DAY_NAMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

/** Meta de dias de leitura por semana, com um ponto para cada dia. */
export function WeekGoal() {
  const { settings, readDates, today } = useApp();
  const { days, flags, weekStart } = weekProgress(readDates, today);
  const goal = settings.weeklyGoal;
  const done = days >= goal;
  return (
    <section className="card" aria-label="Meta da semana">
      <div className="row between">
        <h2 className="card-title">Meta da semana</h2>
        <span className={done ? 'badge ok' : 'muted'}>{done ? '✓ Meta batida' : `${days} de ${goal} ${goal === 1 ? 'dia' : 'dias'}`}</span>
      </div>
      <ProgressBar value={Math.min(1, days / goal)} label={`Meta da semana: ${days} de ${goal} dias de leitura`} />
      <ol className="week-dots" aria-label="Dias lidos nesta semana">
        {flags.map((f, i) => {
          const date = new Date(weekStart + 'T00:00:00');
          date.setDate(date.getDate() + i);
          const isToday = date.toDateString() === new Date(today + 'T00:00:00').toDateString();
          return (
            <li key={i} className={`${f ? 'on' : ''} ${isToday ? 'today' : ''}`} aria-label={`${DAY_NAMES[i]}${f ? ': leu' : ': não leu'}${isToday ? ' (hoje)' : ''}`}>
              {f ? '✓' : DAY_LETTERS[i]}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
