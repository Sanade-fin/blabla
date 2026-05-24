import type { PlayerProfile } from '../types';

export function laserColor(skinId: string, fallback = '#38bdf8'): string {
  const map: Record<string, string> = {
    laser_default: '#38bdf8',
    laser_void: '#a78bfa',
    laser_plasma: '#22c55e',
    laser_cosmic: '#f472b6',
    laser_lightning: '#fde047',
    laser_toxic: '#84cc16',
    laser_sakura: '#f9a8d4',
    laser_quantum: '#67e8f9',
    laser_pink: '#ff69b4',
  };
  return map[skinId] ?? fallback;
}

export function explosionColor(skinId: string): string {
  const map: Record<string, string> = {
    exp_default: '#38bdf8',
    exp_nova: '#a855f7',
    exp_plasma: '#22c55e',
    exp_pink: '#ff69b4',
    exp_blackhole: '#67e8f9',
    exp_implosion: '#c4b5fd',
    exp_galaxy: '#f472b6',
  };
  return map[skinId] ?? '#38bdf8';
}

export function isPinkLoadout(loadout: PlayerProfile['loadout']): boolean {
  return (
    loadout.shipSkin === 'ship_pink' ||
    loadout.laserSkin === 'laser_pink' ||
    loadout.explosionSkin === 'exp_pink'
  );
}
