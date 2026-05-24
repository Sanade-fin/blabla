/** Отрисовка космического корабля на canvas */
export function drawPlayerShip(
  ctx: CanvasRenderingContext2D,
  skinId: string,
  opts: { boostGlow?: boolean; damaged?: boolean },
): void {
  const palettes: Record<string, { body: string; wing: string; core: string; trim: string }> = {
    ship_default: { body: '#1e3a5f', wing: '#38bdf8', core: '#67e8f9', trim: '#0ea5e9' },
    ship_neon: { body: '#0f172a', wing: '#e879f9', core: '#ff00ff', trim: '#c026d3' },
    ship_alien: { body: '#14532d', wing: '#4ade80', core: '#86efac', trim: '#22c55e' },
    ship_crystal: { body: '#312e81', wing: '#c4b5fd', core: '#ede9fe', trim: '#8b5cf6' },
    ship_samurai: { body: '#450a0a', wing: '#fca5a5', core: '#fef2f2', trim: '#ef4444' },
    ship_corrupted: { body: '#1c1917', wing: '#a855f7', core: '#7c3aed', trim: '#6b21a8' },
    ship_blackhole: { body: '#020617', wing: '#67e8f9', core: '#06b6d4', trim: '#0891b2' },
    ship_dragon: { body: '#422006', wing: '#fbbf24', core: '#fef08a', trim: '#f59e0b' },
    ship_pink: { body: '#500724', wing: '#f472b6', core: '#fbcfe8', trim: '#ec4899' },
  };
  const c = palettes[skinId] ?? palettes.ship_default;

  if (opts.boostGlow) {
    ctx.shadowColor = c.core;
    ctx.shadowBlur = 24;
  }

  const wing = (flip: number) => {
    ctx.beginPath();
    ctx.moveTo(-8 * flip, 18);
    ctx.lineTo(-28 * flip, 8);
    ctx.lineTo(-22 * flip, 0);
    ctx.lineTo(-28 * flip, -8);
    ctx.lineTo(-8 * flip, -18);
    ctx.closePath();
    ctx.fill();
  };

  ctx.fillStyle = c.wing;
  wing(1);
  wing(-1);

  ctx.fillStyle = c.body;
  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(-18, 14);
  ctx.lineTo(-12, 0);
  ctx.lineTo(-18, -14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = c.trim;
  ctx.fillRect(-14, -3, 20, 6);

  const g = ctx.createRadialGradient(8, 0, 2, 12, 0, 10);
  g.addColorStop(0, '#fff');
  g.addColorStop(0.4, c.core);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(10, 0, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c.core;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(-36, 5);
  ctx.lineTo(-36, -5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  if (opts.damaged) {
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(5, 8);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}
