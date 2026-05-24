export const RANK_TIERS = [
  { mmr: 0, name: 'Cadet', icon: '◆' },
  { mmr: 800, name: 'Pilot', icon: '◇' },
  { mmr: 1200, name: 'Ace', icon: '★' },
  { mmr: 1600, name: 'Elite', icon: '✦' },
  { mmr: 2000, name: 'Veteran', icon: '✧' },
  { mmr: 2400, name: 'Champion', icon: '⚔' },
  { mmr: 2800, name: 'Legend', icon: '☄' },
  { mmr: 3200, name: 'Mythic', icon: '◎' },
];

export const TITLES = [
  'Planet Destroyer',
  'UFO Slayer',
  'Cosmic Hunter',
  'Galaxy Reaper',
  'Void Emperor',
  'Space God',
];

export const ACHIEVEMENTS = [
  { id: 'ach_planets_100', name: '100 планет', desc: 'Уничтожьте 100 планет' },
  { id: 'ach_pvp_10', name: '10 PvP побед', desc: 'Победите 10 игроков' },
  { id: 'ach_boss_5', name: '5 боссов', desc: 'Победите 5 боссов' },
  { id: 'ach_invasion', name: 'Invasion Survivor', desc: 'Переживите invasion event' },
  { id: 'ach_cosmic_skin', name: 'Cosmic Collector', desc: 'Получите cosmic скин' },
];

export function rankFromMmr(mmr: number): string {
  let rank = RANK_TIERS[0].name;
  for (const t of RANK_TIERS) {
    if (mmr >= t.mmr) rank = t.name;
  }
  return rank;
}
