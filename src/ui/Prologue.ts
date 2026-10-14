import { AudioManager } from '../systems/Sound';

export const PROLOGUE_TAKES = [
  { id: 'earth', title: 'O último lar', text: 'A Terra deixou de nos abrigar. Permanecer já não era uma escolha.' },
  { id: 'evacuation', title: 'O que levamos', text: 'Partimos com quem conseguimos salvar. E com a esperança de encontrar outro lar.' },
  { id: 'voyage', title: 'Anos entre estrelas', text: 'A viagem consumiu anos. As naves envelheceram. A procura continuou.' },
  { id: 'dante', title: 'Dante', text: 'Então encontramos Dante. Um mundo vivo, imenso… e ainda desconhecido.' },
  { id: 'landing', title: 'A primeira expedição', text: 'Nossa equipe desceu primeiro. Reconhecer o terreno. Preparar a base. Abrir caminho para os que ainda aguardam.' },
] as const;
const TAKE_MS = 8000;

// Five offline paintings, one reused image and one optional music voice.
// No game clock, combat state or save is advanced by this presentation.
export class Prologue {
  readonly view = document.createElement('section');
  private readonly image = document.createElement('img');
  private readonly caption = document.createElement('div');
  private readonly count = document.createElement('small');
  private readonly heading = document.createElement('h2');
  private readonly text = document.createElement('p');
  private readonly progress = document.createElement('span');
  private readonly sound = new AudioManager();
  private motion?: Animation;
  private frame = 0;
  private last = 0;
  private elapsed = 0;
  private lastPaint = 0;
  private index = 0;
  private active = false;
  private finished = false;
  constructor(private readonly done: () => void, settings: () => void) {
    this.view.className = 'prologue'; this.view.setAttribute('aria-label', 'Prólogo — a chegada a Dante');
    this.image.className = 'prologue-painting'; this.image.alt = '';
    this.caption.className = 'prologue-caption'; this.caption.setAttribute('aria-live', 'polite');
    this.heading.id = 'shell-title'; this.caption.append(this.count, this.heading, this.text);
    const track = document.createElement('div'); track.className = 'prologue-progress'; track.append(this.progress);
    const controls = document.createElement('nav'); controls.className = 'prologue-controls'; controls.setAttribute('aria-label', 'Controles do prólogo');
    for (const [label, id, callback] of [
      ['PULAR', 'prologue-skip', () => this.finish()],
      ['AVANÇAR', 'prologue-next', () => this.next()],
      ['ATIVAR SOM', 'prologue-sound', () => this.sound.unlock()],
      ['CONFIGURAÇÕES', 'settings', settings],
    ] as const) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.shell = id; button.onclick = callback; controls.append(button);
    }
    this.view.append(this.image, this.caption, track, controls);
    this.sound.setArea('deep'); this.paint();
    document.addEventListener('visibilitychange', this.visibility);
  }
  volumes(master: number, music: number, sfx: number): void { this.sound.setVolumes(master, music, sfx); }
  resume(): void {
    if (this.finished) return;
    this.active = true; this.last = 0; this.motion?.play(); this.sound.setMusicFocus(1); this.sound.unlock();
    cancelAnimationFrame(this.frame); this.frame = requestAnimationFrame(this.tick);
  }
  pause(): void { this.active = false; this.last = 0; this.motion?.pause(); this.sound.setMusicFocus(0); cancelAnimationFrame(this.frame); }
  private visibility = (): void => { this.last = 0; if (document.hidden) { this.motion?.pause(); this.sound.setMusicFocus(0); } else if (this.active) { this.motion?.play(); this.sound.setMusicFocus(1); } };
  private tick = (now: number): void => {
    if (!this.active || this.finished) return;
    if (this.last && !document.hidden) this.elapsed += Math.min(100, now - this.last);
    this.last = now;
    if (this.elapsed >= TAKE_MS) { this.next(); if (this.finished) return; }
    if (now - this.lastPaint >= 80) { this.lastPaint = now; this.progress.style.transform = `scaleX(${(this.index + this.elapsed / TAKE_MS) / PROLOGUE_TAKES.length})`; }
    this.frame = requestAnimationFrame(this.tick);
  };
  private paint(): void {
    const take = PROLOGUE_TAKES[this.index]; this.view.dataset.take = take.id;
    this.count.textContent = `${this.index + 1} / ${PROLOGUE_TAKES.length} · PRÓLOGO`;
    this.heading.textContent = take.title; this.text.textContent = take.text;
    this.image.src = `${import.meta.env.BASE_URL}assets/prologue/${take.id}.webp`;
    this.motion?.cancel();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) this.motion = this.image.animate([{ transform: 'scale(1)', opacity: .45 }, { transform: 'scale(1.035)', opacity: 1, offset: .25 }, { transform: 'scale(1.07)', opacity: 1 }], { duration: TAKE_MS, fill: 'forwards' });
    if (!this.active) this.motion?.pause();
    const next = PROLOGUE_TAKES[this.index + 1]; if (next) { const preload = new Image(); preload.src = `${import.meta.env.BASE_URL}assets/prologue/${next.id}.webp`; }
  }
  private next(): void { this.sound.unlock(); this.elapsed = 0; this.last = 0; if (++this.index >= PROLOGUE_TAKES.length) this.finish(); else this.paint(); }
  private finish(): void { if (this.finished) return; this.finished = true; this.pause(); this.done(); }
  destroy(): void { this.finished = true; this.pause(); this.motion?.cancel(); document.removeEventListener('visibilitychange', this.visibility); this.sound.destroy(); this.view.remove(); }
}
