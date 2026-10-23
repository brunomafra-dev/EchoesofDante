import '../../style.css';
import './world.css';

// Isolate both storage surfaces before profiles/journey modules are imported.
const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
const prefix='dante-world-finish-lab.';
const key=(storage:Storage,k:string)=>prefix+(storage===localStorage?'local.':'session.')+k;
Storage.prototype.getItem=function(k){return k.startsWith('echoes-of-dante.')?get.call(sessionStorage,key(this,k)):get.call(this,k)};
Storage.prototype.setItem=function(k,v){if(k.startsWith('echoes-of-dante.'))set.call(sessionStorage,key(this,k),String(v));else set.call(this,k,v)};
Storage.prototype.removeItem=function(k){if(k.startsWith('echoes-of-dante.'))remove.call(sessionStorage,key(this,k));else remove.call(this,k)};

const [{default:Phaser},{GameScene},{REGION_NAMES},{CLASS_NAMES}]=await Promise.all([import('phaser'),import('../../scenes/GameScene'),import('../../config/economy'),import('../../config/classes')]);
const params=new URLSearchParams(location.search);
const area=(params.get('area')&&params.get('area')! in REGION_NAMES?params.get('area'):'base') as import('../../systems/LocalJourney').JourneyArea;
const classId=(params.get('class')&&params.get('class')! in CLASS_NAMES?params.get('class'):'warrior') as import('../../config/classes').PlayableClass;
const sex=params.get('sex')==='female'?'female':'male',kit=params.get('kit')??'basic';
const panel=document.createElement('details');panel.className='world-finish-lab';panel.innerHTML='<summary>REGIÕES · TESTE VISUAL RESERVADO</summary><div><p>Acabamento aplicado à campanha. Esta visita é simulada: cavernas abertas e bosses vivos. Seus saves reais estão protegidos.</p><label>Região<select name="area"></select></label><label>Acabamento<select name="mode"><option value="new">Novo acabamento</option><option value="previous">Visual anterior</option></select></label><label>Classe<select name="class"></select></label><label>Apresentação<select name="sex"><option value="male">Masculino</option><option value="female">Feminino</option></select></label><label>Equipamento<select name="kit"><option value="clothes">Roupa inicial</option><option value="basic">Carapaça básica</option><option value="advanced">Carapaça avançada</option></select></label><p>WASD mover · mouse mirar · clique atacar · espaço esquivar · Q segurar/mirar/soltar. Caminhe junto à vegetação para sentir a resposta natural.</p><p>Ícones: mochila I · poção H · atlas M · registros B. Touch e gamepad mantêm seus controles.</p><a href="test-library.html">Biblioteca de testes</a><a href="./">Jogar campanha oficial</a></div>';
for(const[name,values]of [['area',REGION_NAMES],['class',CLASS_NAMES]] as const){const select=panel.querySelector<HTMLSelectElement>(`[name=${name}]`)!;for(const[value,label]of Object.entries(values)){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}}
for(const[name,value]of [['area',area],['class',classId],['sex',sex],['kit',kit],['mode',params.get('mode')==='previous'?'previous':'new']]){const select=panel.querySelector<HTMLSelectElement>(`[name=${name}]`)!;select.value=value;select.onchange=()=>{const url=new URL(location.href);url.searchParams.set(name,select.value);location.href=url.href};}
document.body.append(panel);
let current:InstanceType<typeof GameScene>|undefined;
panel.addEventListener('toggle',()=>{if(!current)return;if(panel.open){current.pauseForShell();}else current.resumeFromShell();});
const {equipmentLook}=await import('../../config/appearance');
const game=new Phaser.Game({type:Phaser.AUTO,width:1280,height:720,parent:'game',backgroundColor:'#102d2c',scale:{mode:Phaser.Scale.EXPAND,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[new GameScene(false,false,s=>{current=s;},{area,classId,sex,environment:true,environmentBaseline:params.get('mode')==='previous',look:equipmentLook(kit==='clothes'?'none':kit==='advanced'?'reinforced':'basic'),weaponLook:kit==='clothes'?'starter':kit==='advanced'?'advanced':'current'})]});
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});
