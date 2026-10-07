import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/frozen-reach/qa'; await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});
const p=await b.newPage({viewport:{width:1280,height:720}});
const report={method:'Chrome emulation; DEV chapter/position setup, real action keys; no physical device',errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const state=()=>p.evaluate(()=>{const g=window.__danteGame,s=g.scene.getScene('Game');return{area:s.area,xp:s.progression.xp,hp:s.player.hp,dead:s.player.isDead,echoes:s.progression.echoes.size,seen:s.frostSignalSeen,end:s.frostEndSeen,p:{...s.player.position},objects:s.children.list.length,tweens:s.tweens.getTweens().length,fps:g.loop.actualFps,music:s.sounds.area};});
const key=async(k,ms=200)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(150);};
const pos=async(x,y)=>{await p.evaluate(({x,y})=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x,y});s.player.invulnerableUntil=Infinity;},{x,y});await p.waitForTimeout(120);};
try{
 await p.goto('http://localhost:5184/?qa=play');await ready();assert.equal((await state()).area,'forest');
 await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');s.progression.restore({xp:1000,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[]});for(const id of ['saberArc','saberReach','dashCooldown','dashDuration','chargeWidth','chargePower'])while(s.progression.investUpgrade(id)){};for(const k of JOURNEY_FLAGS)s[k]=true;s.soterradoClueSeen=false;s.frostVisited=s.frostSignalSeen=s.frostEndSeen=false;s.area='sandpit';s.scene.restart();});await p.waitForTimeout(750);await ready();
 await pos(1370,770);await key('e');assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').coldPortal.active),true);
 await key('e');await p.waitForTimeout(700);await ready();assert.equal((await state()).area,'frost');
 await pos(480,1000);const before=(await state()).p.x;await key('d',500);assert.ok((await state()).p.x>before+70);
 for(const [x,y] of [[990,520],[2110,1320]]){await pos(x,y);await p.waitForTimeout(100);}
 assert.equal((await state()).xp,1040);report.sideRoutes=true;
 await pos(1660,690);await key('e');assert.ok((await state()).seen);await key('e');assert.equal((await state()).xp,1040);
 await pos(2640,930);assert.ok((await state()).end);report.discoveryAndFrontier=true;
 for(const [w,h] of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(350);await p.screenshot({path:`${out}/frost-${w}.png`});}
 await p.setViewportSize({width:1280,height:720});await pos(1620,880);
 // No collider crosses the path between entry, safe checkpoint and frontier; check circle bases.
 const safe=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return [{x:440,y:1000},{x:1630,y:900},{x:2640,y:930}].every(q=>s.arena.obstacles.every(o=>Math.hypot(q.x-o.x,q.y-o.y)>o.radius+18));});assert.ok(safe);
 await key('Space');await key('q',850);await p.waitForTimeout(700);report.dashAndCharge=true;
 const combatXp=(await state()).xp;
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const kind of ['frostPouncer','frostSpitter']){const e=s.enemies.find(e=>e.kind===kind&&!e.isDead);s.resolvePlayerHits(s.time.now,[e],999,0,0x5fe6d8,s.player.position,false);}});
 assert.equal((await state()).xp,combatXp+30);report.newCreaturesXp=true;
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=0;s.player.die();});await p.waitForTimeout(100);await key('r');await p.waitForTimeout(700);await ready();assert.equal((await state()).area,'frost');assert.ok((await state()).seen);assert.equal((await state()).hp,await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.maxHp));report.respawn=true;
 const count=(await state()).objects;await p.waitForTimeout(3000);report.fps=(await state()).fps;assert.ok((await state()).objects<=count+4);report.stableObjects=true;
 await pos(300,1050);await key('e');await p.waitForTimeout(700);await ready();assert.equal((await state()).area,'sandpit');await pos(1370,780);await key('e');await p.waitForTimeout(700);await ready();assert.equal((await state()).area,'frost');report.return=true;
 await p.reload();await ready();assert.equal((await state()).area,'frost');assert.ok((await state()).seen);report.persistence=true;
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await b.close();}console.log(report);
