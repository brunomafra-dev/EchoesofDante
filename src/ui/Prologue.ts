// One whole-scene animated film with its own original mixed audio.
// Sources and production are documented in docs/cinematic-opening.
export class Prologue {
  readonly view = document.createElement('section');
  readonly video = document.createElement('video');
  private readonly progress = document.createElement('span');
  private readonly error = document.createElement('p');
  private readonly soundButton = document.createElement('button');
  private readonly pauseButton = document.createElement('button');
  private frame = 0;
  private active = false;
  private finished = false;

  constructor(private readonly done: () => void, settings: () => void) {
    this.view.className = 'prologue';
    this.view.setAttribute('aria-label', 'Prólogo cinematográfico — chegada a Dante');
    this.video.className = 'prologue-video';
    this.video.src = `${import.meta.env.BASE_URL}assets/cinematic-opening/arrival-whole-scene.mp4`;
    this.video.preload = 'metadata'; this.video.playsInline = true;
    this.video.setAttribute('aria-label', 'Cinemática da evacuação da Terra e da chegada a Dante.');
    this.video.addEventListener('ended', this.finish);
    this.video.addEventListener('error', this.videoError);

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
    this.view.append(this.video, this.error, track, controls);
    document.addEventListener('visibilitychange', this.visibility);
  }

  volumes(master: number, music: number, _sfx: number): void { this.video.volume=Math.max(0,Math.min(1,master*music)); }

  private updateSound():void {this.soundButton.textContent=this.video.muted?'ATIVAR SOM':'SOM ATIVO';this.soundButton.setAttribute('aria-pressed',String(!this.video.muted));}

  resume(): void {
    if (this.finished) return;
    this.active = true;this.pauseButton.textContent='PAUSAR';
    void this.video.play().then(() => { if(!this.active)this.video.pause();else this.view.dataset.state = 'playing'; }).catch(() => {
      if (!this.active || this.finished) return;
      // Mobile browsers can reject unmuted playback after navigation. Preserve
      // the film and offer an explicit sound gesture without blocking arrival.
      this.video.muted=true;this.updateSound();
      void this.video.play().then(()=>{if(!this.active)this.video.pause();else this.view.dataset.state='playing';}).catch(()=>{if(this.active&&!this.finished)this.videoError();});
    });
    cancelAnimationFrame(this.frame); this.frame = requestAnimationFrame(this.tick);
  }

  pause(): void {
    this.active = false; this.video.pause();this.pauseButton.textContent='CONTINUAR';cancelAnimationFrame(this.frame);
  }

  private visibility = (): void => {
    if (document.hidden) {
      this.video.pause();cancelAnimationFrame(this.frame);
    } else if (this.active) {
      this.resume();
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
    this.video.removeAttribute('src');this.video.load();this.view.remove();
  }
}
