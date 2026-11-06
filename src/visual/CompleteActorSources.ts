import Phaser from 'phaser';
// Wardrobes are baking inputs, not rendered textures. Keep their decoded pixels
// in CPU memory; only the equipped, complete atlas receives a GPU texture.
type Source=ImageBitmap|HTMLImageElement;
const caches=new WeakMap<Phaser.Game,Map<string,Source>>();
const destroyedGames=new WeakSet<Phaser.Game>();
function cache(scene:Phaser.Scene):Map<string,Source>{
 let sources=caches.get(scene.game);if(sources)return sources;
 sources=new Map();caches.set(scene.game,sources);const owned=sources,game=scene.game;
 game.events.once(Phaser.Core.Events.DESTROY,()=>{destroyedGames.add(game);for(const source of new Set(owned.values()))if('close'in source)source.close();owned.clear();caches.delete(game);});return sources;
}
export function hasCompleteSource(scene:Phaser.Scene,key:string):boolean{return cache(scene).has(key);}
export function completeSource(scene:Phaser.Scene,key:string):Source{const source=cache(scene).get(key);if(!source)throw Error('Complete character source unavailable: '+key);return source;}
export function aliasCompleteSource(scene:Phaser.Scene,key:string,source:Source):void{cache(scene).set(key,source);}
export function completeSourceStats(scene:Phaser.Scene){const sources=[...new Set(cache(scene).values())];return{inputs:sources.length,decodedBytes:sources.reduce((sum,s)=>sum+s.width*s.height*4,0),storage:'CPU baking inputs; no source texture in the Phaser renderer'};}
class CompleteSourceFile extends Phaser.Loader.File{
 constructor(private scene:Phaser.Scene,key:string,url:string){super(scene.load,{type:'complete-source',key,url,responseType:'arraybuffer',extension:'png'});}
 onProcess():void{
  this.state=Phaser.Loader.FILE_PROCESSING;
  const blob=new Blob([this.xhrLoader!.response],{type:'image/png'});
  const game=this.scene.game;
  const alive=()=>!!this.loader&&game.isBooted&&!destroyedGames.has(game)&&this.state!==Phaser.Loader.FILE_DESTROYED;
  const decode=async():Promise<Source>=>{
   if(typeof createImageBitmap==='function'){try{return await createImageBitmap(blob);}catch{/* WebKit fallback keeps the same source, without a GPU texture. */}}
   return new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(blob);image.onload=()=>{URL.revokeObjectURL(url);resolve(image);};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Character image decode failed'));};image.src=url;});
  };
  void decode().then(source=>{if(!alive()){if('close'in source)source.close();return;}cache(this.scene).set(this.key,source);this.onProcessComplete();}).catch(()=>{if(alive()){this.loader.emit(Phaser.Loader.Events.FILE_LOAD_ERROR,this);this.onProcessError();}});
 }
}
export function preloadCompleteSource(scene:Phaser.Scene,key:string,url:string):void{if(!hasCompleteSource(scene,key))scene.load.addFile(new CompleteSourceFile(scene,key,url));}
