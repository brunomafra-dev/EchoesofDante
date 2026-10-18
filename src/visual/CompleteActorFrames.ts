import { type EquipmentLook, type ProtectionStyle, type WeaponStyle } from '../config/appearance';
import type { PlayableClass } from '../config/classes';

export const COMPLETE_FRAME=192, COMPLETE_FEET=183, COMPLETE_DISPLAY=128;
export const COMPLETE_STYLES=['none','basic','reinforced'] as const;
export function completeDirection(aim:number):number {return ((Math.round((Math.PI/2-aim)/(Math.PI/4))%8)+8)%8;}
export function completeFrame(aim:number,travel:number,walking:boolean,action:boolean):number {
 const column=action?3:walking?[0,1,0,2][Math.floor((((travel/104)%1+1)%1)*4)]:0;
 return completeDirection(aim)*4+column;
}
export function completeKey(classId:PlayableClass,sex:string,style:ProtectionStyle):string{return `complete-${classId}-${sex}-${style}`;}

// Optical anchors in the authored action poses. Simulation still starts on the
// original ground-plane ray; these coordinates only place the visible emission.
const EMITTERS:Record<PlayableClass,readonly (readonly [number,number])[]>={
 warrior:[[102,104],[158,100],[174,75],[163,46],[131,44],[28,68],[22,85],[31,106]],
 hunter:[[99,78],[168,76],[171,74],[155,51],[122,45],[30,61],[29,77],[30,90]],
 astral:[[122,86],[160,81],[172,81],[153,63],[121,53],[32,72],[24,83],[42,96]],
 xenobinder:[[130,69],[164,71],[173,68],[158,51],[125,43],[29,65],[25,75],[36,98]],
};
export function completeMuzzle(classId:PlayableClass,aim:number):{x:number;y:number}{
 const [x,y]=EMITTERS[classId][completeDirection(aim)];
 return{x:(x-96)*COMPLETE_DISPLAY/COMPLETE_FRAME,y:39+(y-COMPLETE_FEET)*COMPLETE_DISPLAY/COMPLETE_FRAME};
}

// Clothing changes replace pixels in a complete registered pose, once on equip.
// They never move a shoulder/elbow/hand or draw another body over the first.
export function composeCompleteAtlas(ctx:CanvasRenderingContext2D,sources:Record<ProtectionStyle,CanvasImageSource>,look:EquipmentLook,weapon:WeaponStyle,classId:PlayableClass):void {
 const size=COMPLETE_FRAME;
 const weaponTier:ProtectionStyle=weapon==='starter'?'none':weapon==='current'?'basic':'reinforced';
 ctx.clearRect(0,0,size*4,size*8);
 for(let f=0;f<32;f++){
  const x=f%4*size,y=Math.floor(f/4)*size;
  ctx.drawImage(sources[look.torso],x,y,size,size,x,y,size,size);
  const replace=(style:ProtectionStyle,rx:number,ry:number,w:number,h:number)=>{
   ctx.clearRect(x+rx,y+ry,w,h);ctx.drawImage(sources[style],x+rx,y+ry,w,h,x+rx,y+ry,w,h);
  };
  const material=(style:ProtectionStyle,rx:number,ry:number,w:number,h:number)=>{
   // A different glove/tool painting must never erase a finger, introduce a
   // second wrist or move the silhouette of the connected underlying pose.
   ctx.save();ctx.beginPath();ctx.rect(x+rx,y+ry,w,h);ctx.clip();ctx.globalCompositeOperation='source-atop';
   ctx.drawImage(sources[style],x+rx,y+ry,w,h,x+rx,y+ry,w,h);ctx.restore();
  };
  replace(look.helmet,0,0,size,55);
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
 }
}
