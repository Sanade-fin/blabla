import { sound } from '../audio/SoundManager';

function syncAudioButtons(root: ParentNode): void {
  const s = sound.getSettings();
  root.querySelectorAll('[data-toggle="music"]').forEach((btn) => {
    const b = btn as HTMLButtonElement;
    b.classList.toggle('toggle-on', s.musicEnabled);
    b.classList.toggle('toggle-off', !s.musicEnabled);
  });
  root.querySelectorAll('[data-toggle="sfx"]').forEach((btn) => {
    const b = btn as HTMLButtonElement;
    b.classList.toggle('toggle-on', s.sfxEnabled);
    b.classList.toggle('toggle-off', !s.sfxEnabled);
  });
}

export function bindAudioSettings(root: ParentNode): void {
  syncAudioButtons(root);
  root.querySelectorAll('[data-toggle="music"]').forEach((btn) => {
    (btn as HTMLButtonElement).onclick = () => {
      sound.toggleMusic();
      syncAudioButtons(root);
    };
  });
  root.querySelectorAll('[data-toggle="sfx"]').forEach((btn) => {
    (btn as HTMLButtonElement).onclick = () => {
      sound.toggleSfx();
      syncAudioButtons(root);
    };
  });
}

export function audioSettingsHtml(): string {
  const s = sound.getSettings();
  return `
    <div class="audio-settings">
      <div class="audio-settings__toggles">
        <button type="button" class="btn-audio ${s.musicEnabled ? 'toggle-on' : 'toggle-off'}" data-toggle="music">
          <span class="btn-audio__ico">♫</span>
          <span class="btn-audio__label">Музыка</span>
        </button>
        <button type="button" class="btn-audio ${s.sfxEnabled ? 'toggle-on' : 'toggle-off'}" data-toggle="sfx">
          <span class="btn-audio__ico">🔊</span>
          <span class="btn-audio__label">Эффекты</span>
        </button>
      </div>
    </div>
  `;
}

export function showHangarSettingsModal(): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal settings-modal">
      <h2 class="section-title">НАСТРОЙКИ</h2>
      ${audioSettingsHtml()}
      <button type="button" class="btn-primary" style="margin-top:16px;width:100%" id="settings-close">Закрыть</button>
    </div>
  `;
  document.body.appendChild(overlay);
  bindAudioSettings(overlay);
  overlay.querySelector('#settings-close')!.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
