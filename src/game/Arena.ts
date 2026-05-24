import { sound } from '../audio/SoundManager';
import { audioSettingsHtml, bindAudioSettings } from '../ui/SettingsPanel';
import { showHelpModal } from '../ui/HelpModal';
import { playerStore } from '../core/PlayerStore';
import {
  BOOST_DURATION_SECONDS,
  boostDurationFrames,
  MAX_ACTIVE_BOOSTS,
  MAX_PICKUPS_ON_MAP,
  POWERUP_DEFS,
  POWERUP_KINDS,
  type PowerUpKind,
} from '../data/powerups';
import { renderArenaQuestBoard } from '../ui/QuestBoard';
import { footerLinksHtml, bindFooterLinks } from '../ui/PrivacyModal';
import { drawStatBar } from './drawBars';
import { drawBombTrap, drawBotShip, drawUfoSaucer } from './drawEnemies';
import { drawPlanet } from './drawPlanet';
import { getLevelDifficulty, levelDurationFrames, levelDurationSec } from './levels';
import { drawPlayerShip } from './ShipRenderer';
import { explosionColor, isPinkLoadout, laserColor } from './skinColors';

const WORLD_W = 2800;
const WORLD_H = 2100;
const MAX_PLANETS = 7;

interface Planet {
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  hue: number;
  ufoSpawned?: boolean;
}

interface Bot {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  name: string;
  shootCd: number;
  retargetCd: number;
  tier: number;
}

interface Ufo {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  shootCd: number;
  wobble: number;
  emergeT: number;
}

interface BombTrap {
  x: number;
  y: number;
  pulse: number;
  armed: boolean;
  fuse: number;
  damage: number;
}

type BoltOwner = { type: 'player' } | { type: 'bot'; id: number } | { type: 'ufo'; id: number };

interface LaserBolt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  damage: number;
  owner: BoltOwner;
}

interface Explosion {
  x: number;
  y: number;
  r: number;
  life: number;
  color: string;
}

interface PowerUp {
  x: number;
  y: number;
  kind: PowerUpKind;
  pulse: number;
}

interface ActiveBoost {
  kind: PowerUpKind;
  until: number;
  durationSec: number;
}

interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  vy: number;
}

interface MilestoneParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  life: number;
}

interface AimDir {
  x: number;
  y: number;
}

export class Arena {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private raf = 0;
  private player = { x: WORLD_W / 2, y: WORLD_H / 2, speed: 4 };
  private aim: AimDir = { x: 1, y: 0 };
  private mouseWorld = { x: WORLD_W / 2 + 100, y: WORLD_H / 2 };
  private hp = 100;
  private maxHp = 100;
  private shield = 0;
  private planets: Planet[] = [];
  private bots: Bot[] = [];
  private ufos: Ufo[] = [];
  private bolts: LaserBolt[] = [];
  private explosions: Explosion[] = [];
  private pickups: PowerUp[] = [];
  private coins: Coin[] = [];
  private boosts: ActiveBoost[] = [];
  private keys = new Set<string>();
  private score = 0;
  private matchCoins = 0;
  private planetsDestroyed = 0;
  private botsKilled = 0;
  private ufosKilled = 0;
  private shootCooldown = 0;
  private pickupTimer = 0;
  private ufoSpawnTimer = 0;
  private dead = false;
  private onHangar: () => void;
  private stars: { x: number; y: number; s: number }[] = [];
  private debris: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
  private floaters: Floater[] = [];
  private milestoneParticles: MilestoneParticle[] = [];
  private totalKills = 0;
  private killTier = 0;
  private milestoneFlash = 0;
  private lastHp = 100;
  private nextBotId = 1;
  private nextUfoId = 1;
  private t = 0;
  private matchLevel = 1;
  private levelTimeLeft = levelDurationFrames(1);
  private paused = false;
  private bombs: BombTrap[] = [];
  private levelBanner = 0;
  private completedQuestFlash = new Set<string>();
  private bossQuestTracked = false;
  private onMouseMove = (e: MouseEvent) => this.handleMouse(e);

  constructor(container: HTMLElement, onHangar: () => void) {
    this.container = container;
    this.onHangar = onHangar;
    this.renderShell();
    this.canvas = container.querySelector('#arena-canvas') as HTMLCanvasElement;
    this.canvas.tabIndex = 0;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('ctx');
    this.ctx = ctx;

    const combat = playerStore.getCombatStats();
    this.maxHp = Math.floor(combat.maxHp);
    this.hp = this.maxHp;
    this.lastHp = this.hp;
    this.mouseWorld = { x: this.player.x + 80, y: this.player.y };

    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        s: Math.random() * 2 + 0.5,
      });
    }

    this.initWorld();
    this.startLevel(1);
    this.bindInput();
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('achievement-unlocked', this.onAchievementUnlocked);
    requestAnimationFrame(() => this.canvas.focus());
    this.loop();
  }

  private renderShell(): void {
    this.container.innerHTML = `
      <div class="arena-wrap">
        <canvas id="arena-canvas"></canvas>
        <div id="arena-quests-wrap"></div>
        <div class="arena-hud">
          <div>
            <div id="arena-score">0</div>
            <div class="arena-hud-sub">Очки</div>
            <div id="arena-coins" class="arena-hud-sub" style="color:#fbbf24">🪙 0</div>
          </div>
          <div class="arena-hud-center" id="arena-hint">
            WASD — движение · Мышь — прицел · ESC — пауза
          </div>
          <div id="arena-level-hud" class="arena-level-hud">
            <span id="arena-level-num">Уровень 1</span>
            <span id="arena-level-timer">1:00</span>
          </div>
          <div id="arena-icon-hud" class="arena-icon-hud"></div>
        </div>
        <div id="quest-complete-toast" class="quest-complete-toast hidden"></div>
        <div id="level-complete-banner" class="level-complete-banner hidden"></div>
        <div id="arena-stats-line" class="arena-stats-line">Планеты: 0 · Боты: 0 · НЛО: 0</div>
        <div id="arena-pause" class="arena-pause hidden">
          <div class="arena-pause__panel">
            <h2>ПАУЗА</h2>
            <p class="arena-pause__sub">Уровень <span id="pause-level">1</span> · ESC — закрыть</p>
            ${audioSettingsHtml()}
            <button type="button" class="btn-how-to-play btn-how-to-play--pause" id="pause-help">📖 Как играть</button>
            <div class="arena-pause__actions">
              <button type="button" class="btn-primary" id="pause-continue">Продолжить</button>
              <button type="button" class="btn-secondary" id="pause-restart">Новая арена</button>
              <button type="button" class="btn-secondary" id="pause-hangar">В ангар</button>
            </div>
            <div class="arena-pause__footer">${footerLinksHtml()}</div>
          </div>
        </div>
        <div id="arena-boost-dock" class="arena-boost-dock"></div>
        <div id="kill-milestone" class="kill-milestone hidden">
          <div class="kill-milestone__inner">
            <div class="kill-milestone__text">10 УНИЧТОЖЕНИЙ</div>
            <div class="kill-milestone__sub">Волна врагов · точность ↑</div>
          </div>
        </div>
        <div id="game-over" class="game-over hidden">
          <div class="game-over__panel">
            <h2>КОРАБЛЬ УНИЧТОЖЕН</h2>
            <p id="go-stats"></p>
            <p class="game-over__tip">Вернитесь в <strong>ангар</strong> — прокачайте навыки и модули за CR, затем снова в бой.</p>
            <div class="game-over__actions">
              <button class="btn-primary" id="go-restart">Начать заново</button>
              <button class="btn-secondary" id="go-hangar">В ангар</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.container.querySelector('#go-restart')!.addEventListener('click', () => {
      this.destroy();
      window.dispatchEvent(new CustomEvent('restart-match'));
    });
    this.container.querySelector('#go-hangar')!.addEventListener('click', () => {
      this.destroy(false);
      this.onHangar();
    });
    this.container.querySelector('#pause-continue')!.addEventListener('click', () => this.setPaused(false));
    this.container.querySelector('#pause-restart')!.addEventListener('click', () => {
      this.destroy();
      window.dispatchEvent(new CustomEvent('restart-match'));
    });
    this.container.querySelector('#pause-hangar')!.addEventListener('click', () => {
      this.destroy(false);
      this.onHangar();
    });
    bindAudioSettings(this.container);
    bindFooterLinks(this.container);
    this.container.querySelector('#pause-help')!.addEventListener('click', () => showHelpModal());
  }

  private getDifficulty() {
    return getLevelDifficulty(this.matchLevel);
  }

  private startLevel(level: number): void {
    this.matchLevel = level;
    this.levelTimeLeft = levelDurationFrames(level);
    const diff = this.getDifficulty();
    this.levelBanner = 120;
    this.spawnLevelWave(diff);
    this.syncBombsToLevel(diff.bombCap);
    const banner = document.getElementById('level-complete-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.textContent = `УРОВЕНЬ ${level} · ${Math.floor(levelDurationSec(level) / 60)}:${String(levelDurationSec(level) % 60).padStart(2, '0')}`;
      setTimeout(() => banner.classList.add('hidden'), 2200);
    }
  }

  private spawnLevelWave(diff: ReturnType<typeof getLevelDifficulty>): void {
    while (this.bots.length < Math.min(diff.maxBots, 3 + this.matchLevel)) {
      this.bots.push(this.createBot(`Raider-${this.bots.length + 1}`, diff));
    }
    const ufoWant = Math.min(diff.maxUfo, 1 + Math.floor(this.matchLevel / 2));
    while (this.ufos.length < ufoWant) this.spawnUfo();
  }

  private syncBombsToLevel(cap: number): void {
    while (this.bombs.length < cap) {
      this.bombs.push({
        x: 80 + Math.random() * (WORLD_W - 160),
        y: 80 + Math.random() * (WORLD_H - 160),
        pulse: Math.random() * Math.PI * 2,
        armed: false,
        fuse: 0,
        damage: 12 + this.matchLevel * 3,
      });
    }
  }

  private advanceLevel(): void {
    this.matchLevel++;
    this.score += 100 * this.matchLevel;
    this.hp = Math.min(this.maxHp, this.hp + Math.floor(this.maxHp * 0.15));
    this.spawnFloater(this.player.x, this.player.y - 60, `УРОВЕНЬ ${this.matchLevel}!`, '#38bdf8');
    sound.milestone();
    this.startLevel(this.matchLevel);
  }

  private setPaused(p: boolean): void {
    this.paused = p;
    const el = document.getElementById('arena-pause');
    const lv = document.getElementById('pause-level');
    if (el) el.classList.toggle('hidden', !p);
    if (lv) lv.textContent = String(this.matchLevel);
    if (p) {
      this.canvas.blur();
      sound.pauseMusic();
    } else {
      sound.resumeMusic();
      requestAnimationFrame(() => this.canvas.focus());
    }
  }

  private onAchievementUnlocked = (e: Event): void => {
    const list = (e as CustomEvent<{ id: string; name: string }[]>).detail;
    for (const a of list) this.showAchievementBanner(a.name);
  };

  private showAchievementBanner(name: string): void {
    const el = document.getElementById('quest-complete-toast');
    if (!el) return;
    el.classList.remove('hidden');
    el.innerHTML = `<span class="quest-complete-toast__icon">🏆</span><span>Достижение: <strong>${name}</strong></span>`;
    sound.milestone();
    setTimeout(() => el.classList.add('hidden'), 4500);
  }

  private showQuestComplete(title: string, questId?: string): void {
    if (questId) this.completedQuestFlash.add(questId);
    const el = document.getElementById('quest-complete-toast');
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('quest-complete-toast--celebrate');
      el.innerHTML = `<span class="quest-complete-toast__icon">✓</span><span>Задание выполнено: <strong>${title}</strong></span>`;
      sound.milestone();
      setTimeout(() => {
        el.classList.add('hidden');
        el.classList.remove('quest-complete-toast--celebrate');
      }, 6500);
    }
    this.updateHud();
  }

  private trackQuest(id: string, amt: number): void {
    const r = playerStore.bumpQuest(id, amt);
    if (r?.completed) this.showQuestComplete(r.title, id);
  }

  private initWorld(): void {
    this.planets = [];
    for (let i = 0; i < MAX_PLANETS; i++) this.spawnPlanet();
    this.bots = [];
    this.ufos = [];
    this.bombs = [];
  }

  private createBot(name: string, diff = this.getDifficulty()): Bot {
    return {
      id: this.nextBotId++,
      x: 200 + Math.random() * (WORLD_W - 400),
      y: 200 + Math.random() * (WORLD_H - 400),
      hp: diff.botHp,
      maxHp: diff.botHp,
      name,
      shootCd: 30 + Math.random() * 40,
      retargetCd: 0,
      tier: diff.botTier,
    };
  }

  private spawnPlanet(): void {
    const r = 32 + Math.random() * 38;
    const maxHp = Math.floor(r * 3.5 + 35);
    this.planets.push({
      x: 120 + Math.random() * (WORLD_W - 240),
      y: 120 + Math.random() * (WORLD_H - 240),
      r,
      hp: maxHp,
      maxHp,
      hue: Math.floor(Math.random() * 90) + 170,
    });
  }

  private spawnUfo(fromPlanet = false, px?: number, py?: number): void {
    if (this.ufos.length >= this.getMaxUfo()) return;
    const hp = 35 + this.matchLevel * 6;
    this.ufos.push({
      id: this.nextUfoId++,
      x: fromPlanet && px != null ? px : 100 + Math.random() * (WORLD_W - 200),
      y: fromPlanet && py != null ? py : 100 + Math.random() * (WORLD_H - 200),
      hp,
      maxHp: hp,
      vx: (Math.random() - 0.5) * (1.5 + this.matchLevel * 0.15),
      vy: fromPlanet ? -2.5 : (Math.random() - 0.5) * 1.5,
      shootCd: 50,
      wobble: Math.random() * Math.PI * 2,
      emergeT: fromPlanet ? 70 : 0,
    });
    if (fromPlanet) {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        this.milestoneParticles.push({
          x: px ?? 0,
          y: py ?? 0,
          vx: Math.cos(a) * 2,
          vy: Math.sin(a) * 2 - 2,
          life: 40,
          color: '#a3e635',
        });
      }
    }
  }

  private trySpawnUfoFromPlanet(p: Planet): void {
    if (p.ufoSpawned) return;
    if (p.hp > p.maxHp * 0.45) return;
    p.ufoSpawned = true;
    this.spawnUfo(true, p.x, p.y + p.r * 0.3);
  }

  private bindInput(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
  }

  private handleMouse(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
    const sy = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
    const cam = this.getCamera();
    this.mouseWorld.x = cam.x + sx;
    this.mouseWorld.y = cam.y + sy;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Escape') {
      if (this.dead) return;
      this.setPaused(!this.paused);
      return;
    }
    if (this.dead || this.paused) return;
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private updateAimAndMove(): void {
    const combat = playerStore.getCombatStats();
    let mx = 0;
    let my = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) my -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) my += 1;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) mx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) mx += 1;

    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my) || 1;
      this.aim = { x: mx / len, y: my / len };
      const spd =
        this.player.speed * (combat.speed / 100) * (this.hasBoost('rapid') ? 1.25 : 1);
      this.player.x = Math.max(40, Math.min(WORLD_W - 40, this.player.x + this.aim.x * spd));
      this.player.y = Math.max(40, Math.min(WORLD_H - 40, this.player.y + this.aim.y * spd));
    }

  }

  private get angle(): number {
    return Math.atan2(this.mouseWorld.y - this.player.y, this.mouseWorld.x - this.player.x);
  }

  private getCamera(): { x: number; y: number } {
    const vw = this.canvas.width;
    const vh = this.canvas.height;
    let cx = this.player.x - vw / 2;
    let cy = this.player.y - vh / 2;
    cx = Math.max(0, Math.min(WORLD_W - vw, cx));
    cy = Math.max(0, Math.min(WORLD_H - vh, cy));
    return { x: cx, y: cy };
  }

  private resize = (): void => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  private hasBoost(kind: PowerUpKind): boolean {
    return this.boosts.some((b) => b.kind === kind && b.until > this.t);
  }

  private getMaxBots(): number {
    return this.getDifficulty().maxBots;
  }

  private getMaxUfo(): number {
    return this.getDifficulty().maxUfo;
  }

  private spawnFloater(x: number, y: number, text: string, color: string): void {
    this.floaters.push({ x, y, text, life: 55, color, vy: -1.2 });
  }

  private registerKill(x: number, y: number): void {
    this.totalKills++;
    if (this.totalKills % 10 !== 0) return;
    this.killTier = this.totalKills / 10;
    this.triggerKillMilestone(x, y);
  }

  private triggerKillMilestone(x: number, y: number): void {
    sound.milestone();
    this.milestoneFlash = 90;
    const pink = isPinkLoadout(playerStore.get().loadout);
    const col = pink ? '#ff69b4' : '#38bdf8';
    for (let i = 0; i < 80; i++) {
      const a = (Math.PI * 2 * i) / 80;
      const sp = 3 + Math.random() * 8;
      this.milestoneParticles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 50 + Math.random() * 20,
        color: col,
      });
    }
    const el = document.getElementById('kill-milestone');
    if (el) {
      el.classList.remove('hidden');
      el.classList.toggle('kill-milestone--pink', pink);
      const t = el.querySelector('.kill-milestone__text');
      const s = el.querySelector('.kill-milestone__sub');
      if (t) t.textContent = `${this.totalKills} УНИЧТОЖЕНИЙ!`;
      if (s) s.textContent = `Врагов +${this.killTier} · точность +${Math.round(this.killTier * 15)}%`;
      setTimeout(() => el.classList.add('hidden'), 2800);
    }
    for (let i = 0; i < Math.min(2, this.killTier); i++) {
      this.bots.push(this.createBot(`Raider-${this.bots.length}`));
    }
    for (let i = 0; i < 1; i++) this.spawnUfo();
    this.syncBombsToLevel(this.getDifficulty().bombCap);
  }

  private getExplosionCol(): string {
    return explosionColor(playerStore.get().loadout.explosionSkin);
  }

  private fireLaser(): void {
    if (this.dead || this.shootCooldown > 0) return;
    const combat = playerStore.getCombatStats();
    let fireDelay = Math.max(5, 18 - Math.floor(combat.fireRate / 10));
    if (this.hasBoost('rapid')) fireDelay = Math.max(3, fireDelay - 5);
    this.shootCooldown = fireDelay;

    const loadout = playerStore.get().loadout;
    const pink = isPinkLoadout(loadout);
    const color = this.hasBoost('plasma')
      ? '#22c55e'
      : laserColor(loadout.laserSkin);
    if (this.t % 3 === 0) sound.shoot(pink);
    let damage = 4 + Math.floor(combat.damage / 18);
    if (this.hasBoost('damage')) damage *= 2;

    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    this.bolts.push({
      x: this.player.x + dx * 34,
      y: this.player.y + dy * 34,
      vx: dx * 16,
      vy: dy * 16,
      life: 90,
      color,
      damage,
      owner: { type: 'player' },
    });
  }

  private botFire(bot: Bot, tx: number, ty: number): void {
    const diff = this.getDifficulty();
    const acc = diff.botAccuracy + this.killTier * 0.02;
    const leadX = tx + (tx - bot.x) * acc;
    const leadY = ty + (ty - bot.y) * acc;
    const ang = Math.atan2(leadY - bot.y, leadX - bot.x);
    const spd = 7 + this.killTier * 0.6 + this.matchLevel * 0.3;
    this.bolts.push({
      x: bot.x,
      y: bot.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 60,
      color: ['#f87171', '#818cf8', '#4ade80', '#fbbf24', '#f472b6'][bot.tier % 5],
      damage: diff.botDamage,
      owner: { type: 'bot', id: bot.id },
    });
  }

  private ufoFire(ufo: Ufo, tx: number, ty: number): void {
    const diff = this.getDifficulty();
    const ang = Math.atan2(ty - ufo.y, tx - ufo.x);
    this.bolts.push({
      x: ufo.x,
      y: ufo.y,
      vx: Math.cos(ang) * (5 + this.matchLevel * 0.2),
      vy: Math.sin(ang) * (5 + this.matchLevel * 0.2),
      life: 50,
      color: '#a3e635',
      damage: diff.ufoDamage,
      owner: { type: 'ufo', id: ufo.id },
    });
  }

  private pickBotTarget(bot: Bot): { x: number; y: number } {
    type T = { x: number; y: number; d: number };
    const candidates: T[] = [
      {
        x: this.player.x,
        y: this.player.y,
        d: Math.hypot(this.player.x - bot.x, this.player.y - bot.y),
      },
    ];
    for (const o of this.bots) {
      if (o.id === bot.id) continue;
      candidates.push({
        x: o.x,
        y: o.y,
        d: Math.hypot(o.x - bot.x, o.y - bot.y),
      });
    }
    for (const u of this.ufos) {
      candidates.push({ x: u.x, y: u.y, d: Math.hypot(u.x - bot.x, u.y - bot.y) });
    }
    candidates.sort((a, b) => a.d - b.d);
    if (candidates.length > 1 && Math.random() < 0.45) {
      return candidates[1 + Math.floor(Math.random() * Math.min(2, candidates.length - 1))];
    }
    return candidates[0];
  }

  private spawnCoinBurst(x: number, y: number, amount: number, spread: number): void {
    const count = Math.min(14, 4 + Math.floor(amount / 15));
    const each = Math.max(1, Math.floor(amount / count));
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = 1.5 + Math.random() * spread;
      this.coins.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        value: each,
        life: 420,
      });
    }
  }

  private collectPickup(p: PowerUp): void {
    const def = POWERUP_DEFS[p.kind];
    sound.pickup();
    if (p.kind === 'repair') {
      const heal = Math.floor(this.maxHp * 0.35);
      this.hp = Math.min(this.maxHp, this.hp + heal);
      this.spawnFloater(this.player.x, this.player.y - 45, `+${heal} HP`, '#4ade80');
    } else {
      if (this.boosts.length >= MAX_ACTIVE_BOOSTS) this.boosts.shift();
      const idx = this.boosts.length;
      const durationSec = BOOST_DURATION_SECONDS[Math.min(idx, BOOST_DURATION_SECONDS.length - 1)];
      this.boosts.push({
        kind: p.kind,
        until: this.t + boostDurationFrames(idx),
        durationSec,
      });
      if (p.kind === 'shield') this.shield = 50 + Math.floor(this.maxHp * 0.25);
      this.showBoostToast(def, durationSec);
    }
    this.pickups = this.pickups.filter((x) => x !== p);
  }

  private showBoostToast(def: (typeof POWERUP_DEFS)[PowerUpKind], sec: number): void {
    const dock = document.getElementById('arena-boost-dock');
    if (!dock) return;
    const el = document.createElement('div');
    el.className = 'boost-toast';
    el.style.borderColor = def.color;
    el.innerHTML = `<span>${def.icon}</span> <strong>${def.shortLabel}</strong> — ${def.effect} <em>${sec}с</em>`;
    dock.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => el.remove(), 2200);
  }

  private damagePlayer(amount: number): void {
    if (this.dead) return;
    const combat = playerStore.getCombatStats();
    if (this.shield > 0) {
      const taken = Math.min(this.shield, amount);
      this.shield -= taken;
      this.spawnFloater(this.player.x, this.player.y - 48, `-${Math.ceil(taken)} ЩИТ`, '#a78bfa');
      sound.playerHurt();
      if (amount > taken) this.damagePlayer(amount - taken);
      return;
    }
    const dmgRaw = amount * (100 / (100 + combat.armor));
    const dmg = this.hasBoost('armor') ? dmgRaw * 0.5 : dmgRaw;
    this.hp -= dmg;
    this.spawnFloater(this.player.x, this.player.y - 48, `-${Math.ceil(dmg)} HP`, '#f87171');
    sound.playerHurt();
    if (this.hp <= 0) this.killPlayer();
  }

  private killPlayer(): void {
    this.dead = true;
    this.spawnCoinBurst(this.player.x, this.player.y, 20, 2);
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 7;
      this.debris.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 55,
        color: i % 2 ? '#38bdf8' : '#fbbf24',
      });
    }
    const col = this.getExplosionCol();
    this.explosions.push({ x: this.player.x, y: this.player.y, r: 25, life: 50, color: col });
    this.explosions.push({ x: this.player.x, y: this.player.y, r: 65, life: 40, color: '#f87171' });
    playerStore.finalizeMatch({
      score: this.score,
      planetsDestroyed: this.planetsDestroyed,
      botsKilled: this.botsKilled,
      ufosKilled: this.ufosKilled,
      coinsCollected: this.matchCoins,
      died: true,
    });
    const banner = document.getElementById('level-complete-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.textContent = 'КОРАБЛЬ УНИЧТОЖЕН · Возврат в ангар…';
      banner.classList.add('level-complete-banner--death');
    }
    setTimeout(() => {
      this.destroy(false);
      this.onHangar();
    }, 2400);
  }

  private applyBoltHit(bolt: LaserBolt, dmg: number, x: number, y: number, showNum = false): void {
    bolt.life = 0;
    this.spawnHitFx(x, y, bolt.color, 12);
    sound.hit();
    if (showNum) this.spawnFloater(x, y - 10, `-${Math.ceil(dmg)}`, bolt.color);
  }

  private update(): void {
    if (this.dead) {
      for (const d of this.debris) {
        d.x += d.vx;
        d.y += d.vy;
        d.life--;
      }
      this.debris = this.debris.filter((d) => d.life > 0);
      for (const e of this.explosions) {
        e.life--;
        e.r += 2.5;
      }
      this.explosions = this.explosions.filter((e) => e.life > 0);
      return;
    }

    if (this.paused) {
      this.updateHud();
      return;
    }

    this.t++;
    this.levelTimeLeft--;
    if (this.levelTimeLeft <= 0) this.advanceLevel();
    if (this.levelBanner > 0) this.levelBanner--;

    this.updateAimAndMove();
    this.fireLaser();

    const combat = playerStore.getCombatStats();
    if (combat.hullRegen > 0 && this.t % 50 === 0) {
      const before = this.hp;
      this.hp = Math.min(this.maxHp, this.hp + combat.hullRegen);
      if (this.hp > before) {
        this.spawnFloater(this.player.x, this.player.y - 40, `+${Math.ceil(this.hp - before)}`, '#4ade80');
      }
    }
    if (this.hp !== this.lastHp && this.hp > this.lastHp && this.t % 10 === 0) {
      this.lastHp = this.hp;
    } else if (this.hp < this.lastHp) {
      this.lastHp = this.hp;
    }
    if (this.shootCooldown > 0) this.shootCooldown--;

    this.pickupTimer++;
    if (this.pickupTimer > 220 && this.pickups.length < MAX_PICKUPS_ON_MAP) {
      this.pickups.push({
        x: 80 + Math.random() * (WORLD_W - 160),
        y: 80 + Math.random() * (WORLD_H - 160),
        kind: POWERUP_KINDS[Math.floor(Math.random() * POWERUP_KINDS.length)],
        pulse: 0,
      });
      this.pickupTimer = 0;
    }

    this.ufoSpawnTimer++;
    const ufoInterval = Math.max(180, 500 - this.matchLevel * 25);
    if (this.ufoSpawnTimer > ufoInterval) {
      this.spawnUfo();
      this.ufoSpawnTimer = 0;
    }

    for (const u of this.ufos) {
      u.wobble += 0.06;
      if (u.emergeT > 0) {
        u.emergeT--;
        u.y -= 1.2;
      } else {
        u.x += u.vx + Math.sin(u.wobble) * 0.8;
        u.y += u.vy + Math.cos(u.wobble) * 0.8;
      }
      if (u.x < 60 || u.x > WORLD_W - 60) u.vx *= -1;
      if (u.y < 60 || u.y > WORLD_H - 60) u.vy *= -1;
      u.shootCd--;
      const d = Math.hypot(this.player.x - u.x, this.player.y - u.y);
      if (u.emergeT <= 0 && u.shootCd <= 0 && d < 420) {
        u.shootCd = Math.max(40, 70 - this.matchLevel * 3) + Math.random() * 30;
        this.ufoFire(u, this.player.x, this.player.y);
      }
    }

    for (const bomb of this.bombs) {
      bomb.pulse += 0.1;
      const dist = Math.hypot(bomb.x - this.player.x, bomb.y - this.player.y);
      if (dist < 52) {
        bomb.armed = true;
        bomb.fuse++;
        if (bomb.fuse > 25) this.detonateBomb(bomb);
      } else {
        bomb.armed = false;
        bomb.fuse = Math.max(0, bomb.fuse - 2);
      }
    }

    for (const b of this.bots) {
      b.retargetCd--;
      const tgt = this.pickBotTarget(b);
      const dx = tgt.x - b.x;
      const dy = tgt.y - b.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > 90) {
        b.x += (dx / dist) * 1.4;
        b.y += (dy / dist) * 1.4;
      } else if (dist < 50) {
        b.x -= (dx / dist) * 0.8;
        b.y -= (dy / dist) * 0.8;
      }
      b.shootCd--;
      if (b.shootCd <= 0 && dist < 480) {
        b.shootCd = 45 + Math.random() * 30;
        this.botFire(b, tgt.x, tgt.y);
      }
    }

    for (const p of this.pickups) {
      p.pulse += 0.08;
      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 38) this.collectPickup(p);
    }

    for (const c of this.coins) {
      c.x += c.vx;
      c.y += c.vy;
      c.vx *= 0.98;
      c.vy *= 0.98;
      c.life--;
      const d = Math.hypot(c.x - this.player.x, c.y - this.player.y);
      const pullR = this.hasBoost('magnet') ? 280 : 120;
      const pullF = this.hasBoost('magnet') ? 0.14 : 0.08;
      if (d < pullR) {
        c.x += (this.player.x - c.x) * pullF;
        c.y += (this.player.y - c.y) * pullF;
      }
      if (d < 28) {
        this.matchCoins += c.value;
        this.score += c.value * 2;
        c.life = 0;
      }
    }
    this.coins = this.coins.filter((c) => c.life > 0);

    for (const bolt of this.bolts) {
      bolt.x += bolt.vx;
      bolt.y += bolt.vy;
      bolt.life--;

      if (bolt.owner.type === 'player') {
        for (const p of this.planets) {
          if (Math.hypot(bolt.x - p.x, bolt.y - p.y) < p.r + 10) {
            let dmg = bolt.damage * (1 + combat.planetDamageBonus);
            if (Math.random() * 100 < combat.critChance) dmg *= 2;
            p.hp -= dmg;
            this.applyBoltHit(bolt, dmg, bolt.x, bolt.y, true);
            this.trySpawnUfoFromPlanet(p);
            if (p.hp <= 0) this.destroyPlanet(p);
            break;
          }
        }
        if (bolt.life <= 0) continue;
        for (const b of this.bots) {
          if (Math.hypot(bolt.x - b.x, bolt.y - b.y) < 30) {
            let dmg = bolt.damage * (1 + combat.botDamageBonus * 20);
            b.hp -= dmg;
            this.applyBoltHit(bolt, dmg, b.x, b.y - 20, true);
            if (b.hp <= 0) this.destroyBot(b);
            break;
          }
        }
        if (bolt.life <= 0) continue;
        for (const u of this.ufos) {
          if (Math.hypot(bolt.x - u.x, bolt.y - u.y) < 28) {
            const dmg = bolt.damage * 1.2;
            u.hp -= dmg;
            this.applyBoltHit(bolt, dmg, u.x, u.y - 15, true);
            if (u.hp <= 0) this.destroyUfo(u);
            break;
          }
        }
        if (bolt.life <= 0) continue;
        for (const bomb of this.bombs) {
          if (Math.hypot(bolt.x - bomb.x, bolt.y - bomb.y) < 18) {
            bomb.armed = true;
            bomb.fuse = 30;
            this.applyBoltHit(bolt, 0, bomb.x, bomb.y);
            break;
          }
        }
      } else if (bolt.owner.type === 'bot') {
        if (Math.hypot(bolt.x - this.player.x, bolt.y - this.player.y) < 28) {
          this.damagePlayer(bolt.damage);
          this.applyBoltHit(bolt, bolt.damage, bolt.x, bolt.y);
          continue;
        }
        for (const o of this.bots) {
          if (o.id === bolt.owner.id) continue;
          if (Math.hypot(bolt.x - o.x, bolt.y - o.y) < 28) {
            o.hp -= bolt.damage;
            this.applyBoltHit(bolt, bolt.damage, bolt.x, bolt.y);
            if (o.hp <= 0) this.destroyBot(o);
            break;
          }
        }
        if (bolt.life <= 0) continue;
        for (const u of this.ufos) {
          if (Math.hypot(bolt.x - u.x, bolt.y - u.y) < 26) {
            u.hp -= bolt.damage;
            this.applyBoltHit(bolt, bolt.damage, bolt.x, bolt.y);
            if (u.hp <= 0) this.destroyUfo(u);
            break;
          }
        }
      } else if (bolt.owner.type === 'ufo') {
        if (Math.hypot(bolt.x - this.player.x, bolt.y - this.player.y) < 26) {
          this.damagePlayer(bolt.damage);
          this.applyBoltHit(bolt, bolt.damage, bolt.x, bolt.y);
          continue;
        }
        for (const b of this.bots) {
          if (Math.hypot(bolt.x - b.x, bolt.y - b.y) < 26) {
            b.hp -= bolt.damage;
            this.applyBoltHit(bolt, bolt.damage, bolt.x, bolt.y);
            if (b.hp <= 0) this.destroyBot(b);
            break;
          }
        }
      }
    }
    this.bolts = this.bolts.filter(
      (b) => b.life > 0 && b.x > 0 && b.x < WORLD_W && b.y > 0 && b.y < WORLD_H,
    );

    for (const e of this.explosions) {
      e.life--;
      e.r += 2;
    }
    this.explosions = this.explosions.filter((e) => e.life > 0);
    this.boosts = this.boosts.filter((b) => b.until > this.t);

    while (this.planets.length < 5) this.spawnPlanet();
    const spawnEvery = this.getDifficulty().spawnInterval;
    if (this.bots.length < this.getMaxBots() && this.t % spawnEvery === 0) {
      this.bots.push(this.createBot(`Raider-${this.bots.length + 1}`));
    }

    for (const f of this.floaters) {
      f.y += f.vy;
      f.life--;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    for (const mp of this.milestoneParticles) {
      mp.x += mp.vx;
      mp.y += mp.vy;
      mp.life--;
    }
    this.milestoneParticles = this.milestoneParticles.filter((m) => m.life > 0);
    if (this.milestoneFlash > 0) this.milestoneFlash--;

    if (!this.bossQuestTracked && this.score >= 800) {
      this.bossQuestTracked = true;
      this.trackQuest('q_boss', 1);
    }
    this.updateHud();
  }

  private detonateBomb(bomb: BombTrap): void {
    this.bombs = this.bombs.filter((b) => b !== bomb);
    sound.explosion(true);
    this.spawnHitFx(bomb.x, bomb.y, '#ef4444', 40);
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      this.debris.push({
        x: bomb.x,
        y: bomb.y,
        vx: Math.cos(a) * 5,
        vy: Math.sin(a) * 5,
        life: 35,
        color: '#fbbf24',
      });
    }
    if (Math.hypot(bomb.x - this.player.x, bomb.y - this.player.y) < 90) {
      this.damagePlayer(bomb.damage);
    }
    for (const b of this.bots) {
      if (Math.hypot(bomb.x - b.x, bomb.y - b.y) < 70) b.hp -= bomb.damage * 0.8;
    }
    const cap = this.getDifficulty().bombCap;
    if (this.bombs.length < cap && Math.random() < 0.6) {
      this.bombs.push({
        x: 80 + Math.random() * (WORLD_W - 160),
        y: 80 + Math.random() * (WORLD_H - 160),
        pulse: 0,
        armed: false,
        fuse: 0,
        damage: bomb.damage,
      });
    }
  }

  private destroyPlanet(p: Planet): void {
    this.planets = this.planets.filter((x) => x !== p);
    this.planetsDestroyed++;
    this.score += 80 + Math.floor(p.r);
    const coins = 25 + Math.floor(p.r * 1.5);
    this.spawnCoinBurst(p.x, p.y, coins, 3);
    const col = isPinkLoadout(playerStore.get().loadout) ? '#ff69b4' : this.getExplosionCol();
    sound.explosion(p.r > 45);
    this.spawnHitFx(p.x, p.y, col, p.r * 1.4);
    this.registerKill(p.x, p.y);
    this.spawnPlanet();
    const diff = this.getDifficulty();
    for (let i = 0; i < diff.ufoPerPlanet; i++) {
      this.spawnUfo(true, p.x + (i - 1) * 36, p.y + p.r * 0.4);
    }
    this.trackQuest('q_planets', 1);
  }

  private destroyBot(b: Bot): void {
    this.bots = this.bots.filter((x) => x !== b);
    this.botsKilled++;
    this.score += 50;
    this.spawnCoinBurst(b.x, b.y, 35, 4);
    const col = this.getExplosionCol();
    sound.explosion(true);
    this.spawnHitFx(b.x, b.y, col, 36);
    this.registerKill(b.x, b.y);
    this.trackQuest('q_pvp', 1);
  }

  private destroyUfo(u: Ufo): void {
    this.ufos = this.ufos.filter((x) => x !== u);
    this.ufosKilled++;
    this.score += 70;
    this.spawnCoinBurst(u.x, u.y, 40, 3.5);
    sound.explosion(true);
    this.spawnHitFx(u.x, u.y, this.getExplosionCol(), 30);
    this.registerKill(u.x, u.y);
  }

  private spawnHitFx(x: number, y: number, color: string, r: number): void {
    this.explosions.push({ x, y, r: 12, life: 24, color });
    if (r > 20) this.explosions.push({ x, y, r, life: 32, color });
  }

  private updateHud(): void {
    const combat = playerStore.getCombatStats();
    const scoreEl = document.getElementById('arena-score');
    const coinsEl = document.getElementById('arena-coins');
    const statsEl = document.getElementById('arena-stats-line');
    const iconHud = document.getElementById('arena-icon-hud');
    const questsWrap = document.getElementById('arena-quests-wrap');
    if (questsWrap) questsWrap.innerHTML = renderArenaQuestBoard(this.score);
    if (scoreEl) scoreEl.textContent = String(this.score);
    if (coinsEl) coinsEl.textContent = `🪙 ${this.matchCoins}`;
    const lvNum = document.getElementById('arena-level-num');
    const lvTimer = document.getElementById('arena-level-timer');
    const secLeft = Math.ceil(this.levelTimeLeft / 60);
    const m = Math.floor(secLeft / 60);
    const s = secLeft % 60;
    if (lvNum) lvNum.textContent = `Уровень ${this.matchLevel}`;
    if (lvTimer) lvTimer.textContent = `${m}:${String(s).padStart(2, '0')}`;
    if (statsEl) {
      statsEl.textContent = `Ур.${this.matchLevel} · Планеты: ${this.planetsDestroyed} · Боты: ${this.botsKilled} · НЛО: ${this.ufosKilled} · Мины: ${this.bombs.length}`;
    }
    if (iconHud) {
      const hpP = this.hp / this.maxHp;
      const sh = this.shield > 0 ? Math.min(1, this.shield / (50 + this.maxHp * 0.25)) : 0;
      iconHud.innerHTML = `
        <div class="icon-stat" title="Здоровье">
          <span class="icon-stat__ico">♥</span>
          <div class="icon-stat__nums"><strong>${Math.ceil(this.hp)}</strong><span> / ${this.maxHp}</span></div>
          <div class="icon-stat__bar"><i style="width:${hpP * 100}%;background:#4ade80"></i></div>
        </div>
        <div class="icon-stat" title="Броня — снижает урон">
          <span class="icon-stat__ico">🛡</span>
          <div class="icon-stat__nums"><strong>${Math.floor(combat.armor)}</strong><span> брони</span></div>
          <div class="icon-stat__bar"><i style="width:${Math.min(100, combat.armor)}%;background:#94a3b8"></i></div>
        </div>
        <div class="icon-stat" title="Урон лазера">
          <span class="icon-stat__ico">⚡</span>
          <div class="icon-stat__nums"><strong>${Math.floor(combat.damage)}</strong><span> урон</span></div>
          <div class="icon-stat__bar"><i style="width:${Math.min(100, combat.damage / 2.5)}%;background:#f59e0b"></i></div>
        </div>
        ${
          this.shield > 0
            ? `<div class="icon-stat" title="Энергощит">
          <span class="icon-stat__ico">◆</span>
          <div class="icon-stat__nums"><strong>${Math.ceil(this.shield)}</strong><span> щит</span></div>
          <div class="icon-stat__bar"><i style="width:${sh * 100}%;background:#a78bfa"></i></div>
        </div>`
            : ''
        }
        <div class="icon-stat icon-stat--kills" title="Убийств / волна">
          <span class="icon-stat__ico">☠</span>
          <div class="icon-stat__nums"><strong>${this.totalKills}</strong><span> · ур.${this.matchLevel}</span></div>
        </div>
      `;
    }
    const dock = document.getElementById('arena-boost-dock');
    if (dock) {
      const slots = Array.from({ length: MAX_ACTIVE_BOOSTS }, (_, i) => {
        const b = this.boosts[i];
        if (!b) {
          return `<div class="boost-slot boost-slot--empty"><span>—</span></div>`;
        }
        const d = POWERUP_DEFS[b.kind];
        const left = Math.max(0, Math.ceil((b.until - this.t) / 60));
        const pct = (left / b.durationSec) * 100;
        return `<div class="boost-slot boost-slot--${b.kind}" style="border-color:${d.color}">
          <span class="boost-slot__icon">${d.icon}</span>
          <span class="boost-slot__label">${d.shortLabel}</span>
          <span class="boost-slot__effect">${d.effect}</span>
          <div class="boost-slot__timer"><i style="width:${pct}%;background:${d.color}"></i></div>
          <span class="boost-slot__sec">${left}с</span>
        </div>`;
      }).join('');
      dock.innerHTML = `<div class="boost-dock-title">Активные эффекты (макс. ${MAX_ACTIVE_BOOSTS})</div><div class="boost-dock-slots">${slots}</div>`;
    }
  }

  private draw(): void {
    const { ctx, canvas } = this;
    const cam = this.getCamera();
    const skin = playerStore.get().loadout.shipSkin;
    const combat = playerStore.getCombatStats();

    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    for (const s of this.stars) {
      ctx.fillStyle = 'rgba(200,220,255,0.4)';
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }

    ctx.strokeStyle = 'rgba(56,189,248,0.15)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, WORLD_W, WORLD_H);

    for (const p of this.planets) {
      drawPlanet(ctx, p.x, p.y, p.r, p.hue, p.hp, p.maxHp);
    }

    for (const c of this.coins) {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(String(c.value), c.x, c.y + 3);
      ctx.textAlign = 'left';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(251,191,36,0.3)';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - c.vx * 4, c.y - c.vy * 4);
      ctx.stroke();
    }

    for (const pu of this.pickups) {
      const def = POWERUP_DEFS[pu.kind];
      const s = 18 + Math.sin(pu.pulse) * 5;
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = def.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, s + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = 'bold 20px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(def.icon, pu.x, pu.y + 7);
      ctx.font = 'bold 11px Rajdhani';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(def.shortLabel, pu.x, pu.y - s - 12);
      ctx.fillText(def.shortLabel, pu.x, pu.y - s - 12);
      ctx.font = '10px Rajdhani';
      ctx.fillStyle = def.color;
      ctx.strokeText(def.effect, pu.x, pu.y + s + 16);
      ctx.fillText(def.effect, pu.x, pu.y + s + 16);
      ctx.textAlign = 'left';
    }

    for (const e of this.explosions) {
      ctx.globalAlpha = e.life / 32;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const bolt of this.bolts) {
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = bolt.owner.type === 'player' ? 5 : 3;
      ctx.shadowColor = bolt.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(bolt.x, bolt.y);
      ctx.lineTo(bolt.x - bolt.vx * 5, bolt.y - bolt.vy * 5);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (const bomb of this.bombs) drawBombTrap(ctx, bomb.x, bomb.y, bomb.pulse, bomb.armed);
    for (const u of this.ufos) {
      drawUfoSaucer(ctx, u.x, u.y, u.wobble, u.hp / u.maxHp, u.emergeT);
    }
    for (const b of this.bots) {
      const ang = Math.atan2(this.player.y - b.y, this.player.x - b.x);
      drawBotShip(ctx, b.x, b.y, ang, b.tier, b.name, b.hp / b.maxHp);
    }

    if (!this.dead) {
      const px = this.player.x;
      const py = this.player.y;
      drawStatBar(ctx, px, py - 58, 64, 8, this.hp / this.maxHp, '#4ade80', `${Math.ceil(this.hp)}/${this.maxHp} HP`);
      drawStatBar(
        ctx,
        px,
        py - 47,
        64,
        7,
        Math.min(1, combat.armor / 100),
        '#94a3b8',
        `Броня ${Math.floor(combat.armor)}`,
      );
      drawStatBar(
        ctx,
        px,
        py - 37,
        64,
        7,
        Math.min(1, combat.damage / 250),
        '#f59e0b',
        `Урон ${Math.floor(combat.damage)}`,
      );
      if (this.shield > 0) {
        drawStatBar(ctx, px, py - 27, 64, 6, this.shield / 80, '#a78bfa', `Щит ${Math.ceil(this.shield)}`);
      }

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.angle);
      drawPlayerShip(ctx, skin, {
        boostGlow: this.boosts.length > 0,
        damaged: this.hp < this.maxHp * 0.35,
      });
      ctx.restore();
    }

    for (const d of this.debris) {
      ctx.globalAlpha = d.life / 55;
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, 5, 5);
      ctx.globalAlpha = 1;
    }

    for (const mp of this.milestoneParticles) {
      ctx.globalAlpha = mp.life / 60;
      ctx.fillStyle = mp.color;
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const f of this.floaters) {
      ctx.globalAlpha = f.life / 55;
      ctx.font = 'bold 14px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, f.x, f.y);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (this.milestoneFlash > 0) {
      const a = this.milestoneFlash / 90;
      const pink = isPinkLoadout(playerStore.get().loadout);
      ctx.fillStyle = pink
        ? `rgba(255,105,180,${a * 0.2})`
        : `rgba(56,189,248,${a * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  private loop = (): void => {
    this.update();
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  };

  destroy(grantWin = true): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('achievement-unlocked', this.onAchievementUnlocked);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    if (grantWin && !this.dead) {
      playerStore.finalizeMatch({
        score: this.score,
        planetsDestroyed: this.planetsDestroyed,
        botsKilled: this.botsKilled,
        ufosKilled: this.ufosKilled,
        coinsCollected: this.matchCoins,
        died: false,
      });
    }
  }
}
