import { MAX_UPGRADE_LEVEL } from '../data/upgrades';
import { SKILL_TREE } from '../data/skills';
import type { PlayerProfile, StatBlock } from '../types';

export interface CombatStats extends StatBlock {
  maxHp: number;
  hullRegen: number;
  explosionRadius: number;
  botDamageBonus: number;
  planetDamageBonus: number;
}

export function computeCombatStats(p: PlayerProfile): CombatStats {
  const base: CombatStats = {
    damage: 100,
    fireRate: 100,
    shield: 100,
    armor: 100,
    speed: 100,
    critChance: 5,
    lootBonus: 0,
    maxHp: 100,
    hullRegen: 0,
    explosionRadius: 1,
    botDamageBonus: 0,
    planetDamageBonus: 0,
  };

  const shipLvl = p.shipLevel;
  base.damage += shipLvl * 2;
  base.maxHp += shipLvl * 4;
  base.fireRate += Math.floor(shipLvl * 0.8);
  base.speed += Math.floor(shipLvl * 0.5);

  for (const [mod, lvl] of Object.entries(p.moduleLevels)) {
    const l = Math.min(lvl, MAX_UPGRADE_LEVEL);
    if (mod === 'reactor') base.damage += l * 1.5;
    if (mod === 'hull') base.maxHp += l * 3;
    if (mod === 'targeting') base.fireRate += l * 1.2;
    if (mod === 'thrusters') base.speed += l * 0.8;
  }

  for (const node of SKILL_TREE) {
    const lvl = Math.min(p.unlockedSkills[node.id] ?? 0, node.maxLevel);
    if (lvl <= 0) continue;
    if (node.id === 'des_crit') base.critChance += lvl * 0.15;
    if (node.id === 'des_boom') base.explosionRadius += lvl * 0.02;
    if (node.id === 'des_planet') base.planetDamageBonus += lvl * 0.05;
    if (node.id === 'tank_shield') base.shield += lvl * 2;
    if (node.id === 'tank_armor') base.armor += lvl * 2;
    if (node.id === 'tank_hull') {
      base.maxHp += lvl * 2;
      base.hullRegen += lvl * 0.05;
    }
    if (node.id === 'spd_move') base.speed += lvl * 1;
    if (node.id === 'global_ufo') base.botDamageBonus += lvl * 0.04;
  }

  return base;
}

/** Множитель наград: чем выше уровень корабля, тем меньше «плюшек» с матча */
export function rewardScaleByShipLevel(shipLevel: number): number {
  return Math.max(0.25, 1 - shipLevel / 120);
}
