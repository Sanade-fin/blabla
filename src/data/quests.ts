import type { DailyQuest } from '../types';

export function createDailyQuests(): DailyQuest[] {
  return [
    {
      id: 'q_planets',
      title: 'Уничтожить 5 планет',
      target: 5,
      progress: 0,
      reward: { credits: 350, shipXp: 120 },
    },
    {
      id: 'q_pvp',
      title: 'Победить 3 ботов',
      target: 3,
      progress: 0,
      reward: { credits: 450, shipXp: 150, loot: true },
    },
    {
      id: 'q_boss',
      title: 'Набрать 800 очков в бою',
      target: 1,
      progress: 0,
      reward: { credits: 500, shipXp: 200, shards: 3 },
    },
    {
      id: 'q_invasion',
      title: 'Апгрейд любого модуля',
      target: 1,
      progress: 0,
      reward: { credits: 300, shipXp: 100 },
    },
  ];
}
