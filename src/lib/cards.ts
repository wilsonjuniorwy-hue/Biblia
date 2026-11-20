/** Imagens para compartilhar (versículo e progresso), desenhadas em canvas, com modelos de cor. */

export type Template = 'amanhecer' | 'noite' | 'pergaminho' | 'claro';

interface Look { bg: [string, string]; glow: string | null; text: string; accent: string; sub: string }

export const TEMPLATES: { id: Template; name: string; swatch: string }[] = [
  { id: 'amanhecer', name: 'Amanhecer', swatch: 'linear-gradient(135deg,#14213d,#1f3a68)' },
  { id: 'noite', name: 'Noite', swatch: 'linear-gradient(135deg,#0b0f1a,#161d33)' },
  { id: 'pergaminho', name: 'Pergaminho', swatch: 'linear-gradient(135deg,#f1e6cc,#e2cf9f)' },
  { id: 'claro', name: 'Claro', swatch: 'linear-gradient(135deg,#ffffff,#efe9da)' },
];

const LOOKS: Record<Template, Look> = {
  amanhecer: { bg: ['#14213d', '#1f3a68'], glow: 'rgba(252,163,17,.35)', text: '#f5ecd7', accent: '#fca311', sub: 'rgba(245,236,215,.65)' },
  noite: { bg: ['#0b0f1a', '#161d33'], glow: 'rgba(217,178,95,.18)', text: '#ece8dc', accent: '#d9b25f', sub: 'rgba(236,232,220,.55)' },
  pergaminho: { bg: ['#f1e6cc', '#e2cf9f'], glow: null, text: '#3b2f1c', accent: '#8f5200', sub: 'rgba(59,47,28,.65)' },
  claro: { bg: ['#ffffff', '#efe9da'], glow: null, text: '#1d2433', accent: '#9a5600', sub: 'rgba(29,36,51,.6)' },
};

const S = 1080;
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function newCanvas(tpl: Template): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; look: Look } {
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas indisponível');
  const look = LOOKS[tpl];
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, look.bg[0]); g.addColorStop(1, look.bg[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  if (look.glow) {
    const r = ctx.createRadialGradient(S / 2, 150, 10, S / 2, 150, 430);
    r.addColorStop(0, look.glow); r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, S, S);
  }
  // chama da lâmpada
  ctx.fillStyle = look.accent;
  ctx.beginPath(); ctx.ellipse(S / 2, 130, 24, 36, 0, 0, Math.PI * 2); ctx.fill();
  return { canvas, ctx, look };
}

function footer(ctx: CanvasRenderingContext2D, look: Look) {
  const host = typeof location !== 'undefined' ? location.host : '';
  ctx.textAlign = 'center';
  ctx.font = `28px ${SANS}`;
  ctx.fillStyle = look.sub;
  ctx.fillText(host ? `Lâmpada · ${host}` : 'Lâmpada · Bíblia', S / 2, 1000);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawVerseCard(tpl: Template, text: string, ref: string): HTMLCanvasElement {
  const { canvas, ctx, look } = newCanvas(tpl);
  const maxW = S - 220;
  const maxH = 560;
  let size = 64;
  let lines: string[] = [];
  for (; size >= 26; size -= 2) {
    ctx.font = `italic ${size}px ${SERIF}`;
    lines = wrap(ctx, `“${text}”`, maxW);
    if (lines.length * size * 1.35 <= maxH) break;
  }
  const lh = size * 1.35;
  const startY = 520 - (lines.length * lh) / 2 + size / 2;
  ctx.fillStyle = look.text;
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, S / 2, startY + i * lh));
  ctx.font = `bold 42px ${SANS}`;
  ctx.fillStyle = look.accent;
  ctx.fillText(ref, S / 2, 900);
  footer(ctx, look);
  return canvas;
}

export interface ProgressCard { pct: number; read: number; total: number; streak: number; books: number }

export function drawProgressCard(tpl: Template, d: ProgressCard): HTMLCanvasElement {
  const { canvas, ctx, look } = newCanvas(tpl);
  const cx = S / 2, cy = 500, r = 230;
  ctx.lineWidth = 46; ctx.lineCap = 'round';
  ctx.strokeStyle = look.sub; ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1; ctx.strokeStyle = look.accent;
  if (d.pct > 0) { ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, d.pct)); ctx.stroke(); }
  ctx.textAlign = 'center';
  ctx.fillStyle = look.text;
  ctx.font = `bold 150px ${SERIF}`;
  ctx.fillText(`${Math.floor(d.pct * 100)}%`, cx, cy + 40);
  ctx.font = `34px ${SANS}`; ctx.fillStyle = look.sub;
  ctx.fillText('da Bíblia lida', cx, cy + 100);
  ctx.font = `bold 44px ${SANS}`; ctx.fillStyle = look.text;
  ctx.fillText(`${d.read} de ${d.total} capítulos · ${d.books}/66 livros`, cx, 850);
  if (d.streak > 0) { ctx.fillStyle = look.accent; ctx.fillText(`${d.streak} ${d.streak === 1 ? 'dia' : 'dias'} seguidos`, cx, 920); }
  footer(ctx, look);
  return canvas;
}

export const canvasToBlob = (c: HTMLCanvasElement): Promise<Blob | null> => new Promise((res) => c.toBlob(res, 'image/png'));

/** Compartilha o arquivo (celular) ou baixa (computador). */
export async function shareBlob(blob: Blob, filename: string): Promise<'shared' | 'saved' | 'failed'> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'shared';
    }
  }
  return download(blob, filename) ? 'saved' : 'failed';
}

export function download(blob: Blob, filename: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch { return false; }
}

export const buzz = (ms = 15) => { try { navigator.vibrate?.(ms); } catch { /* ignora */ } };
