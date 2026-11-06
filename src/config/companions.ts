import{companion,type CompanionSpecies}from'./characterPresentation';
export const COMPANIONS={
 symbiont:{name:'Simbionte de Dante',role:'ASSALTO E RECUPERAÇÃO',command:'SALTO SIMBIÓTICO',description:'Q: salta até o ponto mirado, atinge a área ao pousar e recupera aliados próximos. O salto respeita obstáculos.',unlock:'Companheiro inicial.',color:0x9bc67d,size:94,texture:'dante-symbiont-motion',feet:244,frameSize:256},
 bulwark:{name:'Broto Guardião',role:'IMPACTO E PROTEÇÃO',command:'ABALO GUARDIÃO',description:'Q: golpeia o chão ao seu redor, causando dano em área, e protege você e aliados próximos por 5 s (35–45% de redução). A carga aumenta o dano e a proteção. Não cura nem atinge através de paredes.',unlock:'Disponível após derrotar o Warden na sua jornada.',color:0xdbba78,size:94,texture:'companion-bulwark',feet:159,frameSize:192},
 frostling:{name:'Filhote de Vésper',role:'EXPLOSÃO EM ÁREA',command:'SOPRO GLACIAL',description:'Q: dispara gelo do filhote. Ao atingir o primeiro alvo, explode e causa dano em todos os inimigos próximos. A carga amplia o impacto. Não cura nem atravessa paredes.',unlock:'Disponível após derrotar Vésper na sua jornada.',color:0xa9dfef,size:100,texture:'companion-frostling',feet:183,frameSize:192},
}as const;
export function companionInfo(value?:unknown){return COMPANIONS[companion(value)];}
export function companionFrames(species:CompanionSpecies,pose:number):number{return species==='symbiont'?pose:species==='bulwark'?[0,1,2,4,3,4,0,0][pose]??0:[0,1,2,4,3,4,0,0][pose]??0;}
// Simulation and aim/impact presentation share these radii; no extra damage event in FX.
export const GUARDIAN_RADIUS=140;
export function glacialRadius(level:number,rank=0):number{return 100+32*Math.max(0,Math.min(1,level))+6*rank;}
