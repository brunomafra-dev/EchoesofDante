import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out=process.argv[2]??'docs/star-hunter/beam-qa/coop';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});
const hc=await b.newContext(),gc=await b.newContext();
for(const[c,id]of[[hc,'host'],[gc,'guest']])await c.addInitScript(id=>localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:id,characters:[{id,name:id,classId:'hunter',createdAt:1}]})),id);
const h=await hc.newPage(),g=await gc.newPage(),report={errors:[],method:'Two Chrome clients, two Hunters; real local WebSocket relay, actual keyboard charge/release; DEV target lane; no physical or Internet test'};
for(const p of[h,g])p.on('pageerror',e=>report.errors.push(e.message));
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.hunter);
async function setup(remote){await h.evaluate(remote=>{
 const s=window.__danteGame.scene.getScene('Game');s.arena.obstacles.length=0;
 const source=remote?s.party.partner:s,other=remote?s.player:s.party.partner.player;
 Object.assign(source.player.position,{x:650,y:800});Object.assign(other.position,{x:450,y:1200});
 s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;
 source.charge.stop();source.charge.lastReleasedAt=-Infinity;source.hunter.clear();
 for(let i=0;i<s.enemies.length;i++){const e=s.enemies[i];e.isDead=i>2;e.update=()=>{};e.hurt=()=>{};e.health.current=e.health.max=1000;s.party.resilience.set(e,1000/1.4);Object.assign(e.position,{x:900+i*240,y:800});}
},remote);await g.waitForTimeout(500);}
async function cast(p){await p.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>0);await p.keyboard.down('q');await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game'),r=window.__danteCoop;return (r.role==='guest'?r.world?.partner?.phase:s.charge.phase)==='CHARGING';});await p.waitForTimeout(1000);
 report.chargeState=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=window.__danteCoop;return{role:r.role,paused:r.hostPaused,connected:r.connected,peer:r.peerConnected,phase:s.charge.phase,pose:r.world?.partner,controls:{held:s.controls.chargeHeld,method:s.controls.inputMethod},ring:s.hunterArt.weapon.charge.visible,hostInput:r.input,party:s.party.partner?.charge.phase};});assert.ok(report.chargeState.ring,JSON.stringify(report.chargeState));
 assert.match(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').hud.chargeText.text),/100%/);
 await p.keyboard.up('q');}
try{
 await h.goto('http://localhost:5184/?qa=play');await ready(h);await h.evaluate(()=>window.__danteCoop.connect('ws://localhost:5190','create',{name:'host',classId:'hunter'},'forest'));
 const code=await h.evaluate(()=>window.__danteCoop.code);await g.goto('http://localhost:5184/?qa=play');await ready(g);
 await g.evaluate(code=>window.__danteCoop.connect('ws://localhost:5190','join',{name:'guest',classId:'hunter'},'forest',code),code);
 await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party.mirrorHost);
 for(const p of[h,g])await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');window.qaBeamSeen={own:false,partner:false};s.events.on('update',()=>{window.qaBeamSeen.own ||= !!s.hunter?.beamView.view.visible;window.qaBeamSeen.partner ||= !!(s.party.partner??s.party.mirrorHost)?.hunter?.beamView.view.visible;});});
 await setup(true);await cast(g);
 await g.waitForFunction(()=>window.qaBeamSeen.own);await h.waitForFunction(()=>window.qaBeamSeen.partner);
 assert.deepEqual(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies.slice(0,3).map(e=>e.health.current)),[863,863,863]);
 assert.ok(await h.evaluate(()=>window.qaBeamSeen.partner));report.guestBeamHitsAllOnHostAndRendersOnBoth=true;
 await g.screenshot({path:`${out}/guest-beam.png`});await g.waitForTimeout(800);
 assert.deepEqual(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies.slice(0,3).map(e=>e.health.current)),[863,863,863]);report.noGuestDoubleDamage=true;
 await setup(false);await cast(h);
 await g.waitForFunction(()=>window.qaBeamSeen.partner);await h.waitForFunction(()=>window.qaBeamSeen.own);
 assert.deepEqual(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies.slice(0,3).map(e=>e.health.current)),[863,863,863]);report.hostBeamRenderedOnGuest=true;
 await g.waitForTimeout(800);assert.equal(await g.evaluate(()=>window.__danteGame.scene.getScene('Game').party.mirrorHost.hunter.beamView.view.visible),false);
 await g.keyboard.down('d');await g.waitForTimeout(450);const phase=await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.art.travel);await g.waitForTimeout(400);await g.keyboard.up('d');assert.ok(await h.evaluate(before=>window.__danteGame.scene.getScene('Game').party.partner.art.travel>before,phase));report.coopPaintedWalk=true;report.coopChargeRingAndPercentage=true;
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await g.evaluate(()=>window.__danteCoop.disconnect(false)).catch(()=>{});await h.evaluate(()=>window.__danteCoop.disconnect()).catch(()=>{});await gc.close();await hc.close();await b.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(report);
