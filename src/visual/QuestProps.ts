import Phaser from 'phaser';

// Two baked RGBA atlases; complete objects, one texture upload per sheet.
export const QUEST_PROPS={
 vitrifiedCore:['buried',0],
 emitter:['research',0],receiver:['research',1],archive:['research',2],routeArchive:['research',3],
 anemometer:['research',4],windSled:['research',5],windKit:['research',6],coreSample:['research',7],
 hydrophone:['research',8],decontamination:['research',9],manifest:['research',10],tools:['research',11],
 necklace1:['research',12],necklace2:['research',13],necklace3:['research',14],returnBeacon:['research',15],
 filter:['survival',0],valve:['survival',1],sealedWater:['survival',2],foodReserve:['survival',3],
 supplyRack:['survival',4],cargoSled:['survival',5],groundRod:['survival',6],powerCell:['survival',7],
 isolator:['survival',8],worklight:['survival',9],intake:['survival',10],seedlings:['survival',11],
 contaminatedRoots:['survival',12],cleanSample:['survival',13],floodStake:['survival',14],surveyor:['survival',15],
} as const;
export type QuestProp=keyof typeof QUEST_PROPS;
export function preloadQuestProps(scene:Phaser.Scene):void{
 if(!scene.textures.exists('quest-buried'))scene.load.image('quest-buried',`${import.meta.env.BASE_URL}assets/buried-record/vitrified-core-v1.png`);
 for(const sheet of ['research','survival'])if(!scene.textures.exists('quest-'+sheet))scene.load.spritesheet('quest-'+sheet,`${import.meta.env.BASE_URL}assets/mission-identity/${sheet}-v1.png`,{frameWidth:256,frameHeight:256});
}
export function addQuestProp(scene:Phaser.Scene,kind:QuestProp,x:number,y:number,size=78):Phaser.GameObjects.Image{
 const[sheet,frame]=QUEST_PROPS[kind];
 return scene.add.image(x,y,'quest-'+sheet,frame).setDisplaySize(size,size).setOrigin(.5,232/256).setDepth(y-2).setData('quest-prop',kind);
}
// Undefined entries intentionally keep their natural formation/ground stamp.
// null means an existing instrument/building/person is the objective itself.
export const GOAL_PROPS:Readonly<Record<string,QuestProp|null>>={
 'pb-sample':null,
 'pd-kit':'coreSample','pd-test':null,'pd-store':'routeArchive',
 'pv-kit':'windKit','pv-mount':'anemometer','pv-read':null,'pv-store':null,
 'pr-copy':'emitter','pr-origin':null,'pr-flow':null,'pr-read':null,'pr-store':'routeArchive',
 'ps-kit':'receiver','ps-carrier':'archive','ps-water':'hydrophone','ps-ridge':'coreSample','ps-align':null,'ps-record':'archive',
 'pw-intake':'intake','pw-filter':'filter','pw-valve':'valve','pw-online':'sealedWater',
 'pf-trace':'contaminatedRoots','pf-control':'seedlings','pf-sample':'cleanSample','pf-safe':'decontamination','pf-stock':'foodReserve',
 'pt-upper':'surveyor','pt-lower':'coreSample','pt-anchor':'tools','pt-load':'cargoSled','pt-deliver':'supplyRack',
 'pe-ground':'groundRod','pe-cell':'powerCell','pe-isolate':'isolator','pe-online':'worklight',
 'pc-beacon':'returnBeacon','pc-manifest':'manifest','pc-receive':null,'pc-home':null,
 'po-bank':'floodStake','po-water':'surveyor','po-kit':'supplyRack','po-load':'cargoSled','po-deliver':'supplyRack','po-crew':null,'po-ready':null,
};
