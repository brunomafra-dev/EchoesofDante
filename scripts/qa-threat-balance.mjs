import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/progression-threat/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),p=await browser.newPage({viewport:{width:1280,height:720}});
const report={method:'Chrome, actual regional actors and damage/reward pipeline; DEV lethal hit for coverage. No physical devices or human balance approval.',errors:[],regions:[],checks:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
p.setDefaultTimeout(40000);
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
try{
 for(const region of ['forest','cavern','arid','icecave'])for(const kit of ['initial','basic','advanced']){
  await p.goto(`http://localhost:5184/threat-playtest.html?region=${region}&kit=${kit}`);await ready();
  const sample=await p.evaluate(async()=>{
   const s=window.__danteGame.scene.getScene('Game'),e=s.enemies[0];
   const {regionalThreat}=await import('/src/config/threat.ts'),{equipmentStats}=await import('/src/config/equipment.ts');
   const enemyHp=e.health.max,at={...e.position},xp=s.progression.xp,stats=equipmentStats(s.equipment.snapshot().slots);
   s.player.health.current=s.player.maxHp;s.player.invulnerableUntil=0;
   const before=s.player.hp;s.enemyStrike(e,{damage:20,ranged:true});const received=before-s.player.hp;s.player.invulnerableUntil=Infinity;
   s.resolvePlayerHits(s.time.now,[e],s.player.attackDamage,0,0x5fe6d8,s.player.position,false);
   const attack=enemyHp-e.health.current;
   s.resolvePlayerHits(s.time.now,[e],9999,0,0x5fe6d8,s.player.position,false);
   const reward=s.resources.snapshot().find(r=>r.owner==='host'&&Math.hypot(r.x-at.x,r.y-at.y)<1);
   return{region:s.area,kit:new URLSearchParams(location.search).get('kit'),level:s.progression.level,enemyHp,playerHp:s.player.maxHp,attack,resistance:stats.resistance,received,
    expectedDamage:Math.max(1,Math.round(20*regionalThreat(s.area,at.x).damage*(1-stats.resistance))),xp:s.progression.xp-xp,expectedXp:regionalThreat(s.area,at.x).xp,reward,population:s.enemies.length};
  });
  assert.equal(sample.received,sample.expectedDamage);assert.equal(sample.xp,sample.expectedXp);assert.ok(sample.reward);assert.equal(sample.reward.amount,1);
  assert.equal(sample.reward.credits,4*sample.reward.tier);report.regions.push(sample);
 }
 for(const region of ['forest','cavern','arid','icecave']){const rows=report.regions.filter(r=>r.region===region);assert.equal(new Set(rows.map(r=>r.enemyHp)).size,1);assert.equal(new Set(rows.map(r=>r.level)).size,1);assert.ok(rows[2].attack>rows[0].attack);assert.ok(rows[2].received<rows[0].received)}
 report.checks.push('Four regions x three equipment tiers: fixed enemy HP, increased player power, real regional damage and XP, material/credit drops');
 const ledger=await p.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),before=s.journey.load(),id=crypto.randomUUID();
  before.economy.credits=237;s.journey.save(before);
  const snapshot=s.journey.load(),native=Storage.prototype.setItem;
  Storage.prototype.setItem=function(){throw new DOMException('QA quota fixture','QuotaExceededError')};
  const failed=s.journey.penalizeDeath(id);Storage.prototype.setItem=native;
  const unchanged=JSON.stringify(s.journey.load())===JSON.stringify(snapshot),retry=s.journey.penalizeDeath(id),replay=s.journey.penalizeDeath(id),after=s.journey.load();
  return{failed,unchanged,retry,replay,credits:after.economy.credits,xpBefore:before.progression.xp,xpAfter:after.progression.xp,
   materialsBefore:before.economy.materials,materialsAfter:after.economy.materials,equipmentBefore:before.equipment,equipmentAfter:after.equipment};
 });
 assert.equal(ledger.failed,undefined);assert.equal(ledger.unchanged,true);assert.equal(ledger.retry,23);assert.equal(ledger.replay,0);assert.equal(ledger.credits,214);assert.equal(ledger.xpBefore,ledger.xpAfter);assert.deepEqual(ledger.materialsBefore,ledger.materialsAfter);assert.deepEqual(ledger.equipmentBefore,ledger.equipmentAfter);report.death=ledger;
 report.checks.push('Death receipt: quota failure leaves save intact, successful retry deducts floor(10%) once, XP/materials/items untouched');
 const economy=await p.evaluate(async()=>{const e=await import('/src/config/economy.ts'),t=await import('/src/config/threat.ts'),cfg=await import('/src/config/progression.ts');return{cadence:e.EQUIPMENT_DROP_INTERVAL,potion:e.POTION_PRICE,recipes:['forest-armor','sirocco-armor','glacier-armor'].map(id=>e.recipe(id)),losses:[0,9,10,237].map(t.deathCreditLoss),cap:cfg.PROGRESSION.levelThresholds.length}});
 assert.equal(economy.cadence,12);assert.equal(economy.potion,12);assert.deepEqual(economy.recipes.map(r=>[r.credits,r.amount]),[[35,6],[70,8],[105,10]]);assert.deepEqual(economy.losses,[0,0,1,23]);assert.equal(economy.cap,10);report.economy=economy;
 assert.deepEqual(report.errors,[]);report.passed=true;console.log({passed:true,checks:report.checks});
}finally{await writeFile(out+'/balance.json',JSON.stringify(report,null,2));await browser.close()}
