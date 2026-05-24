import { playerStore } from '../core/PlayerStore';
import { getCosmetic } from '../data/cosmetics';
import { SpaceBackdrop } from './SpaceBackdrop';
import { ShipScene } from './ShipScene';
import { showLoadoutModal, showLootReveal } from './LootReveal';
import {
  bindSectionEvents,
  renderDailyQuests,
  renderSocialSidebar,
  TAB_RENDERERS,
  type HangarTab,
} from './sections';
import { showHangarSettingsModal } from '../ui/SettingsPanel';
import { footerLinksHtml, bindFooterLinks } from '../ui/PrivacyModal';
import '../styles/global.css';

const TABS: { id: HangarTab; icon: string; label: string }[] = [
  { id: 'ship', icon: '🚀', label: 'Корабль' },
  { id: 'weapons', icon: '⚡', label: 'Оружие' },
  { id: 'skills', icon: '🧬', label: 'Навыки' },
  { id: 'shop', icon: '🛒', label: 'Магазин' },
  { id: 'ranks', icon: '🏆', label: 'Ранги' },
  { id: 'inventory', icon: '📦', label: 'Инвентарь' },
  { id: 'battlepass', icon: '⭐', label: 'Pass' },
  { id: 'help', icon: '📖', label: 'Помощь' },
];

export class HangarApp {
  private root: HTMLElement;
  private panel!: HTMLElement;
  private shipScene!: ShipScene;
  private backdrop!: SpaceBackdrop;
  private activeTab: HangarTab = 'ship';
  private unsub?: () => void;
  private onLogout: () => void;

  constructor(container: HTMLElement, onLogout: () => void) {
    this.root = container;
    this.onLogout = onLogout;
    this.render();
    this.unsub = playerStore.subscribe(() => this.refresh());
    window.addEventListener('open-loot', (e) => {
      showLootReveal((e as CustomEvent).detail, () => this.refresh());
    });
    window.addEventListener('achievement-unlocked', (e) => {
      const list = (e as CustomEvent<{ id: string; name: string }[]>).detail;
      list.forEach((a) => this.showAchievementToast(a.name));
    });
  }

  private showAchievementToast(name: string): void {
    const el = document.createElement('div');
    el.className = 'quest-complete-toast';
    el.innerHTML = `<span class="quest-complete-toast__icon">🏆</span><span>Достижение: <strong>${name}</strong></span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  private render(): void {
    const p = playerStore.get();
    this.root.innerHTML = `
      <div class="hangar">
        <canvas class="hangar__backdrop" id="space-canvas"></canvas>
        <div class="hangar__ship-stage" id="ship-stage"></div>
        <header class="hangar__topbar">
          <div>
            <div style="font-family:var(--font-display);font-size:11px;letter-spacing:0.2em;color:var(--accent)">ANGAR SYSTEM</div>
            <div style="font-family:var(--font-display);font-size:22px;font-weight:700">COSMIC DESTROYER</div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <span class="currency-pill pilot-pill" title="Аккаунт">👤 ${p.nickname}</span>
            <div id="hangar-currencies" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <span class="currency-pill has-tooltip" data-cur="credits" data-tip="credits">◈ ${p.credits.toLocaleString()} CR</span>
              <span class="currency-pill has-tooltip" data-cur="ship" data-tip="ship">🚀 Корабль Lv.${p.shipLevel}</span>
              <span class="currency-pill shards has-tooltip" data-cur="shards" data-tip="shards">✦ ${p.cosmicShards} Shards</span>
            </div>
            <button type="button" class="btn-icon" id="btn-settings" title="Настройки и звук">⏸</button>
            <button type="button" class="btn-icon" id="btn-logout" title="Выйти из аккаунта">⎋</button>
          </div>
        </header>
        <nav class="hangar__nav" id="nav"></nav>
        <main class="hangar__panel" id="panel"></main>
        <aside class="hangar__hud" id="hud"></aside>
        <footer class="hangar__footer">
          <button class="btn-primary" id="btn-play">В БОЙ</button>
          <button class="btn-secondary" id="btn-loadout">Loadout</button>
          <button class="btn-secondary" id="btn-daily">Задания</button>
        </footer>
        <div class="hangar__bottom">
          ${footerLinksHtml()}
        </div>
      </div>
    `;

    const canvas = this.root.querySelector('#space-canvas') as HTMLCanvasElement;
    const shipStage = this.root.querySelector('#ship-stage') as HTMLElement;
    this.backdrop = new SpaceBackdrop(canvas);
    this.backdrop.start();
    this.shipScene = new ShipScene(shipStage);
    this.shipScene.setSkin(p.loadout.shipSkin);
    this.shipScene.start();

    this.panel = this.root.querySelector('#panel')!;
    const nav = this.root.querySelector('#nav')!;
    nav.innerHTML = TABS.map(
      (t) =>
        `<button class="nav-btn ${t.id === this.activeTab ? 'active' : ''}" data-tab="${t.id}">
          <span class="icon">${t.icon}</span>${t.label}
        </button>`,
    ).join('');
    nav.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn as HTMLElement).dataset.tab as HangarTab;
        this.refresh();
      });
    });

    this.root.querySelector('#btn-play')!.addEventListener('click', () => {
      this.destroy();
      window.dispatchEvent(new CustomEvent('start-match'));
    });
    this.root.querySelector('#btn-loadout')!.addEventListener('click', () => {
      showLoadoutModal(() => {
        this.shipScene.setSkin(playerStore.get().loadout.shipSkin);
        this.refresh();
      });
    });
    this.root.querySelector('#btn-daily')!.addEventListener('click', () => this.showDailyModal());
    this.root.querySelector('#btn-settings')!.addEventListener('click', () => showHangarSettingsModal());
    bindFooterLinks(this.root);
    this.root.querySelector('#btn-logout')!.addEventListener('click', () => {
      if (confirm('Выйти из аккаунта? Прогресс сохранён на этом устройстве.')) this.onLogout();
    });

    this.bindCurrencyTooltips();
    this.refresh();

    if (!p.firstVisitDone) this.showOnboarding();
  }

  private bindCurrencyTooltips(): void {
    const tips: Record<string, string> = {
      credits:
        'CR (Credits) — основная валюта. Покупка модулей, навыков и обычных скинов. Зарабатывается в боях и заданиях.',
      shards:
        'Cosmic Shards — редкая премиум-валюта. Эксклюзивные скины и косметика. Даётся за задания и редкий лут.',
      ship: 'Уровень корабля 1–100. Растёт только от заданий и апгрейдов (не от фарма в бою).',
    };
    this.root.querySelectorAll('.has-tooltip[data-tip]').forEach((el) => {
      const key = (el as HTMLElement).dataset.tip!;
      el.setAttribute('title', tips[key] ?? '');
    });
  }

  private refresh(): void {
    const p = playerStore.get();
    this.updateCurrencies(p);
    this.shipScene?.setSkin(p.loadout.shipSkin);
    this.panel.innerHTML = TAB_RENDERERS[this.activeTab]();
    bindSectionEvents(this.panel, () => this.refresh());
    const hud = this.root.querySelector('#hud')!;
    hud.innerHTML = renderSocialSidebar();
    this.root.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === this.activeTab);
    });
    const laserName = getCosmetic(p.loadout.laserSkin)?.name ?? p.loadout.laserSkin;
    document.title = `${p.nickname} · ${laserName} — Cosmic Destroyer`;
  }

  private showDailyModal(): void {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="width:min(480px,92vw)">
        <h2 class="section-title">Ежедневные задания</h2>
        <p class="section-sub">XP · Credits · Loot · Shards</p>
        ${renderDailyQuests()}
        <button class="btn-secondary" style="margin-top:16px" id="close-daily">Закрыть</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-daily')!.addEventListener('click', () => overlay.remove());
    bindSectionEvents(overlay, () => {
      overlay.querySelector('.modal')!.innerHTML = `
        <h2 class="section-title">Ежедневные задания</h2>
        ${renderDailyQuests()}
        <button class="btn-secondary" style="margin-top:16px" id="close-daily">Закрыть</button>
      `;
      overlay.querySelector('#close-daily')!.addEventListener('click', () => overlay.remove());
      bindSectionEvents(overlay, () => {});
    });
  }

  private updateCurrencies(p: ReturnType<typeof playerStore.get>): void {
    const el = this.root.querySelector('#hangar-currencies');
    if (!el) return;
    const credits = el.querySelector('[data-cur="credits"]');
    const ship = el.querySelector('[data-cur="ship"]');
    const shards = el.querySelector('[data-cur="shards"]');
    if (credits) credits.textContent = `◈ ${p.credits.toLocaleString()} CR`;
    if (ship) ship.textContent = `🚀 Lv.${p.shipLevel} (${p.shipXp}/${p.shipXpToNext} XP)`;
    if (shards) shards.textContent = `✦ ${p.cosmicShards} Shards`;
    this.bindCurrencyTooltips();
  }

  private showOnboarding(): void {
    const el = document.createElement('div');
    el.className = 'onboarding';
    el.innerHTML = `
      <strong>Добро пожаловать в Ангар</strong>
      <p style="margin:8px 0;font-size:14px;color:var(--muted)">Настройте loadout, экипировку и косметику. Магазин — только визуал, без pay-to-win.</p>
      <button class="btn-primary" style="padding:8px 16px;font-size:12px" id="ob-ok">Понятно</button>
    `;
    document.body.appendChild(el);
    el.querySelector('#ob-ok')!.addEventListener('click', () => {
      playerStore.markFirstVisitDone();
      el.remove();
    });
  }

  destroy(): void {
    this.backdrop?.stop();
    this.shipScene?.stop();
    this.unsub?.();
    this.root.innerHTML = '';
  }
}
