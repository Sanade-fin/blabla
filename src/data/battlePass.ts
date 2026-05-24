import type { BattlePassTier } from '../types';

export const SEASONS = [
  { id: 'alien_invasion', name: 'Alien Invasion', theme: '#7c3aed' },
  { id: 'black_hole_crisis', name: 'Black Hole Crisis', theme: '#0ea5e9' },
  { id: 'cosmic_war', name: 'Cosmic War', theme: '#ef4444' },
  { id: 'galactic_corruption', name: 'Galactic Corruption', theme: '#22c55e' },
];

export const CURRENT_SEASON = SEASONS[2];

export const BATTLE_PASS_TIERS: BattlePassTier[] = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  return {
    level,
    freeReward: level % 5 === 0 ? `${level * 100} Credits` : level % 3 === 0 ? 'XP Boost' : undefined,
    premiumReward:
      level % 10 === 0
        ? 'Exclusive Skin'
        : level % 7 === 0
          ? 'Animated Effect'
          : level % 4 === 0
            ? 'Cosmic Shards'
            : undefined,
  };
});
