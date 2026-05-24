/** Визуал врагов: боты по тирам, НЛО-тарелки с пришельцами, мины */

const BOT_TIERS = [
  { body: '#450a0a', wing: '#ef4444', glow: '#f87171', accent: '#fecaca' },
  { body: '#1e1b4b', wing: '#6366f1', glow: '#818cf8', accent: '#c7d2fe' },
  { body: '#14532d', wing: '#22c55e', glow: '#4ade80', accent: '#bbf7d0' },
  { body: '#422006', wing: '#f59e0b', glow: '#fbbf24', accent: '#fde68a' },
  { body: '#500724', wing: '#ec4899', glow: '#f472b6', accent: '#fbcfe8' },
];

export function drawBotShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  tier: number,
  name: string,
  hpRatio: number,
): void {
  const c = BOT_TIERS[tier % BOT_TIERS.length];
  const scale = 1.35;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);

  ctx.shadowColor = c.glow;
  ctx.shadowBlur = 12 + tier * 2;
  ctx.fillStyle = c.wing;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, 12);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-12, -12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = c.body;
  ctx.fillRect(-14, -9, 28, 18);
  ctx.fillStyle = c.accent;
  ctx.fillRect(-6, -4, 10, 8);

  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.fillStyle = c.accent;
  ctx.font = 'bold 12px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y - 34 * scale);

  const bw = 52;
  ctx.fillStyle = '#0009';
  ctx.fillRect(x - bw / 2, y - 28, bw, 6);
  ctx.fillStyle = c.glow;
  ctx.fillRect(x - bw / 2, y - 28, bw * hpRatio, 6);
  ctx.textAlign = 'left';
}

export function drawUfoSaucer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wobble: number,
  hpRatio: number,
  emergeT = 0,
): void {
  const scale = emergeT > 0 ? 0.4 + (1 - emergeT / 60) * 0.6 : 1;
  const lift = emergeT > 0 ? emergeT * 0.8 : 0;
  const py = y - lift;

  ctx.save();
  ctx.translate(x, py);
  ctx.scale(scale, scale);
  ctx.rotate(Math.sin(wobble) * 0.15);

  ctx.shadowColor = '#a3e635';
  ctx.shadowBlur = 18;

  // Купол
  const domeGrad = ctx.createRadialGradient(0, -8, 2, 0, -6, 14);
  domeGrad.addColorStop(0, 'rgba(200,255,200,0.9)');
  domeGrad.addColorStop(0.6, 'rgba(134,239,172,0.5)');
  domeGrad.addColorStop(1, 'rgba(74,222,128,0.2)');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.arc(0, -6, 13, Math.PI, 0);
  ctx.fill();

  // Пришельцы в куполе
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(i * 7, -8, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.ellipse(i * 7, -10, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(i * 7 - 1.5, -9, 1.2, 0, Math.PI * 2);
    ctx.arc(i * 7 + 1.5, -9, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Диск
  const diskGrad = ctx.createLinearGradient(0, -4, 0, 10);
  diskGrad.addColorStop(0, '#365314');
  diskGrad.addColorStop(0.5, '#84cc16');
  diskGrad.addColorStop(1, '#1a2e05');
  ctx.fillStyle = diskGrad;
  ctx.beginPath();
  ctx.ellipse(0, 2, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Огни по краю
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 + wobble;
    const lx = Math.cos(a) * 20;
    const ly = 2 + Math.sin(a) * 5;
    ctx.fillStyle = i % 2 ? '#fef08a' : '#f472b6';
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Луч снизу при вылете с планеты
  if (emergeT > 0) {
    ctx.globalAlpha = 0.35;
    const beam = ctx.createLinearGradient(0, 8, 0, 40 + emergeT);
    beam.addColorStop(0, '#a3e635');
    beam.addColorStop(1, 'transparent');
    ctx.fillStyle = beam;
    ctx.fillRect(-8, 8, 16, 40 + emergeT);
    ctx.globalAlpha = 1;
  }

  ctx.shadowBlur = 0;
  ctx.restore();

  const bw = 40;
  ctx.fillStyle = '#0009';
  ctx.fillRect(x - bw / 2, py - 32, bw, 5);
  ctx.fillStyle = '#a3e635';
  ctx.fillRect(x - bw / 2, py - 32, bw * hpRatio, 5);
}

export function drawBombTrap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pulse: number,
  armed: boolean,
): void {
  const s = 14 + Math.sin(pulse) * 3;
  ctx.save();
  ctx.translate(x, y);

  ctx.shadowColor = armed ? '#ef4444' : '#f59e0b';
  ctx.shadowBlur = armed ? 20 : 10;

  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = armed ? '#ef4444' : '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = armed ? '#ef4444' : '#f59e0b';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 + pulse * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (s - 2), Math.sin(a) * (s - 2));
    ctx.lineTo(Math.cos(a) * (s + 5), Math.sin(a) * (s + 5));
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 10px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText('!', 0, 4);
  ctx.textAlign = 'left';
  ctx.shadowBlur = 0;
  ctx.restore();
}
