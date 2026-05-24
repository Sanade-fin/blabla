import type { SkillBranch, SkillNode } from '../types';

export const MAX_SKILL_LEVEL = 100;

export const SKILL_BRANCHES: { id: SkillBranch; label: string; desc: string }[] = [
  { id: 'destroyer', label: 'Destroyer', desc: 'Урон и взрывы' },
  { id: 'tank', label: 'Tank', desc: 'HP и броня' },
  { id: 'speedster', label: 'Speedster', desc: 'Скорость' },
];

export const SKILL_TREE: SkillNode[] = [
  {
    id: 'des_crit',
    branch: 'destroyer',
    name: 'Критический урон',
    description: '+крит за уровень',
    maxLevel: MAX_SKILL_LEVEL,
    type: 'passive',
    costPerLevel: 1,
  },
  {
    id: 'des_boom',
    branch: 'destroyer',
    name: 'Взрывы',
    description: 'Радиус взрыва планет',
    maxLevel: MAX_SKILL_LEVEL,
    type: 'passive',
    costPerLevel: 1,
  },
  {
    id: 'des_planet',
    branch: 'destroyer',
    name: 'Разрушитель планет',
    description: 'Бонус урона по планетам',
    maxLevel: MAX_SKILL_LEVEL,
    type: 'passive',
    costPerLevel: 2,
    requires: 'des_boom',
  },
  {
    id: 'tank_shield',
    branch: 'tank',
    name: 'Щит',
    description: 'Поглощение урона',
    maxLevel: MAX_SKILL_LEVEL,
    type: 'passive',
    costPerLevel: 1,
  },
  {
    id: 'tank_hull',
    branch: 'tank',
    name: 'Корпус',
    description: 'HP и реген',
    maxLevel: MAX_SKILL_LEVEL,
    type: 'passive',
    costPerLevel: 1,
  },
  {
    id: 'spd_move',
    branch: 'speedster',
    name: 'Форсаж',
    description: 'Скорость корабля',
    maxLevel: MAX_SKILL_LEVEL,
    type: 'passive',
    costPerLevel: 1,
  },
  {
    id: 'global_ufo',
    branch: 'destroyer',
    name: 'Охотник на ботов',
    description: 'Урон по ботам',
    maxLevel: MAX_SKILL_LEVEL,
    type: 'passive',
    costPerLevel: 1,
  },
];

export function skillUpgradeCost(skillId: string, currentLevel: number): number {
  const node = SKILL_TREE.find((s) => s.id === skillId);
  const base = (node?.costPerLevel ?? 1) * 60;
  return Math.floor(base + currentLevel * 35);
}
