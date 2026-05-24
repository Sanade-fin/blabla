/** Длительность: ур.1 = 30с, далее +10с, макс 180с */
export const LEVEL_BASE_SEC = 30;
export const LEVEL_SEC_STEP = 10;
export const LEVEL_MAX_SEC = 180;
export const FPS = 60;

export function levelDurationSec(level: number): number {
  return Math.min(LEVEL_MAX_SEC, LEVEL_BASE_SEC + (level - 1) * LEVEL_SEC_STEP);
}

export function levelDurationFrames(level: number): number {
  return levelDurationSec(level) * FPS;
}

export interface LevelDifficulty {
  maxBots: number;
  maxUfo: number;
  botHp: number;
  botDamage: number;
  botAccuracy: number;
  bombCap: number;
  ufoPerPlanet: number;
  botTier: number;
  ufoDamage: number;
  spawnInterval: number;
}

export function getLevelDifficulty(level: number): LevelDifficulty {
  const tier = Math.floor((level - 1) / 2) % 5;
  return {
    maxBots: Math.min(36, 6 + level * 4),
    maxUfo: Math.min(24, 4 + level * 2),
    botHp: 50 + level * 12,
    botDamage: 6 + Math.floor(level * 1.6),
    botAccuracy: 0.12 + level * 0.04,
    bombCap: Math.min(14, Math.max(1, level)),
    ufoPerPlanet: Math.min(5, 1 + Math.floor(level / 2)),
    botTier: tier,
    ufoDamage: 5 + Math.floor(level * 1.1),
    spawnInterval: Math.max(50, 180 - level * 10),
  };
}
