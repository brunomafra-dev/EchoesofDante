import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out=process.argv[2]??'docs/xenobinder/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1920,height:1080}}),report={method:'Actual character creation, replay, inventory, typing and reload in an isolated Chrome profile.',errors:[],profiles:[]};
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
try{
 await p.goto('http://localhost:5184/',{waitUntil:'domcontentloaded'});await ready();
 for(const sex of ['male','female']){
  await p.locator('[data-shell="characters"]').click();await p.locator('[data-shell="new-character"]').click();
  assert.equal(await p.locator('[data-class]').count(),4);assert.equal(await p.locator('[data-shell="future-class"]').count(),0);
  await p.locator('[data-class="xenobinder"]').click();await p.locator('[name="character-sex"]').selectOption(sex);
  await p.waitForFunction(()=>document.querySelector('[data-class="xenobinder"] .showcase-caption')?.textContent!=='PREPARADO PARA DANTE');
  await p.waitForTimeout(600);assert.ok(!await p.locator('[data-class="xenobinder"] .showcase-caption').innerText().then(s=>s.includes('INDISPONÍVEL')));
  await p.locator('[data-shell="replay"]').click();await p.waitForTimeout(700);await p.screenshot({path:`${out}/menu-${sex}.png`});
  await p.locator('[name="character-name"]').pressSequentially('AL Vínculo '+sex);assert.equal(await p.locator('[name="character-name"]').inputValue(),'AL Vínculo '+sex);
  await p.locator('[data-shell="create"]').click();await p.waitForTimeout(700);await ready();
  const state=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{classId:s.classId,sex:s.player.sex,bond:s.xeno.bond,body:s.xenoArt.body.texture.key,pet:s.xeno.body.texture.key}});
  assert.equal(state.classId,'xenobinder');assert.equal(state.sex,sex);assert.equal(state.bond,35);assert.match(state.body,new RegExp('xenobinder-'+sex));assert.equal(state.pet,'dante-symbiont-motion');report.profiles.push(state);
  // Explicit owned-item fixture; real newly created characters have no equipped armor.
  await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.equipment.grant('forest-emitter');s.openEquipment();});await p.locator('[data-item="forest-emitter"]').click();assert.ok((await p.locator('.equipment-dialog').innerText()).includes('Condutor'));await p.locator('[data-equip]').click();await p.screenshot({path:`${out}/inventory-${sex}.png`});await p.locator('.equipment-dialog [data-close]').click();
  await p.reload({waitUntil:'domcontentloaded'});await ready();assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').classId),'xenobinder');assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.sex),sex);
 }
 const registry=await p.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')));assert.ok(registry.characters.some(c=>c.classId==='warrior'));assert.equal(registry.characters.filter(c=>c.classId==='xenobinder').length,2);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/menu.json',JSON.stringify(report,null,2));}
console.log(report);
