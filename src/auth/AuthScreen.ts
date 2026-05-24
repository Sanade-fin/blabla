import { sound } from '../audio/SoundManager';
import { authService } from '../core/AuthService';
import { playerStore } from '../core/PlayerStore';
import { showHelpModal } from '../ui/HelpModal';
import { footerLinksHtml, bindFooterLinks } from '../ui/PrivacyModal';
import '../styles/global.css';

export class AuthScreen {
  private root: HTMLElement;
  private onSuccess: () => void;
  private mode: 'login' | 'register' = 'login';

  constructor(container: HTMLElement, onSuccess: () => void) {
    this.root = container;
    this.onSuccess = onSuccess;
    this.render();
  }

  private render(): void {
    const isLogin = this.mode === 'login';
    this.root.innerHTML = `
      <div class="auth-screen">
        <div class="auth-screen__bg"></div>
        <div class="auth-card">
          <div class="auth-card__logo">COSMIC DESTROYER</div>
          <p class="auth-card__sub">Войдите или создайте аккаунт — прогресс и достижения сохраняются на устройстве</p>
          <div class="auth-tabs">
            <button type="button" class="auth-tab ${isLogin ? 'active' : ''}" data-mode="login">Вход</button>
            <button type="button" class="auth-tab ${!isLogin ? 'active' : ''}" data-mode="register">Регистрация</button>
          </div>
          <form class="auth-form" id="auth-form">
            <label>
              <span>Имя пилота</span>
              <input type="text" name="username" autocomplete="username" placeholder="NovaPilot" required minlength="3" maxlength="24" />
            </label>
            <label>
              <span>Пароль</span>
              <input type="password" name="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="••••••" required minlength="4" />
            </label>
            ${!isLogin ? '<p class="auth-hint">Данные хранятся локально в браузере (офлайн-аккаунт)</p>' : ''}
            <p class="auth-error hidden" id="auth-error"></p>
            <button type="submit" class="btn-primary auth-submit">${isLogin ? 'Войти в ангар' : 'Создать аккаунт'}</button>
          </form>
          <button type="button" class="btn-how-to-play" id="auth-howto">📖 Как играть</button>
          <div class="auth-footer">${footerLinksHtml()}</div>
        </div>
      </div>
    `;

    this.root.querySelectorAll('.auth-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.mode = (btn as HTMLElement).dataset.mode as 'login' | 'register';
        this.render();
      });
    });

    const form = this.root.querySelector('#auth-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => this.onSubmit(e));
    this.root.querySelector('#auth-howto')!.addEventListener('click', () => showHelpModal());
    bindFooterLinks(this.root);
  }

  private async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const username = String(fd.get('username') ?? '');
    const password = String(fd.get('password') ?? '');
    const errEl = this.root.querySelector('#auth-error') as HTMLElement;

    const result =
      this.mode === 'login'
        ? await authService.login(username, password)
        : await authService.register(username, password);

    if (!result.ok) {
      errEl.textContent = result.error;
      errEl.classList.remove('hidden');
      return;
    }

    const session = authService.getSession()!;
    if ('isNew' in result && result.isNew) {
      playerStore.createNewAccount(session.accountId, session.username);
    } else {
      playerStore.loadForAccount(session.accountId, session.username);
    }
    if (sound.getSettings().musicEnabled) await sound.startMusic();
    this.onSuccess();
  }

  destroy(): void {
    this.root.innerHTML = '';
  }
}
