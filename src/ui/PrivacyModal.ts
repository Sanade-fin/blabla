import { setPrivacyConsent } from '../core/PrivacyConsent';

export function showPrivacyModal(onAccepted?: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal privacy-modal">
      <h2 class="section-title" style="font-size:16px">Политика данных</h2>
      <div class="privacy-modal__body">
        <p>Данные хранятся <strong>только в браузере</strong> на этом устройстве: логин, прогресс, достижения, настройки звука.</p>
        <p>Мы не отправляем данные на сервер. Очистка кэша браузера удалит аккаунт.</p>
      </div>
      ${onAccepted ? `<button type="button" class="btn-primary" style="width:100%;margin-top:12px" id="privacy-agree">Согласен и продолжить</button>` : ''}
      <button type="button" class="btn-secondary" style="width:100%;margin-top:8px" id="privacy-close">Закрыть</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#privacy-close')!.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#privacy-agree')?.addEventListener('click', () => {
    setPrivacyConsent(true);
    overlay.remove();
    onAccepted?.();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

export function footerLinksHtml(opts?: { showSupport?: boolean }): string {
  const support =
    opts?.showSupport !== false
      ? `<span class="footer-link-sep">·</span><span class="footer-support">Поддержка: support@cosmic-destroyer.local</span>`
      : '';
  return `
    <div class="app-footer-links">
      <button type="button" class="footer-link" data-action="privacy">Политика данных</button>
      ${support}
    </div>
  `;
}

export function bindFooterLinks(root: ParentNode): void {
  root.querySelectorAll('[data-action="privacy"]').forEach((btn) => {
    (btn as HTMLButtonElement).onclick = () => showPrivacyModal();
  });
}
