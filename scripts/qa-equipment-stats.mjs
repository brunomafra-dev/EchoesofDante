import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out='docs/campaign-equipment/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
const report={method:'Chrome DEV, actual damage/save/equip paths with controlled target HP and stopped enemy AI; no physical device.',errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 await page.goto('http://localhost:5184/?qa=play');await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
 report.stats=await page.evaluate(()=>{
  const s=window.__danteGame.scene.getScene('Game'),e=s.enemies[0];s.player.invulnerableUntil=Infinity;e.update=()=>{};e.health.max=e.health.current=1000;
  const hit=heavy=>{const before=e.health.current;s.resolvePlayerHits(s.time.now,[e],20,0,0x5fe6d8,s.player.position,heavy);return before-e.health.current;};
  const basic=hit(false);s.equipment.grant('forest-emitter');s.equipItem('weapon','forest-emitter');const weapon=hit(false);
  s.equipment.grant('forest-focus');s.equipItem('accessory','forest-focus');const charge=hit(true);
  s.player.health.current=80;s.equipment.grant('forest-armor');s.equipItem('armor','forest-armor');const hp=s.player.hp,maxHp=s.player.maxHp;
  s.player.invulnerableUntil=0;s.enemyStrike(e,{damage:20,ranged:true});return{basic,weapon,charge,hp,maxHp,armorDamage:hp-s.player.hp};
 });
 assert.deepEqual(report.stats,{basic:20,weapon:22,charge:24,hp:80,maxHp:112,armorDamage:19});
 await page.reload();await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
 const restored=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{equipment:s.equipment.snapshot(),hp:s.player.hp,maxHp:s.player.maxHp};});
 assert.equal(restored.hp,61);assert.equal(restored.maxHp,112);assert.equal(restored.equipment.slots.weapon,'forest-emitter');report.reload=restored;
 report.legacy=await page.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),key=s.journey.storageKey(),raw=JSON.parse(localStorage.getItem(key));delete raw.equipment;localStorage.setItem(key,JSON.stringify(raw));
  const legacy=s.journey.load();const receipt='a'.repeat(32);
  s.journey.creditCoopXp(receipt,0,['glacier-focus']);s.journey.creditCoopXp(receipt,0,['glacier-focus']);const after=s.journey.load();
  return{legacy:legacy.equipment,xpBefore:legacy.progression.xp,xpAfter:after.progression.xp,items:after.equipment.owned,areaBefore:legacy.area,areaAfter:after.area};
 });
 assert.deepEqual(report.legacy.legacy,{owned:[],slots:{}});assert.equal(report.legacy.xpBefore,report.legacy.xpAfter);assert.equal(report.legacy.areaBefore,report.legacy.areaAfter);assert.deepEqual(report.legacy.items,['glacier-focus']);
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/equipment-stats.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(report);
