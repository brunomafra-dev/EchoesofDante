import { JOURNEY_FLAGS,type JourneyArea } from '../../systems/LocalJourney';
import { PROGRESSION } from '../../config/progression';
import { REGION_NAMES,validEconomy } from '../../config/economy';
import { EQUIPMENT,type EquipmentId,validEquipment } from '../../config/equipment';
import { CLASS_NAMES,type PlayableClass } from '../../config/classes';
import {characterSex} from '../../config/appearance';
import '../../style.css';

// Only this laboratory redirects Dante's save keys. Real localStorage is untouched.
const isolated=new Map<string,string>();
const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
Storage.prototype.getItem=function(key){return this===localStorage&&key.startsWith('echoes-of-dante.')?isolated.get(key)??null:get.call(this,key)};
Storage.prototype.setItem=function(key,value){if(this===localStorage&&key.startsWith('echoes-of-dante.'))isolated.set(key,String(value));else set.call(this,key,value)};
Storage.prototype.removeItem=function(key){if(this===localStorage&&key.startsWith('echoes-of-dante.'))isolated.delete(key);else remove.call(this,key)};
const params=new URLSearchParams(location.search);
const region=(Object.hasOwn(REGION_NAMES,params.get('region')??'forest')?params.get('region')??'forest':'forest') as JourneyArea;
const astralLab=location.pathname.endsWith('/astral-playtest.html');
const classId=(['warrior','hunter','astral'].includes(params.get('class')??'')?params.get('class'):astralLab?'astral':'warrior') as PlayableClass;
const sex=characterSex(classId,params.get('sex'));
const kit=['initial','basic','advanced'].includes(params.get('kit')??'')?params.get('kit')!:'basic';
const levels:Record<JourneyArea,number>={base:1,forest:1,cavern:3,warden:4,valley:5,arid:6,dunes:6,sandpit:7,frost:8,icecave:8,icenest:9};
const level=levels[region],id='threat-'+classId;
const tier=kit==='advanced'?3:1;
const slots=Object.fromEntries(Object.entries(EQUIPMENT).filter(([,v])=>kit!=='initial'&&v.tier===tier).map(([k,v])=>[v.slot,k])) as Partial<Record<import('../../config/equipment').EquipmentSlot,EquipmentId>>;
const owned=Object.values(slots);
const flags=Object.fromEntries(JOURNEY_FLAGS.map(flag=>[flag,true]));
if(['base','forest','cavern','warden'].includes(region))flags.wardenDefeated=flags.wardenEndingSeen=flags.valleyVisited=flags.aridVisited=flags.dunesVisited=flags.soterradoReached=flags.soterradoDefeated=flags.soterradoClueSeen=flags.frostVisited=flags.frostSignalSeen=flags.icecaveVisited=flags.icenestVisited=flags.vesperReached=flags.vesperDefeated=flags.vesperClueSeen=false;
if(!['frost','icecave','icenest'].includes(region))flags.soterradoDefeated=flags.soterradoClueSeen=flags.vesperDefeated=flags.vesperClueSeen=false;
if(region==='warden')flags.wardenDefeated=flags.wardenEndingSeen=false;
if(region==='sandpit')flags.soterradoDefeated=flags.soterradoClueSeen=false;
if(region==='icenest')flags.vesperReached=flags.vesperDefeated=flags.vesperClueSeen=false;
const ranks={saberArc:0,saberReach:0,dashCooldown:0,dashDuration:0,chargeWidth:0,chargePower:0};
let points=PROGRESSION.levelThresholds[level-1]>=360?1:0;if(level>=6)points++;if(level>=8)points++;
points+=Number(flags.wardenDefeated)+Number(flags.soterradoDefeated)+Number(flags.vesperDefeated);
for(let round=0;round<2;round++)for(const key of ['dashCooldown','chargePower','saberReach'] as const)if(points-->0)ranks[key]++;
localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:id,characters:[{id,name:('Teste '+CLASS_NAMES[classId]).slice(0,24),classId,sex,createdAt:1}]}));
localStorage.setItem('echoes-of-dante.journey.v1.character.'+id,JSON.stringify({schema:1,updatedAt:Date.now(),area:region,hp:10000,
 progression:{xp:PROGRESSION.levelThresholds[level-1],echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[],abilityUpgrades:ranks},
 flags,bestiary:{},valleyRoutes:[],valleyHabitats:[],aridHabitats:[],equipment:validEquipment({owned,slots}),economy:validEconomy({credits:237,materials:[12,12,12],potions:6,visited:Object.keys(REGION_NAMES)})}));
sessionStorage.setItem('echoes-of-dante.launch-once',id);
const panel=document.createElement('details');panel.className='threat-lab';panel.open=true;
panel.innerHTML=`<summary>${astralLab?'ETAPA 5':'ETAPA 4'} · TESTE RESERVADO</summary><p>Mesmo nível por região. Troque o equipamento para comparar. Seus saves reais não são alterados.</p>
<label>Região <select data-region>${Object.entries(REGION_NAMES).map(([id,name])=>`<option value="${id}" ${id===region?'selected':''}>${name}</option>`).join('')}</select></label>
<label>Classe <select data-class><option value="warrior" ${classId==='warrior'?'selected':''}>Guerreiro</option><option value="hunter" ${classId==='hunter'?'selected':''}>Hunter</option><option value="astral" ${classId==='astral'?'selected':''}>Astral</option></select></label>
<label>Equipamento <select data-kit><option value="initial" ${kit==='initial'?'selected':''}>Roupa inicial</option><option value="basic" ${kit==='basic'?'selected':''}>Básico</option><option value="advanced" ${kit==='advanced'?'selected':''}>Avançado</option></select></label>
<label>Apresentação <select data-sex><option value="male" ${sex==='male'?'selected':''}>Masculino</option><option value="female" ${sex==='female'?'selected':''}>Feminino</option></select></label>
${astralLab?'<p>Astral: LMB / DISPARO recupera energia ao acertar. F / Y / botão troca elemento. Q / CAMPO: segure, mire e solte; custo 30. Energia explode; fogo permanece; água desacelera; terra interrompe criaturas pequenas. Bosses resistem ao controle.</p>':''}
<p>H / CURAR: poção. M: base/retorno. Esc: criar sala. Convites deste laboratório também usam personagens temporários. Num boss, o caído aguarda o aliado; ambos caídos podem reiniciar.</p><a href="./test-library.html">Biblioteca de testes</a>`;
document.body.append(panel);
for(const name of ['region','class','kit','sex'])panel.querySelector('[data-'+name+']')!.addEventListener('change',event=>{const url=new URL(location.href);url.searchParams.set(name,(event.target as HTMLSelectElement).value);location.href=url.href});
await import('../../main');
