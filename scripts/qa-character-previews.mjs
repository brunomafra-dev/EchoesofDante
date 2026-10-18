import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
// Capture the actual short attack window even if an external webfont is slow.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5184',out=process.env.QA_OUT??'docs/complete-actors/revision-03/preview-qa';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce',hasTouch:true});
const report={passed:false,errors:[],warnings:[],previews:[],cleanup:[]};
p.setDefaultTimeout(30000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});p.on('console',m=>{if(['warning','error'].includes(m.type()))report.warnings.push(m.text())});
const click=id=>p.locator(`[data-shell=${id}]`).click();
const cdp=await p.context().newCDPSession(p);
// Chrome inspection confirmed these two sources belong to Playwright's injected
// hit-target instrumentation. Keep every game/Phaser listener in the comparison.
const listeners=async()=>{const r=await cdp.send('Runtime.evaluate',{expression:`Object.fromEntries(Object.entries(getEventListeners(window)).filter(([k])=>k!=='__playwright_global_listeners_check__').map(([k,v])=>[k,v.filter(e=>!e.listener.toString().includes('this._hitTargetInterceptor')).length]).filter(([,n])=>n>0))`,includeCommandLineAPI:true,returnByValue:true});return r.result.value;};
try{
 await p.addInitScript(()=>localStorage.setItem('preview-save-sentinel','keep'));
 await p.goto(base+'/campaign-playtest.html');
 // The shell opens before the campaign's preload/create has finished. Its
 // permanent UI listeners must exist before taking the selector-only baseline.
 await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view);
 await click('play');
 // Compare the same Play menu before/after, excluding only verified test tooling.
 const before=await listeners();await click('new-game');
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const sex of ['male','female']){
  await click('choose-'+cls);await p.locator('[name=character-sex]').selectOption(sex);
  await p.waitForFunction(cls=>document.querySelector(`[data-class=${cls}] canvas`)?.__preview?.ready,cls);
  const canvas=p.locator(`[data-class=${cls}] canvas`);
  await canvas.evaluate(el=>{window.qaSamples=[];window.qaTimer=setInterval(()=>{const s=el.__preview;window.qaSamples.push({phase:s.charge.phase,basic:s.hunter?s.hunter.shots.some(v=>v.active):s.astral?s.astral.snapshot().shots.length>0:s.xeno?s.xeno.snapshot().shots.length>0:s.attack.pose(s.time.now,0).phase!=='READY',beam:!!s.hunter?.beam,wave:s.wave.visible,zones:s.astral?.snapshot().zones.map(v=>v.element)??[],pet:s.xeno?.state,pulse:!!s.xeno?.snapshot().pulse,hp:s.owner.health.current,targetHp:s.target.health.current});},30);});
  await click('replay');await p.locator('[name=character-name]').fill('Alana L Élise');assert.equal(await p.locator('[name=character-name]').inputValue(),'Alana L Élise');
  await p.waitForFunction(cls=>document.querySelector(`[data-class=${cls}] canvas`).__preview.charge.phase==='CHARGING',cls);
  await p.screenshot({path:`${out}/${cls}-${sex}-charge.png`});
  await p.waitForFunction(cls=>document.querySelector(`[data-class=${cls}] canvas`).__preview.charge.phase==='RELEASE',cls);
  await p.screenshot({path:`${out}/${cls}-${sex}-release.png`});
  await p.waitForFunction(cls=>!document.querySelector(`[data-class=${cls}] canvas`).__preview.running,cls);
  const result=await canvas.evaluate(el=>{clearInterval(window.qaTimer);const s=el.__preview;return{samples:window.qaSamples,objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,sleeping:!s.game.loop.running,visibleTarget:s.targetParts.some(p=>p.visible),frame:Number(s.actor.body.frame.name)};});
  assert.ok(result.samples.some(s=>s.basic),cls+' basic');assert.ok(result.samples.some(s=>s.phase==='CHARGING'),cls+' hold');assert.ok(result.samples.some(s=>s.phase==='RELEASE'),cls+' release');
  if(cls==='warrior')assert.ok(result.samples.some(s=>s.wave),'actual kinetic wave');
  if(cls==='hunter')assert.ok(result.samples.some(s=>s.beam),'actual piercing beam');
  if(cls==='astral')assert.ok(result.samples.some(s=>s.zones.length),'actual astral zone');
  if(cls==='xenobinder'){assert.ok(result.samples.some(s=>s.pet==='ASSIST'),'assist');assert.ok(result.samples.some(s=>s.pulse),'command pulse');assert.ok(result.samples.some(s=>s.hp>65),'recovery');}
  assert.ok(result.sleeping);assert.equal(result.visibleTarget,false);assert.equal(result.frame,0);
  report.previews.push({cls,sex,...result,samples:undefined,observed:{basic:true,hold:true,release:true,beam:result.samples.some(s=>s.beam),wave:result.samples.some(s=>s.wave),elements:[...new Set(result.samples.flatMap(s=>s.zones))],petStates:[...new Set(result.samples.map(s=>s.pet).filter(Boolean))],healed:result.samples.some(s=>s.hp>65)}});console.log('Actual preview',cls,sex);
 }
 // All four Astral manifestations are the real zone renderer, not recolored ellipses.
 await click('choose-astral');
 for(const element of ['fire','water','earth']){
  await click('replay');await p.waitForFunction(element=>document.querySelector('[data-class=astral] canvas').__preview.astral.snapshot().zones.some(z=>z.element===element),element);
  await p.screenshot({path:`${out}/astral-${element}.png`});await p.waitForFunction(()=>!document.querySelector('[data-class=astral] canvas').__preview.running);
 }
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.screenshot({path:`${out}/selector-${width}.png`});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await p.setViewportSize({width:1280,height:720});
 for(let cycle=0;cycle<3;cycle++){
  await p.evaluate(()=>window.qaRetired=[...document.querySelectorAll('canvas[data-representation=complete]')].map(c=>c.__previewGame));
  await click('back');await p.waitForFunction(()=>window.qaRetired.every(g=>g.loop.game===null));
  const after=await listeners();assert.deepEqual(after,before);report.cleanup.push({cycle,listeners:after,destroyedGames:4});
  if(cycle<2){await click('new-game');await p.waitForFunction(()=>[...document.querySelectorAll('canvas[data-representation=complete]')].length===4&&[...document.querySelectorAll('canvas[data-representation=complete]')].every(c=>c.__preview?.ready));}
 }
 assert.equal(await p.evaluate(()=>localStorage.getItem('preview-save-sentinel')),'keep');assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.passed=true;
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'});throw e;}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failure:report.failure}));}
