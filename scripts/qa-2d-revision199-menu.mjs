import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/199/menu';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),report={passed:false,base,checks:[],errors:[],warnings:[]};
p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(['warning','error'].includes(m.type()))report.warnings.push(m.text());});p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const click=id=>p.locator(`[data-shell="${id}"]`).click();
try{
 await p.addInitScript(()=>{for(const key of ['echoes-of-dante.characters.v1','echoes-of-dante.journey.v1'])if(!localStorage.getItem(key))localStorage.setItem(key,'protected-real-save');});
 await p.goto(base+'/campaign-playtest.html?refinement=199');
 await click('play');await click('new-game');await click('choose-astral');
 await p.locator('[name=character-sex]').selectOption('female');
 await p.waitForFunction(()=>[...document.querySelectorAll('.showcase-canvas')].every(c=>c.dataset.sex==='female'&&c.dataset.demoPhase==='idle'));
 await p.locator('[data-shell=customize-character]').click();
 await p.locator('[name=appearance-head]').selectOption('practical');await p.locator('[name=appearance-skin]').selectOption('deep');await p.locator('[name=appearance-hair]').selectOption('silver');
 await p.locator('[name=character-name]').fill('Revisao Astral');await p.screenshot({path:out+'/creator-female.jpg',type:'jpeg',quality:90});
 await click('create');await click('back');
 assert.equal(await p.locator('[name=appearance-skin]').inputValue(),'deep');assert.equal(await p.locator('[name=appearance-hair]').inputValue(),'silver');
 await click('create');await click('difficulty-normal');await p.locator('[data-shell=prologue-skip]').waitFor();await click('prologue-skip');
 await p.waitForFunction(()=>document.querySelector('.application-shell')?.classList.contains('is-open')===false&&window.__dante2dReview?.().ready);
 const state=await p.evaluate(()=>window.__dante2dReview());assert.equal(state.profile.appearance.skin,'deep');assert.equal(state.profile.sex,'female');report.checks.push('Female previews, independent appearance controls, draft navigation and real creation preserve selected appearance.');
 await p.keyboard.down('d');await p.waitForTimeout(700);await p.screenshot({path:out+'/world-astral.jpg',type:'jpeg',quality:90});await p.keyboard.up('d');
 await p.reload();await click('play');await click('continue');await click('play-character');await p.waitForFunction(()=>window.__dante2dReview?.().ready);assert.equal((await p.evaluate(()=>window.__dante2dReview())).profile.appearance.hair,'silver');
 report.checks.push('World and reload retain the created appearance in the isolated profile.');
 assert.deepEqual(await p.evaluate(()=>['echoes-of-dante.characters.v1','echoes-of-dante.journey.v1'].map(k=>localStorage[k])),['protected-real-save','protected-real-save']);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:85}).catch(()=>{});throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('2D menu',report.passed,report.checks);}
