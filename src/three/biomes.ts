import type {SpeciesId} from './creatures';

// Regions of Dante for the new 3D, following the 2D maps and their bestiary.
export type BiomeId='camp'|'springs'|'valley'|'caldera'|'frost'|'dunes';
export interface Biome{
 name:string;sub:string;ground:string;groundTint:string;bg:string;fog:number;
 hemi:[string,string,number];moon:[string,number];ambient:'none'|'spores'|'motes'|'ash'|'snow'|'sand';
 rockTint:string;treeTint:string;creatures:[SpeciesId,number][];boss?:SpeciesId;bossAfter?:number;
}
export const BIOME_ORDER:BiomeId[]=['camp','springs','valley','caldera','frost','dunes'];
export const BIOMES:Record<BiomeId,Biome>={
 camp:{name:'Acampamento da Chegada',sub:'Floresta e profundezas',ground:'burned_ground_01',groundTint:'#8a8378',bg:'#10151d',fog:.03,hemi:['#7f93bd','#2a2a22',1.25],moon:['#9bb2e6',2.3],ambient:'none',
  rockTint:'#ffffff',treeTint:'#ffffff',creatures:[['crawler',.4],['skitter',.25],['spitter',.2],['carapace',.15]]},
 springs:{name:'Bacia das Nascentes',sub:'Nascentes e Terraços do Amanhecer',ground:'forest_ground_04',groundTint:'#b4c0aa',bg:'#12201f',fog:.028,hemi:['#9fd2d8','#2a3a2e',1.9],moon:['#b8e8f0',2.8],ambient:'spores',
  rockTint:'#a8c8a0',treeTint:'#d8ffd0',creatures:[['bankGrazer',.45],['reedSpitter',.35],['crawler',.2]]},
 valley:{name:'Vale da Ressonância',sub:'Desvios do Vale',ground:'rocky_terrain_02',groundTint:'#b0a8bc',bg:'#161226',fog:.026,hemi:['#b0a0e8','#2e2638',1.8],moon:['#c8b8ff',2.8],ambient:'motes',
  rockTint:'#b0a8c0',treeTint:'#e0d0ff',creatures:[['thorn',.4],['carapace',.3],['skitter',.3]]},
 caldera:{name:'Caldeira de Dante',sub:'Costa das Cinzas e Garganta de Obsidiana',ground:'aerial_rocks_02',groundTint:'#7a6a62',bg:'#200e08',fog:.028,hemi:['#d88a68','#3a1a10',1.6],moon:['#ffae80',2.2],ambient:'ash',
  rockTint:'#4a4040',treeTint:'#2a2220',creatures:[['emberHound',.4],['fumarole',.3],['slagback',.3]],boss:'titan',bossAfter:10},
 frost:{name:'Fratura Boreal',sub:'Galerias do Degelo e Ninho da Geada',ground:'snow_02',groundTint:'#c8d4e0',bg:'#141c26',fog:.035,hemi:['#b8d8ff','#506070',1.3],moon:['#cfe6ff',2.4],ambient:'snow',
  rockTint:'#c8d8e8',treeTint:'#b8c8d8',creatures:[['frostPouncer',.4],['frostSpitter',.3],['iceCarapace',.3]],boss:'vesper',bossAfter:10},
 dunes:{name:'Bacia do Siroco',sub:'Depressão do Siroco',ground:'coast_sand_01',groundTint:'#b89a78',bg:'#2a1a12',fog:.028,hemi:['#ffc890','#3a2414',1.25],moon:['#ffb070',2.2],ambient:'sand',
  rockTint:'#d8a070',treeTint:'#a07a50',creatures:[['dunePouncer',.45],['glassSpitter',.35],['skitter',.2]],boss:'soterrado',bossAfter:10},
};
