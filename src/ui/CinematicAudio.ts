// The film is one mixed track, controlled by General × Music. Its context is
// created on playback and released with the film; no extra media or scheduler.
export class CinematicAudio {
  private context?: AudioContext;
  private source?: MediaElementAudioSourceNode;
  private gain?: GainNode;
  private volume = 1;

  constructor(private readonly media: HTMLVideoElement) {}

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gain) {
      this.gain.gain.value = this.volume;
      this.media.volume = 1;
      this.media.muted = false;
    } else {
      this.media.volume = this.volume;
      this.media.muted = this.volume === 0;
    }
  }

  unlock(): void {
    try {
      if (!this.context && typeof AudioContext !== 'undefined') {
        this.context = new AudioContext();
        this.source = this.context.createMediaElementSource(this.media);
        this.gain = this.context.createGain();
        this.gain.gain.value = this.volume;
        this.source.connect(this.gain).connect(this.context.destination);
        this.setVolume(this.volume);
      }
      if (this.context && this.context.state !== 'running') void this.context.resume().catch(() => {});
    } catch { /* Native volume/mute remains available if routing is unavailable. */ }
  }

  destroy(): void {
    this.source?.disconnect();
    this.gain?.disconnect();
    void this.context?.close().catch(() => {});
  }
}
