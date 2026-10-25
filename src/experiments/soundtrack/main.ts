import { AudioManager, type MusicRegion } from '../../systems/Sound';
import { AUDIO } from '../../config/audio';
const sound = new AudioManager();
const regions: [MusicRegion, string, MusicRegion][] = [
 ['base','Base · abrigo humano','warden'],['forest','Floresta · leito vivo','warden'],
 ['cavern','Caverna · pedra e ecos','warden'],['deep','Câmaras profundas','warden'],
 ['deeper','Aproximação do Warden','warden'],['exterior','Escarpa exterior','warden'],
 ['valley','Vale da Ressonância','warden'],['sirocco','Bacia do Siroco','soterrado'],['dunes','Dunas Interiores','soterrado'],
 ['frost','Fratura Boreal','icenest'],['icecave','Galerias de Gelo','icenest'],
 ['cinder','Costa das Cinzas','titan'],['obsidian','Garganta de Obsidiana','titan'],['caldera','Forjas da Caldeira','titan'],
 ['springs','Nascentes','warden'],['terraces','Terraços','warden'],
];
const select = document.querySelector<HTMLSelectElement>('#region')!;
for (const [id,name] of regions) select.add(new Option(name,id));
const selected = () => regions.find(r=>r[0]===select.value)!;
const status = document.querySelector('#status')!;
document.querySelector('#explore')!.addEventListener('click',()=>{sound.setArea(selected()[0]);sound.unlock();status.textContent='Exploração · '+selected()[1];});
document.querySelector('#encounter')!.addEventListener('click',()=>{sound.setArea(selected()[2]);sound.unlock();sound.wardenCue('intro');status.textContent='Encontro · trilha tensa em volume contido';});
document.querySelector('#stop')!.addEventListener('click',()=>{sound.stopMusic();status.textContent='Música parada';});
for(const input of Array.from(document.querySelectorAll<HTMLInputElement>('input')))input.addEventListener('input',()=>sound.setVolumes(AUDIO.master,+document.querySelector<HTMLInputElement>('#music')!.value/100,+document.querySelector<HTMLInputElement>('#sfx')!.value/100));
for(const button of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-cue]')))button.onclick=()=>{sound.unlock();const cue=button.dataset.cue;if(cue==='guard')sound.guard();else if(cue==='recover')sound.wardenCue('recover');else sound.wardenWarning(cue);};
addEventListener('pagehide',()=>sound.destroy(),{once:true});
