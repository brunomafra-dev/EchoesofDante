import Phaser from 'phaser';

// Shared by campaign, remote views and the isolated lab; no gameplay state here.
export const MATERIAL_ART = ['alloy','amber-shell','boreal-core'] as const;
export const SURVEY_ART = {
 water: {art:'water',width:100,height:72},
 biology: {art:'biology',width:80,height:75},
 spring: {art:'spring',width:112,height:98},
 'route-west': {art:'route',width:45,height:63},
 'route-east': {art:'route',width:45,height:63},
 soil: {art:'soil',width:78,height:61},
 site: {art:'site',width:108,height:82},
} as const;
export const materialTexture=(tier:number)=>'material-'+MATERIAL_ART[tier-1];
export function preloadMissionProps(scene:Phaser.Scene):void {
 for(const art of [...MATERIAL_ART,'water','biology','spring','route','soil','site']) {
  const key='material-'+art;
  if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/mission-props/${art}-v1.png`);
 }
}
export function addSurveyProp(scene:Phaser.Scene,id:keyof typeof SURVEY_ART,x:number,y:number):Phaser.GameObjects.Image {
 const p=SURVEY_ART[id];
 return scene.add.image(x,y,'material-'+p.art).setDisplaySize(p.width,p.height).setDepth(y-2).setName('survey-'+id);
}
