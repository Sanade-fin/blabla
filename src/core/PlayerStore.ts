import { computeCombatStats, rewardScaleByShipLevel } from './CombatStats';
import { EQUIPMENT_CATALOG } from '../data/equipment';
import { CURRENT_SEASON } from '../data/battlePass';
import { createDailyQuests } from '../data/quests';
import { rankFromMmr } from '../data/ranks';
import { skillUpgradeCost, SKILL_TREE } from '../data/skills';
import { MAX_UPGRADE_LEVEL, moduleUpgradeCost, type ModuleId } from '../data/upgrades';
import type {
  EquipSlot,
  LootCapsule,
  ModuleLevels,
  PlayerProfile,
  Rarity,
  StatBlock,
} from '../types';
import { getEquipment } from '../data/equipment';
import { ACHIEVEMENTS } from '../data/ranks';
import { profileStorageKey } from './AuthService';

const DEFAULT_MODULES: ModuleLevels = {
  reactor: 1,
  hull: 1,
  targeting: 1,
  thrusters: 1,
};

const DEFAULT_EQUIP: Record<EquipSlot, string | null> = {
  coreReactor: 'reactor_mk1',
  laserModule: 'laser_standard',
  shieldGenerator: 'shield_basic',
  engineThrusters: null,
  droneBay: null,
  aiChip: null,
  quantumAmplifier: null,
  armorPlating: null,
};

function defaultProfile(accountId = ''): PlayerProfile {
  return {
    id: accountId || crypto.randomUUID(),
    accountId,
    nickname: 'Pilot_' + Math.floor(Math.random() * 9000 + 1000),
    shipLevel: 1,
    shipXp: 0,
    shipXpToNext: 200,
    moduleLevels: { ...DEFAULT_MODULES },
    level: 1,
    xp: 0,
    xpToNext: 500,
    rank: 'Cadet',
    mmr: 800,
    credits: 2500,
    cosmicShards: 10,
    title: 'Rookie',
    clanTag: '[VOID]',
    friends: ['NovaStrike', 'xKiller99'],
    equipped: { ...DEFAULT_EQUIP },
    ownedEquipment: EQUIPMENT_CATALOG.map((e) => e.id),
    ownedCosmetics: ['ship_default', 'laser_default', 'exp_default'],
    unlockedSkills: {},
    activeBranch: 'destroyer',
    loadout: {
      weapon: 'laser',
      ability: 'blackHole',
      passive: 'crit',
      laserSkin: 'laser_default',
      shipSkin: 'ship_default',
      explosionSkin: 'exp_default',
    },
    inventory: [],
    dailyQuests: createDailyQuests(),
    battlePassLevel: 1,
    battlePassPremium: false,
    battlePassXp: 0,
    seasonId: CURRENT_SEASON.id,
    stats: {
      planetsDestroyed: 0,
      pvpWins: 0,
      bossesKilled: 0,
      ufoKills: 0,
      matchesPlayed: 0,
    },
    achievements: [],
    recentMatches: [],
    cosmeticEffects: {
      trail: null,
      killEffect: null,
      damageNumbers: null,
      banner: null,
      avatar: null,
    },
    firstVisitDone: false,
  };
}

type Listener = () => void;

export class PlayerStore {
  private profile: PlayerProfile = defaultProfile();
  private listeners = new Set<Listener>();
  private accountId: string | null = null;

  constructor() {
    /* профиль загружается после входа через loadForAccount */
  }

  /** Новый аккаунт — чистый прогресс без чужих достижений */
  createNewAccount(accountId: string, username: string): void {
    this.accountId = accountId;
    this.profile = defaultProfile(accountId);
    this.profile.nickname = username;
    this.profile.achievements = [];
    this.profile.stats = {
      planetsDestroyed: 0,
      pvpWins: 0,
      bossesKilled: 0,
      ufoKills: 0,
      matchesPlayed: 0,
    };
    this.profile.dailyQuests = createDailyQuests();
    this.migrateProfile();
    this.save();
    this.notify(false);
  }

  loadForAccount(accountId: string, username: string): void {
    this.accountId = accountId;
    const loaded = this.load(accountId);
    if (loaded.accountId && loaded.accountId !== accountId) {
      this.createNewAccount(accountId, username);
      return;
    }
    this.profile = loaded;
    this.profile.accountId = accountId;
    this.profile.id = accountId;
    this.profile.nickname = username;
    if (!Array.isArray(this.profile.achievements)) this.profile.achievements = [];
    this.profile.rank = rankFromMmr(this.profile.mmr);
    this.migrateProfile();
    this.checkAchievements();
    this.notify(false);
  }

  clearAccount(): void {
    this.accountId = null;
    this.profile = defaultProfile();
  }

  getAccountId(): string | null {
    return this.accountId;
  }

  isReady(): boolean {
    return this.accountId != null;
  }

  private migrateProfile(): void {
    const p = this.profile;
    if (!p.shipLevel) p.shipLevel = 1;
    if (!p.moduleLevels) p.moduleLevels = { ...DEFAULT_MODULES };
    if (p.shipXpToNext == null) p.shipXpToNext = 200 + p.shipLevel * 80;
  }

  get(): PlayerProfile {
    return this.profile;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(persist = true): void {
    if (persist) this.save();
    this.listeners.forEach((fn) => fn());
  }

  private load(accountId: string): PlayerProfile {
    const key = profileStorageKey(accountId);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultProfile(accountId);
      const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
      if (parsed.accountId && parsed.accountId !== accountId) {
        return defaultProfile(accountId);
      }
      const merged: PlayerProfile = {
        ...defaultProfile(accountId),
        ...parsed,
        accountId,
        id: accountId,
        achievements: Array.isArray(parsed.achievements) ? [...parsed.achievements] : [],
        stats: {
          ...defaultProfile(accountId).stats,
          ...(parsed.stats ?? {}),
        },
        dailyQuests: parsed.dailyQuests?.length
          ? parsed.dailyQuests
          : createDailyQuests(),
      };
      return merged;
    } catch {
      /* ignore */
    }
    return defaultProfile(accountId);
  }

  save(): void {
    if (!this.accountId) return;
    localStorage.setItem(profileStorageKey(this.accountId), JSON.stringify(this.profile));
  }

  /** Проверка достижений по статистике; возвращает только что разблокированные */
  checkAchievements(): { id: string; name: string }[] {
    const p = this.profile;
    const unlocked: { id: string; name: string }[] = [];
    const rules: { id: string; test: () => boolean }[] = [
      { id: 'ach_planets_100', test: () => p.stats.planetsDestroyed >= 100 },
      { id: 'ach_pvp_10', test: () => p.stats.pvpWins >= 10 },
      { id: 'ach_boss_5', test: () => p.stats.bossesKilled >= 5 },
      { id: 'ach_invasion', test: () => p.stats.matchesPlayed >= 20 },
      {
        id: 'ach_cosmic_skin',
        test: () => p.ownedCosmetics.some((c) => c.includes('blackhole') || c.includes('dragon')),
      },
    ];
    for (const r of rules) {
      if (!p.achievements.includes(r.id) && r.test()) {
        p.achievements.push(r.id);
        const def = ACHIEVEMENTS.find((a) => a.id === r.id);
        unlocked.push({ id: r.id, name: def?.name ?? r.id });
      }
    }
    if (unlocked.length) {
      this.notify();
      window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: unlocked }));
    }
    return unlocked;
  }

  addShipXp(amount: number, silent = false): void {
    if (this.profile.shipLevel >= 100) return;
    this.profile.shipXp += amount;
    while (this.profile.shipXp >= this.profile.shipXpToNext && this.profile.shipLevel < 100) {
      this.profile.shipXp -= this.profile.shipXpToNext;
      this.profile.shipLevel += 1;
      this.profile.shipXpToNext = 200 + this.profile.shipLevel * 85;
    }
    if (!silent) this.notify();
  }

  upgradeModule(moduleId: ModuleId): boolean {
    const cur = this.profile.moduleLevels[moduleId];
    if (cur >= MAX_UPGRADE_LEVEL) return false;
    const cost = moduleUpgradeCost(cur);
    if (this.profile.shipLevel < cost.minShipLevel) return false;
    if (this.profile.credits < cost.credits) return false;
    this.profile.credits -= cost.credits;
    this.profile.moduleLevels[moduleId] = cur + 1;
    this.addShipXp(25, true);
    this.bumpQuest('q_invasion', 1);
    this.notify();
    return true;
  }

  buySkillLevel(skillId: string): boolean {
    const node = SKILL_TREE.find((s) => s.id === skillId);
    if (!node) return false;
    const cur = this.profile.unlockedSkills[skillId] ?? 0;
    if (cur >= node.maxLevel) return false;
    if (node.requires) {
      const reqLvl = this.profile.unlockedSkills[node.requires] ?? 0;
      if (reqLvl < 1) return false;
    }
    const cost = skillUpgradeCost(skillId, cur);
    if (this.profile.credits < cost) return false;
    this.profile.credits -= cost;
    this.profile.unlockedSkills[skillId] = cur + 1;
    this.addShipXp(15, true);
    this.notify();
    return true;
  }

  equipItem(slot: EquipSlot, itemId: string): void {
    if (!this.profile.ownedEquipment.includes(itemId)) return;
    const item = getEquipment(itemId);
    if (!item || item.slot !== slot) return;
    this.profile.equipped[slot] = itemId;
    this.notify();
  }

  buyCosmetic(id: string, price: { credits?: number; shards?: number }): boolean {
    if (this.profile.ownedCosmetics.includes(id)) return false;
    if (price.credits && this.profile.credits < price.credits) return false;
    if (price.shards && this.profile.cosmicShards < price.shards) return false;
    if (price.credits) this.profile.credits -= price.credits;
    if (price.shards) this.profile.cosmicShards -= price.shards;
    this.profile.ownedCosmetics.push(id);
    if (id.startsWith('ship_')) this.profile.loadout.shipSkin = id;
    if (id.startsWith('laser_')) this.profile.loadout.laserSkin = id;
    if (id.startsWith('exp_')) this.profile.loadout.explosionSkin = id;
    this.notify();
    return true;
  }

  setLoadout(partial: Partial<PlayerProfile['loadout']>): void {
    this.profile.loadout = { ...this.profile.loadout, ...partial };
    this.notify();
  }

  setBranch(branch: PlayerProfile['activeBranch']): void {
    this.profile.activeBranch = branch;
    this.notify();
  }

  addLoot(source: LootCapsule['source'], rarity: Rarity): void {
    this.profile.inventory.push({
      id: crypto.randomUUID(),
      source,
      rarity,
      opened: false,
    });
    this.notify();
  }

  openLoot(id: string): { type: string; name: string; rarity: Rarity } | null {
    const cap = this.profile.inventory.find((c) => c.id === id && !c.opened);
    if (!cap) return null;
    cap.opened = true;
    const scale = rewardScaleByShipLevel(this.profile.shipLevel);
    this.profile.credits += Math.floor(200 * scale);
    this.addShipXp(Math.floor(30 * scale));
    this.notify();
    return { type: 'credits', name: 'Награда из капсулы', rarity: cap.rarity };
  }

  finalizeMatch(result: {
    score: number;
    planetsDestroyed: number;
    botsKilled: number;
    ufosKilled?: number;
    coinsCollected?: number;
    died: boolean;
  }): void {
    const p = this.profile;
    const scale = rewardScaleByShipLevel(p.shipLevel);

    if (result.planetsDestroyed > 0) {
      p.stats.planetsDestroyed += result.planetsDestroyed;
    }
    if (result.botsKilled > 0) {
      p.stats.pvpWins += Math.min(result.botsKilled, 3);
      this.bumpQuest('q_pvp', Math.min(result.botsKilled, 3));
    }
    if (result.ufosKilled) {
      p.stats.ufoKills += result.ufosKilled;
    }

    const coins = result.coinsCollected ?? 0;
    const creditsGain = Math.floor((result.score / 40 + result.planetsDestroyed * 8 + coins) * scale);
    p.credits += creditsGain;
    p.stats.matchesPlayed += 1;

    const won = !result.died && (result.score >= 300 || result.botsKilled >= 2);
    p.mmr += won ? 8 : -4;
    p.rank = rankFromMmr(p.mmr);
    p.battlePassXp += Math.floor((result.score / 100) * scale);

    p.recentMatches.unshift({
      result: result.died ? 'loss' : won ? 'win' : 'loss',
      mode: 'Arena',
      score: result.score,
    });
    p.recentMatches = p.recentMatches.slice(0, 8);
    if (result.score >= 800 && !result.died) p.stats.bossesKilled += 1;
    this.checkAchievements();
    this.notify();
  }

  bumpQuest(id: string, amt: number): { completed: boolean; title: string } | null {
    const q = this.profile.dailyQuests.find((x) => x.id === id);
    if (!q) return null;
    const wasDone = q.progress >= q.target;
    q.progress = Math.min(q.target, q.progress + amt);
    const completed = !wasDone && q.progress >= q.target;
    if (completed) this.notify();
    return completed ? { completed: true, title: q.title } : null;
  }

  claimQuest(id: string): boolean {
    const q = this.profile.dailyQuests.find((x) => x.id === id);
    if (!q || q.progress < q.target) return false;
    this.profile.credits += q.reward.credits;
    const shipXp = q.reward.shipXp ?? 80;
    this.addShipXp(shipXp);
    if (q.reward.shards) this.profile.cosmicShards += q.reward.shards;
    if (q.reward.loot) this.addLoot('planet', 'rare');
    q.progress = 0;
    this.notify();
    return true;
  }

  computeStats(): StatBlock {
    const c = computeCombatStats(this.profile);
    return c;
  }

  getCombatStats() {
    return computeCombatStats(this.profile);
  }

  markFirstVisitDone(): void {
    this.profile.firstVisitDone = true;
    this.notify();
  }
}

export const playerStore = new PlayerStore();
