/** Ilustrações próprias do app (SVG). Cada cena tem seu próprio céu, então funcionam em qualquer tema. */

const stars = (pts: [number, number, number][]) =>
  pts.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff6dc" opacity={0.55 + (i % 3) * 0.15} />);

/** Amanhecer largo: serve de fundo da tela de entrada. */
export function Dawn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 800 360" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <defs>
        <linearGradient id="dawn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1530" />
          <stop offset=".5" stopColor="#25407a" />
          <stop offset=".8" stopColor="#e0873a" />
          <stop offset="1" stopColor="#ffd98a" />
        </linearGradient>
        <radialGradient id="dawn-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff1c2" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffb84d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="360" fill="url(#dawn-sky)" />
      {stars([[60, 40, 1.6], [150, 80, 1.2], [240, 30, 1.4], [330, 70, 1], [420, 36, 1.5], [90, 120, 1], [700, 50, 1.5], [620, 90, 1.1], [760, 120, 1.2]])}
      <g transform="translate(560 262)" fill="#fff4d0" opacity=".07">
        {Array.from({ length: 14 }, (_, i) => (
          <polygon key={i} points="0,0 -26,-420 26,-420" transform={`rotate(${-80 + i * 12.3})`} />
        ))}
      </g>
      <circle cx="560" cy="262" r="190" fill="url(#dawn-glow)" />
      <circle cx="560" cy="262" r="40" fill="#fff1c2" />
      <path d="M0 292 C120 250 230 274 350 286 C470 298 560 262 680 276 C740 283 780 272 800 264 L800 360 L0 360Z" fill="#1c2e58" />
      <g fill="#0f1b38">
        <path d="M0 322 C140 292 260 332 400 314 C540 296 660 336 800 306 L800 360 L0 360Z" />
      </g>
    </svg>
  );
}

/** Igrejinha ao amanhecer. */
export function ChurchArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <defs>
        <linearGradient id="ch-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101d3c" />
          <stop offset=".55" stopColor="#2f4b84" />
          <stop offset=".85" stopColor="#e58f3d" />
          <stop offset="1" stopColor="#ffd98a" />
        </linearGradient>
        <radialGradient id="ch-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff1c2" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffb84d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#ch-sky)" />
      {stars([[40, 30, 1.4], [110, 56, 1], [310, 34, 1.5], [360, 70, 1.1], [250, 20, 1]])}
      <circle cx="200" cy="170" r="120" fill="url(#ch-glow)" />
      <circle cx="200" cy="172" r="34" fill="#fff1c2" />
      <path d="M0 196 C80 178 150 192 220 190 C290 188 350 176 400 186 L400 240 L0 240Z" fill="#1f3158" />
      <g fill="#0e1a36">
        <rect x="140" y="152" width="120" height="62" />
        <polygon points="130,154 200,116 270,154" />
        <rect x="178" y="92" width="44" height="64" />
        <polygon points="172,94 200,50 228,94" />
        <rect x="198" y="26" width="4" height="26" />
        <rect x="191" y="33" width="18" height="4" />
        <path d="M0 214 C100 204 300 204 400 214 L400 240 L0 240Z" />
        <ellipse cx="78" cy="196" rx="20" ry="26" />
        <rect x="76" y="212" width="4" height="10" />
        <ellipse cx="326" cy="198" rx="17" ry="22" />
        <rect x="324" y="212" width="4" height="10" />
      </g>
      <g fill="#ffb84d">
        <path d="M190 214 V196 a10 10 0 0 1 20 0 V214Z" />
        <rect x="150" y="168" width="12" height="22" rx="6" />
        <rect x="238" y="168" width="12" height="22" rx="6" />
        <circle cx="200" cy="112" r="8" />
      </g>
    </svg>
  );
}

/** Livro aberto com a chama da lâmpada. */
export function BookArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <defs>
        <linearGradient id="bk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1530" />
          <stop offset="1" stopColor="#2b3270" />
        </linearGradient>
        <radialGradient id="bk-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".85" />
          <stop offset="1" stopColor="#fca311" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill="url(#bk-sky)" />
      {stars([[50, 36, 1.4], [120, 70, 1], [320, 40, 1.5], [360, 90, 1.1], [270, 26, 1], [30, 110, 1.2]])}
      <g transform="translate(200 104)" fill="#fff4d0" opacity=".08">
        {Array.from({ length: 10 }, (_, i) => (
          <polygon key={i} points="0,0 -18,-200 18,-200" transform={`rotate(${-72 + i * 16})`} />
        ))}
      </g>
      <circle cx="200" cy="104" r="104" fill="url(#bk-glow)" />
      <path d="M70 188 C120 178 170 181 200 198 C230 181 280 178 330 188 L330 200 C280 191 230 194 200 210 C170 194 120 191 70 200Z" fill="#7a4f1d" />
      <path d="M200 192 C170 177 120 174 80 184 L80 124 C120 114 170 117 200 132Z" fill="#f5ecd7" />
      <path d="M200 192 C230 177 280 174 320 184 L320 124 C280 114 230 117 200 132Z" fill="#e8d9b5" />
      <path d="M200 132 V192" stroke="#b89b62" strokeWidth="2" />
      <g stroke="#c9b88f" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M98 138 C124 133 156 135 184 143" /><path d="M98 152 C124 147 156 149 184 157" /><path d="M98 166 C124 161 156 163 184 171" />
        <path d="M216 143 C244 135 276 133 302 138" /><path d="M216 157 C244 149 276 147 302 152" /><path d="M216 171 C244 163 276 161 302 166" />
      </g>
      <path d="M200 50 C217 76 226 90 215 104 C209 114 191 114 185 104 C174 90 183 76 200 50Z" fill="#fca311" />
      <path d="M200 78 C207 90 210 96 205 103 C202 108 198 108 195 103 C190 96 193 90 200 78Z" fill="#fff1c2" />
    </svg>
  );
}
