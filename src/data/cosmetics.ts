import type { CosmeticSkin } from '../types';

export const SHIP_SKINS: CosmeticSkin[] = [
  { id: 'ship_default', name: 'Стандартный корпус', kind: 'ship', rarity: 'common', price: {} },
  { id: 'ship_neon', name: 'Neon Ship', kind: 'ship', rarity: 'epic', price: { credits: 4500 } },
  { id: 'ship_alien', name: 'Alien Ship', kind: 'ship', rarity: 'rare', price: { credits: 2800 } },
  { id: 'ship_crystal', name: 'Crystal Ship', kind: 'ship', rarity: 'legendary', price: { shards: 120 } },
  { id: 'ship_samurai', name: 'Samurai Ship', kind: 'ship', rarity: 'epic', price: { credits: 5200 } },
  { id: 'ship_corrupted', name: 'Corrupted Ship', kind: 'ship', rarity: 'legendary', price: { shards: 90 } },
  { id: 'ship_blackhole', name: 'Black Hole Ship', kind: 'ship', rarity: 'cosmic', price: { shards: 200 } },
  { id: 'ship_dragon', name: 'Cyber Dragon Ship', kind: 'ship', rarity: 'cosmic', price: { shards: 250 } },
  { id: 'ship_pink', name: 'Pink Dream', kind: 'ship', rarity: 'epic', price: { credits: 3200 } },
];

export const LASER_SKINS: CosmeticSkin[] = [
  { id: 'laser_default', name: 'Standard Beam', kind: 'laser', rarity: 'common', price: {} },
  { id: 'laser_plasma', name: 'Plasma Beam', kind: 'laser', rarity: 'rare', price: { credits: 1800 } },
  { id: 'laser_void', name: 'Void Beam', kind: 'laser', rarity: 'epic', price: { credits: 3500 } },
  { id: 'laser_lightning', name: 'Lightning Laser', kind: 'laser', rarity: 'epic', price: { shards: 45 } },
  { id: 'laser_quantum', name: 'Quantum Beam', kind: 'laser', rarity: 'legendary', price: { shards: 80 } },
  { id: 'laser_sakura', name: 'Sakura Laser', kind: 'laser', rarity: 'rare', price: { credits: 2200 } },
  { id: 'laser_toxic', name: 'Toxic Beam', kind: 'laser', rarity: 'rare', price: { credits: 1900 } },
  { id: 'laser_cosmic', name: 'Cosmic Flame', kind: 'laser', rarity: 'cosmic', price: { shards: 150 } },
  { id: 'laser_pink', name: 'Pink Beam', kind: 'laser', rarity: 'epic', price: { credits: 2800 } },
];

export const EXPLOSION_SKINS: CosmeticSkin[] = [
  { id: 'exp_default', name: 'Standard Burst', kind: 'explosion', rarity: 'common', price: {} },
  { id: 'exp_blackhole', name: 'Black Hole Explosion', kind: 'explosion', rarity: 'cosmic', price: { shards: 180 } },
  { id: 'exp_implosion', name: 'Cosmic Implosion', kind: 'explosion', rarity: 'legendary', price: { shards: 70 } },
  { id: 'exp_nova', name: 'Purple Nova', kind: 'explosion', rarity: 'epic', price: { credits: 4000 } },
  { id: 'exp_plasma', name: 'Plasma Burst', kind: 'explosion', rarity: 'rare', price: { credits: 2400 } },
  { id: 'exp_galaxy', name: 'Galaxy Collapse', kind: 'explosion', rarity: 'cosmic', price: { shards: 220 } },
  { id: 'exp_pink', name: 'Pink Nova', kind: 'explosion', rarity: 'epic', price: { credits: 3000 } },
];

export const EXTRA_COSMETICS: CosmeticSkin[] = [
  { id: 'trail_ion', name: 'Ion Trail', kind: 'trail', rarity: 'rare', price: { credits: 1500 } },
  { id: 'trail_nebula', name: 'Nebula Wake', kind: 'trail', rarity: 'legendary', price: { shards: 55 } },
  { id: 'kill_void', name: 'Void Dissolve', kind: 'kill', rarity: 'epic', price: { shards: 40 } },
  { id: 'dmg_holo', name: 'Holo Numbers', kind: 'damageNumbers', rarity: 'rare', price: { credits: 1200 } },
  { id: 'nick_glitch', name: 'Glitch Nickname', kind: 'nickname', rarity: 'epic', price: { shards: 35 } },
  { id: 'banner_war', name: 'Cosmic War Banner', kind: 'banner', rarity: 'legendary', price: { shards: 60 } },
  { id: 'avatar_pulse', name: 'Pulse Avatar', kind: 'avatar', rarity: 'rare', price: { credits: 900 } },
];

export const ALL_COSMETICS = [...SHIP_SKINS, ...LASER_SKINS, ...EXPLOSION_SKINS, ...EXTRA_COSMETICS];

export function getCosmetic(id: string): CosmeticSkin | undefined {
  return ALL_COSMETICS.find((c) => c.id === id);
}
