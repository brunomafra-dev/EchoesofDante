import assert from 'node:assert/strict';

// Moves a real keyboard actor. Reads only the host-authoritative haul position;
// never teleports or edits the cargo and never calls its update directly.
export async function leadHaul(inputPage,hostPage,goal){
 let held=new Set(),samples=[];
 const keys=async next=>{for(const k of held)if(!next.has(k))await inputPage.keyboard.up(k);for(const k of next)if(!held.has(k))await inputPage.keyboard.down(k);held=next;};
 try{
  for(let i=0;i<500;i++){
   const q=await hostPage.evaluate(guest=>{const s=window.__danteGame.scene.getScene('Game');return{cargo:s.permanence.haulPosition?{...s.permanence.haulPosition}:null,player:{...(guest?s.party.players[0]:s.player).position}}},hostPage!==inputPage);
   assert.ok(q.cargo,'Cargo must remain in the world');
   const remaining=Math.hypot(q.cargo.x-goal.x,q.cargo.y-goal.y);
   if(i%15===0)samples.push(q);
   if(remaining<95){await keys(new Set());return samples;}
   const d=Math.hypot(q.player.x-q.cargo.x,q.player.y-q.cargo.y);
   const target=d>185?{x:q.cargo.x+(goal.x-q.cargo.x)/remaining*125,y:q.cargo.y+(goal.y-q.cargo.y)/remaining*125}:goal;
   const dx=target.x-q.player.x,dy=target.y-q.player.y;
   const next=new Set();if(Math.abs(dx)>12)next.add(dx>0?'d':'a');if(Math.abs(dy)>12)next.add(dy>0?'s':'w');await keys(next);await inputPage.waitForTimeout(80);
  }
  throw Error('Haul did not reach destination with real movement');
 }finally{await keys(new Set());}
}
