import './style.css';

// A reserved film viewer: no game boot, storage, campaign state or relay.
const film = document.querySelector<HTMLVideoElement>('#film')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const replay = document.querySelector<HTMLButtonElement>('#replay')!;
const sound = document.querySelector<HTMLButtonElement>('#sound')!;
const state = document.querySelector<HTMLOutputElement>('#state')!;
let disposed = false;
let hiddenPlayback = false;
let frame = 0;
let lastPad = [false, false, false];

async function start(): Promise<void> {
  try { await film.play(); }
  catch { state.textContent = 'Toque no botão de reprodução do vídeo para assistir.'; }
}
function toggle(): void { if (film.paused || film.ended) void start(); else film.pause(); }
play.addEventListener('click', toggle);
replay.addEventListener('click', () => { film.currentTime = 0; void start(); });
sound.addEventListener('click', () => {
  film.muted = !film.muted;
  sound.textContent = film.muted ? 'Som desligado' : 'Som ligado';
  sound.setAttribute('aria-pressed', String(!film.muted));
});
film.addEventListener('play', () => { play.textContent = 'Pausar'; state.textContent = 'Reproduzindo'; });
film.addEventListener('pause', () => { play.textContent = film.ended ? 'Rever cena' : 'Retomar'; if (!film.ended) state.textContent = 'Pausado'; });
film.addEventListener('ended', () => { play.textContent = 'Rever cena'; state.textContent = 'Cena concluída — aguardando sua avaliação'; });
film.addEventListener('error', () => { state.textContent = 'Não foi possível carregar a cena. Tente recarregar ou abrir o MP4 abaixo.'; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenPlayback = !film.paused; film.pause(); }
  else if (hiddenPlayback) { hiddenPlayback = false; void start(); }
});
window.addEventListener('keydown', event => {
  // Native video and focused buttons keep their native keyboard behavior.
  if (event.code !== 'Space' || event.target instanceof HTMLButtonElement || event.target instanceof HTMLVideoElement || event.target instanceof HTMLAnchorElement) return;
  event.preventDefault(); toggle();
});
function pad(): void {
  if (disposed) return;
  if (!document.hidden) {
    const p = Array.from(navigator.getGamepads?.() ?? []).find(p => p?.connected);
    const keys = [Boolean(p?.buttons[0]?.pressed), Boolean(p?.buttons[14]?.pressed || p && p.axes[0] < -.6), Boolean(p?.buttons[15]?.pressed || p && p.axes[0] > .6)];
    const controls = [play, replay, sound, document.querySelector<HTMLAnchorElement>('#skip')!];
    const index = controls.indexOf(document.activeElement as HTMLButtonElement);
    if (keys[1] && !lastPad[1]) controls[(index + controls.length - 1) % controls.length].focus();
    if (keys[2] && !lastPad[2]) controls[(index + 1) % controls.length].focus();
    if (keys[0] && !lastPad[0]) (index < 0 ? play : controls[index]).click();
    lastPad = keys;
  }
  frame = requestAnimationFrame(pad);
}
frame = requestAnimationFrame(pad);
window.addEventListener('pagehide', () => { disposed = true; film.pause(); cancelAnimationFrame(frame); });
window.addEventListener('pageshow', event => { if (event.persisted) { disposed = false; frame = requestAnimationFrame(pad); } });
