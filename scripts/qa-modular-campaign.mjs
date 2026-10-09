import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out='docs/modular-characters/revision-03/qa/campaign';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const hc=await browser.newContext({viewport:{width:1280,height:720}}),gc=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true});
await gc.addInitScript(()=>{
 if(localStorage.getItem('qa-character'))return;localStorage.setItem('qa-character','1');
 localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'visitor',characters:[{id:'visitor',name:'Visitante',classId:'hunter',sex:'male',createdAt:1}]}));
});
await hc.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'host',characters:[{id:'host',name:'Host',classId:'warrior',sex:'female',createdAt:1}]})));
const h=await hc.newPage(),g=await gc.newPage();const report={method:'Two independent Chrome contexts with real local WebSockets; DEV positioning, chapter setup and shortened boss health used for coverage. Keyboard/mouse, touch viewport and Gamepad API mock; no physical devices.',errors:[],areas:[],bosses:[],cycles:[]};
for(const p of [h,g]){p.setDefaultTimeout(45000);p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});}
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const state=p=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=window.__danteCoop;return{area:s.area,role:r.role,xp:s.progression.xp,personal:r.personalXpGained,items:r.personalItems,equipment:s.equipment.snapshot(),hp:s.player.hp,maxHp:s.player.maxHp,dead:s.player.isDead,objects:s.children.list.length,tweens:s.tweens.getTweens().length,fps:window.__danteGame.loop.actualFps,boss:r.world?.boss,loot:s.loot.snapshot(),p:{...s.player.position}};});
const key=async(p,k,ms=80)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(150);};
async function arrive(area){for(const p of[h,g])await p.waitForFunction(area=>{const s=window.__danteGame.scene.getScene('Game'),r=window.__danteCoop;return s.area===area&&!s.transitioning&&s.party?.localPlayer===s.player&&s.player.view.active&&(r.role==='host'?!!s.party.partner:!!s.party.mirrorHost);},area);await g.waitForTimeout(450);await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;});report.areas.push(area);console.log('Arrived',area);}
async function travel(area){
 await h.waitForTimeout(500);
 for(let i=0;i<8;i++){const options=h.locator('.ability-upgrade-dialog[open] button:not(:disabled)');if(!await options.count())break;await options.first().click();await h.waitForTimeout(200);}
 await h.evaluate(area=>window.__danteGame.scene.getScene('Game').transitionArea(area),area);
 await h.waitForTimeout(700);
 for(let i=0;i<8;i++){const options=h.locator('.ability-upgrade-dialog[open] button:not(:disabled)');if(!await options.count())break;await options.first().click();await h.waitForTimeout(200);}
 await arrive(area);
}
async function position(x,y,guest=false){await h.evaluate(({x,y,guest})=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(guest?s.party.partner.player.position:s.player.position,{x,y});s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;},{x,y,guest});await g.waitForTimeout(450);}
try{
 await h.goto('http://localhost:5184/?qa=play');await ready(h);await g.goto('http://localhost:5184/?qa=play');await ready(g);
 // Direct connection exercises the production protocol; menu/invite UX has its own regression QA.
 await h.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();await window.__danteCoop.connect('ws://localhost:5184/coop','create',{name:'Anfitrião',classId:'warrior',sex:'female'},'forest');});
 const code=await h.evaluate(()=>window.__danteCoop.code);
 await g.evaluate(async code=>{window.__danteGame.scene.getScene('Game').saveProgress();await window.__danteCoop.connect('ws://localhost:5184/coop','join',{name:'Visitante',classId:'hunter',sex:'male'},'forest',code);},code);await arrive('forest');
 // Visitor investigates an Echo, then all existing early-campaign interaction gates.
 for(const[x,y]of[[560,700],[1870,900],[1500,360]]){await position(x,y,true);await key(g,'e');}
 assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.echoes.size),3);
 await position(1870,340,true);await key(g,'e');await position(1670,290,true);await key(g,'e');await h.waitForTimeout(1900);
 await position(1870,260,true);await arrive('cavern');
 await position(1620,490,true);await h.waitForFunction(()=>window.__danteGame.scene.getScene('Game').deepPassageOpen);
 report.guestEchoesAndCavernEntry=true;
 // Keep all existing boss/portal dependencies valid, without replaying kilometers in every QA.
 await h.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');for(const flag of JOURNEY_FLAGS)s[flag]=true;s.wardenDefeated=s.wardenEndingSeen=s.soterradoDefeated=s.soterradoClueSeen=s.vesperDefeated=s.vesperClueSeen=false;
  s.progression.restore({xp:1000,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[]});for(const id of['saberArc','saberReach','dashCooldown','dashDuration','chargeWidth','chargePower'])while(s.progression.investUpgrade(id)){}s.saveProgress();});
 await g.waitForTimeout(900);
 // A real mob death creates a ground item. Either participant collects; both receive their own copy.
 await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=s.enemies[0];s.resolvePlayerHits(s.time.now,[e],9999,0,0x5fe6d8,s.player.position,false);});
 const drop=(await state(h)).loot[0];assert.ok(drop);await position(drop.x,drop.y,true);await g.waitForTimeout(700);
 assert.ok((await state(h)).equipment.owned.includes(drop.id));assert.ok((await state(g)).equipment.owned.includes(drop.id));
 report.sharedGroundLoot=true;
 // Equip through the actual modal on both screens. Increasing HP does not heal.
 for(const p of[h,g]){await p.evaluate(()=>window.__danteGame.scene.getScene('Game').openEquipment());await p.locator(`[data-item="${drop.id}"]`).click();await p.locator('.equipment-dialog [data-close]').click();}
 await g.waitForTimeout(400);
 assert.equal((await state(h)).equipment.slots.armor,drop.id);assert.equal((await state(g)).equipment.slots.armor,drop.id);
 assert.ok((await state(h)).maxHp>await h.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.maxHp));
 assert.equal(await h.evaluate(()=>window.__danteCoop.peer.sex),'male');assert.equal(await g.evaluate(()=>window.__danteCoop.peer.sex),'female');assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.art.torso.image.visible),true);report.equipmentBothPlayers=true;report.appearanceTransmitted=true;
 // Every connected area, and every boss's actual telegraph / phase / reward presentation.
 for(const[area,keyName,entry]of[['warden','warden',[910,760]],['sandpit','soterrado',[900,850]],['icenest','vesper',[920,990]]]){
  if(area==='sandpit'){await travel('valley');await travel('arid');await travel('dunes');}
  if(area==='icenest'){await travel('frost');await travel('icecave');}
  await travel(area);await position(...entry,true);await h.waitForTimeout(3000);
  await h.evaluate(keyName=>{const s=window.__danteGame.scene.getScene('Game'),b=s[keyName];if(b.state==='DORMANT')b.beginIntro(s.time.now);},keyName);await h.waitForTimeout(2500);
  for(const ratio of[.9,.4,.2]){
   await h.evaluate(({keyName,ratio})=>{const s=window.__danteGame.scene.getScene('Game'),b=s[keyName];b.health.current=Math.round(b.health.max*ratio);b.state='IDLE';if('_state'in b)b._state='IDLE';b.until=b.stateUntil=s.time.now+700;},{keyName,ratio});
   await h.waitForTimeout(1600);
   const pose=(await state(g)).boss;assert.ok(pose&&pose.visuals.length>3&&pose.health.max>pose.health.current);
   assert.ok(pose.visuals.some(v=>v.kind==='image'&&v.visible));
   await g.screenshot({path:`${out}/${keyName}-phase-${pose.phase}.png`});
  }
  if(keyName==='warden'){
   const before=await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.warden;
    for(const [i,p]of [s.player,s.party.partner.player].entries()){Object.assign(p.position,{x:b.position.x+110,y:b.position.y+i*15});p.invulnerableUntil=0;p.setHurtGrace(0);p.health.current=p.health.max;}
    b.beginAttack(s.time.now,'sweep',s.player.position);return[s.player.hp,s.party.partner.player.hp];});
   await h.waitForTimeout(1300);
   const after=await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;return[s.player.hp,s.party.partner.player.hp];});
   assert.ok(after.every((hp,i)=>hp<before[i]),'One sweep must evaluate both players');report.bossCanHitBothPlayers={before,after};
  }
  // Visitor's real primary attack damages the authoritative boss.
  const target=await h.evaluate(keyName=>{const s=window.__danteGame.scene.getScene('Game'),b=s[keyName];b.state='RECOVER';if('_state'in b)b._state='RECOVER';b.until=b.stateUntil=s.time.now+6000;Object.assign(s.party.partner.player.position,{x:b.position.x-220,y:b.position.y});return{x:b.position.x,y:b.position.y,hp:b.health.current};},keyName);
  await g.waitForTimeout(500);const screen=await g.evaluate(t=>{const c=window.__danteGame.scene.getScene('Game').cameras.main;return{x:t.x-c.scrollX,y:t.y-c.scrollY};},target);
  await g.mouse.move(screen.x,screen.y);await g.mouse.down();await g.waitForTimeout(1000);await g.mouse.up();
  const hp=await h.evaluate(k=>window.__danteGame.scene.getScene('Game')[k].health.current,keyName);assert.ok(hp<target.hp,`${keyName}: guest ranged primary must hit`);
  await h.evaluate(keyName=>{const s=window.__danteGame.scene.getScene('Game');s.resolvePlayerHits(s.time.now,[s[keyName]],9999,0,0x5fe6d8,s.player.position,false);},keyName);
  await g.waitForTimeout(2100);assert.equal((await state(g)).boss.isDead,true);
  const upgrades=h.locator('.ability-upgrade-dialog[open] button:not(:disabled)');
  if(await upgrades.count())await upgrades.first().click();
  report.bosses.push({area,guestPrimary:true,death:true,visuals:(await state(g)).boss.visuals.length});
 }
 assert.ok((await state(g)).equipment.owned.includes('glacier-focus'));
 // Charge, movement and Dash use the existing guest action pipeline.
 await travel('icecave');await position(420,990,true);await key(g,'d',250);await key(g,'Space');await g.waitForTimeout(500);
 // A route reward can unlock a mastery choice; finish that real modal before
 // testing charge. Host menus deliberately cancel and pause visitor actions.
 for(let i=0;i<8;i++){const options=h.locator('.ability-upgrade-dialog[open] button:not(:disabled)');if(!await options.count())break;await options.first().click();await h.waitForTimeout(200);}
 await g.keyboard.down('q');await g.waitForTimeout(400);
 const chargeState=await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{phase:s.party.partner.charge.phase,paused:s.scene.isPaused(),input:window.__danteCoop.input,dash:s.party.partner.player.isDashing,now:s.time.now,offset:s.recordsTimeOffset,dialog:s.abilityUpgradeDialog.isOpen};});
 assert.equal(chargeState.phase,'CHARGING',JSON.stringify(chargeState));await g.keyboard.up('q');await g.waitForTimeout(500);report.guestKit=true;
 for(let i=0;i<3;i++){
  await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;s.enemyStrike(s.enemies[0],{damage:25,ranged:true});});await h.waitForTimeout(650);await key(g,'r');await arrive('icecave');report.cycles.push(await state(h));
 }
 assert.ok(report.cycles.every(s=>s.objects===report.cycles[0].objects&&s.tweens===report.cycles[0].tweens));
 await g.waitForTimeout(2500);report.performance={host:(await state(h)).fps,guest:(await state(g)).fps,pairedContextsOneComputer:true};
 const persistence=await g.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),r=window.__danteCoop,{validEquipment}=await import('/src/config/equipment.ts');
  const before=s.journey.load();s.journey.creditCoopXp(r.receipt,r.personalXpGained,r.personalItems);const after=s.journey.load();
  return{xpBefore:before.progression.xp,xpAfter:after.progression.xp,itemsBefore:before.equipment.owned.length,itemsAfter:after.equipment.owned.length,
   invalid:validEquipment({owned:['glacier-focus','bad',17],slots:{weapon:'glacier-focus',accessory:'glacier-focus'}}),mismatch:s.equipment.equip('weapon','glacier-focus')};
 });
 assert.equal(persistence.xpBefore,persistence.xpAfter);assert.equal(persistence.itemsBefore,persistence.itemsAfter);assert.equal(persistence.mismatch,false);
 assert.deepEqual(persistence.invalid,{owned:['glacier-focus'],slots:{accessory:'glacier-focus'}});report.persistence=persistence;
 for(const[width,height]of[[1366,768],[1920,1080],[844,390]]){await g.setViewportSize({width,height});await g.waitForTimeout(300);await g.evaluate(()=>window.__danteGame.scene.getScene('Game').openEquipment());assert.ok(await g.locator('.equipment-dialog').isVisible());await g.screenshot({path:`${out}/equipment-${width}.png`});await g.locator('.equipment-dialog [data-close]').click();}
 const gained=(await state(g)).personal;await g.evaluate(()=>window.__danteCoop.disconnect(false));await g.reload();await ready(g);
 assert.equal((await state(g)).area,'forest');assert.equal((await state(g)).xp,gained);assert.ok((await state(g)).equipment.owned.includes('glacier-focus'));assert.equal((await state(g)).equipment.slots.armor,drop.id);
 report.guestPersonalSaveAndReturn=true;
 await h.evaluate(()=>window.__danteCoop.disconnect(false));assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/campaign.json`,JSON.stringify(report,null,2));await browser.close();}
console.log({passed:report.passed,areas:report.areas,bosses:report.bosses,errors:report.errors});
