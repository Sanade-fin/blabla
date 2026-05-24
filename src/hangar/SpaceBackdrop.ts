/** Живой космический фон: звёзды, туманность, планеты, астероиды, корабли */

interface Planet {
  x: number;
  y: number;
  r: number;
  hue: number;
  rot: number;
  speed: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
}

interface FlyShip {
  x: number;
  y: number;
  vx: number;
  life: number;
}

export class SpaceBackdrop {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private stars: { x: number; y: number; z: number; tw: number }[] = [];
  private planets: Planet[] = [];
  private asteroids: Asteroid[] = [];
  private ships: FlyShip[] = [];
  private t = 0;
  private raf = 0;
  private lowPerf: boolean;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;
    this.lowPerf = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
    window.addEventListener('resize', () => this.resize());
  }

  private init(): void {
    this.resize();
    for (let i = 0; i < 280; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        tw: Math.random() * Math.PI * 2,
      });
    }
    this.planets = [
      { x: 0.15, y: 0.35, r: 48, hue: 220, rot: 0, speed: 0.0004 },
      { x: 0.82, y: 0.55, r: 72, hue: 280, rot: 0, speed: 0.00025 },
      { x: 0.55, y: 0.78, r: 28, hue: 30, rot: 0, speed: 0.0006 },
    ];
    for (let i = 0; i < 18; i++) this.spawnAsteroid();
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private spawnAsteroid(): void {
    this.asteroids.push({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 4 + Math.random() * 12,
      rot: Math.random() * Math.PI,
    });
  }

  private spawnShip(): void {
    const fromLeft = Math.random() > 0.5;
    this.ships.push({
      x: fromLeft ? -40 : this.w + 40,
      y: this.h * (0.2 + Math.random() * 0.5),
      vx: fromLeft ? 1.2 + Math.random() : -(1.2 + Math.random()),
      life: 0,
    });
  }

  start(): void {
    const loop = () => {
      this.t += 1;
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  private draw(): void {
    const { ctx, w, h } = this;
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, w, h);

    const g = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.5, w * 0.8);
    g.addColorStop(0, `rgba(88, 28, 135, ${0.35 + Math.sin(this.t * 0.008) * 0.08})`);
    g.addColorStop(0.5, `rgba(14, 116, 144, ${0.15 + Math.cos(this.t * 0.01) * 0.05})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (const s of this.stars) {
      const flicker = 0.5 + 0.5 * Math.sin(this.t * 0.05 + s.tw);
      const size = (1 - s.z) * 2.2 * flicker;
      ctx.fillStyle = `rgba(200, 230, 255, ${0.3 + s.z * 0.7})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of this.planets) {
      p.rot += p.speed;
      const px = p.x * w;
      const py = p.y * h;
      const grad = ctx.createRadialGradient(px - p.r * 0.3, py - p.r * 0.3, 0, px, py, p.r);
      grad.addColorStop(0, `hsla(${p.hue}, 70%, 65%, 0.9)`);
      grad.addColorStop(0.7, `hsla(${p.hue}, 50%, 35%, 0.85)`);
      grad.addColorStop(1, `hsla(${p.hue}, 40%, 15%, 0.6)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${p.hue}, 80%, 70%, 0.25)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(px, py, p.r * 1.4, p.r * 0.35, p.rot, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (!this.lowPerf) {
      for (const a of this.asteroids) {
        a.x += a.vx;
        a.y += a.vy;
        a.rot += 0.01;
        if (a.x < 0 || a.x > w || a.y < 0 || a.y > h) this.spawnAsteroid();
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.fillRect(-a.size, -a.size * 0.6, a.size * 2, a.size * 1.2);
        ctx.restore();
      }

      if (this.t % 180 === 0) this.spawnShip();
      this.ships = this.ships.filter((s) => {
        s.x += s.vx;
        s.life++;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 8, s.y + 4);
        ctx.lineTo(s.x - s.vx * 8, s.y - 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(129, 140, 248, 0.4)';
        ctx.fillRect(s.x - s.vx * 14, s.y - 1, 12, 2);
        return s.life < 400 && s.x > -80 && s.x < w + 80;
      });
    }
  }
}
