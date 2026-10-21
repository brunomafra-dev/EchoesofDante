export const ARRIVAL_SOURCES = [
  { path: 'assets/cinematic-opening/arrival-compatible-v1.mp4', type: 'video/mp4; codecs="avc1.42E01F, mp4a.40.2"' },
  { path: 'assets/cinematic-opening/arrival-compatible-v1.webm', type: 'video/webm; codecs="vp9, opus"' },
] as const;

export type PlaybackState = 'loading' | 'playing' | 'paused' | 'gesture' | 'retrying' | 'error';

// A denied play() is a permission request, not a broken movie. Source errors
// alone trigger bounded format/network recovery; no timer discards a slow load.
export class CinematicPlayback {
  private index = 0;
  private retries = 0;
  private operation = 0;
  private wanted = false;
  private disposed = false;
  private position = 0;
  private restoring = false;
  private slowTimer = 0;
  private readonly sources: (typeof ARRIVAL_SOURCES)[number][];

  constructor(readonly video: HTMLVideoElement, private readonly update: (state: PlaybackState, message: string) => void) {
    this.sources = ARRIVAL_SOURCES.filter(s => videoSupport(video, s.type));
    // Unknown codec support still gets a real decoding attempt.
    if (!this.sources.length) this.sources = [...ARRIVAL_SOURCES];
    video.preload = 'auto'; video.playsInline = true;
    video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
    video.poster = `${import.meta.env.BASE_URL}assets/prologue/earth.webp`;
    video.addEventListener('error', this.failed);
    video.addEventListener('playing', this.playing);
    video.addEventListener('play', this.nativePlay);
    video.addEventListener('pause', this.nativePause);
    video.addEventListener('waiting', this.waiting);
    video.addEventListener('loadedmetadata', this.restore);
    video.addEventListener('timeupdate', this.remember);
    document.addEventListener('visibilitychange', this.visibility);
    this.load();
  }

  resume(): void {
    if (this.disposed) return;
    this.wanted = true;
    if (this.video.error) { this.retry(); return; }
    const operation = ++this.operation;
    this.update('loading', 'Carregando a abertura…'); this.watchSlowLoad();
    void this.video.play().then(() => {
      if (this.disposed || operation !== this.operation) return;
      if (!this.wanted || document.hidden) this.video.pause();
    }).catch((error: unknown) => {
      if (this.disposed || operation !== this.operation || !this.wanted) return;
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'AbortError') return; // pause/load/visibility interrupted this request.
      if (name === 'NotSupportedError') { this.failed(); return; }
      this.clearSlowLoad();
      this.update('gesture', 'Toque para assistir à abertura com som.');
    });
  }

  pause(): void {
    this.wanted = false; ++this.operation; this.video.pause(); this.clearSlowLoad();
    if (!this.disposed) this.update('paused', 'Abertura pausada.');
  }

  retry(): void {
    if (this.disposed) return;
    this.retries = 0; this.index = 0; this.wanted = true; this.load();
  }

  private load(): void {
    ++this.operation; this.clearSlowLoad();
    this.restoring = true;
    this.update('loading', 'Carregando a abertura…');
    this.video.src = `${import.meta.env.BASE_URL}${this.sources[this.index].path}`;
    this.video.load();
    if (this.wanted && !document.hidden) this.resume();
  }

  private remember = (): void => { if (!this.restoring && this.video.readyState >= 2 && Number.isFinite(this.video.currentTime)) this.position = this.video.currentTime; };
  private restore = (): void => {
    if (this.position > 0 && Number.isFinite(this.video.duration)) this.video.currentTime = Math.min(this.position, this.video.duration - .05);
    this.restoring = false;
  };
  private nativePlay = (): void => { if (this.video.controls && !this.disposed) this.wanted = true; };
  private nativePause = (): void => {
    if (this.video.controls && !document.hidden && !this.restoring && this.wanted) {
      this.wanted = false; this.clearSlowLoad(); this.update('paused', 'Abertura pausada.');
    }
  };
  private playing = (): void => {
    if (!this.wanted || document.hidden) { this.video.pause(); return; }
    this.clearSlowLoad(); this.update('playing', '');
  };
  private waiting = (): void => {
    if (!this.wanted || this.disposed) return;
    this.update('loading', 'Carregando a abertura…'); this.watchSlowLoad();
  };
  private failed = (): void => {
    if (this.disposed) return;
    ++this.operation; this.clearSlowLoad();
    const code = this.video.error?.code;
    if (code === 2 && this.retries++ === 0) { this.load(); return; }
    if (this.index + 1 < this.sources.length) { ++this.index; this.retries = 0; this.load(); return; }
    this.update('error', 'A conexão ou o navegador interrompeu o vídeo. Tente carregar novamente.');
  };
  private watchSlowLoad(): void {
    this.clearSlowLoad();
    this.slowTimer = window.setTimeout(() => {
      if (this.wanted && !this.disposed && this.video.readyState < 3) {
        this.update('retrying', 'A conexão está lenta. Você pode aguardar ou tentar novamente.');
      }
    }, 15000);
  }
  private clearSlowLoad(): void { window.clearTimeout(this.slowTimer); this.slowTimer = 0; }
  private visibility = (): void => {
    if (document.hidden) { ++this.operation; this.video.pause(); this.clearSlowLoad(); }
    else if (this.wanted) this.resume();
  };

  destroy(): void {
    this.disposed = true; this.pause();
    this.video.removeEventListener('error', this.failed);
    this.video.removeEventListener('playing', this.playing);
    this.video.removeEventListener('play', this.nativePlay);
    this.video.removeEventListener('pause', this.nativePause);
    this.video.removeEventListener('waiting', this.waiting);
    this.video.removeEventListener('loadedmetadata', this.restore);
    this.video.removeEventListener('timeupdate', this.remember);
    document.removeEventListener('visibilitychange', this.visibility);
    this.video.removeAttribute('src'); this.video.load();
  }
}

function videoSupport(video: HTMLVideoElement, type: string): boolean { return video.canPlayType(type) !== ''; }
