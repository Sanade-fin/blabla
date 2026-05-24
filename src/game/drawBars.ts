export function drawStatBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number,
  fill: string,
  label: string,
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x - w / 2, y, w * Math.max(0, Math.min(1, pct)), h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, y, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + h - 2);
  ctx.textAlign = 'left';
}
