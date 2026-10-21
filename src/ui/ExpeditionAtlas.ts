import {REGION_NAMES,type EconomySnapshot} from '../config/economy';

type Region=keyof typeof REGION_NAMES;
type AtlasState={area:Region;economy:EconomySnapshot;canLead:boolean;returnAvailable:boolean;missionArea?:Region;missionTitle?:string};
// Cartographic positions describe the existing expedition, not world-space coordinates.
const points:Record<Region,[number,number]>={base:[170,620],forest:[200,450],cavern:[370,355],warden:[445,265],valley:[550,455],springs:[630,335],terraces:[805,355],arid:[660,575],dunes:[920,575],sandpit:[975,430],frost:[965,265],icecave:[825,170],icenest:[650,80],cinder:[535,80],obsidian:[430,125],caldera:[300,170]};
const route:Region[]=['base','forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera','springs','terraces'];
let instance=0;

export function expeditionAtlas(state:AtlasState,travel:(area:Region)=>void):HTMLElement{
 const known=new Set(state.economy.visited),root=document.createElement('section');root.className='expedition-atlas';
 const heading=document.createElement('div');heading.className='atlas-heading';heading.innerHTML='<strong>DANTE</strong><span>CARTOGRAFIA DA EXPEDIÇÃO</span>';root.append(heading);
 const viewport=document.createElement('div');viewport.className='atlas-viewport';root.append(viewport);
 const board=document.createElement('div');board.className='atlas-board';board.setAttribute('role','group');board.setAttribute('aria-label','Regiões e caminhos da expedição');viewport.append(board);
 const art=document.createElement('img');art.src=`${import.meta.env.BASE_URL}assets/base/dante-expedition-atlas.webp`;art.alt='';art.draggable=false;board.append(art);
 const id=`atlas-fog-${++instance}`;
 const revealed=[...known].filter(a=>points[a]).map(a=>{const[x,y]=points[a];return `<circle cx="${x}" cy="${y}" r="160" fill="black"/>`}).join('');
 const paths=route.slice(1).map((area,i)=>{const from=area==='springs'?'valley':route[i],[x,y]=points[from],[a,b]=points[area];const discovered=known.has(from)&&known.has(area);return `<path d="M ${x} ${y} Q ${(x+a)/2+22} ${(y+b)/2} ${a} ${b}" class="${discovered?'atlas-route-known':'atlas-route-unknown'}"/>`}).join('');
 const[x,y]=points[state.area];
 const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('viewBox','0 0 1120 748');overlay.setAttribute('aria-hidden','true');overlay.innerHTML=`<defs><filter id="${id}-edge"><feGaussianBlur stdDeviation="22"/></filter><mask id="${id}"><rect width="1120" height="748" fill="white"/><g filter="url(#${id}-edge)">${revealed}</g></mask></defs><rect width="1120" height="748" fill="#091820" fill-opacity=".68" mask="url(#${id})"/>${paths}<circle cx="${x}" cy="${y}" r="27" class="atlas-location"/>`;board.append(overlay);
 for(const area of route){const visited=known.has(area),current=area===state.area,b=document.createElement('button');b.dataset.destination=area;b.className=`atlas-node${current?' is-current':''}${visited?'':' is-unknown'}`;b.style.left=`${points[area][0]/1120*100}%`;b.style.top=`${points[area][1]/748*100}%`;
  b.disabled=!visited||current||(state.area!=='base'&&(area!=='base'||!state.returnAvailable))||(state.area==='base'&&!state.canLead);
  b.setAttribute('aria-label',visited?`${REGION_NAMES[area]}${current?', você está aqui':''}`:'Região ainda não explorada');if(current)b.setAttribute('aria-current','location');
  const symbol=document.createElement('span');symbol.className='atlas-symbol';symbol.textContent=current?'◆':visited?'●':'?';const name=document.createElement('span');name.className='atlas-region';name.textContent=visited?REGION_NAMES[area]:'Não explorado';b.append(symbol,name);
  if(area===state.missionArea){b.classList.add('has-mission');const mark=document.createElement('small');mark.className='atlas-mission';mark.textContent='◇ MISSÃO';mark.title=state.missionTitle??'Objetivo acompanhado';b.append(mark);}
  if(current){const here=document.createElement('small');here.textContent='VOCÊ ESTÁ AQUI';b.append(here)}b.onclick=()=>travel(area);board.append(b);
 }
 const legend=document.createElement('p');legend.className='atlas-legend';legend.textContent='◆ Sua localização · ● Região descoberta · ? Ainda não explorado · Traçado dourado: caminho conhecido';root.append(legend);
 return root;
}
