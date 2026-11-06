import Phaser from 'phaser';
import{appearance,type CharacterAppearance}from'../config/characterPresentation';
import type{CharacterSex,EquipmentLook}from'../config/appearance';
import type{PlayableClass}from'../config/classes';
import{COMPLETE_COLUMNS,COMPLETE_FRAME,completeFrameCount}from'./CompleteActorFrames';
export function preloadCharacterAppearance(scene:Phaser.Scene,sex:CharacterSex,cls:PlayableClass):void{
 const key=`dante-heads200-${cls}-${sex}`;if(!scene.textures.exists(key))scene.load.image(key,`${import.meta.env.BASE_URL}assets/visual/customization/heads-${cls}-${sex}-v2.png`);
 const mask=key+'-mask';if(!scene.textures.exists(mask))scene.load.image(mask,`${import.meta.env.BASE_URL}assets/visual/customization/masks-${cls}-${sex}-v2.png`);
}
const skins={fair:[218,166,130],warm:[166,111,76],deep:[100,65,48]}as const;
const hairs={black:[37,36,38],brown:[92,57,34],copper:[157,75,39],silver:[188,191,185]}as const;
const maskCache=new WeakMap<object,ImageData>();
function maskPixels(source:HTMLImageElement):ImageData{let data=maskCache.get(source);if(data)return data;const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const ctx=c.getContext('2d')!;ctx.drawImage(source,0,0);data=ctx.getImageData(0,0,c.width,c.height);maskCache.set(source,data);return data;}
/** Optional pixels are baked into the complete figure, never separate limbs. */
export function applyCharacterAppearance(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,cls:PlayableClass,sex:CharacterSex,look:EquipmentLook,value:CharacterAppearance):void{
 const a=appearance(value);if(Object.values(a).every(v=>v==='original'))return;
 const count=completeFrameCount(cls),size=COMPLETE_FRAME,base=cls==='warrior'?40:32;
 const headKey=`dante-heads200-${cls}-${sex}`,heads=scene.textures.get(headKey).getSourceImage()as HTMLImageElement,neck={warrior:68,hunter:62,astral:57,xenobinder:58}[cls];
 const masks=maskPixels(scene.textures.get(headKey+'-mask').getSourceImage()as HTMLImageElement).data,headIndex={original:0,practical:1,astral:2,stellar:3,curly:4,tied:5}[a.head];
 for(let f=0;f<count;f++){
  const row=f<32?Math.floor(f/4):f<base?f-32:Math.floor((f-base)/4),ox=f%COMPLETE_COLUMNS*size,oy=Math.floor(f/COMPLETE_COLUMNS)*size;
  if(look.helmet==='none'){
   ctx.save();ctx.beginPath();ctx.moveTo(ox+58,oy);ctx.lineTo(ox+134,oy);ctx.lineTo(ox+132,oy+neck-16);ctx.lineTo(ox+108,oy+neck+2);ctx.lineTo(ox+84,oy+neck+2);ctx.lineTo(ox+60,oy+neck-16);ctx.closePath();ctx.clip();
   ctx.clearRect(ox+56,oy,80,80);ctx.drawImage(heads,row*80,headIndex*80,80,80,ox+56,oy,80,80);ctx.restore();
  }
  if(a.skin==='original'&&a.hair==='original')continue;
  const image=ctx.getImageData(ox,oy,size,size),d=image.data;
  const mask=(x:number,y:number,channel:number)=>x>=56&&x<136&&y<80?masks[((headIndex*80+y)*640+row*80+x-56)*4+channel]:0;
  const isSkin=(r:number,g:number,b:number)=>r>85&&r>g*1.09&&g>b*1.08&&r-b>25&&(r-Math.min(g,b))/r<.72;
  let faceLight=0,n=0;
  for(let y=20;y<neck;y++)for(let x=65;x<128;x++){const i=(y*size+x)*4,r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]>160&&mask(x,y,1)>128){faceLight+=(r+g+b)/3;n++;}}
  const reference=n?faceLight/n:123;
  for(let y=10;y<118;y++)for(let x=40;x<151;x++){
   const i=(y*size+x)*4;if(d[i+3]<32)continue;const r=d[i],g=d[i+1],b=d[i+2],light=(r+g+b)/3;
   const face=mask(x,y,1)>128;
   const arm=y>=65&&y<110&&(x<77||x>118),chest=cls==='warrior'&&y>=neck&&y<neck+23&&x>=77&&x<=117;
   const hair=look.helmet==='none'&&mask(x,y,0)>128;
   if(a.skin!=='original'&&!hair&&(face||(arm||chest)&&r>Math.max(90,reference*.9))&&isSkin(r,g,b)){
    const color=skins[a.skin],shade=Math.max(.35,Math.min(1.55,light/reference));for(let c=0;c<3;c++)d[i+c]=Math.min(255,color[c]*shade);
   }else if(a.hair!=='original'&&hair){
    const color=hairs[a.hair],shade=Math.pow(light/110,.85);for(let c=0;c<3;c++)d[i+c]=Math.min(255,color[c]*shade);
   }
  }
  ctx.putImageData(image,ox,oy);
 }
}
