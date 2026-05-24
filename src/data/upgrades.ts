export type ModuleId = 'reactor' | 'hull' | 'targeting' | 'thrusters';

export const MAX_UPGRADE_LEVEL = 100;

export const SHIP_MODULES: {
  id: ModuleId;
  name: string;
  desc: string;
  stat: string;
}[] = [
  { id: 'reactor', name: 'Реактор', desc: '+урон лазера', stat: 'damage' },
  { id: 'hull', name: 'Корпус', desc: '+HP корабля', stat: 'hp' },
  { id: 'targeting', name: 'Наведение', desc: '+скорострельность', stat: 'fireRate' },
  { id: 'thrusters', name: 'Двигатели', desc: '+скорость', stat: 'speed' },
];

export function moduleUpgradeCost(level: number): { credits: number; minShipLevel: number } {
  const next = level + 1;
  return {
    credits: 80 + next * 45,
    minShipLevel: Math.max(1, Math.ceil(next / 10)),
  };
}
