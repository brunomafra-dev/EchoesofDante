import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/party-four/qa';await mkdir(out,{recursive:true});
const base=process.env.QA_BASE??'http://localhost:5184';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={method:'Four independent Chrome contexts (one visible camera at a time to share the QA machine GPU; all four simulations/network connections remain live), real local WebSocket relay, keyboard/mouse, touch emulation and gamepad mock. DEV campaign/position/damage fixtures; no physical-device approval.',checks:[],errors:[],metrics:[]};
const pages=[];
const scene=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const check=t=>{report.checks.push(t);console.log(t)};
const view=async p=>{for(const page of pages)await scene(page,'s.cameras.main.visible=arg',page===p);};
const key=async(p,k,ms=120)=>{await view(p);await p.bringToFront();await p.keyboard.down(k);await p.waitForTimeout(Math.max(ms,500));await p.keyboard.up(k);await p.waitForTimeout(160)};
async function upgrades(p){for(let i=0;i<30;i++){if(!await scene(p,'return s.progression.upgradePointsAvailable>0&&!s.bossActive()'))break;const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');await b.first().waitFor({state:'visible',timeout:5000});await b.first().click();await p.waitForTimeout(100)}}
async function waitParty(){await pages[0].waitForFunction(()=>window.__danteGame.scene.getScene('Game').party?.actors.size===3);for(const p of pages.slice(1))await p.waitForFunction(()=>Object.keys(window.__danteCoop.world?.players??{}).length===4&&window.__danteGame.scene.getScene('Game').party?.playerMirrors.size===3);await view(pages[0]);}
async function travel(area){await pages[0].bringToFront();await view(pages[0]);assert.ok(await scene(pages[0],'return s.transitionArea(arg)',area));for(const p of pages){await p.waitForFunction(area=>window.__danteGame.scene.getScene('Game').area===area&&window.__danteGame.scene.isActive('Game'),area,{timeout:60000});await ready(p);await upgrades(p);}await waitParty();await pages[0].waitForTimeout(350);await scene(pages[0],'for(const p of [s.player,...s.party.players])p.invulnerableUntil=Infinity');console.log('Travel',area);}
try{
 for(const classId of ['warrior','hunter','astral','xenobinder']){
  const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});pages.push(p);p.setDefaultTimeout(120000);
  p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
  p.qaFrames=[];p.on('websocket',socket=>socket.on('framereceived',({payload})=>{let m;try{m=JSON.parse(payload.toString());}catch{return;}if(m.type==='world'){p.qaFrames.push({type:m.type,total:m.total,xp:m.world?.progression?.xp,epoch:m.epoch});if(p.qaFrames.length>20)p.qaFrames.shift();}else if(['joined','ended','error','travel'].includes(m.type))p.qaFrames.push({type:m.type,id:m.id,epoch:m.epoch,message:m.message});}));
  await p.goto(`${base}/party-playtest.html?class=${classId}&sex=${classId==='warrior'?'male':'female'}&kit=basic`,{waitUntil:'domcontentloaded'});await p.bringToFront();await ready(p);await upgrades(p);await scene(p,"s.cameras.main.visible=false;s.game.loop.hasFocus=true;s.game.loop.blur=()=>{}");console.log("Loaded",classId);
 }
 const [h,hunter,astral,xeno]=pages;await view(h);
 await scene(h,"s.saveProgress();return r.connect(arg,'create',{name:'Guerreiro QA',classId:'warrior',sex:'male'},s.area)",base.replace(/^http/,'ws')+'/coop');
 const code=await scene(h,'return r.code');
 for(const [i,p]of pages.entries())if(i)await scene(p,"s.saveProgress();return r.connect(arg.url,'join',{name:arg.cls+' QA',classId:arg.cls,sex:'female'},s.area,arg.code)",{url:base.replace(/^http/,'ws')+'/coop',code,cls:['warrior','hunter','astral','xenobinder'][i]});
 await waitParty();for(const p of pages)await upgrades(p);
 report.ids=await Promise.all(pages.map(p=>scene(p,'return r.id')));assert.equal(new Set(report.ids).size,4);
 assert.ok(await scene(h,'return s.party.players.length===3&&s.party.actors.size===3'));check('Four unique participant IDs, four existing kits and three player mirrors in every visitor');
 if(process.env.QA_PHASE!=='campaign'){
 await scene(h,'window.qaEnemyStrike=s.enemyStrike;s.enemyStrike=()=>{};for(const e of s.enemies)e.health.current=e.health.max');
 report.scale=await scene(h,'const e=s.enemies[0];return {base:s.party.resilience.get(e),max:e.health.max}');assert.equal(report.scale.max,Math.round(report.scale.base*2.2));
 for(const [i,p]of pages.entries()){
  const id=report.ids[i];await scene(h,'const p=arg==="host"?s.player:s.party.actors.get(arg).player;const walls=s.arena.obstacles;let spot;for(let y=300;y<1200&&!spot;y+=100)for(let x=300;x<1700&&!spot;x+=100)if(walls.every(o=>[0,80,160].every(dx=>Math.hypot(o.x-x-dx,o.y-y)>o.radius+40)))spot={x,y};Object.assign(p.position,spot);p.lastDashAt=-Infinity',id);await p.waitForTimeout(350);
  const before=await scene(h,'return {...(arg==="host"?s.player:s.party.actors.get(arg).player).position}',id);
  await view(p);await p.bringToFront();await p.keyboard.down('d');await h.waitForFunction(({id,x})=>{const s=window.__danteGame.scene.getScene('Game');return (id==='host'?s.player:s.party.actors.get(id).player).position.x>x+20},{id,x:before.x},{timeout:15000,polling:100});await p.keyboard.up('d');const after=await scene(h,'return {...(arg==="host"?s.player:s.party.actors.get(arg).player).position}',id);console.log("Move",i,before,after,await scene(p,"return {paused:s.scene.isPaused(),modal:s.inputModalOpen,keys:s.input.keyboard.enabled,input:s.controls.movement(),role:r.role,connected:r.connected,peer:r.peerConnected,age:performance.now()-r.worldAt,pausedHost:r.hostPaused,worldArea:r.world?.area}"));assert.ok(after.x>before.x+20);
  await key(p,'Space');await p.mouse.move(1150,360);await p.mouse.click(1150,360);await p.waitForTimeout(450);
  if(i)await scene(h,'const a=s.party.actors.get(arg);a.charge.lastReleasedAt=-Infinity;if(a.astral)a.astral.energy=100;if(a.xeno)a.xeno.bond=100',id);
  else await scene(h,'s.charge.lastReleasedAt=-Infinity');
  await view(p);await p.bringToFront();await p.keyboard.down('q');await h.waitForFunction(id=>{const s=window.__danteGame.scene.getScene('Game');return (id==='host'?s.charge:s.party.actors.get(id).charge).phase==='CHARGING'},id,{timeout:15000,polling:100});await p.waitForTimeout(300);
  assert.equal(await scene(h,'return (arg==="host"?s.charge:s.party.actors.get(arg).charge).phase',id),'CHARGING');
  assert.equal(await scene(h,'const p=arg==="host"?s.player:s.party.actors.get(arg).player;return Math.hypot(p.velocity.x,p.velocity.y)',id),0);
  await p.keyboard.up('q');await h.waitForFunction(id=>{const s=window.__danteGame.scene.getScene('Game');return Number.isFinite((id==='host'?s.charge:s.party.actors.get(id).charge).lastReleasedAt)},id,{timeout:15000,polling:100});
 }
 check('Every kit: independent movement, basic attack, Dash, charge hold immobilizes and release starts personal cooldown');
 await scene(h,'s.openEquipment()');assert.ok(await scene(h,'return !s.scene.isPaused()'));
 const beforeMenu=await scene(h,'return s.time.now');await key(hunter,'d',250);assert.ok(await scene(h,'return s.time.now>arg+150',beforeMenu));await h.locator('.equipment-dialog [data-close]').click();await h.waitForTimeout(150);check('Host inventory keeps the authoritative world and visitors running');for(const p of pages)await upgrades(p);
 for(const [i,p]of pages.entries())if(i){
  await scene(h,'const a=s.party.actors.get(arg);a.player.health.current=Math.round(a.player.maxHp*.3);r.state(arg).potionReady=0',report.ids[i]);await p.waitForFunction(()=>window.__danteCoop.ownPose?.hp<window.__danteCoop.ownPose?.maxHp);await key(p,'h');await h.waitForFunction(id=>window.__danteCoop.state(id).potionUsed===1,report.ids[i],{timeout:15000,polling:100});await p.waitForTimeout(250);
  assert.equal(await scene(h,'return r.state(arg).potionUsed',report.ids[i]),1);
  await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').economy.potions===5,{},{timeout:15000,polling:100});
 }
 check('Three independent potion receipts/cooldowns/consumption');
 report.xpKill=await scene(h,'const mob=s.enemies.find(e=>!e.isDead&&s.hollowSpawnIds.has(e)),xp=s.progression.xp,id=s.hollowSpawnIds.get(mob);mob.health.current=1;s.resolvePlayerHits(s.time.now,[mob],50,0,0x5fe6d8,s.player.position,false);return {before:xp,after:s.progression.xp,id}');assert.ok(report.xpKill.after>report.xpKill.before);await h.waitForTimeout(600);
 for(const p of pages.slice(1))await p.waitForFunction(()=>window.__danteCoop.personalXpGained>0,{},{timeout:30000,polling:100});
 for(const [i,p]of pages.entries())if(i){
  await scene(h,'const a=s.party.actors.get(arg);s.resources.add(a.player.position,1,arg);s.loot.add("forest-helmet",a.player.position,arg,a.profile.classId)',report.ids[i]);await p.waitForTimeout(300);await key(p,'e');await p.waitForTimeout(300);
  await p.waitForFunction(()=>window.__danteCoop.personalItems.some(i=>i.id==='forest-helmet'));assert.ok(await scene(p,'return r.personalItems.some(i=>i.id==="forest-helmet")'));assert.equal(await scene(p,'return r.personalItems.length'),1);
 }
 check('Shared gained XP, personal resource collection and one class-compatible equipment receipt each, no cross-player pickup');
 report.receivedDamage=await scene(h,'s.enemyStrike=window.qaEnemyStrike;const e=s.enemies.find(e=>!e.isDead);return [s.player,...s.party.players].map(p=>{p.invulnerableUntil=-Infinity;const before=p.hp;s.enemyStrike(e,{ranged:true,damage:10,victim:p.position},p);const result={before,after:p.hp};p.invulnerableUntil=Infinity;return result;})');assert.ok(report.receivedDamage.every(p=>p.after<p.before&&p.after>0));check('Existing damage path reaches each of four distinct players with personal armor resistance');
 }
 await travel('cavern');console.log('Arrived cavern');await travel('warden');console.log('Arrived warden');
 await scene(h,'for(const p of [s.player,...s.party.players]){Object.assign(p.position,{x:1000,y:760});p.invulnerableUntil=Infinity;}s.gatherParty(1000,760);s.warden.beginIntro(s.time.now)');await h.waitForTimeout(300);
 for(const id of report.ids.slice(0,3))await scene(h,'const p=arg==="host"?s.player:s.party.actors.get(arg).player;p.health.current=0;s.handleDeath(p)',id);
 await h.waitForTimeout(450);assert.ok(await scene(h,'return s.party.living.length===1&&s.warden.state!=="DORMANT"'));await astral.waitForFunction(()=>window.__danteCoop.ownPose.dead);
 for(const p of [h,hunter,astral])await key(p,'r');assert.ok(await scene(h,'return s.party.living.length===1'));check('Three dead allies wait for the last living Xenobinder; no premature boss restart');
 await scene(h,'const p=s.party.actors.get(arg).player;p.health.current=0;s.handleDeath(p);s.restart()',report.ids[3]);await h.waitForTimeout(1500);await waitParty();for(const p of pages)await upgrades(p);
 assert.ok(await scene(h,'return s.party.living.length===4'));check('Collective defeat resets exactly one boss, preserves all classes and revives the group');
 const bosses=[];
 for(const [area,boss]of [['warden','warden'],['sandpit','soterrado'],['icenest','vesper'],['caldera','titan']]){
  if((await scene(h,'return s.area'))!==area){for(const step of (area==='sandpit'?['valley','arid','dunes','sandpit']:area==='icenest'?['frost','icecave','icenest']:['cinder','obsidian','caldera']))await travel(step);}
  await scene(h,'const b=s[arg];for(const p of [s.player,...s.party.players])p.invulnerableUntil=Infinity;b.beginIntro(s.time.now)',boss);await h.waitForTimeout(3100);
  const max=await scene(h,'return s[arg].health.max',boss);
  for(const [fraction,phase] of (boss==='soterrado'?[[.45,2]]:[[.6,2],[.28,3]])){await scene(h,'const b=s[arg.boss];b.health.current=Math.round(b.health.max*arg.fraction)',{boss,fraction});await h.waitForFunction(({boss,phase})=>window.__danteGame.scene.getScene('Game')[boss].phase>=phase,{boss,phase},{timeout:15000,polling:100});await h.waitForTimeout(1000);}
  // Controlled damage tests the existing death/reward path; it is not a balance playthrough.
  await h.waitForFunction(boss=>{const s=window.__danteGame.scene.getScene('Game'),b=s[boss];if(!b.canBeHit)return false;b.health.current=1;s.resolvePlayerHits(s.time.now,[b],5000,0,0x5fe6d8,s.player.position,false);return b.isDead},boss,{timeout:20000,polling:100});await h.waitForTimeout(2200);
  assert.ok(await scene(h,'return s[arg].isDead',boss));for(const p of pages.slice(1))await p.waitForFunction(boss=>window.__danteCoop.earnedBosses.includes(boss),boss,{timeout:15000,polling:100});bosses.push({area,boss,max});
 }
 report.bosses=bosses;check('All four campaign bosses: intro, phase thresholds, existing damage/death and unique personal rewards');
 await travel('base');await travel('arid');
 for(const [i,p]of pages.entries())if(i){
  const hp=await scene(h,'s.enemyStrike=()=>{};for(const p of [s.player,...s.party.players])p.health.current=Math.ceil(p.maxHp*.7);const actor=s.party.actors.get(arg);Object.assign(actor.player.position,s.chapterPortal.position);return [s.player,...s.party.players].map(p=>p.hp)',report.ids[i]);
  await p.waitForFunction(()=>window.__danteCoop.ownPose?.prompt);await key(p,'e');
  await h.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='valley',{},{timeout:60000});await waitParty();
  assert.deepEqual(await scene(h,'return [s.player,...s.party.players].map(p=>p.hp)'),hp);
  await travel('arid');
 }
 await scene(h,'s.player.health.current=0;s.handleDeath(s.player)');await scene(hunter,'r.requestBase()');await h.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='base',{},{timeout:60000});await waitParty();assert.ok(await scene(h,'return s.player.hp>0&&!s.player.isDead'));check('Every visitor activates a physical portal; living HP survives travel and a visitor can return the party to base while host is dead');
 await travel('base');for(const area of ['forest','cavern','valley','arid','dunes','frost','icecave','cinder','obsidian']){await travel(area);report.metrics.push(await scene(h,'return {area:s.area,objects:s.children.list.length,tweens:s.tweens.getTweens().length,textures:s.textures.getTextureKeys().length,fps:s.game.loop.actualFps}'));await travel('base');}
 check('All fourteen campaign areas plus return to base keep four actors/snapshots and personal kits');
 await travel('forest');
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await view(xeno);await xeno.setViewportSize({width,height});await xeno.waitForTimeout(300);await xeno.screenshot({path:`${out}/four-${width}.png`});assert.ok(await scene(xeno,'return s.party.playerMirrors.size===3'));}
 await scene(xeno,'window.qaPad={mapping:"standard",connected:true,axes:[1,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad]');await xeno.waitForTimeout(300);assert.equal(await scene(xeno,'return s.controls.inputMethod'),'gamepad');await scene(xeno,'window.qaPad.connected=false');
 await xeno.touchscreen.tap(420,195);await xeno.waitForTimeout(250);const b=await xeno.locator('[data-action="charge"]').boundingBox();assert.ok(b);
 const cdp=await xeno.context().newCDPSession(xeno);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await scene(h,'const a=s.party.actors.get(arg);a.xeno.bond=100;a.charge.lastReleasedAt=-Infinity',report.ids[3]);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await xeno.waitForTimeout(400);assert.equal(await scene(h,'return s.party.actors.get(arg).charge.phase',report.ids[3]),'CHARGING');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await xeno.waitForTimeout(300);assert.equal(await xeno.evaluate(()=>visualViewport.scale),1);check('Four resolutions, guest Gamepad API mock and touch charge captured hold/release without zoom');
 await scene(astral,'r.socket.close()');await astral.waitForTimeout(1600);await waitParty();assert.equal(await scene(astral,'return r.id'),report.ids[2]);assert.ok(await scene(astral,'return r.connected'));check('Visitor reconnect recovers the same seat/class/receipts while the others remain connected');
 report.cycles=[];for(let i=0;i<3;i++){await scene(h,'for(const p of [s.player,...s.party.players]){p.health.current=0;s.handleDeath(p);}s.restart()');await h.waitForTimeout(1400);await waitParty();for(const p of pages)await upgrades(p);report.cycles.push(await scene(h,'return {objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,actors:s.party.actors.size}'));}
 assert.equal(report.cycles[0].objects,report.cycles[2].objects);assert.equal(report.cycles[0].textures,report.cycles[2].textures);check('Three collective respawns: stable object/texture counts, no duplicate actors or companions');
 await view(h);await h.waitForTimeout(10000);report.fps=await Promise.all(pages.map(p=>scene(p,'return s.game.loop.actualFps')));
 await scene(h,'r.disconnect(false)');for(const p of pages.slice(1)){await p.waitForFunction(()=>!!window.__danteCoop.endedMessage);assert.ok(await p.locator('[data-shell="coop-solo"]').isVisible());await scene(p,'r.disconnect(false)');}
 check('Host departure pauses every visitor with explicit solo/menu choices');
 for(const p of pages)assert.equal(await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error);report.frames=pages.map(p=>p.qaFrames);report.bossAtFailure=await scene(pages[0],'const b=s.warden??s.soterrado??s.vesper??s.titan;return b?{state:b.state,phase:b.phase,stopped:b.stopped,introduced:b.introduced,hp:b.health.current,max:b.health.max,inEnemies:s.enemies.includes(b),local:s.player===s.party.localPlayer,living:s.party.living.length,frame:s.game.loop.frame,fps:s.game.loop.actualFps,now:s.time.now}:null').catch(String);report.hostStates=await scene(pages[0],"return [...r.states].map(([id,a])=>({id,input:a.input,age:performance.now()-a.inputAt,pose:s.party.actors.get(id)?.snapshot(),canCharge:s.party.actors.get(id)?.xeno?.canCharge}))").catch(String);report.last=await Promise.all(pages.map(p=>p.evaluate(()=>({title:document.title,visibility:document.visibilityState,canvas:!!document.querySelector("canvas"),scene:window.__danteGame?.scene.getScene("Game")?.scene?.settings.status,loader:window.__danteGame?.scene.getScene("Game")?.load?.state,area:window.__danteGame?.scene.getScene("Game")?.area,transitioning:window.__danteGame?.scene.getScene("Game")?.transitioning,roomArea:window.__danteCoop?.area,epoch:window.__danteCoop?.epoch,worldArea:window.__danteCoop?.world?.area,worldAge:performance.now()-window.__danteCoop?.worldAt,clock:window.__danteGame?.scene.getScene("Game")?.time?.paused,potions:window.__danteGame?.scene.getScene("Game")?.economy?.potions,resources:window.__danteCoop?.rewardResources,dialogs:[...document.querySelectorAll("dialog[open]")].map(d=>d.className),xp:window.__danteCoop?.personalXpGained,saved:window.__danteCoop?.rewardSaved,status:window.__danteCoop?.message,close:window.__danteCoop?.lastClose})).catch(e=>String(e))));throw error;}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
