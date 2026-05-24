export interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

const SETTINGS_KEY = 'cosmic_destroyer_audio';
const MUSIC_SRC = '/audio/bg-music.mp3';
const MUSIC_VOLUME = 0.14;
const SFX_GAIN = 0.85;

class SoundManager {
  private ctx: AudioContext | null = null;
  private music: HTMLAudioElement | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const s = JSON.parse(raw) as AudioSettings;
        this.musicEnabled = s.musicEnabled ?? true;
        this.sfxEnabled = s.sfxEnabled ?? true;
      }
    } catch {
      /* defaults */
    }
    this.applyMusicState();
  }

  private persistSettings(): void {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ musicEnabled: this.musicEnabled, sfxEnabled: this.sfxEnabled }),
    );
  }

  getSettings(): AudioSettings {
    return { musicEnabled: this.musicEnabled, sfxEnabled: this.sfxEnabled };
  }

  /** Синхронизировать HTMLAudio с флагом (без автозапуска) */
  applyMusicState(): void {
    if (!this.music) return;
    if (!this.musicEnabled) {
      this.music.pause();
      this.music.muted = true;
      this.music.volume = 0;
      return;
    }
    this.music.muted = false;
    this.music.volume = MUSIC_VOLUME;
  }

  setMusicEnabled(on: boolean): void {
    this.musicEnabled = on;
    this.persistSettings();
    if (!on) {
      this.stopMusic();
      return;
    }
    this.ensureMusicElement();
    this.applyMusicState();
    void this.startMusic();
  }

  setSfxEnabled(on: boolean): void {
    this.sfxEnabled = on;
    this.persistSettings();
  }

  toggleMusic(): boolean {
    this.setMusicEnabled(!this.musicEnabled);
    return this.musicEnabled;
  }

  toggleSfx(): boolean {
    this.setSfxEnabled(!this.sfxEnabled);
    return this.sfxEnabled;
  }

  private ensureMusicElement(): void {
    if (this.music) return;
    this.music = new Audio(MUSIC_SRC);
    this.music.loop = true;
    this.music.preload = 'auto';
    this.music.addEventListener('play', () => {
      if (!this.musicEnabled && this.music) {
        this.music.pause();
        this.music.muted = true;
      }
    });
  }

  async startMusic(): Promise<void> {
    if (!this.musicEnabled) {
      this.stopMusic();
      return;
    }
    try {
      this.ensureMusicElement();
      this.applyMusicState();
      await this.music!.play();
    } catch {
      /* autoplay blocked until gesture */
    }
  }

  stopMusic(): void {
    this.ensureMusicElement();
    if (!this.music) return;
    this.music.pause();
    try {
      this.music.currentTime = 0;
    } catch {
      /* ignore */
    }
    this.music.muted = true;
    this.music.volume = 0;
  }

  pauseMusic(): void {
    if (!this.music || !this.musicEnabled) return;
    this.music.pause();
  }

  resumeMusic(): void {
    if (!this.musicEnabled) {
      this.stopMusic();
      return;
    }
    void this.startMusic();
  }

  private ac(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain = 0.08,
    slide?: number,
  ): void {
    if (!this.sfxEnabled) return;
    try {
      const c = this.ac();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, c.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
      g.gain.setValueAtTime(gain * SFX_GAIN, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch {
      /* ignore */
    }
  }

  private noise(dur: number, gain = 0.06): void {
    if (!this.sfxEnabled) return;
    try {
      const c = this.ac();
      const bufferSize = c.sampleRate * dur;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buffer;
      const g = c.createGain();
      g.gain.setValueAtTime(gain * SFX_GAIN, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      src.connect(filter);
      filter.connect(g);
      g.connect(c.destination);
      src.start();
    } catch {
      /* ignore */
    }
  }

  shoot(pink = false): void {
    this.tone(pink ? 880 : 620, 0.06, 'square', 0.04, pink ? 1200 : 900);
  }

  explosion(big = false): void {
    this.noise(big ? 0.35 : 0.18, big ? 0.12 : 0.07);
    this.tone(80, big ? 0.4 : 0.22, 'sawtooth', big ? 0.1 : 0.06, 30);
  }

  hit(): void {
    this.tone(200, 0.05, 'triangle', 0.05, 120);
  }

  pickup(): void {
    this.tone(520, 0.08, 'sine', 0.07, 880);
    this.tone(780, 0.1, 'sine', 0.05, 1040);
  }

  milestone(): void {
    this.tone(440, 0.12, 'sine', 0.08, 880);
    this.tone(660, 0.15, 'sine', 0.07, 1320);
    this.tone(880, 0.2, 'sine', 0.06, 1760);
  }

  playerHurt(): void {
    this.tone(150, 0.15, 'sawtooth', 0.07, 80);
  }
}

export const sound = new SoundManager();
