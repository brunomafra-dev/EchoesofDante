import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5186',out=process.env.QA_OUT??'docs/2d-refinement/qa/200/editor';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
p.setDefaultTimeout(90000);const report={passed:false,base,checks:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const click=id=>p.locator('[data-shell="'+id+'"]').click();
const read=()=>p.locator('.class-gallery [data-class] canvas').evaluateAll(es=>es.map(e=>e.__previewRead?.()));
const ready=()=>p.waitForFunction(()=>{const sex=document.querySelector('[name=character-sex]')?.value;return document.querySelectorAll('.class-gallery canvas').length===4&&[...document.querySelectorAll('.class-gallery canvas')].every(e=>{const s=e.__previewRead?.();return s?.ready&&s.sex===sex;});});
try{
 await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='untouched-real-profiles';localStorage['echoes-of-dante.journey.v1']='untouched-real-journey';});
 await p.goto(base+'/campaign-playtest.html?refinement=200&editor=1');await ready();
 await click('choose-warrior');await p.locator('[name=appearance-head]').selectOption('curly');await p.locator('[name=appearance-hair]').selectOption('copper');
 let states=await read();assert.equal(states.find(s=>s.identity==='warrior').appearance.head,'curly');assert.ok(states.filter(s=>s.identity!=='warrior').every(s=>s.appearance.head==='original'&&s.appearance.hair==='original'));
 await click('choose-hunter');assert.equal(await p.locator('[name=appearance-head]').inputValue(),'original');await p.locator('[name=appearance-head]').selectOption('tied');await p.locator('[name=appearance-hair]').selectOption('silver');
 await click('choose-warrior');assert.equal(await p.locator('[name=appearance-head]').inputValue(),'curly');assert.equal(await p.locator('[name=appearance-hair]').inputValue(),'copper');
 await p.locator('[name=character-sex]').selectOption('female');await ready();states=await read();assert.ok(states.every(s=>s.sex==='female'));assert.equal(states.find(s=>s.identity==='hunter').appearance.head,'tied');assert.equal(states.find(s=>s.identity==='warrior').appearance.head,'curly');
 for(const cls of ['astral','xenobinder']){await click('choose-'+cls);await p.locator('[name=appearance-head]').selectOption(cls==='astral'?'curly':'tied');}
 await click('choose-warrior');await p.locator('[name=character-name]').fill('Passada QA');await p.screenshot({path:out+'/independent-female.jpg',type:'jpeg',quality:90});
 await click('create');await click('back');await ready();assert.equal(await p.locator('[name=appearance-head]').inputValue(),'curly');await click('choose-hunter');assert.equal(await p.locator('[name=appearance-head]').inputValue(),'tied');assert.equal(await p.locator('[name=appearance-hair]').inputValue(),'silver');await click('choose-warrior');
 await click('create');await click('difficulty-normal');await click('prologue-skip');await p.waitForFunction(()=>window.__dante2dReview?.().ready);
 let review=await p.evaluate(()=>window.__dante2dReview());assert.equal(review.profile.appearance.head,'curly');assert.equal(review.profile.sex,'female');
 await p.reload();await click('play');await click('continue');await click('edit-appearance');await p.locator('[name=appearance-head]').selectOption('tied');await click('cancel-appearance');assert.equal((await p.evaluate(()=>window.__dante2dReview())).profile.appearance.head,'curly');
 await click('edit-appearance');await p.locator('[name=appearance-head]').selectOption('tied');await click('save-appearance');await click('play-character');await p.waitForFunction(()=>window.__dante2dReview?.().ready);assert.equal((await p.evaluate(()=>window.__dante2dReview())).profile.appearance.head,'tied');
 assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.journey.v1']]),['untouched-real-profiles','untouched-real-journey']);
 report.checks.push('Hair/cut draft is per class; selecting another class and returning preserves both independently.','Global gender updates all four presentations and retains independent appearance.','Back/difficulty navigation, save/cancel and actual reload retain new haircuts; canonical saves untouched.');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:90}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('200 independent editor',report.passed);}
