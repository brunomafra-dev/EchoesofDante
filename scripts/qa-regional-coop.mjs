import assert from 'node:assert/strict';
import{mkdir,writeFile}from'node:fs/promises';import{chromium}from'playwright';
const out='docs/regional-coop/qa';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true}),hc=await b.newContext({viewport:{width:1280,height:720}}),gc=await b.newContext({viewport:{width:1280,height:720},hasTouch:true});
await gc.addInitScript(()=>{if(!localStorage.getItem('coop-setup')){localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'visitor',characters:[{id:'visitor',name:'Visitante',classId:'hunter',createdAt:1}]}));localStorage.setItem('echoes-of-dante.journey.v1.character.visitor',JSON.stringify({schema:1,area:'forest',hp:80,flags:{},updatedAt:1,bestiary:{},valleyRoutes:[],valleyHabitats:[],aridHabitats:[],progression:{xp:15,echoes:[],sourceLocated:false,passageOpen:false,rewardedHollows:[],rewardedRoutes:[]}}));localStorage.setItem('coop-setup','1');}});
const h=await hc.newPage(),g=await gc.newPage(),report={errors:[],method:'Two independent Chrome clients through real local WebSocket relay; actual input/menu; DEV obstacle/target/HP setup; no physical/network-internet test'};
for(const p of[h,g]){p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});}
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const state=p=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=window.__danteCoop;return{role:r.role,xp:s.progression.xp,echoes:s.progression.echoes.size,area:s.area,p:{...s.player.position},partner:s.party.partner?{p:{...s.party.partner.player.position},hp:s.party.partner.player.hp,dead:s.party.partner.player.isDead}:null,dead:s.player.isDead,objects:s.children.list.length,tweens:s.tweens.getTweens().length,hp:s.player.hp,visiting:s.visitingCoop,fps:window.__danteGame.loop.actualFps};});
const key=async(p,k,ms=180)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(150);};
async function performanceSample(){
 const samples={host:[],guest:[]};
 for(let i=0;i<20;i++){await h.waitForTimeout(250);samples.host.push((await state(h)).fps);samples.guest.push((await state(g)).fps);}
 return Object.fromEntries(Object.entries(samples).map(([k,v])=>[k,{mean:v.reduce((a,b)=>a+b)/v.length,min:Math.min(...v),max:Math.max(...v)}]));
}
async function join(){
 await g.goto('http://localhost:5184/?qa=play');await ready(g);await g.keyboard.press('Escape');await g.locator('[data-shell="coop"]').click();await g.locator('[name="coop-code"]').fill(await h.evaluate(()=>window.__danteCoop.code));await g.locator('[data-shell="coop-join"]').click();await g.waitForFunction(()=>window.__danteCoop.role==='guest');await g.locator('[data-shell="coop-play"]').click();await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').visitingCoop&&window.__danteGame.scene.getScene('Game').party.mirrorHost);await g.waitForTimeout(400);
}
try{
 await h.goto('http://localhost:5184/?qa=play');await ready(h);await g.goto('http://localhost:5184/?qa=play');await ready(g);await h.waitForTimeout(1500);report.pairedSoloBaseline=await performanceSample();
 await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click();await h.locator('[data-shell="coop-create"]').click();await h.waitForFunction(()=>window.__danteCoop.role==='host');await h.locator('[data-shell="coop-play"]').click();await join();assert.equal((await state(g)).role,'guest');assert.equal((await state(h)).partner.hp,80);report.twoClassesOneWorld=true;
 report.pairedCoop=await performanceSample();
 const x=(await state(h)).partner.p.x;await key(g,'d',650);assert.ok((await state(h)).partner.p.x>x+80);report.guestMovementAuthoritative=true;
 // A real environment circle blocks the host-simulated partner before a controlled combat lane.
 const rock=await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),o=s.arena.obstacles.find(o=>o.x>600&&o.x<1500&&o.y>450&&o.y<1100);Object.assign(s.party.partner.player.position,{x:o.x-o.radius-70,y:o.y});s.party.partner.player.invulnerableUntil=Infinity;return o;});
 await g.waitForTimeout(300);await key(g,'d',600);assert.ok((await state(h)).partner.p.x<=rock.x-rock.radius-17);report.sharedCollision=true;
 await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.arena.obstacles.length=0;Object.assign(s.player.position,{x:400,y:900});s.player.invulnerableUntil=Infinity;Object.assign(s.party.partner.player.position,{x:600,y:900});window.target=s.enemies[0];for(const e of s.enemies)if(e!==target)e.isDead=true;Object.assign(target.position,{x:910,y:900});target.update=()=>{};target.health.current=target.health.max=44;});await g.waitForTimeout(800);
 const screen=await g.evaluate(()=>{const c=window.__danteGame.scene.getScene('Game').cameras.main;return{x:910-c.scrollX,y:900-c.scrollY};});await g.mouse.move(screen.x,screen.y);await g.mouse.down();await g.waitForTimeout(900);await g.mouse.up();await g.waitForTimeout(400);
 assert.equal((await state(h)).xp,15);assert.equal((await state(g)).xp,15);await g.waitForTimeout(500);assert.equal((await state(h)).xp,15);report.sharedDamageAndSingleXp=true;
 await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.party.partner.player.position,{x:560,y:700});});await g.waitForTimeout(450);await key(g,'e');await g.waitForTimeout(750);assert.equal((await state(h)).echoes,1);assert.equal((await state(g)).echoes,1);assert.equal((await state(h)).xp,55);report.guestEchoInteraction=true;
 await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),p=s.party.partner.player;p.health.current=1;p.invulnerableUntil=0;s.enemyStrike({position:p.position,attackRange:100,attackDamage:9},{damage:9,ranged:true},p);});await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await key(g,'r');await g.waitForTimeout(900);assert.equal((await state(g)).dead,false);assert.equal((await state(h)).partner.hp,80);report.visitorRespawn=true;
 await g.screenshot({path:`${out}/visitor.png`});await h.screenshot({path:`${out}/host.png`});
 report.fps={host:(await state(h)).fps,guest:(await state(g)).fps};
 await g.evaluate(()=>window.__danteCoop.disconnect());await g.waitForTimeout(1200);await ready(g);assert.equal((await state(g)).xp,15);assert.equal((await state(g)).echoes,0);report.soloSavePreserved=true;
 await h.waitForTimeout(600);const baseline=(await state(h)).objects;
 for(let i=0;i<2;i++){await join();await g.evaluate(()=>window.__danteCoop.disconnect());await g.waitForTimeout(1100);await h.waitForTimeout(400);assert.ok((await state(h)).objects<=baseline+2);}
 report.disconnectCyclesStable=true;
 // If the host dies, either participant can request the existing regional restart.
 await join();await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.die();s.hud.showDeath();});await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await key(g,'r');
 await h.waitForTimeout(1200);await ready(h);await g.waitForTimeout(500);assert.equal((await state(h)).dead,false);assert.equal((await state(g)).dead,false);assert.equal((await state(g)).echoes,1);report.teamRespawn=true;
 await g.evaluate(()=>window.__danteCoop.disconnect());await g.waitForTimeout(1000);await h.evaluate(()=>window.__danteCoop.disconnect());
 report.regions=[];
 for(const[area,width,height]of[['valley',1280,720],['arid',1366,768],['dunes',1920,1080],['frost',844,390]]){
  await h.evaluate(async area=>{const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');s.progression.restore({xp:1000,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[]});for(const id of ['saberArc','saberReach','dashCooldown','dashDuration','chargeWidth','chargePower'])while(s.progression.investUpgrade(id)){};for(const k of JOURNEY_FLAGS)s[k]=true;s.area=area;s.scene.restart();},area);
  await h.waitForTimeout(900);await ready(h);await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click();await h.locator('[data-shell="coop-create"]').click();await h.waitForFunction(()=>window.__danteCoop.role==='host');await h.locator('[data-shell="coop-play"]').click();await join();assert.equal((await state(g)).area,area);
  await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;});
  await g.setViewportSize({width,height});await g.waitForTimeout(300);await g.screenshot({path:`${out}/${area}-${width}.png`});
  assert.ok(await g.evaluate(()=>window.__danteGame.scene.getScene('Game').party.mirrors.size>0));report.regions.push({area,width,height});
  if(area==='frost'){
   const xp=(await state(h)).xp;await h.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').party.partner.player.position,{x:990,y:520}));await h.waitForTimeout(650);assert.equal((await state(h)).xp,xp+20);assert.equal((await state(g)).xp,xp+20);report.visitorExplorationReward=true;
   const habitat=await h.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{FROST_ENCOUNTERS}=await import('/src/config/frost.ts');const q=FROST_ENCOUNTERS.at(-1),e=s.siroccoResidents.get(q.id);s.resolvePlayerHits(s.time.now,[e],999,0,0x5fe6d8,s.player.position,false);s.siroccoHabitatCooldowns.set(q.id,0);Object.assign(s.player.position,{x:440,y:1000});Object.assign(s.party.partner.player.position,q);return q;});
   await h.waitForTimeout(700);assert.equal(await h.evaluate(id=>window.__danteGame.scene.getScene('Game').siroccoResidents.has(id),habitat.id),false);
   await h.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').party.partner.player.position,{x:600,y:1000}));await h.waitForTimeout(700);assert.equal(await h.evaluate(id=>window.__danteGame.scene.getScene('Game').siroccoResidents.has(id),habitat.id),true);report.visitorPreventsUnsafeRenewal=true;
   await g.setViewportSize({width:1280,height:720});await g.evaluate(()=>{window.pad={connected:true,mapping:'standard',axes:[.6,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.pad];});await g.waitForTimeout(450);assert.equal(await g.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'gamepad');
   await g.evaluate(()=>{window.pad.axes[0]=0;window.pad.buttons[6].value=1;});await h.waitForTimeout(400);assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.charge.phase),'CHARGING');await g.evaluate(()=>window.pad.buttons[6].value=0);await h.waitForTimeout(350);assert.ok(await h.evaluate(()=>Number.isFinite(window.__danteGame.scene.getScene('Game').party.partner.charge.lastReleasedAt)));report.coopGamepadHoldRelease=true;
   await g.evaluate(()=>navigator.getGamepads=()=>[]);await h.waitForTimeout(3800);
   const cdp=await gc.newCDPSession(g);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:4});await g.setViewportSize({width:844,height:390});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:400,y:190,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await g.waitForTimeout(150);
   const r=await g.locator('[data-action="charge"]').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+38,y:y-23,id:1}]});await h.waitForTimeout(550);assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.charge.phase),'CHARGING');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await h.waitForTimeout(350);assert.ok(await h.evaluate(()=>Number.isFinite(window.__danteGame.scene.getScene('Game').party.partner.charge.lastReleasedAt)));assert.equal(await g.evaluate(()=>visualViewport.scale),1);report.coopTouchHoldDragRelease=true;
  }
  await g.evaluate(()=>window.__danteCoop.disconnect());await g.waitForTimeout(900);await h.evaluate(()=>window.__danteCoop.disconnect());
 }
 await h.evaluate(()=>window.__danteCoop.disconnect());await h.waitForTimeout(150);const health=await(await fetch('http://localhost:5190')).json();assert.equal(health.rooms,0);report.roomsReleased=true;
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await b.close();}console.log(report);
