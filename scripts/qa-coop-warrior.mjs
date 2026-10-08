import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out=process.argv[2]??'docs/regional-coop/warrior-qa';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true}),hc=await b.newContext(),gc=await b.newContext();
await hc.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'h',characters:[{id:'h',name:'Hunter Host',classId:'hunter',createdAt:1}]})));
const h=await hc.newPage(),g=await gc.newPage(),report={errors:[],method:'Two Chrome contexts, Hunter host and Warrior visitor; real keys/mouse, controlled enemy and positions; no physical hardware'};
for(const p of[h,g])p.on('pageerror',e=>report.errors.push(e.message));
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
async function aim(x,y){const pos=await g.evaluate(({x,y})=>{const c=window.__danteGame.scene.getScene('Game').cameras.main;return{x:x-c.scrollX,y:y-c.scrollY};},{x,y});await g.mouse.move(pos.x,pos.y);}
try{
 await h.goto('http://localhost:5184/?qa=play');await ready(h);await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click();await h.locator('[data-shell="coop-create"]').click();await h.waitForFunction(()=>window.__danteCoop.role==='host');await h.locator('[data-shell="coop-play"]').click();
 await g.goto('http://localhost:5184/?qa=play');await ready(g);await g.keyboard.press('Escape');await g.locator('[data-shell="coop"]').click();await g.locator('[name="coop-code"]').fill(await h.evaluate(()=>window.__danteCoop.code));await g.locator('[data-shell="coop-join"]').click();await g.waitForFunction(()=>window.__danteCoop.role==='guest');await g.locator('[data-shell="coop-play"]').click();await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party.mirrorHost);await g.waitForTimeout(300);
 assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.player.maxHp),100);report.reverseClasses=true;
 await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.arena.obstacles.length=0;s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;Object.assign(s.party.partner.player.position,{x:700,y:900});window.target=s.enemies[0];for(const e of s.enemies)if(e!==target)e.isDead=true;Object.assign(target.position,{x:754,y:900});target.update=()=>{};target.hurt=()=>{};target.health.current=target.health.max=200;});await g.waitForTimeout(650);await aim(754,900);await g.mouse.down();await g.waitForTimeout(100);await g.mouse.up();await h.waitForTimeout(250);
 assert.ok(await h.evaluate(()=>window.target.health.current<200));report.remoteSaberDamage=true;
 await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.party.partner.player.position,{x:700,y:900});Object.assign(window.target.position,{x:880,y:900});window.target.health.current=200;});await g.waitForTimeout(450);await aim(880,900);await g.keyboard.down('q');await h.waitForTimeout(450);assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.charge.phase),'CHARGING');
 const before=await h.evaluate(()=>({...window.__danteGame.scene.getScene('Game').party.partner.player.position}));await g.keyboard.down('d');await h.waitForTimeout(250);await g.keyboard.up('d');assert.deepEqual(await h.evaluate(()=>({...window.__danteGame.scene.getScene('Game').party.partner.player.position})),before);
 await g.keyboard.up('q');await g.waitForTimeout(130);await aim(700,1100);await h.waitForTimeout(300);assert.ok(await h.evaluate(()=>window.target.health.current<150));report.remoteWaveHoldReleaseFixedDirection=true;
 await g.keyboard.down('Space');await g.waitForTimeout(180);await g.keyboard.up('Space');assert.ok(await h.evaluate(()=>Number.isFinite(window.__danteGame.scene.getScene('Game').party.partner.player.lastDashAt)));report.remoteDash=true;
 await g.keyboard.down('b');await g.waitForTimeout(120);await g.keyboard.up('b');await g.waitForTimeout(150);assert.ok(await g.evaluate(()=>window.__danteGame.scene.getScene('Game').records.isOpen));assert.ok(await g.locator('[data-reset]').isDisabled());await g.locator('.records-dialog [data-close]').click();report.visitorJournalAndSaveProtection=true;
 await g.waitForTimeout(3600);await g.keyboard.down('q');await h.waitForTimeout(400);assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.charge.phase),'CHARGING');
 await h.keyboard.press('Escape');assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.charge.phase),'READY');await g.keyboard.up('q');await h.locator('[data-shell="continue"]').click();await h.waitForTimeout(350);assert.equal(await h.evaluate(()=>window.__danteGame.scene.getScene('Game').party.partner.charge.wavePending),false);report.hostMenuCancelsPartnerCharge=true;
 await g.evaluate(()=>window.__danteCoop.disconnect());await g.waitForTimeout(800);await h.evaluate(()=>window.__danteCoop.disconnect());
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await b.close();}
console.log(report);
