import { AudioManager } from '../systems/Sound';

// A single offline-rendered film. Its source plates and generation process live
// in public/assets/prologue and scripts/render-prologue-trailer.py.
export class Prologue {
  readonly view = document.createElement('section');
  readonly video = document.createElement('video');
  private readonly progress = document.createElement('span');
  private readonly error = document.createElement('p');
  private readonly sound = new AudioManager();
  private frame = 0;
  private active = false;
  private finished = false;

  constructor(private readonly done: () => void, settings: () => void) {
    this.view.className = 'prologue';
    this.view.setAttribute('aria-label', 'Prólogo cinematográfico — chegada a Dante');
    this.video.className = 'prologue-video';
    this.video.src = `${import.meta.env.BASE_URL}assets/prologue/arrival-trailer.mp4`;
    this.video.preload = 'auto'; this.video.muted = true; this.video.playsInline = true;
    this.video.setAttribute('aria-label', 'Cinemática da evacuação da Terra e da chegada a Dante.');
    this.video.addEventListener('ended', this.finish);
    this.video.addEventListener('error', this.videoError);

    const track = document.createElement('div'); track.className = 'prologue-progress'; track.append(this.progress);
    const controls = document.createElement('nav'); controls.className = 'prologue-controls'; controls.setAttribute('aria-label', 'Controles da cinemática');
    for (const [label, id, callback] of [
      ['SOM', 'prologue-sound', () => this.sound.unlock()],
      ['CONFIGURAÇÕES', 'settings', settings],
      ['PULAR', 'prologue-skip', () => this.finish()],
    ] as const) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.shell = id; button.onclick = callback; controls.append(button);
    }
    this.error.className = 'prologue-error'; this.error.setAttribute('role', 'status'); this.error.hidden = true;
    this.view.append(this.video, this.error, track, controls);
    this.sound.setArea('deep');
    document.addEventListener('visibilitychange', this.visibility);
  }

  volumes(master: number, music: number, sfx: number): void { this.sound.setVolumes(master, music, sfx); }

  resume(): void {
    if (this.finished) return;
    this.active = true; this.sound.setMusicFocus(1); this.sound.unlock();
    void this.video.play().then(() => { this.view.dataset.state = 'playing'; }).catch(() => {
      if (this.active && !this.finished) this.videoError();
    });
    cancelAnimationFrame(this.frame); this.frame = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.active = false; this.video.pause(); this.sound.setMusicFocus(0); cancelAnimationFrame(this.frame);
  }

  private visibility = (): void => {
    if (document.hidden) {
      this.video.pause(); this.sound.setMusicFocus(0); cancelAnimationFrame(this.frame);
    } else if (this.active) {
      this.sound.setMusicFocus(1); void this.video.play().catch(() => this.videoError());
      this.frame = requestAnimationFrame(this.tick);
    }
  };

  private tick = (): void => {
    if (!this.active || this.finished) return;
    const duration = this.video.duration;
    if (Number.isFinite(duration) && duration > 0) this.progress.style.transform = `scaleX(${Math.min(1, this.video.currentTime / duration)})`;
    this.frame = requestAnimationFrame(this.tick);
  };

  private videoError = (): void => {
    this.view.dataset.state = 'error';
    this.error.textContent = 'A cinemática não pôde ser carregada. Pule a abertura para iniciar a expedição.';
    this.error.hidden = false;
  };

  private finish = (): void => {
    if (this.finished) return;
    this.finished = true; this.pause(); this.done();
  };

  destroy(): void {
    this.finished = true; this.pause(); this.video.removeEventListener('ended', this.finish);
    this.video.removeEventListener('error', this.videoError); document.removeEventListener('visibilitychange', this.visibility);
    this.sound.destroy(); this.view.remove();
  }
}
