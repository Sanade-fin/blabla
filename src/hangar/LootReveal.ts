import { RARITY_COLOR, RARITY_LABEL } from '../data/rarity';
import { playerStore } from '../core/PlayerStore';
export function showLootReveal(lootId: string, onClose: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal loot-reveal" id="loot-modal">
      <h2 style="font-family:var(--font-display);margin:0 0 8px">LOOT CAPSULE</h2>
      <p style="color:var(--muted);margin:0 0 20px">Нажмите, чтобы открыть</p>
      <div class="loot-capsule" id="capsule"></div>
      <p id="loot-result" style="min-height:24px"></p>
      <button class="btn-primary" id="loot-close" style="display:none;margin-top:16px">Забрать</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const modal = overlay.querySelector('#loot-modal')!;
  const capsule = overlay.querySelector('#capsule')!;
  const result = overlay.querySelector('#loot-result')!;
  const closeBtn = overlay.querySelector('#loot-close') as HTMLButtonElement;

  const open = () => {
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    modal.classList.add('open');
    const reward = playerStore.openLoot(lootId);
    setTimeout(() => {
      if (reward) {
        result.innerHTML = `<span style="color:${RARITY_COLOR[reward.rarity]};font-size:20px;font-weight:700">${reward.name}</span><br><span style="color:var(--muted)">${RARITY_LABEL[reward.rarity]}</span>`;
      } else {
        result.textContent = 'Капсула уже открыта';
      }
      closeBtn.style.display = 'inline-block';
    }, 700);
  };

  capsule.addEventListener('click', open, { once: true });
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    onClose();
  });
}

export function showLoadoutModal(onClose: () => void): void {
  const p = playerStore.get();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2 class="section-title">LOADOUT</h2>
      <p class="section-sub">Предматчевый билд</p>
      <div class="loadout-grid">
        <div><label>Оружие</label>
          <select id="ld-weapon">
            <option value="laser">Laser</option>
            <option value="plasma">Plasma</option>
            <option value="rockets">Rockets</option>
            <option value="railgun">Railgun</option>
          </select>
        </div>
        <div><label>Способность</label>
          <select id="ld-ability">
            <option value="shield">Shield</option>
            <option value="blackHole">Black Hole</option>
            <option value="emp">EMP</option>
            <option value="dash">Dash</option>
          </select>
        </div>
        <div><label>Пассивный модуль</label>
          <select id="ld-passive">
            <option value="crit">Crit Chance</option>
            <option value="speed">Speed</option>
            <option value="regen">Regeneration</option>
            <option value="lootBoost">Loot Boost</option>
          </select>
        </div>
        <div><label>Скин корабля</label>
          <select id="ld-ship">
            ${p.ownedCosmetics
              .filter((id) => id.startsWith('ship_'))
              .map((id) => `<option value="${id}">${id}</option>`)
              .join('')}
          </select>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px">
        <button class="btn-primary" id="ld-save">Сохранить</button>
        <button class="btn-secondary" id="ld-cancel">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  (overlay.querySelector('#ld-weapon') as HTMLSelectElement).value = p.loadout.weapon;
  (overlay.querySelector('#ld-ability') as HTMLSelectElement).value = p.loadout.ability;
  (overlay.querySelector('#ld-passive') as HTMLSelectElement).value = p.loadout.passive;
  (overlay.querySelector('#ld-ship') as HTMLSelectElement).value = p.loadout.shipSkin;

  overlay.querySelector('#ld-save')!.addEventListener('click', () => {
    playerStore.setLoadout({
      weapon: (overlay.querySelector('#ld-weapon') as HTMLSelectElement).value as never,
      ability: (overlay.querySelector('#ld-ability') as HTMLSelectElement).value as never,
      passive: (overlay.querySelector('#ld-passive') as HTMLSelectElement).value as never,
      shipSkin: (overlay.querySelector('#ld-ship') as HTMLSelectElement).value,
    });
    overlay.remove();
    onClose();
  });
  overlay.querySelector('#ld-cancel')!.addEventListener('click', () => {
    overlay.remove();
    onClose();
  });
}
