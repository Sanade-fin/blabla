import type { DailyQuest } from '../types';
import { playerStore } from '../core/PlayerStore';

const QUEST_ICONS: Record<string, string> = {
  q_planets: '🪐',
  q_pvp: '☠',
  q_boss: '⭐',
  q_invasion: '🔧',
};

function questProgressLabel(q: DailyQuest, matchScore = 0): string {
  if (q.id === 'q_boss') {
    const done = q.progress >= q.target || matchScore >= 800;
    return done ? '800/800 очков' : `${Math.min(800, matchScore)}/800 очков`;
  }
  if (q.id === 'q_invasion') return 'В ангаре';
  return `${q.progress}/${q.target}`;
}

export function renderArenaQuestBoard(matchScore = 0): string {
  const quests = playerStore.get().dailyQuests.filter((q) => q.id !== 'q_invasion');
  const items = quests
    .map((q) => {
      const done = q.id === 'q_boss' ? q.progress >= q.target || matchScore >= 800 : q.progress >= q.target;
      const pct =
        q.id === 'q_boss'
          ? Math.min(100, (Math.max(q.progress, matchScore >= 800 ? 800 : matchScore) / 800) * 100)
          : (q.progress / q.target) * 100;
      return `
        <li class="arena-quest-item ${done ? 'arena-quest-item--done' : ''}" data-qid="${q.id}">
          <span class="arena-quest-item__ico">${QUEST_ICONS[q.id] ?? '•'}</span>
          <div class="arena-quest-item__body">
            <span class="arena-quest-item__title">${q.title}</span>
            <span class="arena-quest-item__prog">${questProgressLabel(q, matchScore)}</span>
            <div class="arena-quest-item__bar"><i style="width:${pct}%"></i></div>
          </div>
          ${done ? '<span class="arena-quest-item__check">✓</span>' : ''}
        </li>
      `;
    })
    .join('');
  return `
    <div class="arena-quests-panel">
      <div class="arena-quests-panel__head">📋 Задания</div>
      <ul class="arena-quests-list">${items}</ul>
      <p class="arena-quests-hint">Уничтожай · собирай монеты 🪙 · бусты на карте</p>
    </div>
  `;
}
