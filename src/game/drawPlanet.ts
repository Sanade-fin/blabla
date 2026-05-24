/** Улучшенная отрисовка планеты */
export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  hue: number,
  hp: number,
  maxHp: number,
): void {
  const atmo = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 1.35);
  atmo.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.25)`);
  atmo.addColorStop(1, 'transparent');
  ctx.fillStyle = atmo;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.35, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.05, x, y, r);
  body.addColorStop(0, `hsl(${hue}, 95%, 78%)`);
  body.addColorStop(0.45, `hsl(${hue}, 70%, 48%)`);
  body.addColorStop(0.85, `hsl(${hue}, 55%, 22%)`);
  body.addColorStop(1, `hsl(${hue}, 40%, 8%)`);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `hsla(${hue}, 100%, 85%, 0.35)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.15, r * 0.28, 0.4, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    const a = (i * 2.1 + hue * 0.01) % (Math.PI * 2);
    const cr = r * (0.12 + (i % 3) * 0.07);
    ctx.fillStyle = `hsla(${hue}, 40%, 25%, 0.55)`;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.4, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowColor = `hsl(${hue}, 90%, 60%)`;
  ctx.shadowBlur = r * 0.15;
  ctx.strokeStyle = `hsla(${hue}, 100%, 90%, 0.2)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const barW = r * 2.4;
  const y0 = y - r - 18;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(x - barW / 2, y0, barW, 9);
  const pct = hp / maxHp;
  ctx.fillStyle = pct > 0.35 ? '#4ade80' : '#f87171';
  ctx.fillRect(x - barW / 2, y0, barW * pct, 9);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(x - barW / 2, y0, barW, 9);
}
