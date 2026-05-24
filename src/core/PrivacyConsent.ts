import { showHelpModal } from '../ui/HelpModal';
import { footerLinksHtml, bindFooterLinks, showPrivacyModal } from '../ui/PrivacyModal';

const PRIVACY_KEY = 'cosmic_destroyer_privacy_v1';

export function hasPrivacyConsent(): boolean {
  return localStorage.getItem(PRIVACY_KEY) === 'accepted';
}

export function setPrivacyConsent(accepted: boolean): void {
  if (accepted) localStorage.setItem(PRIVACY_KEY, 'accepted');
  else localStorage.removeItem(PRIVACY_KEY);
}

export function showPrivacyGate(container: HTMLElement, onAccepted: () => void): void {
  if (hasPrivacyConsent()) {
    onAccepted();
    return;
  }
  container.innerHTML = `
    <div class="landing-screen">
      <div class="landing-screen__bg"></div>
      <div class="landing-card">
        <div class="landing-card__logo">COSMIC DESTROYER</div>
        <p class="landing-card__sub">Космический шутер · прогресс на вашем аккаунте</p>
        <button type="button" class="btn-how-to-play" id="landing-howto">📖 Как играть</button>
        <button type="button" class="btn-primary landing-enter" id="landing-enter">Войти в игру</button>
      </div>
      <div class="landing-footer">
        ${footerLinksHtml()}
      </div>
    </div>
  `;
  bindFooterLinks(container);
  container.querySelector('#landing-howto')!.addEventListener('click', () => showHelpModal());
  container.querySelector('#landing-enter')!.addEventListener('click', () => {
    showPrivacyModal(() => onAccepted());
  });
}
