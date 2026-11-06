import{companion,type CompanionSpecies}from'./characterPresentation';
export const COMPANIONS={
 symbiont:{name:'Simbionte de Dante',role:'ASSALTO E RECUPERAÇÃO',command:'SALTO SIMBIÓTICO',description:'Q: salta até o ponto mirado, atinge a área ao pousar e recupera aliados próximos. O salto respeita obstáculos.',unlock:'Companheiro inicial.',color:0x9bc67d,size:94,texture:'dante-symbiont-motion',feet:244,frameSize:256},
 bulwark:{name:'Broto Guardião',role:'PROTEÇÃO',command:'COURAÇA VIVA',description:'Q: protege você e aliados próximos por 5 s, reduzindo o dano recebido em 35–45%. Não causa dano nem cura.',unlock:'Disponível após derrotar o Warden na sua jornada.',color:0xdbba78,size:94,texture:'companion-bulwark',feet:159,frameSize:192},
 frostling:{name:'Filhote de Vésper',role:'ATAQUE À DISTÂNCIA',command:'SOPRO GLACIAL',description:'Q: lança do filhote um projétil glacial até o ponto mirado; explode no primeiro alvo ou obstáculo. Não cura nem atravessa paredes.',unlock:'Disponível após derrotar Vésper na sua jornada.',color:0xa9dfef,size:100,texture:'companion-frostling',feet:183,frameSize:192},
}as const;
export function companionInfo(value?:unknown){return COMPANIONS[companion(value)];}
export function companionFrames(species:CompanionSpecies,pose:number):number{return species==='symbiont'?pose:species==='bulwark'?[0,1,2,4,3,4,0,0][pose]??0:[0,1,2,4,3,4,0,0][pose]??0;}
