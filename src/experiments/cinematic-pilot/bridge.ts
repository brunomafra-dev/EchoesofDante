// Isolated media player: no game, relay, storage or authoring dependencies.
export {};
const video = document.querySelector<HTMLVideoElement>('video')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const replay = document.querySelector<HTMLButtonElement>('#replay')!;
const skip = document.querySelector<HTMLAnchorElement>('#skip')!;
const status = document.querySelector<HTMLElement>('#playback-status')!;

async function start() {
  try {
    await video.play();
  } catch {
    status.textContent = 'Toque nos controles do vídeo para reproduzir.';
  }
}
play.addEventListener('click', () => { if (video.paused) void start(); else video.pause(); });
replay.addEventListener('click', () => { video.currentTime = 0; void start(); });
video.addEventListener('play', () => { play.textContent = 'Pausar'; status.textContent = 'Reproduzindo.'; });
video.addEventListener('pause', () => { play.textContent = 'Reproduzir'; status.textContent = 'Pausado.'; });
video.addEventListener('ended', () => { status.textContent = video.dataset.endMessage ?? 'Fim do piloto. Avalie a atuação antes da abertura completa.'; });
video.addEventListener('error', () => { status.textContent = 'Não foi possível carregar o vídeo. Tente baixar o MP4.'; });

const controls: HTMLElement[] = [play, replay, ...Array.from(document.querySelectorAll<HTMLButtonElement>('[data-take]')), skip];
let frame = 0;
let pressed: boolean[] = [];
let focus = 0;
function pollPad() {
  frame = 0;
  const pad = Array.from(navigator.getGamepads()).find(p => p?.connected);
  if (!pad || document.hidden) { pressed = []; return; }
  const now = pad.buttons.map(b => b.pressed);
  const tapped = (i: number) => now[i] && !pressed[i];
  if (tapped(14) || tapped(12)) { focus = (focus + controls.length - 1) % controls.length; controls[focus].focus(); }
  if (tapped(15) || tapped(13)) { focus = (focus + 1) % controls.length; controls[focus].focus(); }
  if (tapped(0)) {
    if (controls.includes(document.activeElement as typeof play)) (document.activeElement as HTMLElement).click();
    else { controls[focus].focus(); controls[focus].click(); }
  }
  if (tapped(2)) replay.click();
  if (tapped(1)) skip.click();
  pressed = now;
  frame = requestAnimationFrame(pollPad);
}
function resumePad() { if (!frame && !document.hidden && Array.from(navigator.getGamepads()).some(p => p?.connected)) frame = requestAnimationFrame(pollPad); }
window.addEventListener('gamepadconnected', resumePad);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { video.pause(); cancelAnimationFrame(frame); frame = 0; pressed = []; }
  else resumePad();
});
resumePad();
