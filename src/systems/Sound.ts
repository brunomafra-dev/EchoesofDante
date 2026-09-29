export class SoundEffects {
  private context?: AudioContext;

  private tone(frequency: number, endFrequency: number, duration: number, volume: number, type: OscillatorType = 'sine'): void {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch { /* Audio is optional when the browser blocks it. */ }
  }

  swing(): void { this.tone(560, 130, 0.16, 0.055, 'sawtooth'); }
  hit(): void { this.tone(135, 58, 0.13, 0.09, 'triangle'); }
  hurt(): void { this.tone(260, 75, 0.24, 0.085, 'sawtooth'); }
  dash(): void { this.tone(140, 450, 0.19, 0.045, 'triangle'); }
  charge(): void { this.tone(180, 520, 0.16, 0.05, 'triangle'); }
  death(): void { this.tone(230, 45, 0.55, 0.07, 'triangle'); }
  discovery(): void { this.tone(320, 640, 0.7, 0.035, 'sine'); }
}
