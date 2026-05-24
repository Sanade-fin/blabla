/** Мини-иконки кораблей для магазина (inline SVG) */

const PALETTES: Record<string, { body: string; wing: string; core: string }> = {
  ship_default: { body: '#1e3a5f', wing: '#38bdf8', core: '#67e8f9' },
  ship_neon: { body: '#0f172a', wing: '#e879f9', core: '#ff00ff' },
  ship_alien: { body: '#14532d', wing: '#4ade80', core: '#86efac' },
  ship_crystal: { body: '#312e81', wing: '#c4b5fd', core: '#ede9fe' },
  ship_samurai: { body: '#450a0a', wing: '#fca5a5', core: '#fef2f2' },
  ship_corrupted: { body: '#1c1917', wing: '#a855f7', core: '#7c3aed' },
  ship_blackhole: { body: '#020617', wing: '#67e8f9', core: '#06b6d4' },
  ship_dragon: { body: '#422006', wing: '#fbbf24', core: '#fef08a' },
  ship_pink: { body: '#500724', wing: '#f472b6', core: '#fbcfe8' },
};

export function shipIconSvg(skinId: string, size = 56): string {
  const c = PALETTES[skinId] ?? PALETTES.ship_default;
  const w = size;
  const h = Math.round(size * 0.55);
  return `<svg class="ship-icon" width="${w}" height="${h}" viewBox="0 0 56 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="g-${skinId}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff"/>
        <stop offset="40%" stop-color="${c.core}"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <path fill="${c.wing}" d="M8 16 L28 8 L24 16 L28 24 Z"/>
    <path fill="${c.wing}" transform="scale(-1,1) translate(-56,0)" d="M8 16 L28 8 L24 16 L28 24 Z"/>
    <path fill="${c.body}" d="M32 16 L4 26 L8 16 L4 6 Z"/>
    <circle cx="14" cy="16" r="7" fill="url(#g-${skinId})"/>
    <path fill="${c.core}" opacity="0.85" d="M-2 16 L-14 19 L-14 13 Z"/>
  </svg>`;
}
