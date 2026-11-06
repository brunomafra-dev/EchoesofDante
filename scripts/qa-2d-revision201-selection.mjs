import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5186',out=process.env.QA_OUT??'docs/2d-refinement/qa/201/selection';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});p.setDefaultTimeout(90000);
const report={passed:false,base,checks:[],matrix:[],errors:[],retiredAssetRequests:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});p.on('request',r=>{if(r.url().includes('/customization/'))report.retiredAssetRequests.push(r.url());});
const click=id=>p.locator('[data-shell="'+id+'"]').click();
const read=()=>p.locator('.hero-preview-host canvas').evaluate(e=>e.__previewRead());
const ready=()=>p.waitForFunction(()=>{const e=document.querySelector('.hero-preview-host canvas'),s=e?.__previewRead?.();return s?.ready&&s.sex===document.querySelector('[name=character-sex]')?.value&&s.identity===document.querySelector('[name=character-preset]')?.value;});
try{
 await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='real-profile-marker';localStorage['echoes-of-dante.journey.v1']='real-journey-marker';});
 await p.goto(base+'/campaign-playtest.html?refinement=201&presets=1');await ready();
 assert.equal(await p.locator('canvas.showcase-canvas').count(),1);assert.equal(await p.locator('[name^=appearance-]').count(),0);assert.equal(await p.locator('[data-shell=customize-character]').count(),0);
 assert.deepEqual(await p.locator('.hero-choice').evaluateAll(es=>es.map(e=>e.childNodes[0].textContent)),['Gênero','Personagem','Profissão','Nome']);
 await p.locator('[name=character-name]').fill('Operativa QA');
 for(const sex of ['male','female']){
  await p.locator('[name=character-sex]').selectOption(sex);await ready();
  for(const preset of ['warrior','hunter','astral','xenobinder']){
   await p.locator('[name=character-preset]').selectOption(preset);await ready();
   for(const profession of ['warrior','hunter','astral','xenobinder']){
    await p.locator('[name=character-profession]').selectOption(profession);const s=await read();assert.equal(s.identity,preset);assert.equal(s.sex,sex);assert.ok(Object.values(s.appearance).every(v=>v==='original'));assert.equal(await p.locator('canvas.showcase-canvas').count(),1);
    const enabled=!(await p.locator('[data-shell=create]').isDisabled());assert.equal(enabled,preset===profession);report.matrix.push({sex,preset,profession,playable:enabled});
   }
   await p.locator('[name=character-profession]').selectOption(preset);await click('replay');await p.waitForFunction(()=>document.querySelector('.hero-preview-host canvas')?.__previewRead?.().running);await p.waitForTimeout(850);await p.screenshot({path:`${out}/${preset}-${sex}.jpg`,type:'jpeg',quality:88});
  }
 }
 await p.locator('[name=character-preset]').selectOption('warrior');await p.locator('[name=character-profession]').selectOption('warrior');await click('create');await click('back');await ready();assert.equal(await p.locator('[name=character-name]').inputValue(),'Operativa QA');assert.equal(await p.locator('[name=character-sex]').inputValue(),'female');
 await click('create');await click('difficulty-normal');await click('prologue-skip');await p.waitForFunction(()=>window.__dante2dReview?.().ready);const before=await p.evaluate(()=>window.__dante2dReview());assert.equal(before.profile.classId,'warrior');assert.ok(Object.values(before.profile.appearance).every(v=>v==='original'));
 await p.keyboard.press('Escape');await click('home');await click('play');await click('continue');assert.equal(await p.locator('[data-shell=choose-companion]:visible').count(),0);assert.equal(await p.locator('[name^=appearance-]').count(),0);
 // Explicit old-profile metadata fixture; no campaign/reward changes.
 const legacyLook={skin:'deep',hair:'silver',head:'curly'};
 await p.evaluate(look=>{const k='echoes-of-dante.characters.v1',r=JSON.parse(localStorage.getItem(k));r.characters[0].appearance=look;localStorage.setItem(k,JSON.stringify(r));},legacyLook);
 await p.reload();await click('play');await click('continue');await p.waitForFunction(()=>document.querySelector('.saved-display canvas')?.__previewRead?.().ready);assert.ok(Object.values(await p.locator('.saved-display canvas').evaluate(e=>e.__previewRead().appearance)).every(v=>v==='original'));
 await click('play-character');await p.waitForFunction(()=>window.__dante2dReview?.().ready);const after=await p.evaluate(()=>window.__dante2dReview());assert.deepEqual(after.profile.appearance,legacyLook);assert.equal(after.profile.id,before.profile.id);assert.equal(after.actor.width,128);
 assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.journey.v1']]),['real-profile-marker','real-journey-marker']);
 assert.deepEqual(report.retiredAssetRequests,[]);assert.deepEqual(report.errors,[]);report.checks.push('One preview and ordered controls; no face/hair/skin editor or atlas downloads.','All 32 body/profession/gender selections preserve the selected complete body. Eight existing pairs playable; 24 missing-pose pairs explicitly blocked.','Eight original profession demonstrations, draft/back, original profile creation and reload.','Old appearance metadata retained without applying it to the painted body; canonical saves isolated.');report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:90}).catch(()=>{});throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await b.close();console.log('201 selection',report.passed);}
