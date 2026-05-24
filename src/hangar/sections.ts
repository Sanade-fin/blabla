import { BATTLE_PASS_TIERS, CURRENT_SEASON } from '../data/battlePass';
import { ALL_COSMETICS, EXPLOSION_SKINS, LASER_SKINS, SHIP_SKINS } from '../data/cosmetics';
import { shipIconSvg } from '../game/shipIcons';
import { EQUIP_SLOTS, EQUIPMENT_CATALOG, getEquipment } from '../data/equipment';
import { RARITY_COLOR, RARITY_GLOW, RARITY_LABEL } from '../data/rarity';
import { ACHIEVEMENTS, RANK_TIERS, TITLES } from '../data/ranks';
import { FULL_SHOP } from '../data/shop';
import { skillUpgradeCost, SKILL_BRANCHES, SKILL_TREE } from '../data/skills';
import { MAX_UPGRADE_LEVEL, moduleUpgradeCost, SHIP_MODULES } from '../data/upgrades';
import { HELP_SECTIONS } from '../data/helpContent';
import { playerStore } from '../core/PlayerStore';
import type { EquipSlot, Rarity } from '../types';
import type { ModuleId } from '../data/upgrades';

function card(
  html: string,
  rarity: Rarity,
  opts?: { className?: string; data?: Record<string, string> },
): string {
  const cls = opts?.className ?? '';
  const dataAttrs = opts?.data
    ? Object.entries(opts.data)
        .map(([k, v]) => `data-${k}="${v}"`)
        .join(' ')
    : '';
  return `<div class="item-card rarity-${rarity} ${cls}" ${dataAttrs} style="box-shadow:${RARITY_GLOW[rarity]}">
    <div class="rarity-bar" style="background:${RARITY_COLOR[rarity]}"></div>
    ${html}
    <span class="rarity-tag" style="color:${RARITY_COLOR[rarity]}">${RARITY_LABEL[rarity]}</span>
  </div>`;
}

export function renderShipSection(): string {
  const p = playerStore.get();
  const combat = playerStore.getCombatStats();
  const modules = SHIP_MODULES.map((m) => {
    const lvl = p.moduleLevels[m.id];
    const cost = moduleUpgradeCost(lvl);
    const maxed = lvl >= MAX_UPGRADE_LEVEL;
    return card(
      `<h3>${m.name}</h3>
       <p>${m.desc}</p>
       <p><strong>Ур. ${lvl} / ${MAX_UPGRADE_LEVEL}</strong></p>
       <p style="color:var(--muted)">${maxed ? 'Максимум' : `${cost.credits} CR · корабль ${cost.minShipLevel}+`}</p>`,
      lvl >= 50 ? 'legendary' : 'epic',
      maxed
        ? { className: 'owned' }
        : { data: { module: m.id }, className: 'shop-buyable' },
    );
  }).join('');

  const slots = EQUIP_SLOTS.slice(0, 4).map((s) => {
    const eqId = p.equipped[s.id];
    void (eqId ? getEquipment(eqId) : null);
    const items = EQUIPMENT_CATALOG.filter((i) => i.slot === s.id);
    return `
      <div style="margin-bottom:20px">
        <h3 style="font-family:var(--font-display);font-size:14px;margin:0 0 8px">${s.label}</h3>
        <div class="grid-2" data-slot="${s.id}">
          ${items
            .map((item) => {
              const equipped = eqId === item.id;
              return card(
                `<h3>${item.name}</h3><p>${item.effect ?? 'Статы: ' + JSON.stringify(item.stats)}</p>`,
                item.rarity,
                {
                  className: equipped ? 'equipped' : '',
                  data: { equip: item.id, slot: s.id },
                },
              );
            })
            .join('')}
        </div>
      </div>`;
  }).join('');

  const statBars = [
    ['Урон', combat.damage],
    ['HP', combat.maxHp],
    ['Скоростр.', combat.fireRate],
    ['Скорость', combat.speed],
  ]
    .map(([label, v]) => {
      const pct = Math.min(100, Number(v) / 3);
      return `<div><div class="hud-row"><span>${label}</span><strong>${Math.floor(Number(v))}</strong></div><div class="stat-bar"><span style="width:${pct}%"></span></div></div>`;
    })
    .join('');

  return `
    <h2 class="section-title">КОРАБЛЬ</h2>
    <p class="section-sub">Уровень корабля <strong>${p.shipLevel}</strong>/100 · XP ${p.shipXp}/${p.shipXpToNext} (только задания и апгрейды)</p>
    <div class="stat-grid">${statBars}</div>
    <h3 style="margin-top:20px">Модули (макс. ${MAX_UPGRADE_LEVEL})</h3>
    <div class="grid-2">${modules}</div>
    <h3 style="margin-top:20px">Экипировка</h3>
    ${slots}
  `;
}

export function renderWeaponsSection(): string {
  const p = playerStore.get();
  const weapons = [
    { id: 'laser', name: 'Лазеры', desc: 'Основное оружие' },
    { id: 'plasma', name: 'Plasma', desc: 'DoT урон' },
    { id: 'rockets', name: 'Rockets', desc: 'AoE залпы' },
    { id: 'drones', name: 'Drones', desc: 'Автономные единицы' },
    { id: 'orbital', name: 'Orbital', desc: 'Орбитальные удары' },
  ];
  return `
    <h2 class="section-title">ОРУЖИЕ</h2>
    <p class="section-sub">Лазеры, plasma, rockets, drones, orbital</p>
    <div class="grid-2">
      ${weapons
        .map(
          (w) =>
            card(`<h3>${w.name}</h3><p>${w.desc}</p>`, 'rare', {
              className: p.loadout.weapon === w.id ? 'equipped' : '',
            }),
        )
        .join('')}
    </div>
    <h3 style="margin-top:24px">Скины лазеров</h3>
    <div class="grid-2">
      ${LASER_SKINS.map((l) =>
        card(`<h3>${l.name}</h3><p>Particles + beam + impact</p>`, l.rarity, {
          className: p.loadout.laserSkin === l.id ? 'equipped' : '',
          data: { laserSkin: l.id },
        }),
      ).join('')}
    </div>
  `;
}

export function renderSkillsSection(): string {
  const p = playerStore.get();
  const branches = SKILL_BRANCHES.map(
    (b) =>
      `<button class="branch-tab ${p.activeBranch === b.id ? 'active' : ''}" data-branch="${b.id}">${b.label}</button>`,
  ).join('');
  const nodes = SKILL_TREE.filter((n) => n.branch === p.activeBranch)
    .map((n) => {
      const lvl = p.unlockedSkills[n.id] ?? 0;
      const maxed = lvl >= n.maxLevel;
      const cost = skillUpgradeCost(n.id, lvl);
      const locked = n.requires && (p.unlockedSkills[n.requires] ?? 0) < 1;
      return card(
        `<h3>${n.name}</h3>
         <p>${n.description}</p>
         <p><strong>Ур. ${lvl} / ${n.maxLevel}</strong></p>
         <p style="color:var(--muted)">${locked ? 'Нужен предыдущий навык' : maxed ? 'Максимум' : `Улучшить: ${cost} CR`}</p>`,
        'epic',
        locked || maxed
          ? { className: locked ? '' : 'owned' }
          : { data: { skill: n.id }, className: 'shop-buyable' },
      );
    })
    .join('');
  return `
    <h2 class="section-title">НАВЫКИ</h2>
    <p class="section-sub">Покупка уровней навыков · эффект в бою · макс. 100</p>
    <div class="skill-branch-tabs">${branches}</div>
    <div class="grid-2">${nodes}</div>
    <p style="margin-top:16px;color:var(--muted);font-size:13px">В бою: урон, HP, крит, взрывы, скорость — растут с уровнем навыка.</p>
  `;
}

function renderSkinCards(
  items: typeof SHIP_SKINS,
  p: ReturnType<typeof playerStore.get>,
  equippedId: string,
): string {
  return items
    .map((item) => {
      const owned = p.ownedCosmetics.includes(item.id);
      const price =
        item.price.shards != null
          ? `${item.price.shards} Shards`
          : item.price.credits != null
            ? `${item.price.credits} CR`
            : 'Бесплатно';
      const icon =
        item.kind === 'ship'
          ? `<div class="skin-card-icon">${shipIconSvg(item.id)}</div>`
          : '';
      return card(
        `${icon}<h3>${item.name}</h3>
         <p>${owned ? (equippedId === item.id ? '✓ Активен' : '✓ Куплено — клик применить') : price}</p>`,
        item.rarity,
        owned
          ? {
              className: equippedId === item.id ? 'equipped' : 'owned shop-buyable',
              data: { equipSkin: item.id },
            }
          : { data: { buy: item.id }, className: 'shop-buyable' },
      );
    })
    .join('');
}

export function renderShopSection(): string {
  const p = playerStore.get();
  const extras = FULL_SHOP.filter(
    (i) =>
      !i.id.startsWith('ship_') &&
      !i.id.startsWith('laser_') &&
      !i.id.startsWith('exp_'),
  );
  return `
    <h2 class="section-title">МАГАЗИН</h2>
    <p class="section-sub">Скины кораблей и лазеров · без pay-to-win</p>
    <p style="color:var(--muted);margin-bottom:16px">Credits: ${p.credits} · Shards: ${p.cosmicShards}</p>
    <h3>Скины кораблей</h3>
    <div class="grid-2">${renderSkinCards(SHIP_SKINS, p, p.loadout.shipSkin)}</div>
    <h3 style="margin-top:20px">Скины лазеров</h3>
    <div class="grid-2">${renderSkinCards(LASER_SKINS, p, p.loadout.laserSkin)}</div>
    <h3 style="margin-top:20px">Скины взрывов</h3>
    <p style="color:var(--muted);font-size:13px;margin-bottom:8px">Клик по купленному — применить в бою</p>
    <div class="grid-2">${renderSkinCards(EXPLOSION_SKINS, p, p.loadout.explosionSkin)}</div>
    <h3 style="margin-top:20px">Другие эффекты</h3>
    <div class="grid-2">
      ${extras
        .map((item) => {
          const owned = p.ownedCosmetics.includes(item.id);
          const price =
            item.price.shards != null
              ? `${item.price.shards} Shards`
              : item.price.credits != null
                ? `${item.price.credits} CR`
                : 'Free';
          return card(
            `<h3>${item.name}</h3><p>${owned ? '✓ Куплено' : price}</p>`,
            item.rarity,
            owned
              ? { className: 'owned' }
              : { data: { buy: item.id }, className: 'shop-buyable' },
          );
        })
        .join('')}
    </div>
  `;
}

export function renderRanksSection(): string {
  const p = playerStore.get();
  const tiers = RANK_TIERS.map(
    (t) =>
      `<div class="hud-row"><span>${t.icon} ${t.name}</span><span>${t.mmr}+ MMR</span></div>`,
  ).join('');
  const ach = ACHIEVEMENTS.map(
    (a) =>
      `<div class="quest-row"><span>${a.name}</span><span>${p.achievements.includes(a.id) ? '✓' : '—'}</span></div>`,
  ).join('');
  return `
    <h2 class="section-title">РАНГИ</h2>
    <p class="section-sub">MMR ${p.mmr} · ${p.rank} · Сезон ${CURRENT_SEASON.name}</p>
    <div class="hud-card" style="margin-bottom:16px">${tiers}</div>
    <h3>Титулы</h3>
    <p>${TITLES.map((t) => `<span class="rarity-tag" style="margin:4px;color:var(--gold)">${t}</span>`).join('')}</p>
    <p style="margin-top:12px">Активный: <strong>${p.title}</strong></p>
    <h3 style="margin-top:20px">Достижения</h3>
    ${ach}
    <h3 style="margin-top:20px">Статистика</h3>
    <div class="stat-grid">
      <div class="hud-row"><span>Планеты</span><strong>${p.stats.planetsDestroyed}</strong></div>
      <div class="hud-row"><span>PvP победы</span><strong>${p.stats.pvpWins}</strong></div>
      <div class="hud-row"><span>Боссы</span><strong>${p.stats.bossesKilled}</strong></div>
      <div class="hud-row"><span>НЛО</span><strong>${p.stats.ufoKills}</strong></div>
    </div>
  `;
}

export function renderInventorySection(): string {
  const p = playerStore.get();
  const capsules = p.inventory.filter((c) => !c.opened);
  const lootHtml =
    capsules.length === 0
      ? '<p style="color:var(--muted)">Нет капсул. Играйте матчи и побеждайте боссов!</p>'
      : capsules
          .map(
            (c) =>
              card(
                `<h3>Loot Capsule</h3><p>${c.source.toUpperCase()} · ${RARITY_LABEL[c.rarity]}</p>`,
                c.rarity,
                { data: { openLoot: c.id } },
              ),
          )
          .join('');
  const modules = EQUIPMENT_CATALOG.filter((e) => p.ownedEquipment.includes(e.id))
    .map((e) => card(`<h3>${e.name}</h3><p>${e.slot}</p>`, e.rarity))
    .join('');
  const cos = ALL_COSMETICS.filter((c) => p.ownedCosmetics.includes(c.id))
    .map((c) => card(`<h3>${c.name}</h3><p>${c.kind}</p>`, c.rarity))
    .join('');
  return `
    <h2 class="section-title">ИНВЕНТАРЬ</h2>
    <p class="section-sub">Loot · Modules · Rare items · Cosmetics</p>
    <h3>Loot Capsules</h3>
    <div class="grid-2">${lootHtml}</div>
    <h3 style="margin-top:20px">Модули</h3>
    <div class="grid-2">${modules}</div>
    <h3 style="margin-top:20px">Коллекция</h3>
    <div class="grid-2">${cos}</div>
  `;
}

export function renderBattlePassSection(): string {
  const p = playerStore.get();
  const tiers = BATTLE_PASS_TIERS.slice(0, 20)
    .map((t) => {
      const unlocked = p.battlePassLevel >= t.level;
      return `<div class="bp-tier ${unlocked ? 'unlocked' : ''}">
        <div>${t.level}</div>
        <div style="font-size:10px;color:var(--muted)">${t.premiumReward ?? t.freeReward ?? '—'}</div>
      </div>`;
    })
    .join('');
  return `
    <h2 class="section-title">BATTLE PASS</h2>
    <p class="section-sub">Сезон: ${CURRENT_SEASON.name} · Уровень ${p.battlePassLevel}/50</p>
    <div class="stat-bar" style="margin-bottom:16px"><span style="width:${(p.battlePassXp / 1000) * 100}%"></span></div>
    <button class="btn-secondary" data-bp-premium>${p.battlePassPremium ? 'Premium активен' : 'Купить Premium (косметика)'}</button>
    <div class="bp-track" style="margin-top:16px">${tiers}</div>
    <h3 style="margin-top:16px">Скины кораблей (сезонные)</h3>
    <div class="grid-2">${SHIP_SKINS.slice(4)
      .map((s) => card(`<h3>${s.name}</h3><p>Battle Pass reward</p>`, s.rarity))
      .join('')}</div>
    <h3 style="margin-top:16px">Скины взрывов</h3>
    <div class="grid-2">${EXPLOSION_SKINS.map((e) => card(`<h3>${e.name}</h3>`, e.rarity)).join('')}</div>
  `;
}

export function renderSocialSidebar(): string {
  const p = playerStore.get();
  const friends = p.friends
    .map(
      (f) =>
        `<li><span>${f}</span><button class="btn-secondary" style="padding:4px 10px;font-size:12px" data-inspect="${f}">Inspect</button></li>`,
    )
    .join('');
  const matches = p.recentMatches
    .map(
      (m) =>
        `<li><span>${m.mode}</span><span style="color:${m.result === 'win' ? 'var(--success)' : 'var(--danger)'}">${m.result} · ${m.score}</span></li>`,
    )
    .join('');
  return `
    <div class="hud-card">
      <h4>${p.clanTag} ${p.nickname}</h4>
      <div class="hud-row"><span>Ранг</span><strong>${p.rank}</strong></div>
      <div class="hud-row"><span>Корабль</span><strong>Lv.${p.shipLevel}</strong></div>
      <div class="hud-row"><span>Титул</span><strong>${p.title}</strong></div>
    </div>
    <div class="hud-card">
      <h4>Экипировка</h4>
      ${EQUIP_SLOTS.slice(0, 4)
        .map((s) => {
          const id = p.equipped[s.id];
          const name = id ? getEquipment(id)?.name ?? '—' : '—';
          return `<div class="hud-row"><span>${s.label}</span><strong>${name}</strong></div>`;
        })
        .join('')}
    </div>
    <div class="hud-card">
      <h4>Активный лазер</h4>
      <div class="hud-row"><span>Skin</span><strong>${p.loadout.laserSkin}</strong></div>
      <div class="hud-row"><span>Explosion</span><strong>${p.loadout.explosionSkin}</strong></div>
    </div>
    <div class="hud-card" style="pointer-events:auto">
      <h4>Друзья</h4>
      <ul class="social-list">${friends}</ul>
      <h4 style="margin-top:12px">Недавние матчи</h4>
      <ul class="social-list">${matches}</ul>
      <p style="font-size:12px;color:var(--muted);margin-top:8px">Реакции: 👍 🔥 💀 🚀</p>
    </div>
  `;
}

export function renderDailyQuests(): string {
  const quests = playerStore.get().dailyQuests;
  return quests
    .map((q) => {
      const done = q.progress >= q.target;
      const pct = (q.progress / q.target) * 100;
      return `<div class="quest-row">
        <div style="flex:1">
          <div>${q.title}</div>
          <div class="quest-progress"><span style="width:${pct}%"></span></div>
        </div>
        <button class="btn-secondary" data-claim-quest="${q.id}" ${done ? '' : 'disabled'}>Claim</button>
      </div>`;
    })
    .join('');
}

export function renderHelpSection(): string {
  const blocks = HELP_SECTIONS.map(
    (s) => `
    <div class="hud-card" style="margin-bottom:14px">
      <h3 style="margin:0 0 8px;font-family:var(--font-display);font-size:14px;color:var(--accent)">${s.title}</h3>
      <ul class="help-list">${s.items.map((i) => `<li>${i}</li>`).join('')}</ul>
    </div>
  `,
  ).join('');
  return `
    <h2 class="section-title">ПОМОЩЬ</h2>
    <p class="section-sub">Инструкция · бусты · поддержка</p>
    ${blocks}
    <p style="color:var(--muted);font-size:12px;margin-top:16px">В бою: ESC → пауза → «Инструкция и поддержка»</p>
  `;
}

export type HangarTab =
  | 'ship'
  | 'weapons'
  | 'skills'
  | 'shop'
  | 'ranks'
  | 'inventory'
  | 'battlepass'
  | 'help';

export const TAB_RENDERERS: Record<HangarTab, () => string> = {
  ship: renderShipSection,
  weapons: renderWeaponsSection,
  skills: renderSkillsSection,
  shop: renderShopSection,
  ranks: renderRanksSection,
  inventory: renderInventorySection,
  battlepass: renderBattlePassSection,
  help: renderHelpSection,
};

function showToast(msg: string, kind: 'success' | 'error'): void {
  const t = document.createElement('div');
  t.className = `game-toast game-toast--${kind}`;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => t.remove(), 2800);
}

export function bindSectionEvents(root: HTMLElement, onRefresh: () => void): void {
  root.querySelectorAll('[data-equip]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.equip!;
      const slot = (el as HTMLElement).dataset.slot as EquipSlot;
      playerStore.equipItem(slot, id);
      onRefresh();
    });
  });

  root.querySelectorAll('[data-skill]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.skill!;
      const ok = playerStore.buySkillLevel(id);
      showToast(ok ? 'Навык улучшен' : 'Недостаточно CR или требований', ok ? 'success' : 'error');
      onRefresh();
    });
  });

  root.querySelectorAll('[data-module]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.module as ModuleId;
      const ok = playerStore.upgradeModule(id);
      showToast(
        ok ? 'Модуль улучшен (+XP корабля)' : 'Недостаточно CR или уровня корабля',
        ok ? 'success' : 'error',
      );
      onRefresh();
    });
  });

  root.querySelectorAll('[data-equip-skin]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.equipSkin!;
      if (!playerStore.get().ownedCosmetics.includes(id)) return;
      if (id.startsWith('ship_')) playerStore.setLoadout({ shipSkin: id });
      if (id.startsWith('laser_')) playerStore.setLoadout({ laserSkin: id });
      if (id.startsWith('exp_')) playerStore.setLoadout({ explosionSkin: id });
      showToast('Скин активирован', 'success');
      onRefresh();
    });
  });

  root.querySelectorAll('[data-branch]').forEach((el) => {
    el.addEventListener('click', () => {
      playerStore.setBranch((el as HTMLElement).dataset.branch as never);
      onRefresh();
    });
  });

  root.querySelectorAll('[data-buy]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (el as HTMLElement).dataset.buy!;
      const item = FULL_SHOP.find((s) => s.id === id);
      if (!item) return;
      const ok = playerStore.buyCosmetic(id, item.price);
      showToast(
        ok ? `Куплено: ${item.name}` : 'Недостаточно валюты или уже есть',
        ok ? 'success' : 'error',
      );
      onRefresh();
    });
  });

  root.querySelectorAll('[data-laser-skin]').forEach((el) => {
    el.addEventListener('click', () => {
      playerStore.setLoadout({ laserSkin: (el as HTMLElement).dataset.laserSkin });
      onRefresh();
    });
  });

  root.querySelectorAll('[data-open-loot]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.openLoot!;
      window.dispatchEvent(new CustomEvent('open-loot', { detail: id }));
    });
  });

  root.querySelectorAll('[data-claim-quest]').forEach((el) => {
    el.addEventListener('click', () => {
      playerStore.claimQuest((el as HTMLElement).dataset.claimQuest!);
      onRefresh();
    });
  });

  root.querySelectorAll('[data-inspect]').forEach((el) => {
    el.addEventListener('click', () => {
      alert(`Inspect: ${(el as HTMLElement).dataset.inspect}\n(Profile showcase — demo)`);
    });
  });
}
