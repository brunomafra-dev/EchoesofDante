import '../../style.css';
import '../world-finish/world.css';

// Both storage surfaces are isolated before campaign/profile modules execute.
const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
const key=(storage:Storage,k:string)=>'dante-creature-finish-lab.'+(storage===localStorage?'local.':'session.')+k;
Storage.prototype.getItem=function(k){return k.startsWith('echoes-of-dante.')?get.call(sessionStorage,key(this,k)):get.call(this,k)};
Storage.prototype.setItem=function(k,v){if(k.startsWith('echoes-of-dante.'))set.call(sessionStorage,key(this,k),String(v));else set.call(this,k,v)};
Storage.prototype.removeItem=function(k){if(k.startsWith('echoes-of-dante.'))remove.call(sessionStorage,key(this,k));else remove.call(this,k)};

const [{default:Phaser},{GameScene},{SPECIES},{CLASS_NAMES},{equipmentLook}]=await Promise.all([import('phaser'),import('../../scenes/GameScene'),import('../../config/bestiary'),import('../../config/classes'),import('../../config/appearance')]);
const habitats={crawler:'forest',skitter:'cavern',spitter:'cavern',carapace:'valley',thorn:'valley',dunePouncer:'arid',glassSpitter:'arid',frostPouncer:'frost',frostSpitter:'frost',iceCarapace:'icecave',emberHound:'cinder',fumarole:'cinder',slagback:'obsidian',bankGrazer:'springs',reedSpitter:'springs',warden:'warden',soterrado:'sandpit',vesper:'icenest',titan:'caldera'} as const;
const params=new URLSearchParams(location.search);
const species=(params.get('species')! in habitats?params.get('species'):'skitter') as keyof typeof habitats;
const classId=(params.get('class')! in CLASS_NAMES?params.get('class'):'warrior') as keyof typeof CLASS_NAMES;
const sex=params.get('sex')==='female'?'female':'male',kit=params.get('kit')??'basic';
const panel=document.createElement('details');panel.className='world-finish-lab';
panel.innerHTML='<summary>CRIATURAS · TESTE RESERVADO</summary><div><p>Arte aplicada à campanha e ao coop. Visite cada espécie no próprio habitat, com os ataques reais. Seus personagens e saves estão protegidos.</p><label>Criatura<select name="species"></select></label><label>Pintura<select name="mode"><option value="new">Nova pintura</option><option value="previous">Arte anterior</option></select></label><label>Classe<select name="class"></select></label><label>Apresentação<select name="sex"><option value="male">Masculino</option><option value="female">Feminino</option></select></label><label>Equipamento visual<select name="kit"><option value="clothes">Roupa inicial</option><option value="basic">Básico</option><option value="advanced">Avançado</option></select></label><p>WASD mover · mouse mirar · clique atacar · espaço esquivar · Q segurar/mirar/soltar · H poção. Recolha este painel para jogar. O Hollow conserva a pintura já aprovada.</p><a href="test-library.html">Biblioteca de testes</a><a href="./">Campanha oficial</a></div>';
for(const[name,values]of [['species',Object.fromEntries(Object.keys(habitats).map(id=>[id,SPECIES[id as keyof typeof SPECIES].name]))],['class',CLASS_NAMES]] as const){const select=panel.querySelector<HTMLSelectElement>(`[name=${name}]`)!;for(const[value,label]of Object.entries(values)){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}}
for(const[name,value]of [['species',species],['mode',params.get('mode')==='previous'?'previous':'new'],['class',classId],['sex',sex],['kit',kit]]){const select=panel.querySelector<HTMLSelectElement>(`[name=${name}]`)!;select.value=value;select.onchange=()=>{const url=new URL(location.href);url.searchParams.set(name,select.value);location.href=url.href};}
document.body.append(panel);
let current:InstanceType<typeof GameScene>|undefined;
panel.addEventListener('toggle',()=>{if(!current)return;if(panel.open)current.pauseForShell();else current.resumeFromShell()});
const game=new Phaser.Game({type:Phaser.AUTO,width:1280,height:720,parent:'game',backgroundColor:'#102d2c',scale:{mode:Phaser.Scale.EXPAND,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[new GameScene(false,false,s=>{current=s;},{area:habitats[species],classId,sex,environment:true,specimen:species,creatureBaseline:params.get('mode')==='previous',look:equipmentLook(kit==='clothes'?'none':kit==='advanced'?'reinforced':'basic'),weaponLook:kit==='clothes'?'starter':kit==='advanced'?'advanced':'current'})]});
if(import.meta.env.DEV)Object.assign(window,{__danteGame:game});
