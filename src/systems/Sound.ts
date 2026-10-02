import { AUDIO } from '../config/audio';

type Area = keyof typeof AUDIO.tracks;

// A single music voice and a separate Web Audio SFX bus. Audio remains optional.
export class AudioManager {
  private context?: AudioContext;
  private music?: HTMLAudioElement;
  private area?: Area;
  private unlocked = false;
  private master: number = AUDIO.master;
  private musicVolume: number = AUDIO.music;
  private sfxVolume: number = AUDIO.sfx;
  private musicFocus = 1;

  setMusicFocus(focus: number): void {
    const value = Math.max(0, Math.min(1, focus));
    if (this.musicFocus === value) return;
    this.musicFocus = value;
    if (this.music) this.music.volume = this.master * this.musicVolume * value;
  }

  setVolumes(master: number, music: number, sfx: number): void {
    this.master = Math.max(0, Math.min(1, master));
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    if (this.music) this.music.volume = this.master * this.musicVolume * this.musicFocus;
  }

  setArea(area: Area): void {
    if (this.area === area) return;
    this.music?.pause();
    this.area = area;
    try {
      this.music = new Audio();
      this.music.loop = true;
      this.music.preload = 'none';
      this.music.volume = this.master * this.musicVolume * this.musicFocus;
      this.music.src = `${import.meta.env.BASE_URL}assets/audio/${AUDIO.tracks[area]}`;
      if (this.unlocked) this.playMusic();
    } catch { this.music = undefined; }
  }

  unlock(): void {
    try {
      if (!this.context && typeof AudioContext !== 'undefined') this.context = new AudioContext();
      if (this.context?.state === 'suspended') void this.context.resume().catch(() => {});
      this.unlocked = true;
      this.playMusic();
    } catch { /* Browser audio is optional. */ }
  }

  stopMusic(): void { this.music?.pause(); }

  private playMusic(): void {
    if (this.music?.paused) void this.music.play().catch(() => { /* Autoplay can remain blocked. */ });
  }

  private tone(frequency: number, endFrequency: number, duration: number, volume: number, type: OscillatorType = 'sine'): void {
    if (!this.context) return;
    try {
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
      gain.gain.setValueAtTime(Math.max(0.001, volume * this.master * this.sfxVolume), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch { /* Audio is optional when the device cannot create a voice. */ }
  }

  swing(): void { this.tone(560, 130, 0.16, 0.055, 'sawtooth'); }
  hit(): void { this.tone(135, 58, 0.13, 0.09, 'triangle'); }
  hurt(): void { this.tone(260, 75, 0.24, 0.085, 'sawtooth'); }
  dash(): void { this.tone(140, 450, 0.19, 0.045, 'triangle'); }
  charge(): void { this.tone(180, 520, 0.16, 0.05, 'triangle'); }
  death(): void { this.tone(230, 45, 0.55, 0.07, 'triangle'); }
  discovery(): void { this.tone(320, 640, 0.7, 0.035, 'sine'); }
  ancient(): void {
    this.tone(180, 110, 0.65, 0.045, 'triangle');
    this.tone(360, 280, 0.9, 0.018, 'sine');
  }
  signal(): void {
    this.tone(270, 540, 0.55, 0.035, 'sine');
    this.tone(405, 810, 0.7, 0.015, 'sine');
  }
}
