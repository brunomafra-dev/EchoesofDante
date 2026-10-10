import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/inventory-loot/qa';await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome'});
const report={method:'Chrome CDP touch + generic Gamepad API mock, no physical devices',errors:[]};
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const watch=p=>p.on('pageerror',e=>report.errors.push(e.message));
try{
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),p=await context.newPage();watch(p);
 await p.goto('http://localhost:5184/inventory-playtest.html?class=hunter&sex=female');await ready(p);await p.locator('.playtest-navigation').evaluate(e=>e.open=false);
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.loot.add('forest-gloves',s.player.position);});await p.waitForTimeout(250);
 await p.locator('[data-action="interact"]').tap();await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').equipment.snapshot().items.length),1);
 await p.locator('.inventory-launcher').tap();await p.locator('[data-item="forest-gloves"]').tap();await p.locator('[data-equip]').tap();await p.locator('.equipment-dialog [data-close]').tap();assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').equipment.snapshot().slots.gloves),'forest-gloves');report.touchPickupEquip=true;
 await context.close();
 const q=await browser.newPage();watch(q);await q.addInitScript(()=>{window.qaPad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.qaPad];});
 await q.goto('http://localhost:5184/inventory-playtest.html');await ready(q);await q.locator('.playtest-navigation').evaluate(e=>e.open=false);
 await q.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.loot.add('forest-helmet',s.player.position);});
 const press=async n=>{await q.evaluate(n=>{window.qaPad.buttons[n]={pressed:true,value:1};},n);await q.waitForTimeout(120);await q.evaluate(n=>{window.qaPad.buttons[n]={pressed:false,value:0};},n);await q.waitForTimeout(150);};
 await press(0);assert.equal(await q.evaluate(()=>window.__danteGame.scene.getScene('Game').equipment.snapshot().items.length),1);await press(9);assert.ok(await q.locator('.equipment-dialog[open]').isVisible());
 // D-pad walks through close, seven worn slots, then the first bag item.
 for(let i=0;i<8;i++)await press(13);await press(0);await press(13);await press(0);assert.equal(await q.evaluate(()=>window.__danteGame.scene.getScene('Game').equipment.snapshot().slots.helmet),'forest-helmet');await press(1);report.gamepadPickupNavigateEquip=true;
 await q.goto('http://localhost:5184/?qa=play');await ready(q);await press(9);assert.ok(await q.locator('.application-shell[open]').isVisible());await q.locator('[data-shell="equipment"]').click();assert.ok(await q.locator('.equipment-dialog[open]').isVisible());await press(9);assert.equal(await q.locator('dialog[open]').count(),0);report.startMenuPreserved=true;
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(out+'/inventory-inputs.json',JSON.stringify(report,null,2));await browser.close();}console.log(report);
