import '../../style.css';
import { Prologue } from '../../ui/Prologue';
import { MobileDisplay } from '../../ui/MobileDisplay';

const host = document.querySelector<HTMLElement>('#film')!;
const ended = document.querySelector<HTMLElement>('#film-ended')!;
const settings = document.querySelector<HTMLDialogElement>('#film-settings')!;
const volume = document.querySelector<HTMLInputElement>('#film-volume')!;
let player: Prologue;
function start(): void {
  ended.hidden = true;
  player = new Prologue(() => { player.destroy(); ended.hidden = false; }, () => { player.pause(); settings.showModal(); });
  host.append(player.view); player.volumes(Number(volume.value), 1, 1); player.resume();
}
document.querySelector<HTMLButtonElement>('#watch-again')!.onclick = start;
volume.oninput = () => player.volumes(Number(volume.value), 1, 1);
settings.addEventListener('close', () => player.resume());
start();
const display = new MobileDisplay();
window.addEventListener('pagehide', () => { player.destroy(); display.destroy(); }, { once: true });
