export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Alternativa para contextos sem a API de área de transferência
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'shared';
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Gera uma imagem 1080×1080 com o versículo e compartilha (ou baixa). */
export async function shareVerseImage(text: string, ref: string): Promise<'shared' | 'saved' | 'failed'> {
  const S = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'failed';

  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, '#14213d'); g.addColorStop(1, '#1f3a68');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  const glow = ctx.createRadialGradient(S / 2, 150, 10, S / 2, 150, 420);
  glow.addColorStop(0, 'rgba(252,163,17,.35)'); glow.addColorStop(1, 'rgba(252,163,17,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, S, S);

  ctx.fillStyle = '#fca311';
  ctx.beginPath(); ctx.ellipse(S / 2, 130, 26, 38, 0, 0, Math.PI * 2); ctx.fill();

  // Escolhe o maior corpo de texto que cabe
  const maxW = S - 220;
  const maxH = 560;
  let size = 64;
  let lines: string[] = [];
  for (; size >= 28; size -= 2) {
    ctx.font = `italic ${size}px Georgia, "Times New Roman", serif`;
    lines = wrap(ctx, `“${text}”`, maxW);
    if (lines.length * size * 1.35 <= maxH) break;
  }
  const lh = size * 1.35;
  const startY = 520 - (lines.length * lh) / 2 + size / 2;
  ctx.fillStyle = '#f5ecd7';
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, S / 2, startY + i * lh));

  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.fillStyle = '#fca311';
  ctx.fillText(ref, S / 2, 900);
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(245,236,215,.6)';
  ctx.fillText('Lâmpada · Bíblia', S / 2, 990);

  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) return 'failed';
  const file = new File([blob], 'versiculo.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'versiculo.png';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'saved';
}
