const pad = (n: number) => String(n).padStart(2, '0');

/** Data local no formato AAAA-MM-DD. */
export function toDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const todayStr = () => toDateStr(new Date());

function parts(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number);
  return [y, m, d];
}
/** Soma dias a uma data AAAA-MM-DD (aritmética UTC: imune a horário de verão). */
export function addDays(s: string, n: number): string {
  const [y, m, d] = parts(s);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
/** Dias inteiros de a até b (b - a). */
export function diffDays(a: string, b: string): number {
  const [ya, ma, da] = parts(a);
  const [yb, mb, db] = parts(b);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}
export function formatDate(s: string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }): string {
  const [y, m, d] = parts(s);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', opts);
}
export function dayOfYear(s: string): number {
  const [y] = parts(s);
  return diffDays(`${y}-01-01`, s);
}

/** Dia da semana de uma data AAAA-MM-DD: 0 = domingo … 6 = sábado. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
