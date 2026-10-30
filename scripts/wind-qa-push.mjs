import assert from 'node:assert/strict';
// DEV positioning prepares the pusher's two approaches only. The actual
// platform displacement/docking must come from keyboard inputs and host physics.
export async function pushWindPlatform(control,authority,guest=false){
 const get=()=>authority.evaluate(()=>({...window.__danteGame.scene.getScene('Game').permanence.snapshot().wind}));
 const dock=await authority.evaluate(async()=>({...((await import('/src/config/windSurvey.ts')).WIND_SURVEY.dock)}));
 const position=async point=>{await authority.evaluate(({point,guest})=>{const s=window.__danteGame.scene.getScene('Game'),p=guest?s.party.players[0]:s.player;Object.assign(p.position,point);p.invulnerableUntil=Infinity;}, {point,guest});await control.waitForTimeout(250);};
 let b=await get();await position({x:b.x-65,y:b.y});await control.keyboard.down('d');
 try{for(let i=0;i<100;i++){await control.waitForTimeout(80);b=await get();if(b.x>=dock.x+15)break;}}finally{await control.keyboard.up('d');}
 b=await get();assert.ok(b.x>=dock.x+10&&b.x<dock.x+42,'Actual horizontal push reaches the correction approach');
 await position({x:b.x+43,y:b.y+43});await control.keyboard.down('a');await control.keyboard.down('w');
 try{await authority.waitForFunction(()=>window.__danteGame.scene.getScene('Game').missions.has('pv-dock'),null,{timeout:12000});}finally{await control.keyboard.up('a');await control.keyboard.up('w');}
 const after=await get();assert.ok(Math.hypot(after.x-dock.x,after.y-dock.y)<1);return{before:b,after,method:'Real D then W+A movement; only pusher approach positions prepared, no platform teleport or evidence injection'};
}
