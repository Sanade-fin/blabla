export type PowerUpKind = 'damage' | 'rapid' | 'shield' | 'repair' | 'plasma' | 'magnet' | 'armor';

export interface PowerUpDef {
  kind: PowerUpKind;
  label: string;
  shortLabel: string;
  effect: string;
  color: string;
  icon: string;
}

export const BOOST_DURATION_SECONDS = [5, 10, 15, 20, 25, 30];
export const MAX_ACTIVE_BOOSTS = 3;
export const FPS = 60;
export const MAX_PICKUPS_ON_MAP = 5;

export const POWERUP_DEFS: Record<PowerUpKind, PowerUpDef> = {
  damage: {
    kind: 'damage',
    label: 'Урон ×2',
    shortLabel: '×2 УРОН',
    effect: 'Удваивает урон лазера',
    color: '#f59e0b',
    icon: '⚡',
  },
  rapid: {
    kind: 'rapid',
    label: 'Автопал',
    shortLabel: 'СКОРОСТР',
    effect: 'Быстрее стрельба и +25% скорости',
    color: '#38bdf8',
    icon: '🔫',
  },
  shield: {
    kind: 'shield',
    label: 'Энергощит',
    shortLabel: 'ЩИТ',
    effect: 'Доп. полоска щита поглощает урон',
    color: '#a78bfa',
    icon: '🛡',
  },
  repair: {
    kind: 'repair',
    label: 'Ремонт',
    shortLabel: '+HP',
    effect: 'Мгновенно +35% от макс. HP',
    color: '#4ade80',
    icon: '♥',
  },
  plasma: {
    kind: 'plasma',
    label: 'Плазма',
    shortLabel: 'ПЛАЗМА',
    effect: 'Зелёные снаряды, усиленный урон',
    color: '#22c55e',
    icon: '☄',
  },
  magnet: {
    kind: 'magnet',
    label: 'Магнит',
    shortLabel: 'МОНЕТЫ',
    effect: 'Монеты летят к кораблю с большой дистанции',
    color: '#fbbf24',
    icon: '🧲',
  },
  armor: {
    kind: 'armor',
    label: 'Броня',
    shortLabel: 'БРОНЯ',
    effect: '−50% получаемого урона на время',
    color: '#94a3b8',
    icon: '🛡️',
  },
};

export const POWERUP_KINDS = Object.keys(POWERUP_DEFS) as PowerUpKind[];

export function boostDurationFrames(stackIndex: number): number {
  const sec = BOOST_DURATION_SECONDS[Math.min(stackIndex, BOOST_DURATION_SECONDS.length - 1)];
  return sec * FPS;
}
