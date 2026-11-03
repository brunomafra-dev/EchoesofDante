import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Actor} from './Actor';
import {BEACON,ENEMY,FrontierWorld,IVO,SPAWN} from './World';
import './style.css';

type Trial={stage:number;hp:number;enemyHp:number;potions:number};
const KEY='dante.frontier3d.v1';
const fresh=():Trial=>({stage:0,hp:100,enemyHp:96,potions:2});
let trial=fresh(),storage=true;
try {const old=JSON.parse(sessionStorage.getItem(KEY)??'null');if(old&&Number.isInteger(old.stage)&&old.stage>=0&&old.stage<=3&&Number.isFinite(old.hp)&&Number.isFinite(old.enemyHp)&&Number.isInteger(old.potions))trial={stage:old.stage,hp:T.MathUtils.clamp(old.hp,0,100),enemyHp:T.MathUtils.clamp(old.enemyHp,0,96),potions:T.MathUtils.clamp(old.potions,0,2)};} catch {storage=false;}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(trial));}catch{storage=false;}};
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<main class="frontier" aria-label="Primeira fronteira 3D">
 <div class="view" id="view" tabindex="0" aria-label="Cenário 3D. WASD move, arraste para girar a câmera."></div>
 <header class="top"><a href="test-library.html" class="brand" aria-label="Voltar à biblioteca">ECHOES <span>OF DANTE</span></a><div class="location"><span>PRIMEIRA FRONTEIRA</span><small>Ensaio 3D · 0.1.182</small></div><button class="square" id="menu" aria-label="Pausar e abrir opções">☰</button></header>
 <aside class="mission"><small>EXPEDIÇÃO / BASE DE CHEGADA</small><h1 id="goal">Uma nova perspectiva</h1><p id="objective">Converse com Ivo, junto à bancada.</p></aside>
 <div class="compass" aria-hidden="true"><span>RUMO</span><i></i><b id="heading">N</b></div>
 <div id="labels" aria-hidden="true"><span id="ivo-label" class="world-label">IVO <small>Oficina de campo</small></span><span id="enemy-label" class="world-label enemy-label">INTRUSO <meter id="enemy-health" min="0" max="96" value="96"></meter></span><span id="beacon-label" class="world-label">BALIZA DE PESQUISA</span></div>
 <div class="vitals"><div class="portrait" aria-hidden="true">◈</div><div><small>EXPLORADOR <span id="hp-text">100 / 100</span></small><meter id="health" min="0" max="100" value="100" aria-label="Vida"></meter><div class="stamina"><i id="dodge-ready"></i></div></div></div>
 <div class="context" id="context" hidden><span id="context-text"></span><button id="interact">CONVERSAR <kbd>E</kbd></button></div>
 <div class="actions"><button id="potion" aria-label="Usar poção"><span>✚</span><small>POÇÃO <b id="potions">2</b></small><kbd>R</kbd></button><button id="dodge" aria-label="Esquivar"><span>↗</span><small>ESQUIVA</small><kbd>SHIFT</kbd></button><button id="attack" aria-label="Atacar"><span>╱</span><small>GOLPE</small><kbd>ESPAÇO</kbd></button></div>
 <div class="joystick" id="joystick" aria-label="Controle de movimento por toque"><span id="stick"></span></div>
 <div class="camera-hint">Arraste para olhar · Roda do mouse aproxima</div><div class="notice" id="notice" role="status" aria-live="polite"></div>
 <footer class="lab-note">CENA ISOLADA · SEU PROGRESSO REAL ESTÁ PRESERVADO</footer>
 <div class="overlay" id="intro"><section class="intro-card"><small class="eyebrow">EXPLORAÇÃO / PROTÓTIPO JOGÁVEL</small><h2>Dante.<br><em>Outra perspectiva.</em></h2><p>Uma clareira, o primeiro abrigo e o mundo além dele. Caminhe pela base, encontre Ivo e proteja a pesquisa.</p><p class="intro-controls">WASD / analógico para caminhar · arraste a cena para olhar<br>Golpe, esquiva, interação e poção também por toque.</p><div class="loading" id="loading">Preparando a fronteira…</div><button id="start" class="primary" disabled>EXPLORAR A BASE <span>→</span></button><small class="isolation">Ensaio solo com personagens de referência. Nenhuma missão, vitória, recompensa ou acesso da campanha é simulado. Sessão temporária, sem alterar seus saves.</small><a href="test-library.html">Voltar à biblioteca</a></section></div>
 <dialog id="dialog"><small>IVO / OFICINA DE CAMPO</small><h2 id="dialog-title">Antes de avançar</h2><p id="dialog-text"></p><button id="dialog-close" class="primary">CONTINUAR</button></dialog>
 <dialog id="options"><small>PRIMEIRA FRONTEIRA</small><h2>Faça uma pausa.</h2><label>Qualidade gráfica<select id="quality"><option value="balanced">Equilibrada</option><option value="low">Mais leve</option><option value="high">Mais detalhes</option></select></label><button id="sound" aria-pressed="false">Som do ensaio: desligado</button><button id="reset-camera">Centralizar câmera</button><details><summary>Controles e escopo</summary><p>WASD / setas: caminhar. Arrastar: câmera. Espaço: golpe. Shift: esquiva. E: conversar ou analisar. R: poção. Esc: pausa.</p><p>Gamepad: analógico esquerdo move; direito gira; RT golpe; B esquiva; A interage; Y poção; Menu pausa.</p><p>Experimento solo. Modelos animados CC0 de Quaternius, solo ambientCG, cenário autoral. Coop e classes da campanha ainda não foram migrados.</p></details><button id="restart">Reiniciar somente este ensaio</button><button id="resume" class="primary">RETOMAR</button><a href="test-library.html">Voltar à biblioteca</a></dialog>
 <dialog id="defeat"><small>RETORNO AO ABRIGO</small><h2>Recupere o fôlego.</h2><p>O ensaio guarda a pesquisa e os encontros já concluídos. Seus personagens reais continuam intactos.</p><button id="respawn" class="primary">VOLTAR À CLAREIRA</button></dialog>
 <div class="rotate-note" id="portrait-note" hidden>Você pode jogar assim. Deite o celular para ampliar a visão.<button id="dismiss-portrait" aria-label="Fechar sugestão de orientação">×</button></div>
 </main>`;
const el=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
let renderer:T.WebGLRenderer;
try {renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});} catch {
 el('loading').textContent='Não foi possível iniciar o 3D. Ative a aceleração gráfica ou tente outro navegador.';throw Error('WebGL2 indisponível');
}
renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.25:1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el('view').append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Mundo tridimensional de Dante');
const assetFailures:string[]=[],assetsReady=new Promise<void>(resolve=>{T.DefaultLoadingManager.onLoad=resolve;T.DefaultLoadingManager.onError=url=>assetFailures.push(url);});
const world=(()=>{try{return new FrontierWorld(renderer);}catch(e){el('loading').textContent='Não foi possível preparar o cenário. Recarregue a página para tentar novamente.';throw e;}})(),camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.15,200);
const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=4;controls.maxDistance=19;controls.minPolarAngle=.25;controls.maxPolarAngle=1.3;controls.target.copy(SPAWN).add(new T.Vector3(0,1.25,0));camera.position.copy(controls.target).add(new T.Vector3(6,4.4,9));controls.mouseButtons={LEFT:T.MOUSE.ROTATE,MIDDLE:T.MOUSE.DOLLY,RIGHT:T.MOUSE.ROTATE};
controls.touches={ONE:T.TOUCH.ROTATE,TWO:T.TOUCH.DOLLY_ROTATE};controls.update();
let player:Actor,npc:Actor,enemy:Actor,started=false,disposed=false,attackCD=0,dodgeCD=0,dodging=0,invulnerable=0,enemyPhase='idle',enemyTimer=0,enemyHit=false,slashed=false,attackTime=0,healTime=0,time=0,noticeTime=0,npcWork=0,last=performance.now(),uiTime=0;
const keys=new Set<string>(),moveInput=new T.Vector2(),velocity=new T.Vector3(),dodgeDirection=new T.Vector3(),enemyDirection=new T.Vector3(),enemyHome=ENEMY.clone(),cameraLast=SPAWN.clone();
const ray=new T.Raycaster(),cameraVector=new T.Vector3(),scratch=new T.Vector3(),facing=new T.Vector3();
let audio:AudioContext|undefined,gain:GainNode|undefined,sound=false;
function tone(frequency:number,duration=.12){if(!sound)return;audio??=new AudioContext();if(audio.state==='suspended')void audio.resume();gain??=audio.createGain();gain.gain.value=.06;gain.connect(audio.destination);const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,audio.currentTime);o.frequency.exponentialRampToValueAtTime(frequency*.6,audio.currentTime+duration);g.gain.setValueAtTime(.35,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(gain);o.start();o.stop(audio.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
const heal=new T.Mesh(new T.RingGeometry(.5,.6,40),new T.MeshBasicMaterial({color:'#82e3b6',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));heal.rotation.x=-Math.PI/2;world.scene.add(heal);
const slash=new T.Mesh(new T.TorusGeometry(1.05,.035,5,32,Math.PI*1.1),new T.MeshBasicMaterial({color:'#f6d4a0',transparent:true,opacity:0,depthWrite:false}));slash.rotation.x=-Math.PI/2;world.scene.add(slash);
const warning=new T.Mesh(new T.CircleGeometry(2.5,40,Math.PI*.2,Math.PI*.6),new T.MeshBasicMaterial({color:'#ff7040',transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false}));warning.rotation.x=-Math.PI/2;warning.visible=false;world.scene.add(warning);
function notify(text:string){el('notice').textContent=text;noticeTime=3.5;}
function isPaused(){return !started||document.hidden||['options','dialog','defeat'].some(id=>el<HTMLDialogElement>(id).open);}
function stopInput(){keys.clear();moveInput.set(0,0);velocity.set(0,0,0);el('stick').style.transform='translate(-50%,-50%)';}
function pause(){if(!started)return;if(el<HTMLDialogElement>('dialog').open){el<HTMLDialogElement>('dialog-close').click();return;}const d=el<HTMLDialogElement>('options');if(d.open){d.close();el('view').focus();}else{stopInput();d.showModal();}}
function goal(){const texts=[['O primeiro contato','Converse com Ivo, junto à bancada.'],['Um sinal na fronteira',trial.enemyHp>0?'Proteja a baliza do intruso.':'Analise a baliza e retome o sinal.'],['A pesquisa continua','Retorne à bancada de Ivo.'],['O começo de um mundo','Ensaio concluído. Explore a clareira e experimente a câmera.']];el('goal').textContent=texts[trial.stage][0];el('objective').textContent=texts[trial.stage][1];}
function dialogue(title:string,text:string,label='CONTINUAR'){stopInput();el('dialog-title').textContent=title;el('dialog-text').textContent=text;el('dialog-close').textContent=label;el<HTMLDialogElement>('dialog').showModal();}
function interact(){if(isPaused())return;
 if(player.root.position.distanceTo(IVO)<2.8){
  if(trial.stage===0){trial.stage=1;save();goal();dialogue('Precisamos ouvir Dante.','A baliza do outro lado da clareira perdeu o sinal. Uma criatura se aproximou dos painéis. Abra espaço, examine o equipamento e traga a leitura. Vamos entender este lugar antes de avançar.','VOU VERIFICAR');}
  else if(trial.stage===2){trial.stage=3;save();goal();dialogue('Uma pequena conquista.','O sinal voltou. Agora podemos medir o vento e escolher onde instalar os próximos abrigos. É assim que começamos: conhecendo o terreno e cuidando de quem chegou.','CONTINUAR EXPLORANDO');tone(540,.35);}
  else dialogue('Cada peça importa.',trial.stage===1?'A baliza fica junto aos painéis solares, além da clareira. Observe a criatura antes de se aproximar.':'A bancada continua por aqui. Aproveite para observar o abrigo e a paisagem de outros ângulos.');
 }else if(player.root.position.distanceTo(BEACON)<2.6&&trial.stage===1){if(trial.enemyHp>0){notify('A criatura ainda está junto à baliza.');return;}trial.stage=2;save();goal();tone(680,.3);notify('Sinal recuperado. Leve a leitura a Ivo.');}
}
function attack(){if(isPaused()||attackCD>0||dodging>0)return;attackCD=.64;attackTime=.58;slashed=false;
 if(trial.enemyHp>0&&enemy.root.position.distanceTo(player.root.position)<3){facing.subVectors(enemy.root.position,player.root.position);facing.y=0;player.face(facing,1);}
 player.play('Punch',true,.62);tone(150,.12);
}
function dodge(){if(isPaused()||dodgeCD>0)return;dodgeCD=1.7;dodging=.38;invulnerable=.43;dodgeDirection.copy(velocity);if(dodgeDirection.lengthSq()<.1)dodgeDirection.set(0,0,1).applyQuaternion(player.root.quaternion);dodgeDirection.normalize();player.play('Roll',true,.65);tone(220,.16);}
function potion(){if(isPaused()||trial.hp>=100||trial.potions<=0)return;trial.potions--;trial.hp=Math.min(100,trial.hp+45);healTime=1.15;save();tone(620,.3);notify('Poção usada · +45 de vida');}
function hurt(damage:number){if(invulnerable>0||trial.hp<=0)return;trial.hp=Math.max(0,trial.hp-damage);invulnerable=.35;save();tone(85,.16);el('view').classList.add('hurt');setTimeout(()=>el('view').classList.remove('hurt'),220);if(trial.hp===0){stopInput();player.play('Death',true,999);el<HTMLDialogElement>('defeat').showModal();}else player.play('RecieveHit',true,.25);}
el('attack').onclick=attack;el('dodge').onclick=dodge;el('potion').onclick=potion;el('interact').onclick=interact;el('menu').onclick=pause;
el('dialog-close').onclick=()=>{el<HTMLDialogElement>('dialog').close();el('view').focus();};el('resume').onclick=pause;
el('respawn').onclick=()=>{trial.hp=100;save();player.root.position.copy(SPAWN);player.play('Idle',true,.15);invulnerable=2;enemyPhase='idle';enemyTimer=0;enemy.root.position.copy(enemyHome);el<HTMLDialogElement>('defeat').close();resetCamera();};
el('restart').onclick=()=>{trial=fresh();save();location.reload();};
function resetCamera(){cameraLast.copy(player?.root.position??SPAWN);controls.target.copy(cameraLast).add(new T.Vector3(0,1.25,0));camera.position.copy(controls.target).add(new T.Vector3(6,4.4,9));controls.update();}
el('reset-camera').onclick=resetCamera;
el('sound').onclick=()=>{sound=!sound;el('sound').setAttribute('aria-pressed',String(sound));el('sound').textContent=`Som do ensaio: ${sound?'ligado':'desligado'}`;if(!sound&&gain)gain.gain.value=0;tone(440);};
el<HTMLSelectElement>('quality').onchange=()=>{const q=el<HTMLSelectElement>('quality').value;renderer.setPixelRatio(q==='low'?1:Math.min(devicePixelRatio,q==='high'?2:1.5));renderer.shadowMap.enabled=q!=='low';world.sun.shadow.map?.dispose();world.sun.shadow.map=null;world.sun.shadow.mapSize.setScalar(q==='high'?2048:1024);renderer.setSize(innerWidth,innerHeight);notify(q==='low'?'Qualidade mais leve ativada.':'Qualidade gráfica atualizada.');};
el('dismiss-portrait').onclick=()=>el('portrait-note').classList.add('dismissed');
addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();pause();return;}if(isPaused()||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Space')attack();if(e.code.startsWith('Shift'))dodge();if(e.code==='KeyE')interact();if(e.code==='KeyR')potion();});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{stopInput();if(started&&!isPaused())el<HTMLDialogElement>('options').showModal();});
document.addEventListener('visibilitychange',()=>{stopInput();if(audio&&document.hidden)void audio.suspend();last=performance.now();});
for(const id of ['options','dialog','defeat'])el<HTMLDialogElement>(id).addEventListener('cancel',e=>{e.preventDefault();if(id==='options')pause();else if(id==='dialog')el('dialog-close').click();});
let stickId=-1,stickCenter=new T.Vector2();
el('joystick').onpointerdown=e=>{if(isPaused())return;stickId=e.pointerId;const r=el('joystick').getBoundingClientRect();stickCenter.set(r.x+r.width/2,r.y+r.height/2);el('joystick').setPointerCapture(e.pointerId);stickMove(e);};
function stickMove(e:PointerEvent){if(e.pointerId!==stickId)return;const d=new T.Vector2(e.clientX-stickCenter.x,e.clientY-stickCenter.y).clampLength(0,38);moveInput.set(d.x/38,-d.y/38);el('stick').style.transform=`translate(calc(-50% + ${d.x}px),calc(-50% + ${d.y}px))`;}
el('joystick').onpointermove=stickMove;const release=()=>{stickId=-1;moveInput.set(0,0);el('stick').style.transform='translate(-50%,-50%)';};el('joystick').onpointerup=release;el('joystick').onpointercancel=release;el('joystick').onlostpointercapture=release;
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
let pointerStart=new T.Vector2();renderer.domElement.addEventListener('pointerdown',e=>{pointerStart.set(e.clientX,e.clientY);if(!isPaused())el('view').focus();});renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerType==='mouse'&&e.button===0&&pointerStart.distanceTo(new T.Vector2(e.clientX,e.clientY))<5)attack();});
const padPrevious:boolean[]=[];
function padInput(dt:number):T.Vector2{const p=navigator.getGamepads?.().find(p=>p?.connected);if(!p)return new T.Vector2();const down=(i:number)=>!!p.buttons[i]?.pressed,edge=(i:number)=>{const v=down(i)&&!padPrevious[i];padPrevious[i]=down(i);return v;};if(edge(9))pause();if(isPaused()){
 const dialog=['options','dialog','defeat'].map(id=>el<HTMLDialogElement>(id)).find(d=>d.open);
 if(dialog){const focusable=Array.from(dialog.querySelectorAll<HTMLElement>('button,select,summary,a')).filter(e=>e.getClientRects().length>0);let i=focusable.indexOf(document.activeElement as HTMLElement);if(edge(12)||edge(14))i=(i-1+focusable.length)%focusable.length;if(edge(13)||edge(15))i=(i+1)%focusable.length;if(i>=0&&focusable[i]!==document.activeElement){focusable[i].focus();focusable[i].scrollIntoView({block:'nearest'});}if(edge(0)){const selected=focusable[i];if(selected instanceof HTMLSelectElement){selected.selectedIndex=(selected.selectedIndex+1)%selected.options.length;selected.dispatchEvent(new Event('change'));}else selected?.click();}if(edge(1)){if(dialog.id==='options')pause();else if(dialog.id==='dialog')el('dialog-close').click();}}
 else if(!started&&edge(0)&&!el<HTMLButtonElement>('start').disabled)el('start').click();
 for(let i=0;i<p.buttons.length;i++)padPrevious[i]=down(i);return new T.Vector2();}if(edge(7))attack();if(edge(1))dodge();if(edge(0))interact();if(edge(3))potion();const x=Math.abs(p.axes[2]??0)>.15?p.axes[2]:0,y=Math.abs(p.axes[3]??0)>.15?p.axes[3]:0;if(x||y){scratch.subVectors(camera.position,controls.target);const spherical=new T.Spherical().setFromVector3(scratch);spherical.theta-=x*dt*1.8;spherical.phi=T.MathUtils.clamp(spherical.phi+y*dt*1.4,.25,1.3);camera.position.copy(controls.target).add(scratch.setFromSpherical(spherical));}return new T.Vector2(Math.abs(p.axes[0])>.15?p.axes[0]:0,Math.abs(p.axes[1])>.15?-p.axes[1]:0);}
function updateEnemy(dt:number){
 if(trial.enemyHp<=0){warning.visible=false;enemy.root.visible=false;return;}
 const dist=enemy.root.position.distanceTo(player.root.position);enemyTimer-=dt;
 if(trial.stage===0||dist>14){enemy.update(dt,false);return;}
 if(enemyPhase==='idle'){
  if(enemyTimer<=0&&dist<3.3){enemyPhase='windup';enemyTimer=.9;enemyHit=false;enemyDirection.subVectors(player.root.position,enemy.root.position).setY(0).normalize();enemy.face(enemyDirection,1);tone(280,.22);}
  else if(dist>2.3){scratch.subVectors(player.root.position,enemy.root.position).setY(0).normalize();world.move(enemy.root.position,scratch.x*dt*1.8,scratch.z*dt*1.8,.45);enemy.face(scratch,dt);}
 }else if(enemyPhase==='windup'&&enemyTimer<=0){enemyPhase='strike';enemyTimer=.3;enemy.play('Punch',true,.75);}
 else if(enemyPhase==='strike'){
  world.move(enemy.root.position,enemyDirection.x*dt*3.8,enemyDirection.z*dt*3.8,.45);
  const delta=scratch.subVectors(player.root.position,enemy.root.position).setY(0);if(!enemyHit&&delta.length()<2.5&&delta.normalize().dot(enemyDirection)>.35){hurt(27);enemyHit=true;}
  if(enemyTimer<=0){enemyPhase='recover';enemyTimer=1.25;}
 }else if(enemyPhase==='recover'&&enemyTimer<=0){enemyPhase='idle';enemyTimer=.25;}
 warning.visible=enemyPhase==='windup';warning.position.copy(enemy.root.position).add(new T.Vector3(0,.055,0));warning.rotation.z=Math.atan2(-enemyDirection.z,enemyDirection.x)-Math.PI/2;
 (warning.material as T.MeshBasicMaterial).opacity=.4+.3*(1-T.MathUtils.clamp(enemyTimer/.9,0,1));
 enemy.update(dt,enemyPhase==='idle'&&dist>2.3&&dist<14);
}
function label(id:string,pos:T.Vector3,show=true){const v=pos.clone().project(camera),node=el(id);node.hidden=!show||v.z>1||v.z<0||Math.abs(v.x)>1||Math.abs(v.y)>1;if(!node.hidden)node.style.transform=`translate(-50%,-100%) translate(${(v.x*.5+.5)*innerWidth}px,${(-v.y*.5+.5)*innerHeight}px)`;}
let frames=0,sample=0,fps=0,lastRender=0;
function ui(){
 el('portrait-note').hidden=isPaused();
 const angle=Math.atan2(controls.target.x-camera.position.x,camera.position.z-controls.target.z);el('heading').textContent=['N','NE','L','SE','S','SO','O','NO'][(Math.round(angle/(Math.PI/4))+8)%8];
 el<HTMLMeterElement>('health').value=trial.hp;el('hp-text').textContent=`${Math.round(trial.hp)} / 100`;el('potions').textContent=String(trial.potions);el<HTMLButtonElement>('potion').disabled=trial.potions<=0||trial.hp>=100;el<HTMLButtonElement>('dodge').disabled=dodgeCD>0;el<HTMLButtonElement>('attack').disabled=attackCD>0;el('dodge-ready').style.width=`${(1-dodgeCD/1.7)*100}%`;
 el<HTMLMeterElement>('enemy-health').value=trial.enemyHp;
 const nearIvo=player.root.position.distanceTo(IVO)<2.8,nearBeacon=player.root.position.distanceTo(BEACON)<2.6&&trial.stage===1;
 el('context').hidden=isPaused()||!nearIvo&&!nearBeacon;el('context-text').textContent=nearIvo?'Ivo · Oficina de campo':'Baliza de pesquisa';el('interact').innerHTML=nearIvo?'CONVERSAR <kbd>E</kbd>':'ANALISAR <kbd>E</kbd>';
 label('ivo-label',IVO.clone().add(new T.Vector3(0,2.6,0)),player.root.position.distanceTo(IVO)<16);
 label('enemy-label',enemy.root.position.clone().add(new T.Vector3(0,2.8,0)),trial.enemyHp>0&&player.root.position.distanceTo(enemy.root.position)<14);
 label('beacon-label',BEACON.clone().add(new T.Vector3(0,3.9,0)),trial.stage===1);
 el('notice').classList.toggle('show',noticeTime>0);
}
function tick(now:number){if(disposed)return;requestAnimationFrame(tick);const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(.04,elapsed);last=now;const pad=padInput(dt);controls.enabled=!isPaused();
 if(started&&!isPaused()){
  time+=dt;attackCD=Math.max(0,attackCD-dt);dodgeCD=Math.max(0,dodgeCD-dt);invulnerable=Math.max(0,invulnerable-dt);noticeTime=Math.max(0,noticeTime-dt);
  const input=moveInput.clone().add(pad);input.x+=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));input.y+=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));input.clampLength(0,1);
  const forward=scratch.subVectors(controls.target,camera.position).setY(0).normalize().clone(),right=new T.Vector3(-forward.z,0,forward.x),desired=forward.multiplyScalar(input.y).addScaledVector(right,input.x).multiplyScalar(3.5);
  velocity.lerp(desired,1-Math.exp(-dt*12));if(dodging>0){dodging-=dt;world.move(player.root.position,dodgeDirection.x*dt*9,dodgeDirection.z*dt*9);}else {world.move(player.root.position,velocity.x*dt,velocity.z*dt);if(attackTime<=0)player.face(velocity,dt);}
  if(trial.enemyHp>0){scratch.subVectors(player.root.position,enemy.root.position).setY(0);if(scratch.lengthSq()<.75*.75&&scratch.lengthSq()>.001){scratch.normalize().multiplyScalar(.75).add(enemy.root.position);if(!world.blocked(scratch.x,scratch.z))player.root.position.set(scratch.x,player.root.position.y,scratch.z);}}
  player.update(dt,velocity.lengthSq()>.15&&dodging<=0);npc.update(dt,false);npcWork-=dt;if(npcWork<=0){npc.play('PickUp',true,1.3);npcWork=5.5;}
  if(attackTime>0){attackTime-=dt;if(attackTime<.31&&!slashed){slashed=true;const distance=player.root.position.distanceTo(enemy.root.position);facing.set(0,0,1).applyQuaternion(player.root.quaternion);scratch.subVectors(enemy.root.position,player.root.position).setY(0).normalize();if(trial.stage>0&&trial.enemyHp>0&&distance<2.8&&facing.dot(scratch)>.35){trial.enemyHp=Math.max(0,trial.enemyHp-24);save();enemy.play('Punch',true,.15);tone(100,.08);if(trial.enemyHp===0){goal();notify('Clareira segura. Examine a baliza.');}}}slash.position.copy(player.root.position).add(new T.Vector3(0,1,0));slash.rotation.z=-player.root.rotation.y;(slash.material as T.MeshBasicMaterial).opacity=Math.max(0,Math.sin(attackTime/.58*Math.PI))*.7;}else(slash.material as T.MeshBasicMaterial).opacity=0;
  if(healTime>0){healTime-=dt;heal.position.copy(player.root.position).add(new T.Vector3(0,.06,0));heal.scale.setScalar(1+(1-healTime/1.15)*2);(heal.material as T.MeshBasicMaterial).opacity=healTime/1.15;}else(heal.material as T.MeshBasicMaterial).opacity=0;
  updateEnemy(dt);world.update(time,trial.stage>=2);
 }
 if(player){const follow=player.root.position.clone();cameraVector.subVectors(follow,cameraLast);camera.position.add(cameraVector);controls.target.add(cameraVector);cameraLast.copy(follow);}
 controls.update();
 // Keep the camera in front of solid geometry without fading the geometry.
 cameraVector.subVectors(camera.position,controls.target);const distance=cameraVector.length();ray.set(controls.target,cameraVector.normalize());ray.far=distance;const hits=ray.intersectObjects(world.cameraBodies,false);if(hits.length&&hits[0].distance<distance)camera.position.copy(controls.target).addScaledVector(cameraVector,Math.max(1.1,hits[0].distance-.3));
 if(!isPaused()||now-lastRender>200){renderer.render(world.scene,camera);lastRender=now;}if(player){uiTime+=dt;if(uiTime>.1){uiTime=0;ui();}}
 frames++;sample+=elapsed;if(sample>=1){fps=frames/sample;frames=0;sample=0;}
}
function resized(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resized);window.visualViewport?.addEventListener('resize',resized);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();started=false;stopInput();el('intro').hidden=false;el('loading').textContent='O navegador interrompeu o 3D. Recarregue para retomar este ensaio.';el<HTMLButtonElement>('start').disabled=true;});
async function boot(){try{
 [player,npc,enemy]=await Promise.all([Actor.load('explorer.glb',1.9,true),Actor.load('engineer.glb',1.85),Actor.load('alien.glb',2.05)]);await assetsReady;if(assetFailures.length)throw Error('Recursos indisponíveis: '+assetFailures.join(', '));player.root.position.copy(SPAWN);npc.root.position.copy(IVO);npc.root.rotation.y=Math.PI;enemy.root.position.copy(ENEMY);world.solids.push({x:IVO.x,z:IVO.z,radius:.4,tag:'Ivo'});
 world.scene.add(player.root,npc.root,enemy.root);enemy.root.visible=trial.enemyHp>0;goal();
 el('loading').textContent='Fronteira pronta.';el<HTMLButtonElement>('start').disabled=false;
 el('start').onclick=()=>{started=true;el('intro').hidden=true;stopInput();resetCamera();el('view').focus();if(trial.hp===0)el<HTMLDialogElement>('defeat').showModal();if(!storage)notify('Armazenamento indisponível: este ensaio ficará só na memória.');};
 }catch(e){console.error(e);el('loading').textContent='Não foi possível carregar o ensaio. Recarregue a página para tentar novamente.';}
}
void boot();requestAnimationFrame(tick);
// Read-only diagnostics: explicit opt-in, no cheats or setters, no campaign imports.
if(new URLSearchParams(location.search).has('inspect'))Object.defineProperty(window,'__frontier3d',{value:()=>({trial:{...trial},position:player?.root.position.toArray(),enemyPosition:enemy?.root.position.toArray(),enemyPhase,animation:player?.animation,paused:isPaused(),fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries,solids:world.solids.map(s=>({...s})),camera:camera.position.toArray(),target:controls.target.toArray(),storageKey:KEY}),configurable:true});
function dispose(){if(disposed)return;disposed=true;controls.dispose();player?.dispose();npc?.dispose();enemy?.dispose();world.dispose();renderer.dispose();void audio?.close();removeEventListener('resize',resized);window.visualViewport?.removeEventListener('resize',resized);}
addEventListener('pagehide',e=>{if(!e.persisted)dispose();});
if(import.meta.hot)import.meta.hot.dispose(dispose);
