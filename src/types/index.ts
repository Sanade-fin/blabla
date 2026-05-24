export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'cosmic';

export type EquipSlot =
  | 'coreReactor'
  | 'laserModule'
  | 'shieldGenerator'
  | 'engineThrusters'
  | 'droneBay'
  | 'aiChip'
  | 'quantumAmplifier'
  | 'armorPlating';

export type SkillBranch =
  | 'destroyer'
  | 'engineer'
  | 'tank'
  | 'speedster'
  | 'chaosScientist';

export type LoadoutWeapon = 'laser' | 'plasma' | 'rockets' | 'railgun';
export type LoadoutAbility = 'shield' | 'blackHole' | 'emp' | 'dash';
export type LoadoutPassive = 'crit' | 'speed' | 'regen' | 'lootBoost';

export interface StatBlock {
  damage: number;
  fireRate: number;
  shield: number;
  armor: number;
  speed: number;
  critChance: number;
  lootBonus: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  stats: Partial<StatBlock>;
  effect?: string;
  visualTag?: string;
}

export interface CosmeticSkin {
  id: string;
  name: string;
  kind: 'ship' | 'laser' | 'explosion' | 'trail' | 'kill' | 'damageNumbers' | 'nickname' | 'banner' | 'avatar';
  rarity: Rarity;
  price: { credits?: number; shards?: number };
  owned?: boolean;
}

export interface SkillNode {
  id: string;
  branch: SkillBranch;
  name: string;
  description: string;
  maxLevel: number;
  type: 'passive' | 'active';
  costPerLevel: number;
  requires?: string;
}

export interface ShopItem extends CosmeticSkin {
  category: 'skin' | 'effect' | 'emote' | 'banner' | 'trail' | 'uiTheme';
}

export interface LootCapsule {
  id: string;
  source: 'boss' | 'pvp' | 'planet' | 'ufo';
  rarity: Rarity;
  opened: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  progress: number;
  reward: { credits: number; shipXp: number; shards?: number; loot?: boolean };
}

export interface BattlePassTier {
  level: number;
  freeReward?: string;
  premiumReward?: string;
}

export type ModuleLevels = {
  reactor: number;
  hull: number;
  targeting: number;
  thrusters: number;
};

export interface PlayerProfile {
  id: string;
  /** Привязка сохранения к аккаунту */
  accountId: string;
  nickname: string;
  /** Уровень корабля 1–100 — только задания и апгрейды */
  shipLevel: number;
  shipXp: number;
  shipXpToNext: number;
  moduleLevels: ModuleLevels;
  level: number;
  xp: number;
  xpToNext: number;
  rank: string;
  mmr: number;
  credits: number;
  cosmicShards: number;
  title: string;
  clanTag: string;
  friends: string[];
  equipped: Record<EquipSlot, string | null>;
  ownedEquipment: string[];
  ownedCosmetics: string[];
  unlockedSkills: Record<string, number>;
  activeBranch: SkillBranch;
  loadout: {
    weapon: LoadoutWeapon;
    ability: LoadoutAbility;
    passive: LoadoutPassive;
    laserSkin: string;
    shipSkin: string;
    explosionSkin: string;
  };
  inventory: LootCapsule[];
  dailyQuests: DailyQuest[];
  battlePassLevel: number;
  battlePassPremium: boolean;
  battlePassXp: number;
  seasonId: string;
  stats: {
    planetsDestroyed: number;
    pvpWins: number;
    bossesKilled: number;
    ufoKills: number;
    matchesPlayed: number;
  };
  achievements: string[];
  recentMatches: { result: 'win' | 'loss'; mode: string; score: number }[];
  cosmeticEffects: {
    trail: string | null;
    killEffect: string | null;
    damageNumbers: string | null;
    banner: string | null;
    avatar: string | null;
  };
  firstVisitDone: boolean;
}
