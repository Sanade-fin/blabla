import { AuthScreen } from './auth/AuthScreen';
import { authService } from './core/AuthService';
import { hasPrivacyConsent, showPrivacyGate } from './core/PrivacyConsent';
import { playerStore } from './core/PlayerStore';
import { sound } from './audio/SoundManager';
import { HangarApp } from './hangar/HangarApp';
import { Arena } from './game/Arena';

const app = document.getElementById('app')!;
let hangar: HangarApp | null = null;
let authScreen: AuthScreen | null = null;

function showAuth(): void {
  hangar?.destroy();
  hangar = null;
  authScreen?.destroy();
  authScreen = new AuthScreen(app, () => {
    authScreen?.destroy();
    authScreen = null;
    if (sound.getSettings().musicEnabled) void sound.startMusic();
    showHangar();
  });
}

function showHangar(): void {
  if (!authService.isLoggedIn() || !playerStore.isReady()) {
    showAuth();
    return;
  }
  hangar = new HangarApp(app, () => {
    authService.logout();
    playerStore.clearAccount();
    sound.stopMusic();
    showAuth();
  });
}

function showArena(): void {
  hangar?.destroy();
  hangar = null;
  app.innerHTML = '';
  sound.resumeMusic();
  new Arena(app, () => {
    app.innerHTML = '';
    if (sound.getSettings().musicEnabled) void sound.startMusic();
    showHangar();
  });
}

function continueBoot(): void {
  if (authService.restoreSession()) {
    const s = authService.getSession()!;
    playerStore.loadForAccount(s.accountId, s.username);
    if (sound.getSettings().musicEnabled) void sound.startMusic();
    showHangar();
  } else {
    showAuth();
  }
}

function boot(): void {
  if (!hasPrivacyConsent()) {
    showPrivacyGate(app, continueBoot);
    return;
  }
  continueBoot();
}

window.addEventListener('start-match', showArena);
window.addEventListener('restart-match', showArena);
boot();
