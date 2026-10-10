import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/inventory-loot/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Chrome headless, real UI/keys, independent saves and actual WebSocket pair. DEV positions and controlled kills for coverage. No physical devices.',errors:[],checks:[],views:[]};
const page=await browser.newPage({viewport:{width:1280,height:720}});
const watch=p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});};watch(page);
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const state=p=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{data:s.equipment.snapshot(),free:s.equipment.free,loot:s.loot.snapshot(),hp:s.player.hp,maxHp:s.player.maxHp,objects:s.children.list.length,textures:Object.keys(s.textures.list).length,fps:window.__danteGame.loop.actualFps,area:s.area};});
const key=async(p,k)=>{await p.keyboard.down(k);await p.waitForTimeout(100);await p.keyboard.up(k);await p.waitForTimeout(250);};
const go=async(p,url)=>{await p.goto(url);await ready(p);await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;});};
async function pickup(p,pose){await p.evaluate(pose=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:pose.x,y:pose.y}),pose);await p.waitForTimeout(100);await key(p,'e');}
try{
 await go(page,'http://localhost:5184/inventory-playtest.html');await page.locator('.playtest-navigation').evaluate(e=>e.open=false);
 const beforeStorage=await page.evaluate(()=>JSON.stringify(localStorage));
 await page.evaluate(()=>window.__danteGame.scene.getScene('Game').seedInventoryPlaytest());
 const drops=(await state(page)).loot;assert.equal(drops.length,7);
 await page.waitForTimeout(200);assert.equal((await state(page)).data.items.length,0,'No proximity auto-pickup');
 for(const drop of drops)await pickup(page,drop);
 assert.equal((await state(page)).data.items.length,7);assert.equal((await state(page)).loot.length,0);report.checks.push('Contextual pickup of all seven equipment slots');
 await key(page,'i');assert.ok(await page.locator('.equipment-dialog[open]').isVisible());
 for(const id of drops.map(d=>d.id)){await page.locator(`[data-item="${id}"]`).click();await page.locator('[data-equip]').click();}
 let s=await state(page);assert.equal(Object.keys(s.data.slots).length,7);assert.equal(s.free,24);assert.equal(s.hp,100);assert.equal(s.maxHp,123); // legacy torso 12 + four pieces 11
 await page.screenshot({path:out+'/inventory-equipped.png'});await page.locator('.equipment-dialog [data-close]').click();
 for(const k of ['Space','q'])await key(page,k);await page.mouse.click(850,300);report.checks.push('Full outfit, no healing, existing kit');
 const appearance=await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.modularTorso.look);assert.ok(Object.values(appearance).every(v=>v==='basic'));
 // Capacity: identical catalog entries are distinct copies, equipped items do not use bag slots.
 await page.evaluate(()=>window.__danteGame.scene.getScene('Game').seedInventoryPlaytest(true));let full=await state(page);assert.equal(full.free,0);await pickup(page,full.loot[0]);assert.equal((await state(page)).loot.length,1);
 await key(page,'i');await page.locator('[data-item="forest-helmet"]').first().click();await page.locator('[data-equip]').click();assert.equal((await state(page)).free,1);await page.locator('.equipment-dialog [data-close]').click();await pickup(page,full.loot[0]);assert.equal((await state(page)).free,0);
 await key(page,'i');await page.locator('[data-slot="helmet"]').click();await page.locator('[data-equip]').click();assert.equal((await state(page)).data.slots.helmet,'forest-helmet');assert.match(await page.locator('.inventory-notice').innerText(),/Não foi possível/);
 // Swap at capacity succeeds because the old equipped piece takes the freed backpack place.
 await page.locator('[data-item="forest-helmet"]').first().click();await page.locator('[data-equip]').click();assert.equal((await state(page)).free,0);await page.locator('.equipment-dialog [data-close]').click();
 report.checks.push('24 slots, duplicate copies, blocked pickup/remove, swap at capacity');
 assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),beforeStorage);report.checks.push('Lab leaves real browser storage untouched');
 for(const cls of ['warrior','hunter'])for(const sex of ['male','female']){
  await go(page,`http://localhost:5184/inventory-playtest.html?class=${cls}&sex=${sex}`);await page.locator('.playtest-navigation').evaluate(e=>e.open=false);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.seedInventoryPlaytest(false,'glacier-armor');});await pickup(page,(await state(page)).loot[0]);await key(page,'i');await page.locator('[data-item="glacier-armor"]').click();await page.locator('[data-equip]').click();await page.locator('.equipment-dialog [data-close]').click();
  await page.keyboard.down('q');await page.waitForTimeout(350);await page.keyboard.up('q');await page.waitForTimeout(300);await page.screenshot({path:`${out}/${cls}-${sex}.png`});
 }
 for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await key(page,'i');await page.screenshot({path:`${out}/inventory-${width}.png`});const sizes=await page.locator('.inventory-layout').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));assert.ok(sizes.scroll<=sizes.width+1);report.views.push({width,height,...sizes});await page.locator('.equipment-dialog [data-close]').click();}
 // Main-game migration, persistent equipment and rollback when storage fails.
 const context=await browser.newContext(),solo=await context.newPage();watch(solo);await go(solo,'http://localhost:5184/?qa=play');
 await solo.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();const raw=JSON.parse(localStorage.getItem(s.journey.storageKey()));raw.equipment={owned:['forest-emitter','forest-armor','forest-focus','sirocco-emitter','sirocco-armor','sirocco-focus','glacier-emitter','glacier-armor','glacier-focus'],slots:{weapon:'forest-emitter',armor:'sirocco-armor',accessory:'glacier-focus'}};localStorage.setItem(s.journey.storageKey(),JSON.stringify(raw));const loaded=s.journey.load();s.equipment.restore(loaded.equipment);if(loaded.equipment.items.length!==9)throw Error('Legacy migration failed');});
 await solo.reload();await ready(solo);const migrated=await state(solo);assert.equal(migrated.data.items.length,9);assert.equal(migrated.data.slots.armor,'sirocco-armor');assert.equal(migrated.data.schema,2);
 await solo.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.loot.add('forest-boots',s.player.position);});await pickup(solo,(await state(solo)).loot[0]);await solo.evaluate(()=>window.__danteGame.scene.getScene('Game').equipItem('boots','forest-boots'));await solo.reload();await ready(solo);assert.equal((await state(solo)).data.slots.boots,'forest-boots');
 const rollback=await solo.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),before=JSON.stringify(s.equipment.snapshot());const write=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('QA quota');};const result=s.equipItem('weapon','glacier-emitter');s.loot.add('forest-gloves',s.player.position);s.pickupEquipment(s.loot.snapshot()[0],false);Storage.prototype.setItem=write;return{result,identical:before===JSON.stringify(s.equipment.snapshot()),pending:s.loot.snapshot().length};});assert.deepEqual(rollback,{result:false,identical:true,pending:1});report.checks.push('Nine-item save migration, reload, storage-failure rollback');
 report.performance=[];for(let i=0;i<3;i++){await solo.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.die();s.restart();});await solo.waitForTimeout(800);await ready(solo);report.performance.push(await state(solo));}
 assert.ok(report.performance.every(s=>s.objects===report.performance[0].objects&&s.textures===report.performance[0].textures));report.checks.push('Three respawns: stable objects/textures, equipped state preserved');
 // Personal loot in a live pair, including menu openness while host simulation continues.
 const guestContext=await browser.newContext(),guest=await guestContext.newPage();watch(guest);
 await guest.addInitScript(()=>{if(!localStorage.getItem('echoes-of-dante.characters.v1'))localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'visitor',characters:[{id:'visitor',name:'Hunter',classId:'hunter',createdAt:1}]}));});
 await go(guest,'http://localhost:5184/?qa=play');await guest.evaluate(()=>window.__danteGame.scene.getScene('Game').saveProgress());
 await solo.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();await window.__danteCoop.connect('ws://localhost:5184/coop','create',{name:'Warrior',classId:'warrior'},'forest');});const code=await solo.evaluate(()=>window.__danteCoop.code);
 await guest.evaluate(async code=>window.__danteCoop.connect('ws://localhost:5184/coop','join',{name:'Hunter',classId:'hunter'},'forest',code),code);
 await solo.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party?.partner?.player);await guest.waitForFunction(()=>window.__danteCoop.world?.partner);
 await solo.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;s.lootKills=0;s.resolvePlayerHits(s.time.now,[s.enemies[0]],9999,0,0x5fe6d8,s.player.position,false);});await guest.waitForTimeout(500);
 const pairDrops=(await state(solo)).loot;assert.equal(pairDrops.length,2);const gd=pairDrops.find(p=>p.owner==='guest'),hd=pairDrops.find(p=>p.owner==='host');
 await solo.evaluate(p=>Object.assign(window.__danteGame.scene.getScene('Game').party.partner.player.position,{x:p.x,y:p.y}),gd);await guest.waitForTimeout(500);await key(guest,'e');await guest.waitForTimeout(500);
 assert.ok((await state(guest)).data.items.some(i=>i.uid===gd.uid));assert.ok(!(await state(solo)).data.items.some(i=>i.uid===gd.uid));assert.equal((await state(solo)).loot.length,1);
 await pickup(solo,hd);assert.ok((await state(solo)).data.items.some(i=>i.uid===hd.uid));
 await key(guest,'i');await guest.locator(`[data-uid="${gd.uid}"]`).click();await guest.locator('[data-equip]').click();await guest.locator('.equipment-dialog [data-close]').click();await guest.waitForTimeout(500);
 assert.equal(await solo.evaluate(()=>window.__danteCoop.peer.equipment.weapon),gd.id);
 await key(solo,'i');const time=await solo.evaluate(()=>window.__danteGame.scene.getScene('Game').time.now);await solo.waitForTimeout(400);assert.ok(await solo.evaluate(t=>window.__danteGame.scene.getScene('Game').time.now>t,time));assert.equal(await guest.evaluate(()=>window.__danteCoop.hostPaused),false);await solo.locator('.equipment-dialog [data-close]').click();
 const persistent=await guest.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=window.__danteCoop;const before=s.journey.load();s.journey.creditCoopXp(r.receipt,r.personalXpGained,r.personalItems);return{before:before.equipment.items.length,after:s.journey.load().equipment.items.length,slot:s.journey.load().equipment.slots.weapon};});assert.equal(persistent.before,persistent.after);assert.equal(persistent.slot,gd.id);report.checks.push('Real WebSocket pair: personal pickup, gear sync, idempotent receipts, inventory does not pause party');
 await guest.evaluate(()=>window.__danteCoop.disconnect(false));await guest.reload();await ready(guest);assert.ok((await state(guest)).data.items.some(i=>i.uid===gd.uid));await solo.evaluate(()=>window.__danteCoop.disconnect(false));
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log({passed:report.passed,checks:report.checks,errors:report.errors});
