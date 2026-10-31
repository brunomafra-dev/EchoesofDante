import assert from 'node:assert/strict';
// Only approach positions of the pusher are fixtures. Cargo displacement,
// collision and docking are produced by the ordinary movement inputs.
export async function pushIceCargo(control,authority,guest=false,input=control.keyboard){
 const get=()=>authority.evaluate(()=>({...window.__danteGame.scene.getScene('Game').permanence.snapshot().ice}));
 async function leg(axis,target,key){
  let c=await get();const offset=key==='d'?{x:-52,y:0}:key==='a'?{x:52,y:0}:key==='w'?{x:0,y:52}:{x:0,y:-52};
  await authority.evaluate(({c,offset,guest})=>{const s=window.__danteGame.scene.getScene('Game'),p=guest?s.party.players[0]:s.player;Object.assign(p.position,{x:c.x+offset.x,y:c.y+offset.y});p.invulnerableUntil=Infinity},{c,offset,guest});await control.waitForTimeout(250);
  await input.down(key);try{let reached=false;for(let i=0;i<180;i++){await control.waitForTimeout(60);c=await get();if(await authority.evaluate(()=>window.__danteGame.scene.getScene('Game').missions.has('pi-dock'))||(key==='w'||key==='a'?c[axis]<=target:c[axis]>=target)){reached=true;break;}}assert.ok(reached,'Actual cargo push reaches '+axis+target+': '+JSON.stringify(c));}finally{await input.up(key);await control.waitForTimeout(150);}
 }
 const before=await get();await leg('x',1150,'d');await leg('y',1110,'w');await leg('x',1420,'d');await leg('y',1220,'s');await leg('x',1510,'d');
 assert.ok(await authority.evaluate(()=>window.__danteGame.scene.getScene('Game').missions.has('pi-dock')));return {before,after:await get(),method:'Five normal D/W/D/S/D push legs around the original rock; only pusher approaches prepared'};
}
