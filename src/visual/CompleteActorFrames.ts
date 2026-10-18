import { type CharacterSex,type EquipmentLook, type ProtectionStyle, type WeaponStyle } from '../config/appearance';
import type { PlayableClass } from '../config/classes';
import registration from './actorRegistration.json';
import warriorFemaleHeads from './warriorFemaleHeads.json';

export const COMPLETE_FRAME=192, COMPLETE_FEET=183, COMPLETE_DISPLAY=128;
export const COMPLETE_STYLES=['none','basic','reinforced'] as const;
export function completeDirection(aim:number):number {return ((Math.round((Math.PI/2-aim)/(Math.PI/4))%8)+8)%8;}
export function completeStride(classId?:PlayableClass):number{return classId==='warrior'?144:classId==='hunter'?152:104;}
export function completeFrame(aim:number,travel:number,walking:boolean,action:boolean,classId?:PlayableClass):number {
 const phase=((travel/completeStride(classId))%1+1)%1;
 // These two classes have authored opposite contact poses. The wide idle
 // stance is not a passing step: inserting it between contacts caused a hop.
 const grounded=classId==='warrior'||classId==='hunter';
 const column=action?3:walking?grounded?(phase<.5?1:2):[0,1,0,2][Math.floor(phase*4)]:0;
 return completeDirection(aim)*4+column;
}
export function completeKey(classId:PlayableClass,sex:string,style:ProtectionStyle):string{return `complete-${classId}-${sex}-${style}`;}

// Kept for historical audit scripts. Fixed source imports now supply the
// complete figure; a direction-dependent shrink must not conceal a bad crop.
export function completeViewScale(_classId:PlayableClass,_sex:CharacterSex,_row:number):number{return 1;}

// Optical anchors in the authored action poses. Simulation still starts on the
// original ground-plane ray; these coordinates only place the visible emission.
const EMITTERS:Record<PlayableClass,readonly (readonly [number,number])[]>={
 warrior:[[102,104],[158,100],[174,75],[163,46],[131,44],[28,68],[22,85],[31,106]],
 hunter:[[99,78],[168,76],[171,74],[155,51],[122,45],[30,61],[29,77],[30,90]],
 astral:[[122,86],[160,81],[172,81],[153,63],[121,53],[32,72],[24,83],[42,96]],
 xenobinder:[[130,69],[164,71],[173,68],[158,51],[125,43],[29,65],[25,75],[36,98]],
};
export function completeRegistration(classId:PlayableClass,sex:CharacterSex,style:ProtectionStyle,frame:number):{scale:number;x:number;y:number}{
 const [cx,neck]=registration[`${classId}-${sex}`][style][frame];
 const scale=(COMPLETE_FEET-55)/(COMPLETE_FEET-neck);
 return{scale,x:96-cx*scale,y:COMPLETE_FEET*(1-scale)};
}
export function completeMuzzle(classId:PlayableClass,aim:number,sex:CharacterSex='male',style:ProtectionStyle='none'):{x:number;y:number}{
 const [x,y]=EMITTERS[classId][completeDirection(aim)];
 const p=completeRegistration(classId,sex,style,completeDirection(aim)*4+3);
 const view=completeViewScale(classId,sex,completeDirection(aim));
 return{x:(x*p.scale+p.x-96)*view*COMPLETE_DISPLAY/COMPLETE_FRAME,y:39+(y*p.scale+p.y-COMPLETE_FEET)*view*COMPLETE_DISPLAY/COMPLETE_FRAME};
}

// Clothing changes replace pixels in a complete registered pose, once on equip.
// They never move a shoulder/elbow/hand or draw another body over the first.
export function composeCompleteAtlas(ctx:CanvasRenderingContext2D,sources:Record<ProtectionStyle,CanvasImageSource>,look:EquipmentLook,weapon:WeaponStyle,classId:PlayableClass,sex:CharacterSex='male'):void {
 const size=COMPLETE_FRAME;
 const weaponTier:ProtectionStyle=weapon==='starter'?'none':weapon==='current'?'basic':'reinforced';
 ctx.clearRect(0,0,size*4,size*8);
 const atlas=ctx,tile=document.createElement('canvas');tile.width=size;tile.height=size;
 ctx=tile.getContext('2d')!;
 for(let f=0;f<32;f++){
  // Identical local coordinates avoid subpixel rounding changing the head
  // between atlas columns after uniform view calibration.
  const x=0,y=0;ctx.clearRect(0,0,size,size);
  const view=completeViewScale(classId,sex,Math.floor(f/4));
  ctx.save();ctx.translate(x+96*(1-view),y+COMPLETE_FEET*(1-view));ctx.scale(view,view);ctx.translate(-x,-y);
  const draw=(style:ProtectionStyle,sourceFrame=f)=>{
   const p=completeRegistration(classId,sex,style,sourceFrame);
   ctx.save();ctx.beginPath();ctx.rect(x,y,size,size);ctx.clip();
   ctx.translate(x+p.x,y+p.y);ctx.scale(p.scale,p.scale);
   ctx.drawImage(sources[style],sourceFrame%4*size,Math.floor(sourceFrame/4)*size,size,size,0,0,size,size);ctx.restore();
  };
  draw(look.torso);
  const replace=(style:ProtectionStyle,rx:number,ry:number,w:number,h:number)=>{
   ctx.save();ctx.beginPath();ctx.rect(x+rx,y+ry,w,h);ctx.clip();ctx.clearRect(x+rx,y+ry,w,h);draw(style);ctx.restore();
  };
  const material=(style:ProtectionStyle,rx:number,ry:number,w:number,h:number)=>{
   // A different glove/tool painting must never erase a finger, introduce a
   // second wrist or move the silhouette of the connected underlying pose.
   ctx.save();ctx.beginPath();ctx.rect(x+rx,y+ry,w,h);ctx.clip();ctx.globalCompositeOperation='source-atop';
   draw(style);ctx.restore();
  };
  replace(look.legs,0,116,size,43);
  replace(look.boots,0,159,size,size-159);
  // The main hand/tool is authored as a continuous grip. Its pixels are baked
  // into the complete frame too, not attached as a rotating limb at runtime.
  const row=Math.floor(f/4),action=f%4===3;
  const [mx,my]=EMITTERS[classId][row];
  if(action){
   const left=mx<96,rx=left?0:Math.min(140,mx-30),ry=Math.max(56,my-12);
   material(look.gloves,rx,ry,Math.min(52,size-rx),30);
   material(weaponTier,left?0:Math.min(158,mx-12),Math.max(55,my-7),34,15);
  }else{
   // Resting hands on either flank; the weapon's own silhouette remains in
   // the source pose, and its small emitter/casing changes independently.
   material(look.gloves,44,91,26,23);material(look.gloves,122,91,26,23);
   if(classId==='hunter')material(weaponTier,72,69,54,23);
   else if(classId==='warrior'){
    if(row<=3)material(weaponTier,113,93,66,24);
    else if(row>=5)material(weaponTier,8,98,61,24);
   }
  }
  // One registered head per view/helmet, reused across complete poses at bake.
  // A rectangular strip across the whole sprite erased raised hands and let
  // an unhelmeted action painting replace the equipped helmet.
  const rowHead=Math.floor(f/4)*4;
  if(classId==='hunter'){
   // Empty sky beside the registered skull must not retain a gutter fragment.
   ctx.clearRect(x,y,65,36);ctx.clearRect(x+127,y,65,36);
  }
  // The approved Hunter identity reference is the open-faced basic painting.
  // Its face remains the same in initial clothes and mixed armor. The earlier
  // unarmored sheet painted a different face, especially for the female Hunter.
  const hunterOpenFace=classId==='hunter'&&look.helmet==='none';
  const headStyle=hunterOpenFace?'basic':classId==='hunter'&&look.helmet==='basic'?'reinforced':look.helmet;
  const femaleContact=classId==='warrior'&&sex==='female'&&(row===2||row===4);
  const headFrame=classId==='xenobinder'&&headStyle==='reinforced'&&rowHead===16?12:rowHead+((classId==='hunter'&&!hunterOpenFace&&headStyle!=='none')||femaleContact?1:0);
  ctx.save();ctx.beginPath();
  if(classId==='warrior'&&sex==='female'){
   // A wider skull cap protects the hair silhouette. Taper before the neck
   // so an upraised forearm beside the head is never cut by a rectangle.
   ctx.moveTo(x+60,y);ctx.lineTo(x+140,y);ctx.lineTo(x+136,y+40);
   ctx.lineTo(x+116,y+55);ctx.lineTo(x+76,y+55);ctx.lineTo(x+60,y+40);ctx.closePath();
   ctx.clip();ctx.clearRect(x+60,y,80,55);ctx.beginPath();
   for(const [sy,sx,width]of warriorFemaleHeads[headStyle][row])ctx.rect(x+sx,y+sy,width,1);
  }else{
   ctx.moveTo(x+65,y);ctx.lineTo(x+127,y);ctx.lineTo(x+127,y+42);
   ctx.lineTo(x+116,y+55);ctx.lineTo(x+76,y+55);ctx.lineTo(x+65,y+42);ctx.closePath();
  }
  ctx.clip();if(classId!=='warrior'||sex!=='female')ctx.clearRect(x+65,y,62,55);
  draw(headStyle,headFrame);ctx.restore();ctx.restore();
  atlas.drawImage(tile,f%4*size,Math.floor(f/4)*size);
 }
}
