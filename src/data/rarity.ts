import type { Rarity } from '../types';

export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'cosmic'];

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  cosmic: 'Cosmic',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8b9cb3',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  cosmic: '#22d3ee',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: 'none',
  rare: '0 0 12px rgba(59,130,246,0.5)',
  epic: '0 0 18px rgba(168,85,247,0.6)',
  legendary: '0 0 22px rgba(245,158,11,0.7)',
  cosmic: '0 0 28px rgba(34,211,238,0.85), 0 0 48px rgba(168,85,247,0.4)',
};
