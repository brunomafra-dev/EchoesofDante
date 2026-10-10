import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/progression-threat/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Independent Chrome contexts, real local WebSocket relay. DEV positioning and controlled damage. No physical devices.',checks:[],errors:[],metrics:[]};
const contexts=[];
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const evalS=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
const check=(name)=>{report.checks.push(name);console.log(name)};
async function page(url){const c=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(40000);p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});await p.goto(url);await ready(p);await p.locator('.threat-lab').evaluate(e=>e.open=false);return p;}
async function key(p,key,ms=80){await p.keyboard.down(key);await p.waitForTimeout(ms);await p.keyboard.up(key);await p.waitForTimeout(140)}
async function upgrades(p){await p.waitForTimeout(400);for(let i=0;i<16;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();await p.waitForTimeout(120)}}
async function arrive(h,g,area){for(const p of[h,g])await p.waitForFunction(area=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area===area&&!s.transitioning&&s.party?.localPlayer===s.player&&(window.__danteCoop.role==='host'?!!s.party.partner:!!s.party.mirrorHost)},area);await upgrades(h);await upgrades(g);await evalS(h,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity');await g.waitForTimeout(300)}
async function connect(h,g){await evalS(h,"s.saveProgress();return r.connect('ws://localhost:5184/coop','create',{name:'Host',classId:s.classId},s.area)");const code=await evalS(h,'return r.code');await evalS(g,"s.saveProgress();return r.connect('ws://localhost:5184/coop','join',{name:'Guest',classId:s.classId},s.area,arg)",code);await arrive(h,g,await evalS(h,'return s.area'));}
async function guestPosition(h,g,p){await upgrades(g);await evalS(h,'Object.assign(s.party.partner.player.position,arg)',p);await g.waitForFunction(pos=>{const p=window.__danteGame.scene.getScene('Game').player.position;return Math.hypot(p.x-pos.x,p.y-pos.y)<2},p)}
async function kill(h,guest=false){return evalS(h,`const p=arg?s.party.partner.player:s.player;p.invulnerableUntil=0;p.isDashing=false;p.health.current=1;s.enemyStrike(s.enemies[0],{damage:9999,ranged:true},p);return {dead:p.isDead,credits:s.economy.credits,deathId:r.peerDeathId}`,guest)}
try{
 const h=await page('http://localhost:5184/threat-playtest.html?region=warden&kit=basic');
 const g=await page('http://localhost:5184/threat-playtest.html?region=forest&class=hunter&kit=advanced');
 await connect(h,g);
 const build=await evalS(h,'return {hostLevel:s.progression.level,peerLevel:s.party.partner.progression.level,peerHp:s.party.partner.player.maxHp,peerDash:s.party.partner.player.dashCooldown,hostDash:s.player.dashCooldown}');
 assert.equal(build.hostLevel,4);assert.equal(build.peerLevel,1);assert.equal(build.peerDash,1450);assert.equal(await evalS(g,'return s.progression.level'),1);report.build=build;check('Visitor keeps own level, equipment, HP and ability ranks instead of host kit');
 // Warden remains dormant while measuring guest input; no test invulnerability changes gameplay values.
 await guestPosition(h,g,{x:690,y:790});await key(g,'d',180);
 const before=await evalS(h,'return {...s.party.partner.player.position}');await key(g,'Space');
 const early=await evalS(h,'return s.party.partner.snapshot()');assert.ok(early.dashReady<.35,JSON.stringify(early));
 assert.ok(Math.hypot(early.x-before.x,early.y-before.y)>65);await g.waitForTimeout(1600);assert.ok(await evalS(g,'return r.world.partner.dashReady>=.99'));check('Guest Dash moves, shows real cooldown and becomes ready again');
 await guestPosition(h,g,{x:670,y:700});await g.keyboard.down('q');await g.waitForTimeout(430);
 const held=await evalS(h,'return s.party.partner.snapshot()');assert.equal(held.phase,'CHARGING');assert.ok(held.level>.2);await g.keyboard.up('q');
 await g.waitForFunction(()=>!!window.__danteCoop.world?.partner?.beam);assert.ok(await evalS(g,'return r.world.partner.chargeReady<.4'));check('Guest hold/aim/release beam and Q cooldown replicated');
 await g.waitForTimeout(3200);
 // Host stays dead while guest continues the actual boss simulation.
 await guestPosition(h,g,{x:930,y:850});await h.waitForTimeout(3100);await upgrades(h);await upgrades(g);
 assert.equal(await evalS(h,'return s.bossActive()'),true);
 const hostSave=await evalS(h,'return {xp:s.progression.xp,materials:s.economy.materials,items:s.equipment.snapshot(),credits:s.economy.credits}');
 await kill(h);await g.waitForTimeout(400);assert.equal(await evalS(h,'return s.party.partner.player.isDead'),false);assert.equal(await evalS(h,'return s.economy.credits'),hostSave.credits-Math.floor(hostSave.credits*.1));
 const hp=await evalS(h,'return s.warden.health.current');await evalS(h,'s.restart()');await h.waitForTimeout(400);assert.equal(await evalS(h,'return s.player.isDead'),true);
 await guestPosition(h,g,{x:930,y:850});await evalS(h,"s.warden.state='RECOVER';s.warden.stateUntil=s.warden.until=s.time.now+3000");
 await evalS(h,'s.partyBridge().hit([s.warden],60,0,s.party.partner.player.position,false)');assert.ok(await evalS(h,'return s.warden.health.current')<hp);
 check('Host death does not kill the visitor; active boss continues and reset is blocked while one survives');
 await kill(h,true);await g.waitForTimeout(650);assert.equal(await evalS(g,'return s.economy.credits'),214);
 const death=await evalS(h,'return r.peerDeathId');assert.ok(death);
 const duplicate=await evalS(g,'return s.journey.penalizeDeath(arg)',death);assert.equal(duplicate,0);assert.equal(await evalS(g,'return s.journey.load().economy.credits'),214);
 await key(g,'r');await arrive(h,g,'warden');assert.equal(await evalS(h,'return s.player.isDead||s.party.partner.player.isDead'),false);assert.equal(await evalS(h,'return s.warden.state'),'DORMANT');assert.equal(await evalS(g,'return s.economy.credits'),214);
 check('All fallen reset the boss; 10% loss is charged once per real death and receipt replay does not charge again');
 // A new death outside the arena still charges: revive must not leave the actor marked forever.
 await guestPosition(h,g,{x:930,y:850});await h.waitForTimeout(3100);await kill(h,true);await g.waitForTimeout(500);assert.equal(await evalS(g,'return s.economy.credits'),193);
 assert.equal(await g.locator('[data-action="restart"]').evaluate(e=>e.style.visibility),'hidden');
 await evalS(h,'s.resolvePlayerHits(s.time.now,[s.warden],9999,0,0x5fe6d8,s.player.position,false)');await h.waitForTimeout(2900);await upgrades(h);await upgrades(g);await h.waitForTimeout(400);
 assert.equal(await evalS(h,'return s.party.partner.player.isDead'),false);assert.equal(await evalS(g,'return s.player.isDead'),false);assert.equal(await evalS(h,'return s.wardenDefeated'),true);
 assert.ok(await evalS(g,'return s.journey.load().progression.bossRewards.includes("warden")'));
 const hostAfter=await evalS(h,'return {xp:s.progression.xp,materials:s.economy.materials,items:s.equipment.snapshot(),credits:s.economy.credits}');
 assert.ok(hostAfter.xp>=hostSave.xp);assert.deepEqual(hostAfter.materials,hostSave.materials);assert.deepEqual(hostAfter.items,hostSave.items);check('Second real death charges correctly; boss victory revives fallen ally and preserves equipment/materials/XP');
 // Click the visible portal using the visitor browser, not a direct transition hook.
 await g.waitForTimeout(1700);await guestPosition(h,g,{x:1490,y:825});await g.waitForTimeout(600);console.log('Portal before',await evalS(g,'return {area:s.area,active:s.signalPortal?.active,position:s.player.position,paused:s.scene.isPaused(),prompt:r.world?.prompt,action:r.world?.action}'));
 const portal=await evalS(g,'const c=s.cameras.main;return {x:1500-c.scrollX,y:830-62-c.scrollY}');await g.mouse.click(portal.x,portal.y);await g.waitForTimeout(700);console.log('Portal after',await evalS(h,'return {area:s.area,input:r.input,transitioning:s.transitioning,prompt:s.partyBridge().prompt(s.party.partner.player.position),pos:s.party.partner.player.position}'));await arrive(h,g,'valley');check('Visitor mouse-click on active nearby Warden portal travels both participants');
 await evalS(h,"s.valleyFrontierEndSeen=true;s.saveProgress();s.chapterPortal.activate()");await g.waitForTimeout(700);await upgrades(g);
 const target=await evalS(h,'return s.chapterPortal.position');await guestPosition(h,g,{x:target.x-35,y:target.y});await key(g,'e');await arrive(h,g,'arid');check('Visitor E interaction opens chapter portal for both players');
 // Compare fixed threat values on creatures, not numbers inferred from art.
 const fixed=await evalS(h,'const e=s.enemies[0],hp=e.health.max;s.equipment.grant("glacier-emitter");s.equipItem("weapon","glacier-emitter");return {before:hp,after:e.health.max}');assert.equal(fixed.before,fixed.after);check('Equipping stronger gear does not scale enemy HP');
 await h.waitForTimeout(600);await upgrades(h);await upgrades(g);
 const counts=await evalS(h,'return {objects:s.children.list.length,tweens:s.tweens.getTweens().length,textures:s.textures.getTextureKeys().length}');
 for(let i=0;i<3;i++){await kill(h,true);await g.waitForTimeout(250);await key(g,'r');await g.waitForTimeout(600)}
 const countsAfter=await evalS(h,'return {objects:s.children.list.length,tweens:s.tweens.getTweens().length,textures:s.textures.getTextureKeys().length}');assert.ok(countsAfter.objects<=counts.objects+2,JSON.stringify({counts,countsAfter}));report.respawnCounts={counts,countsAfter};check('Repeated guest respawns do not accumulate actor objects');
 await evalS(h,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity');
 await evalS(g,'window.qaPad={mapping:"standard",connected:true,axes:[0,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad]');
 const pad=async (n,ms=120)=>{await g.evaluate(n=>window.qaPad.buttons[n].value=1,n);await g.waitForTimeout(ms);await g.evaluate(n=>window.qaPad.buttons[n].value=0,n);await g.waitForTimeout(180)};
 await guestPosition(h,g,{x:400,y:600});await g.evaluate(()=>window.qaPad.axes[0]=1);await g.waitForTimeout(250);await pad(5);await g.evaluate(()=>window.qaPad.axes[0]=0);
 assert.ok(await evalS(g,'return r.world.partner.dashReady<.6'));await pad(6,450);assert.ok(await evalS(g,'return r.world.partner.chargeReady<.4'));check('Guest Gamepad API mock: movement, Dash and hold/release charge');
 await g.waitForTimeout(3300);await g.evaluate(()=>window.qaPad.connected=false);await g.setViewportSize({width:844,height:390});await guestPosition(h,g,{x:400,y:600});
 const cdp=await g.context().newCDPSession(g);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const point=async selector=>{const b=await g.locator(selector).boundingBox();assert.ok(b);return{x:b.x+b.width/2,y:b.y+b.height/2}};
 // Activate touch before resolving the DOM's button bounds.
 await g.touchscreen.tap(420,195);await g.waitForTimeout(200);
 const m=await point('.touch-move'),a=await point('[data-action="charge"]');
 const touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 await touch('touchStart',[{...m,id:1}]);await touch('touchMove',[{x:m.x+38,y:m.y,id:1}]);await g.waitForTimeout(220);
 await touch('touchStart',[{x:m.x+38,y:m.y,id:1},{...a,id:2}]);await touch('touchMove',[{x:m.x+38,y:m.y,id:1},{x:a.x-35,y:a.y-35,id:2}]);await g.waitForTimeout(400);
 assert.equal(await evalS(h,'return s.party.partner.charge.phase'),'CHARGING');const stationary=await evalS(h,'return Math.hypot(s.party.partner.player.velocity.x,s.party.partner.player.velocity.y)');assert.equal(stationary,0);
 await touch('touchEnd',[]);await g.waitForFunction(()=>window.__danteCoop.world?.partner?.chargeReady<.4);
 await g.waitForTimeout(1800);await g.locator('[data-action="attack"]').tap();await g.locator('[data-action="dash"]').tap();await g.waitForTimeout(220);assert.ok(await evalS(g,'return r.world.partner.dashReady<.6'));assert.equal(await g.evaluate(()=>visualViewport.scale),1);
 check('Guest CDP touch: simultaneous movement and charge/drag/release, movement lock while charging, strike and Dash');
 for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await g.setViewportSize({width,height});await g.waitForTimeout(250);await g.screenshot({path:out+`/guest-${width}.png`});assert.equal(await g.evaluate(()=>document.querySelectorAll('canvas').length),1);assert.equal(await g.evaluate(()=>document.querySelectorAll('.touch-controls').length),1)}
 check('Four viewports: one canvas, one touch controller, no duplicated UI');
 await h.waitForTimeout(3000);report.metrics.push(await evalS(h,'return {hostFps:s.game.loop.actualFps,objects:s.children.list.length,tweens:s.tweens.getTweens().length}'));report.metrics.push(await evalS(g,'return {guestFps:s.game.loop.actualFps,objects:s.children.list.length,tweens:s.tweens.getTweens().length}'));
 // Lab must leave real storage unchanged; its character uses temporary storage only.
 assert.equal(await h.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);assert.equal(await g.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);check('Laboratory save writes do not touch real localStorage');
 const code=await evalS(h,'return r.code');await evalS(g,'r.disconnect(false)');await g.close();await h.waitForFunction(()=>!window.__danteCoop.peer);assert.equal(await evalS(h,'return r.peerDeathId'),'');
 const replacement=await page('http://localhost:5184/threat-playtest.html?region=arid&class=hunter&kit=initial');
 await evalS(replacement,'s.saveProgress();return r.connect("ws://localhost:5184/coop","join",{name:"NewGuest",classId:s.classId},s.area,arg)',code);await arrive(h,replacement,'arid');
 assert.equal(await evalS(replacement,'return s.economy.credits'),237);assert.equal(await evalS(replacement,'return r.world.partner.deathId'),undefined);check('New participant does not inherit the previous visitor death or penalty');
 await evalS(h,'r.disconnect(false)');await evalS(replacement,'r.disconnect(false)');
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(out+'/coop.json',JSON.stringify(report,null,2));await browser.close()}
