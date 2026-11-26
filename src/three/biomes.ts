import type {SpeciesId} from './creatures';

// Regions of Dante for the new 3D, following the 2D maps and their bestiary.
// Dante was chosen because it resembles Earth: natural daylight, forests, meadows, snow, volcanic and desert ground.
export type BiomeId='camp'|'springs'|'valley'|'caldera'|'frost'|'dunes'|'domain';
export interface Biome{
 name:string;sub:string;ground:string;groundTint:string;bg:string;fog:number;
 hemi:[string,string,number];moon:[string,number];ambient:'none'|'spores'|'motes'|'ash'|'snow'|'sand';
 rockTint:string;treeTint:string;creatures:[SpeciesId,number][];boss?:SpeciesId;bossAfter?:number;
}
export const BIOME_ORDER:BiomeId[]=['camp','springs','valley','caldera','frost','dunes','domain'];
// hemi = sky colour, ground colour, intensity; moon = the sun (colour, intensity)
export const BIOMES:Record<BiomeId,Biome>={
 camp:{name:'Acampamento da Chegada',sub:'Floresta e profundezas',ground:'sparse_grass',groundTint:'#d6d4c4',bg:'#9db0c0',fog:.011,hemi:['#d6e4f4','#5a5440',1.35],moon:['#fff0d6',3.1],ambient:'spores',
  rockTint:'#d8d8d0',treeTint:'#ffffff',creatures:[['crawler',.55],['skitter',.45]]},
 springs:{name:'Bacia das Nascentes',sub:'Nascentes e Terraços do Amanhecer',ground:'leafy_grass',groundTint:'#d8dcc8',bg:'#a6c2c6',fog:.011,hemi:['#d8ecf4','#4a5a3a',1.4],moon:['#fff4e0',3.2],ambient:'spores',
  rockTint:'#c8d0c0',treeTint:'#f4ffe8',creatures:[['bankGrazer',.55],['reedSpitter',.45]]},
 valley:{name:'Vale da Ressonância',sub:'Desvios do Vale',ground:'aerial_grass_rock',groundTint:'#d0ccc4',bg:'#a4aabb',fog:.013,hemi:['#d4dcf0','#4e4a46',1.35],moon:['#ffeed8',3],ambient:'motes',
  rockTint:'#c4c0c4',treeTint:'#eef4ea',creatures:[['thorn',.55],['carapace',.45]]},
 caldera:{name:'Caldeira de Dante',sub:'Costa das Cinzas e Garganta de Obsidiana',ground:'aerial_rocks_02',groundTint:'#9a8478',bg:'#6a4a3c',fog:.017,hemi:['#f0c0a0','#3a2018',1.3],moon:['#ffc8a0',2.7],ambient:'ash',
  rockTint:'#6a5a56',treeTint:'#4a3a34',creatures:[['emberHound',.4],['fumarole',.3],['slagback',.3]],boss:'titan',bossAfter:10},
 frost:{name:'Fratura Boreal',sub:'Galerias do Degelo e Ninho da Geada',ground:'snow_02',groundTint:'#e4ecf4',bg:'#c4d2de',fog:.015,hemi:['#e4f0ff','#8a96a4',1.3],moon:['#fff6ee',2.8],ambient:'snow',
  rockTint:'#d8e0ea',treeTint:'#dfe8ee',creatures:[['frostWyvern',.45],['frostPouncer',.3],['iceCarapace',.25]],boss:'vesper',bossAfter:10},
 dunes:{name:'Bacia do Siroco',sub:'Depressão do Siroco',ground:'coast_sand_01',groundTint:'#e0c8a4',bg:'#e2cca6',fog:.011,hemi:['#fff0d4','#8a6a44',1.3],moon:['#fff2d4',2.7],ambient:'sand',
  rockTint:'#e4b88a',treeTint:'#d8c8a0',creatures:[['duneAntlion',.4],['dunePouncer',.35],['glassAntlion',.25]],boss:'soterrado',bossAfter:10},
 domain:{name:'Domínio do Guardião',sub:'Arena do Warden',ground:'rocky_terrain_02',groundTint:'#a4acb2',bg:'#8a98a6',fog:.015,hemi:['#cfe0f0','#3a4048',1.3],moon:['#eef4ff',2.7],ambient:'motes',
  rockTint:'#8a949c',treeTint:'#c8d4cc',creatures:[],boss:'warden',bossAfter:0},
};
