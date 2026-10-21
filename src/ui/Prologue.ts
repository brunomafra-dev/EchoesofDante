import { CinematicPlayback, type PlaybackState } from './CinematicPlayback';
// One whole-scene animated film with its own original mixed audio.
// Sources and production are documented in docs/cinematic-opening.
export class Prologue {
  readonly view = document.createElement('section');
  readonly video = document.createElement('video');
  private readonly progress = document.createElement('span');
  private readonly error = document.createElement('p');
  private readonly message = document.createElement('span');
  private readonly retryButton = document.createElement('button');
  private readonly playback: CinematicPlayback;
  private readonly soundButton = document.createElement('button');
  private readonly pauseButton = document.createElement('button');
  private frame = 0;
  private active = false;
  private finished = false;

  constructor(private readonly done: () => void, settings: () => void) {
    this.view.className = 'prologue';
    this.view.setAttribute('aria-label', 'Prólogo cinematográfico — chegada a Dante');
    this.video.className = 'prologue-video';
    this.video.setAttribute('aria-label', 'Cinemática da evacuação da Terra e da chegada a Dante.');
    this.video.addEventListener('ended', this.finish);

    const track = document.createElement('div'); track.className = 'prologue-progress'; track.append(this.progress);
    const controls = document.createElement('nav'); controls.className = 'prologue-controls'; controls.setAttribute('aria-label', 'Controles da cinemática');
    this.soundButton.type='button';this.soundButton.dataset.shell='prologue-sound';
    this.soundButton.onclick=()=>{this.video.muted=!this.video.muted;this.updateSound();};
    this.pauseButton.type='button';this.pauseButton.dataset.shell='prologue-pause';this.pauseButton.textContent='PAUSAR';
    this.pauseButton.onclick=()=>{if(this.active)this.pause();else this.resume();};
    this.updateSound();controls.append(this.soundButton,this.pauseButton);
    for (const [label, id, callback] of [
      ['CONFIGURAÇÕES', 'settings', settings],
      ['PULAR', 'prologue-skip', () => this.finish()],
    ] as const) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.shell = id; button.onclick = callback; controls.append(button);
    }
    this.error.className = 'prologue-error'; this.error.setAttribute('role', 'status'); this.error.hidden = true;
    this.retryButton.type = 'button'; this.retryButton.dataset.shell = 'prologue-retry';
    this.retryButton.onclick = () => {
      if (this.view.dataset.state === 'error' || this.view.dataset.state === 'retrying') this.playback.retry();
      this.resume();
    };
    this.error.append(this.message, this.retryButton);
    this.view.append(this.video, this.error, track, controls);
    this.playback = new CinematicPlayback(this.video, this.playbackState);
  }

  volumes(master: number, music: number, _sfx: number): void { this.video.volume=Math.max(0,Math.min(1,master*music)); }

  private updateSound():void {this.soundButton.textContent=this.video.muted?'ATIVAR SOM':'SOM ATIVO';this.soundButton.setAttribute('aria-pressed',String(!this.video.muted));}

  resume(): void {
    if (this.finished) return;
    this.active = true;this.pauseButton.textContent='PAUSAR';
    this.playback.resume();
    cancelAnimationFrame(this.frame); this.frame = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.active = false; this.playback.pause();this.pauseButton.textContent='CONTINUAR';cancelAnimationFrame(this.frame);
  }

  private tick = (): void => {
    if (!this.active || this.finished) return;
    const duration = this.video.duration;
    if (Number.isFinite(duration) && duration > 0) this.progress.style.transform = `scaleX(${Math.min(1, this.video.currentTime / duration)})`;
    this.frame = requestAnimationFrame(this.tick);
  };

  private playbackState = (state: PlaybackState, message: string): void => {
    this.view.dataset.state = state; this.message.textContent = message;
    this.error.hidden = state === 'playing' || state === 'paused';
    this.retryButton.hidden = state === 'loading';
    this.retryButton.textContent = state === 'gesture' ? 'ASSISTIR COM SOM' : 'TENTAR NOVAMENTE';
  };

  private finish = (): void => {
    if (this.finished) return;
    this.finished = true; this.pause(); this.done();
  };

  destroy(): void {
    this.finished = true; this.pause(); this.video.removeEventListener('ended', this.finish);
    this.playback.destroy();this.view.remove();
  }
}
