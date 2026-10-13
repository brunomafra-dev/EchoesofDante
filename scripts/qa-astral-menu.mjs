import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1280,height:720}}),report={method:'Chrome headless; actual creation UI and reload in an isolated browser profile.',errors:[],profiles:[]};
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
try{
 await p.goto('http://localhost:5184/',{waitUntil:'domcontentloaded'});await ready();
 for(const sex of ['male','female']){
  await p.locator('[data-shell="characters"]').click();await p.locator('[data-shell="new-character"]').click();
  assert.equal(await p.locator('[data-class]').count(),3);assert.equal(await p.locator('[data-shell="future-class"]').count(),1);
  await p.locator('[data-class="astral"]').click();await p.locator('[name="character-sex"]').selectOption(sex);
  await p.locator('[name="character-name"]').pressSequentially('AL Astral '+sex);assert.equal(await p.locator('[name="character-name"]').inputValue(),'AL Astral '+sex);
  await p.locator('[data-shell="create"]').click();await p.waitForTimeout(600);await ready();
  const state=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{classId:s.classId,sex:s.player.sex,energy:s.astral.energy,body:s.astralArt.body.texture.key,profiles:JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1'))}});
  assert.equal(state.classId,'astral');assert.equal(state.sex,sex);assert.equal(state.energy,100);assert.match(state.body,new RegExp('astral-'+sex));report.profiles.push({classId:state.classId,sex:state.sex,body:state.body});
  await p.reload({waitUntil:'domcontentloaded'});await ready();assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').classId),'astral');assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.sex),sex);
 }
 const registry=await p.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')));assert.ok(registry.characters.some(c=>c.classId==='warrior'));assert.equal(registry.characters.filter(c=>c.classId==='astral').length,2);
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile('docs/astral/qa/menu.json',JSON.stringify(report,null,2));}
console.log(report);
