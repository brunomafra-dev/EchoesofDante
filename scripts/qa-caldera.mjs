import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/caldera/qa';await mkdir(out,{recursive:true});
const report={method:'Chrome headless, real controls and local WebSocket pair; explicit DEV positioning/health fixtures for transitions and state gates. Not physical/human approval.',errors:[],checks:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});
const S=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
async function upgrades(p){await p.waitForTimeout(400);for(let i=0;i<10;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();}}
async function page(url){const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.basePanel);await p.locator('.threat-lab').evaluate(e=>e.open=false);await upgrades(p);return p;}
const key=async(p,k,ms=100)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(200)};
try{
 let p=await page('http://localhost:5184/caldera-playtest.html?region=caldera&kit=advanced');assert.equal(await S(p,'return s.area'),'caldera');
 await S(p,'Object.assign(s.player.position,{x:220,y:950})');await key(p,'e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='obsidian');await upgrades(p);
 await S(p,'Object.assign(s.player.position,{x:2990,y:970})');await key(p,'e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='caldera');await upgrades(p);report.checks.push('Fresh arrival return portal is independent of the base station');
 report.geometry=await p.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),{CALDERA:C,CALDERA_ROUTES}=await import('/src/config/caldera.ts');
  s.player.invulnerableUntil=Infinity;s.navigation.refreshGeometry();
  const from=s.navigation.nearest(C.entry),routes=[...CALDERA_ROUTES,C.relay,C.checkpoint].map(to=>({to,points:s.navigation.findRoute(from,s.navigation.nearest(to)).length}));
  const spawnClear=s.arena.obstacles.every(o=>Math.hypot(o.x-C.checkpoint.x,o.y-C.checkpoint.y)>o.radius+s.player.radius);
  return {routes,spawnClear,objects:s.children.list.length,textures:s.textures.getTextureKeys().length};
 });assert.ok(report.geometry.routes.every(r=>r.points>0));assert.equal(report.geometry.spawnClear,true);
 const origin=await S(p,'return {...s.player.position}');await key(p,'d',300);assert.ok(await S(p,'return s.player.position.x>arg.x+25',origin));await key(p,'Space');assert.ok(await S(p,'return s.player.dashProgress<1'));await p.waitForTimeout(800);
 await p.screenshot({path:out+'/arrival.png'});
 // Keep the current map colliders while deterministically testing an ordinary melee kill.
 report.kill=await S(p,`s.qaVictim=s.enemies.find(e=>e!==s.titan);s.qaVictim.health.current=1;s.player.invulnerableUntil=Infinity;const xp=s.progression.xp;const pos={...s.qaVictim.position};s.resolvePlayerHits(s.time.now,[s.qaVictim],20,0,0xaafce1,s.player.position,false,{},0);return{xp:s.progression.xp-xp,resources:s.resources.snapshot(),loot:s.loot.snapshot()}`);assert.equal(report.kill.xp,36);assert.ok(report.kill.resources.length>0);
 await S(p,'Object.assign(s.player.position,{x:1620,y:735})');await key(p,'e');assert.equal(await S(p,'return s.calderaRelaySeen'),true);
 report.pathsAfter=await S(p,'s.navigation.refreshGeometry();return s.navigation.findRoute(s.navigation.nearest(s.player.position),s.navigation.nearest({x:2690,y:910})).length');assert.ok(report.pathsAfter>0);
 await p.screenshot({path:out+'/relay.png'});
 await S(p,'Object.assign(s.player.position,{x:1980,y:970})');await p.waitForTimeout(180);assert.equal(await S(p,'return s.calderaCheckpointReached'),true);
 await S(p,'s.baseTravel("base")');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='base');await upgrades(p);assert.equal(await S(p,'return s.expeditionReturn.area'),'caldera');await S(p,'s.baseTravel("caldera",true)');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='caldera');await upgrades(p);assert.equal(await S(p,'return s.calderaRelaySeen'),true);
 await S(p,'Object.assign(s.player.position,{x:2280,y:960})');await p.waitForTimeout(150);assert.equal(await S(p,'return s.titan.state'),'INTRO');assert.equal(await S(p,'return s.canReturnBase()'),false);await p.waitForTimeout(2300);
 assert.ok(await S(p,'return s.enemies.filter(e=>e!==s.titan).every(e=>e.position.x<2190)'),'Entering arena must not clamp distant residents into combat');
 report.boss={phases:[],attacks:[]};
 for(const phase of[1,2,3]){
  await S(p,'s.player.invulnerableUntil=Infinity;s.titan.health.current=s.titan.health.max*arg;s.titan.state="IDLE";s.titan.until=s.time.now',phase===1?1:phase===2?.6:.25);await p.waitForTimeout(1800);
  report.boss.phases.push(await S(p,'return s.titan.phase'));
 }
 for(const attack of['cleave','slam','fissure','boulders']){
  await S(p,'Object.assign(s.player.position,{x:s.titan.position.x-125,y:s.titan.position.y});s.titan.beginAttack(s.time.now,arg,s.player.position)',attack);await p.waitForTimeout(100);assert.equal(await S(p,'return s.titan.state'),'TELEGRAPH');await p.screenshot({path:out+`/${attack}.png`});
  // Screenshot encoding can outlast a warning on slow machines. Restart the
  // explicitly forced fixture after capture so it never expires while immune.
  const hp=await S(p,'return s.player.hp');await S(p,'s.titan.beginAttack(s.time.now,arg,s.player.position);s.player.invulnerableUntil=0;if(arg==="fissure")Object.assign(s.player.position,{x:s.titan.marks[0].x,y:s.titan.marks[0].y})',attack);await p.waitForTimeout(1650);
  if(!await S(p,'return s.player.hp<arg',hp))report.failedPattern=await S(p,'return {attack:arg,state:s.titan.state,player:{...s.player.position},boss:{...s.titan.position},origin:s.titan.origin,invul:s.player.invulnerable,until:s.player.invulnerableUntil,now:s.time.now,dashing:s.player.isDashing,hp:s.player.hp,paused:s.scene.isPaused()}',attack);
  assert.ok(await S(p,'return s.player.hp<arg',hp),'Standing in the warning must receive damage');
  report.boss.attacks.push(attack);await S(p,'s.player.health.current=s.player.maxHp;s.player.invulnerableUntil=Infinity');await p.waitForTimeout(1800);
 }
 const cycles=[];for(let i=0;i<3;i++){
  await S(p,'s.player.health.current=0;s.handleDeath(s.player);s.restart()');await p.waitForTimeout(950);await upgrades(p);
  cycles.push(await S(p,'return {hp:s.player.hp,max:s.player.maxHp,objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,xp:s.progression.xp,relay:s.calderaRelaySeen,bosses:s.enemies.filter(e=>e===s.titan).length,bossHp:s.titan.health.current,bossMax:s.titan.health.max,state:s.titan.state}'));
 }report.cycles=cycles;assert.ok(cycles.every(c=>c.hp===c.max&&c.relay&&c.bosses===1&&c.bossHp===c.bossMax&&c.state==='DORMANT'));assert.equal(cycles[0].objects,cycles[2].objects);assert.equal(cycles[0].textures,cycles[2].textures);
 // Lethal hit and reward are unique; normal inventory/XP receipts are used.
 await S(p,'s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:2300,y:960})');await p.waitForTimeout(2400);
 report.victory=await S(p,'const xp=s.progression.xp;s.resolvePlayerHits(s.time.now,[s.titan],99999,0,0x5fe6d8,s.player.position,false,{},0);const once=s.progression.xp;const again=s.progression.defeatTitan();return{xp:once-xp,again,boss:s.titanDefeated,loot:s.loot.snapshot(),resources:s.resources.snapshot()}');assert.equal(report.victory.xp,260);assert.equal(report.victory.again.awarded,false);assert.equal(report.victory.boss,true);assert.ok(report.victory.loot.length>0);
 await p.waitForTimeout(1900);await upgrades(p);await S(p,'Object.assign(s.player.position,{x:3010,y:850})');await key(p,'e');assert.equal(await S(p,'return s.titanClueSeen'),true);
 await S(p,'s.saveProgress();return s.journey.load()').then(s=>{assert.equal(s.area,'caldera');assert.equal(s.flags.titanDefeated,true);assert.ok(s.progression.bossRewards.includes('titan'))});
 await S(p,'s.scene.restart()');await p.waitForTimeout(850);await upgrades(p);assert.equal(await S(p,'return !!s.titan'),false);
 report.checks.push('Exploration routes, controls, combat XP/material, relay/gate, base return/resume, phases/patterns, death/reset, single victory reward/save and no boss resurrection');
 await S(p,'Object.assign(s.player.position,{x:220,y:950})');await key(p,'e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='obsidian');await upgrades(p);assert.equal(await S(p,'return s.volcanic.onward.active'),true);
 await S(p,'Object.assign(s.player.position,{x:2990,y:970})');await key(p,'e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='caldera');report.checks.push('Both directions of Obsidian-Forjas portal');
 await p.close();
 // A real two-browser pair; both can operate the relay and travel, plus boss defeat/reset.
 p=await page('http://localhost:5184/caldera-playtest.html?region=caldera&kit=advanced&class=warrior');const g=await page('http://localhost:5184/caldera-playtest.html?region=caldera&kit=advanced&class=astral');
 await S(p,'s.saveProgress();return r.connect("ws://localhost:5184/coop","create",{name:"Host",classId:"warrior"},s.area)');const code=await S(p,'return r.code');await S(g,'s.saveProgress();return r.connect("ws://localhost:5184/coop","join",{name:"Astral",classId:"astral"},s.area,arg)',code);
 await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party.partner);await g.waitForFunction(()=>window.__danteCoop.world?.partner);await upgrades(p);await upgrades(g);
 await S(p,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;Object.assign(s.party.partner.player.position,{x:1620,y:730})');await g.waitForTimeout(350);await key(g,'e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').calderaRelaySeen);await g.waitForTimeout(700);await upgrades(g);
 await S(p,'Object.assign(s.party.partner.player.position,{x:2250,y:970})');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').titan.state==='INTRO');await g.waitForFunction(()=>window.__danteCoop.world?.boss?.active);assert.equal(await S(g,'return s.movementBounds.left'),2210);await p.waitForTimeout(2500);
  await S(p,'s.player.health.current=0;s.handleDeath(s.player)');await p.waitForTimeout(200);assert.equal(await S(p,'return s.titan.stopped'),false);await S(p,'s.party.partner.player.health.current=0;s.handleDeath(s.party.partner.player)');assert.equal(await S(p,'return s.titan.stopped'),true);await key(g,'r');await p.waitForTimeout(1000);await upgrades(p);await upgrades(g);assert.equal(await S(p,'return s.titan.state'),'DORMANT');
 report.checks.push('Real WebSocket: visitor relay, boss presentation/arena bounds, survivor keeps encounter running, collective loss resets one boss');
 await g.setViewportSize({width:844,height:390});await g.touchscreen.tap(420,195);await g.waitForTimeout(200);
 const cdp=await g.context().newCDPSession(g);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const point=async selector=>{const b=await g.locator(selector).boundingBox();assert.ok(b);return{x:b.x+b.width/2,y:b.y+b.height/2}};
 const m=await point('.touch-move'),q=await point('[data-action="charge"]');
 const touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 await touch('touchStart',[{...m,id:1}]);await touch('touchMove',[{x:m.x+30,y:m.y,id:1}]);await g.waitForTimeout(180);
 await touch('touchStart',[{x:m.x+30,y:m.y,id:1},{...q,id:2}]);await touch('touchMove',[{x:m.x+30,y:m.y,id:1},{x:q.x+25,y:q.y-25,id:2}]);await g.waitForTimeout(350);
 assert.equal(await S(p,'return s.party.partner.charge.phase'),'CHARGING');assert.equal(await S(p,'return Math.hypot(s.party.partner.player.velocity.x,s.party.partner.player.velocity.y)'),0);
 await touch('touchEnd',[]);await g.waitForFunction(()=>window.__danteCoop.world?.partner?.chargeReady<.4);await g.locator('[data-action="attack"]').tap();await g.locator('[data-action="dash"]').tap();await g.waitForTimeout(250);assert.ok(await S(g,'return r.world.partner.dashReady<.7'));assert.equal(await g.evaluate(()=>visualViewport.scale),1);
 report.checks.push('Caldera visitor CDP touch movement, charge hold/drag/release, attack and Dash; page stays at original zoom');
 const beforeReward=await S(g,'return r.personalXpGained');
 await S(p,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:2350,y:960})');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').titan.canBeHit);
 await S(p,'s.resolvePlayerHits(s.time.now,[s.titan],99999,0,0x5fe6d8,s.player.position,false,{},0)');
 await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').journey.load()?.progression.bossRewards.includes('titan'));await p.waitForTimeout(3500);await upgrades(p);await upgrades(g);
 assert.equal(await S(g,'return r.personalXpGained')-beforeReward,260);assert.equal(await S(g,'return s.journey.load().progression.bossRewards.filter(id=>id==="titan").length'),1);assert.equal(await S(g,'return s.titanDefeated'),true);
 report.checks.push('Coop victory grants visitor 260 XP and unique Titan mastery receipt through relay; no duplicate reward');
 report.views=[];for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await g.setViewportSize({width,height});await g.waitForTimeout(180);await g.screenshot({path:out+`/guest-${width}.png`});report.views.push({width,height})}
 await p.waitForTimeout(2000);report.fps={host:await S(p,'return s.game.loop.actualFps'),guest:await S(g,'return s.game.loop.actualFps')};
 assert.equal(await g.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);await S(g,'r.disconnect(false)');await S(p,'r.disconnect(false)');await g.close();assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(report);}
