import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5190',out=process.env.QA_OUT??'docs/character-cohesion/revision-03/qa/start';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),report={base,method:'Official entry point, fresh isolated Chrome contexts; natural MP4 completion and blocked sessionStorage, not only the lab/Skip path. Run separately from other browser suites because the prologue intentionally pauses on tab/window blur. Human visual approval pending.',errors:[],checks:[]};
const click=(p,id)=>p.locator(`[data-shell="${id}"]`).click();
async function page(blockSession=false){const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
 await p.addInitScript(block=>{
  window.qaRequestedStart=new URL(location.href).searchParams.has('iniciar');window.qaHeadings=[];
  new MutationObserver(()=>{const text=document.querySelector('.shell-content h2')?.textContent;if(text&&window.qaHeadings.at(-1)!==text)window.qaHeadings.push(text)}).observe(document,{childList:true,subtree:true});
  if(block)for(const name of ['getItem','setItem','removeItem']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){if(this===sessionStorage)throw new DOMException('QA: blocked session storage','SecurityError');return original.apply(this,args);};}
 },blockSession);return p;}
async function create(p,cls,name,sex,difficulty,{natural=true}={}){
 await click(p,'new-game');await click(p,'choose-'+cls);await p.locator('[name=character-sex]').selectOption(sex);await p.locator('[name=character-name]').fill(name);await click(p,'create');
 assert.equal(await p.locator('[data-shell=continue]').count(),0);assert.equal(await p.locator('[data-shell=start-new-game]').count(),0);
 await p.locator(`[data-shell=difficulty-${difficulty}]`).evaluate(b=>{b.click();b.click();});await p.locator('.prologue-video').waitFor();
 if(natural){await p.waitForFunction(()=>document.querySelector('.prologue-video')?.readyState>=2);await p.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open,null,{timeout:40000});}else{await click(p,'prologue-skip');await p.waitForFunction(()=>!document.querySelector('.application-shell').open);}
 const state=await p.evaluate(()=>({requested:window.qaRequestedStart,headings:window.qaHeadings,registry:JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')),cleanUrl:!new URL(location.href).searchParams.has('iniciar')}));
 assert.equal(state.requested,true);assert.equal(state.cleanUrl,true);assert.ok(!state.headings.includes('Sua próxima descoberta')&&!state.headings.includes('Jogar'),JSON.stringify(state.headings));
 const hero=state.registry.characters.find(c=>c.id===state.registry.selected);assert.equal(hero.name,name);assert.equal(hero.classId,cls);assert.equal(hero.campaign.difficulty,difficulty);assert.equal(hero.campaign.introSeen,true);
 await p.keyboard.press('Escape');await p.locator('.shell-content h2').filter({hasText:'Expedição pausada'}).waitFor();await click(p,'continue');await p.waitForFunction(()=>!document.querySelector('.application-shell').open);
 return{hero,state};
}
try{
 const p=await page();await p.goto(base+'/');await click(p,'play');assert.equal(await p.locator('[data-shell=continue]').count(),0);report.checks.push('Fresh official browser: New Game exists and Continue is absent');
 const first=await create(p,'astral','ÁL Gabi','female','easy');assert.equal(first.state.registry.characters.length,1);report.checks.push('New Astral: one difficulty click, natural video end, direct playable game, no title/play/continue detour and no duplicate character');
 await p.keyboard.press('Escape');await click(p,'home');await click(p,'play');assert.ok(await p.locator('[data-shell=continue]').isVisible());
 const before=await p.evaluate(id=>localStorage.getItem('echoes-of-dante.journey.v1.character.'+id),first.hero.id);
 const second=await create(p,'hunter','Outro explorador','male','hard',{natural:false});assert.equal(second.state.registry.characters.length,2);
 const preserved=await p.evaluate(id=>JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.'+id)),first.hero.id),prior=JSON.parse(before);assert.deepEqual(preserved.progression,prior.progression);assert.deepEqual(preserved.equipment,prior.equipment);
 report.checks.push('Existing save: Continue appears; New Game starts the new Hunter and preserves the previous Astral progression/equipment');await p.close();
 const blocked=await page(true);await blocked.goto(base+'/');await click(blocked,'play');assert.equal(await blocked.locator('[data-shell=continue]').count(),0);
 const fallback=await create(blocked,'xenobinder','Sem marca de sessão','male','normal');assert.equal(fallback.state.registry.characters.length,1);report.checks.push('All sessionStorage I/O blocked: New Game still starts directly and survives natural video completion');await blocked.screenshot({path:out+'/direct-game.png'});await blocked.close();
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){
  const touch=await page();await touch.setViewportSize({width,height});await touch.goto(base+'/');await click(touch,'play');assert.equal(await touch.locator('[data-shell=continue]').count(),0);
  await click(touch,'new-game');await click(touch,'choose-warrior');await touch.locator('[name=character-name]').fill('Toque '+width);await click(touch,'create');await touch.locator('[data-shell=difficulty-normal]').tap();await touch.locator('.prologue-video').waitFor();await touch.locator('[data-shell=prologue-skip]').tap();await touch.waitForFunction(()=>!document.querySelector('.application-shell').open);
  assert.equal(await touch.evaluate(()=>window.qaRequestedStart),true);await touch.close();
 }
 report.checks.push('Four target resolutions: touch on difficulty starts gameplay directly; no Continue in a fresh browser');
 const retry=await page();await retry.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage&&k==='echoes-of-dante.characters.v1'&&v.includes('"introSeen":true')&&!window.qaFailedIntro){window.qaFailedIntro=true;throw new DOMException('QA: one failed arrival write','QuotaExceededError');}return set.call(this,k,v);};});
 await retry.goto(base+'/');for(const id of ['play','new-game','choose-warrior'])await click(retry,id);await retry.locator('[name=character-name]').fill('Uma chegada');await click(retry,'create');await click(retry,'difficulty-normal');await click(retry,'prologue-skip');await retry.locator('[data-shell=retry-arrival]').waitFor();assert.equal(await retry.locator('[data-shell=play]').count(),0);await click(retry,'retry-arrival');await retry.waitForFunction(()=>!document.querySelector('.application-shell').open);assert.equal(await retry.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters.length),1);await retry.close();
 report.checks.push('A transient arrival-save failure stays in the start flow and retries the same hero directly, without title/Continue or replaying the video');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log(report.checks);
