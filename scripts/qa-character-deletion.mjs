import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out=process.argv[2]??'docs/character-showcase/deletion-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1280,height:720}}),p=await context.newPage();
const KEY='echoes-of-dante.characters.v1',JOURNEY='echoes-of-dante.journey.v1';
const report={method:'Chrome headless; isolated local saves, actual delete/cancel/creation, injected storage failures; touch emulation and gamepad mock; no physical devices',errors:[]};
const watch=p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});};watch(p);
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const registry=()=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const savedKey=id=>id==='legacy-warrior'?JOURNEY:`${JOURNEY}.character.${id}`;
const saved=id=>p.evaluate(key=>localStorage.getItem(key),savedKey(id));
const state=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{classId:s.classId,xp:s.progression.xp,paused:s.scene.isPaused(),objects:s.children.list.length};});
try{
 await p.addInitScript(()=>{
  if(localStorage.getItem('qa-deletion-seeded'))return;
  const characters=[{id:'legacy-warrior',name:'Original QA',classId:'warrior',createdAt:1},{id:'hunter-qa',name:'Hunter QA',classId:'hunter',createdAt:2},...Array.from({length:4},(_,i)=>({id:`extra-${i}`,name:`Extra ${i}`,classId:i%2?'warrior':'hunter',createdAt:i+3}))];
  localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'legacy-warrior',characters}));
  for(const[cIndex,c]of characters.entries())localStorage.setItem(c.id==='legacy-warrior'?'echoes-of-dante.journey.v1':`echoes-of-dante.journey.v1.character.${c.id}`,JSON.stringify({schema:1,updatedAt:1,area:'forest',hp:100,flags:{},bestiary:{},valleyRoutes:[],valleyHabitats:[],aridHabitats:[],progression:{xp:cIndex?cIndex*30:210,echoes:[],sourceLocated:false,passageOpen:false,rewardedHollows:[],rewardedRoutes:[]}}));
  localStorage.setItem('echoes-of-dante.settings.v1',JSON.stringify({master:.7,music:.3,sfx:.5}));localStorage.setItem('qa-deletion-seeded','1');
 });
 await p.goto('http://localhost:5184/');await ready(p);await p.locator('[data-shell="characters"]').click();assert.ok(await p.locator('[data-shell="new-character"]').isDisabled());
 await p.locator('[data-shell="character-hunter-qa"]').click();await p.waitForTimeout(4100);assert.equal(await p.locator('.saved-display canvas').getAttribute('data-facing'),'front');
 for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(100);assert.ok(await p.locator('[data-shell="delete-character"]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),`Delete clipped ${width}`);
  await p.screenshot({path:`${out}/hunter-front-${width}.png`});
 }
 await p.setViewportSize({width:1280,height:720});
 const originalHunter=await saved('hunter-qa');await p.locator('[data-shell="delete-character"]').click();assert.equal(await p.locator('.character-delete-dialog').evaluate(e=>e.open),true);assert.match(await p.locator('#character-delete-title').innerText(),/Hunter QA/);assert.equal(await p.evaluate(()=>document.activeElement.dataset.shell),'cancel-delete');
 await p.screenshot({path:`${out}/confirmation.png`});await p.locator('[data-shell="cancel-delete"]').click();assert.equal((await registry()).characters.length,6);assert.equal(await saved('hunter-qa'),originalHunter);report.cancelPreservesSave=true;
 await p.locator('[data-shell="delete-character"]').click();await p.keyboard.press('Escape');assert.equal(await p.locator('.character-delete-dialog').count(),0);assert.equal((await state()).paused,true);report.escapeCancelsOnlyConfirmation=true;
 await p.evaluate(()=>{window.pad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.pad];});
 await p.locator('[data-shell="delete-character"]').click();await p.evaluate(()=>window.pad.buttons[1].value=1);await p.waitForTimeout(130);await p.evaluate(()=>window.pad.buttons[1].value=0);assert.equal(await p.locator('.character-delete-dialog').count(),0);assert.equal((await state()).paused,true);
 await p.locator('[data-shell="delete-character"]').click();await p.evaluate(()=>window.pad.buttons[9].value=1);await p.waitForTimeout(130);await p.evaluate(()=>window.pad.buttons[9].value=0);assert.equal(await p.locator('.character-delete-dialog').count(),0);assert.equal((await state()).paused,true);
 // A defaults to CANCEL, never an accidental destructive confirmation.
 await p.locator('[data-shell="delete-character"]').click();await p.evaluate(()=>window.pad.buttons[0].value=1);await p.waitForTimeout(130);await p.evaluate(()=>window.pad.buttons[0].value=0);assert.equal((await registry()).characters.length,6);report.gamepadCancel=true;
 // Registry write failure must leave both profile and save intact.
 await p.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='echoes-of-dante.characters.v1')throw new DOMException('blocked','SecurityError');return window.originalSet.call(this,k,v);};});
 await p.locator('[data-shell="delete-character"]').click();await p.locator('[data-shell="confirm-delete"]').click();assert.equal((await registry()).characters.length,6);assert.equal(await saved('hunter-qa'),originalHunter);assert.match(await p.locator('.shell-status').innerText(),/Não foi possível excluir/);await p.evaluate(()=>Storage.prototype.setItem=window.originalSet);report.registryFailureSafe=true;
 // Save removal failure rolls back the registry, preserving the exact save.
 await p.evaluate(()=>{window.originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k.endsWith('.character.hunter-qa'))throw new DOMException('blocked','SecurityError');return window.originalRemove.call(this,k);};});
 await p.locator('[data-shell="delete-character"]').click();await p.locator('[data-shell="confirm-delete"]').click();assert.equal((await registry()).characters.length,6);assert.equal(await saved('hunter-qa'),originalHunter);await p.evaluate(()=>Storage.prototype.removeItem=window.originalRemove);report.saveRemovalFailureRollsBack=true;
 const extra=await saved('extra-0');await p.locator('[data-shell="delete-character"]').click();await p.locator('[data-shell="confirm-delete"]').click();assert.equal((await registry()).characters.length,5);assert.equal((await registry()).selected,'legacy-warrior');assert.equal(await saved('hunter-qa'),null);assert.equal(await saved('extra-0'),extra);assert.equal((await state()).xp,210);assert.equal((await state()).classId,'warrior');assert.equal(await p.locator('[data-shell="new-character"]').isEnabled(),true);report.inactiveDeletionFreesSlot=true;
 await p.locator('[data-shell="delete-character"]').click();await p.locator('[data-shell="confirm-delete"]').click();await p.waitForTimeout(900);await ready(p);assert.equal(await saved('legacy-warrior'),null);assert.equal((await registry()).selected,'extra-0');assert.equal((await state()).xp,60);assert.equal((await state()).paused,true);await p.evaluate(()=>window.__danteGame.scene.getScene('Game').flushForShell());assert.equal(await saved('legacy-warrior'),null);report.activeDeletionDoesNotResurrect=true;
 for(let i=0;i<4;i++){
  assert.equal((await registry()).selected,`extra-${i}`);await p.locator('[data-shell="delete-character"]').click();await p.locator('[data-shell="confirm-delete"]').click();await p.waitForTimeout(750);await ready(p);assert.equal(await saved(`extra-${i}`),null);
 }
 assert.equal((await registry()).characters.length,0);assert.equal(await p.locator('.empty-characters').count(),1);assert.equal(await p.locator('[data-shell="new-character"]').isEnabled(),true);
 await p.evaluate(()=>{window.__danteGame.scene.getScene('Game').flushForShell();window.dispatchEvent(new Event('pagehide'));});
 assert.equal(await saved('unassigned-preview'),null);await p.reload();await ready(p);assert.equal((await registry()).characters.length,0);assert.equal(await saved('legacy-warrior'),null);assert.equal((await state()).paused,true);await p.keyboard.press('Escape');assert.equal((await state()).paused,true);await p.screenshot({path:`${out}/empty-characters.png`});report.lastDeletionAndReloadEmpty=true;
 await p.locator('[data-shell="new-character"]').click();await p.locator('[data-class="hunter"]').click();await p.locator('[name="character-name"]').fill('Hunter QA');await p.keyboard.press('Enter');await p.waitForTimeout(900);await ready(p);assert.equal((await registry()).characters.length,1);assert.notEqual((await registry()).selected,'hunter-qa');assert.equal((await state()).classId,'hunter');assert.equal((await state()).xp,0);assert.equal((await state()).paused,false);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.settings.v1')).music),.3);report.recreateStartsFresh=true;
 const recreatedId=(await registry()).selected,stale=await p.context().newPage();watch(stale);await stale.goto('http://localhost:5184/');await ready(stale);
 await p.keyboard.press('Escape');await p.locator('[data-shell="characters"]').click();await p.locator('[data-shell="delete-character"]').click();await p.locator('[data-shell="confirm-delete"]').click();await p.waitForTimeout(800);await ready(p);
 await stale.evaluate(()=>{window.__danteGame.scene.getScene('Game').flushForShell();window.dispatchEvent(new Event('pagehide'));});assert.equal(await saved(recreatedId),null);report.staleTabCannotResaveDeletedJourney=true;await stale.close();
 const mobile=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:844,height:390}}),t=await mobile.newPage();watch(t);await t.goto('http://localhost:5184/');await ready(t);await t.locator('[data-shell="characters"]').tap();await t.locator('[data-shell="delete-character"]').tap();await t.locator('[data-shell="cancel-delete"]').tap();assert.equal(await t.locator('.saved-character').count(),1);await t.locator('[data-shell="delete-character"]').tap();await t.locator('[data-shell="confirm-delete"]').tap();await t.waitForTimeout(900);await ready(t);assert.equal(await t.locator('.empty-characters').count(),1);assert.equal(await t.evaluate(()=>visualViewport.scale),1);report.touchDeletion=true;await mobile.close();
 const quota=await browser.newContext();await quota.addInitScript(()=>{
  localStorage.setItem('echoes-of-dante.journey.v1',JSON.stringify({schema:1,updatedAt:1,area:'forest',hp:100,flags:{},bestiary:{},valleyRoutes:[],valleyHabitats:[],aridHabitats:[],progression:{xp:210,echoes:[],sourceLocated:false,passageOpen:false,rewardedHollows:[],rewardedRoutes:[]}}));
  const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='echoes-of-dante.characters.v1')throw new DOMException('quota','QuotaExceededError');return set.call(this,k,v);};
 });const q=await quota.newPage();watch(q);await q.goto('http://localhost:5184/');await ready(q);assert.equal(await q.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.xp),210);report.legacyReadableWithoutRegistryWrite=true;await quota.close();
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}console.log(report);
