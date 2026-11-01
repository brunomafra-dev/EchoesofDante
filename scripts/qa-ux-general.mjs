import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5185',out=process.env.QA_OUT??'docs/ux-general/qa/dev';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const report={base,at:new Date().toISOString(),method:'Actual mouse/keyboard/touch/gamepad emulation on isolated UX labs. Advanced lab explicitly prepares previous chapters (Warden/Soterrado); Vesper/Titan and the current Galerias chapter remain pending. No DEV globals are used by this script. Real-storage sentinels preserved.',errors:[],checks:[],layouts:[]};
let p;
async function page(touch){const q=await b.newPage({viewport:{width:844,height:390},isMobile:touch,hasTouch:touch});q.setDefaultTimeout(90000);q.on('pageerror',e=>report.errors.push(e.message));await q.addInitScript(()=>{
 Element.prototype.requestFullscreen=undefined;
 if(!sessionStorage['ux-qa-sentinel']){localStorage['echoes-of-dante.characters.v1']='ux-real-character';localStorage['echoes-of-dante.settings.v1']='ux-real-settings';sessionStorage['ux-qa-sentinel']='1';}
 window.__uxAudio=[];window.__uxBuses=[];const originalConnect=AudioNode.prototype.connect;
 AudioNode.prototype.connect=function(destination,...rest){if(this instanceof GainNode&&destination===this.context.destination){const analyser=this.context.createAnalyser();originalConnect.call(this,analyser);window.__uxBuses.push({gain:this,analyser});}return originalConnect.call(this,destination,...rest);};
 const create=AudioContext.prototype.createMediaElementSource;
 AudioContext.prototype.createMediaElementSource=function(media){const s=create.call(this,media),connect=s.connect;s.connect=function(gain,...rest){const analyser=this.context.createAnalyser();gain.connect(analyser);window.__uxAudio.push({media,gain,analyser});return connect.call(this,gain,...rest)};return s;};
 });return q;}
const click=id=>p.locator(`[data-shell=${id}]`).click();
const shot=name=>p.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:84});
async function portrait(){const button=p.locator('.mobile-display[open] [data-mobile=continue]');if(await button.isVisible())await button.click();}
async function signal(){await p.waitForFunction(()=>window.__uxAudio.some(r=>!r.media.paused&&r.media.readyState>=3&&r.media.currentTime>.1));return p.evaluate(async()=>{const r=window.__uxAudio.at(-1);let peak=0;for(let i=0;i<18;i++){const d=new Float32Array(r.analyser.fftSize);r.analyser.getFloatTimeDomainData(d);for(const n of d)peak=Math.max(peak,Math.abs(n));await new Promise(r=>setTimeout(r,40));}return{peak,gain:r.gain.gain.value,context:r.gain.context.state};});}
async function clearUpgrades(){for(let i=0;i<15;i++){const x=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await x.count())await x.click();await p.waitForTimeout(100);}}
async function saved(){return p.evaluate(()=>{
 const prefix='dante-ux-review-v1.icecave.';
 const chars=JSON.parse(sessionStorage[prefix+'local.echoes-of-dante.characters.v1']);const id=chars.selected;
 const j=JSON.parse(sessionStorage[prefix+'local.echoes-of-dante.journey.v1.character.'+id]);return{missions:j.missions,tracked:j.trackedMission,credits:j.economy.credits,rewards:j.missionRewards,flags:j.flags};
});}
try{
 for(const [touch,sizes]of [[false,[[1920,1080],[1024,768]]],[true,[[568,320],[844,390],[852,393],[915,412],[393,852]]]]){
  p=await page(touch);await p.goto(base+'/campaign-playtest.html?ux-review=1&v=0.1.180');await click('settings');
  for(const[w,h]of sizes){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(180);await portrait();
   const layout=await p.evaluate(()=>({size:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,sliders:[...document.querySelectorAll('[data-volume]')].map(e=>e.getBoundingClientRect().toJSON()),buttons:[...document.querySelectorAll('.settings-actions button')].map(e=>e.getBoundingClientRect().toJSON())}));
   assert.equal(layout.overflow,false);for(const r of [...layout.sliders,...layout.buttons])assert.ok(r.y>=0&&r.bottom<=h+1&&r.height>=44,`visible comfortable controls ${w}x${h}: ${JSON.stringify(r)}`);
   report.layouts.push({touch,...layout});await shot(`settings-${w}-${h}`);
  }
  await p.close();
 }
 report.checks.push('All three sliders, preview actions and Back fit seven desktop/tablet/mobile viewport sizes without horizontal overflow; minimum 44px interactive height');
 p=await page(false);await p.setViewportSize({width:1280,height:720});await p.goto(base+'/campaign-playtest.html?ux-review=1');await click('settings');
 await click('preview-music');report.previewPlaying=await signal();assert.ok(report.previewPlaying.peak>0);
 await p.locator('[data-volume=music]').focus();await p.keyboard.press('Home');await p.waitForTimeout(150);report.previewMuted=await signal();assert.equal(report.previewMuted.gain,0);assert.equal(report.previewMuted.peak,0);
 await p.keyboard.press('End');report.previewRestored=await signal();assert.ok(report.previewRestored.peak>0);
 await click('preview-music');assert.equal(await p.locator('[data-shell=preview-music]').getAttribute('aria-pressed'),'false');assert.equal(await p.evaluate(()=>window.__uxAudio.at(-1).gain.context.state),'closed');
 await click('preview-music');await signal();await click('back');assert.equal(await p.evaluate(()=>window.__uxAudio.at(-1).gain.context.state),'closed');
 await click('settings');await click('preview-music');await p.waitForTimeout(15200);assert.equal(await p.locator('[data-shell=preview-music]').getAttribute('aria-pressed'),'false');assert.equal(await p.evaluate(()=>window.__uxAudio.at(-1).gain.context.state),'closed');
 await click('preview-sfx');report.previewEffect=await p.evaluate(async()=>{const r=window.__uxBuses.at(-1);let peak=0;for(let i=0;i<15;i++){const d=new Float32Array(r.analyser.fftSize);r.analyser.getFloatTimeDomainData(d);for(const n of d)peak=Math.max(peak,Math.abs(n));await new Promise(r=>setTimeout(r,30));}return{peak,gain:r.gain.gain.value};});assert.ok(report.previewEffect.peak>0);await click('back');
 report.checks.push('Music preview produces measured signal, keyboard volume zero silences actual output and restoration works; Stop, leaving settings and the 15s bound release its context; effect sample control works');await p.close();
 p=await page(true);await p.goto(base+'/campaign-playtest.html?ux-review=1&permanence=icecave&v=0.1.180');await p.locator('.mission-tracker').waitFor();await p.waitForTimeout(1700);await clearUpgrades();
 const before=await saved();
 for(const[w,h]of [[1920,1080],[844,390],[568,320],[393,852]]){
  await p.setViewportSize({width:w,height:h});await portrait();await p.keyboard.press('j');await p.locator('.mission-dialog[open]').waitFor();
  assert.equal(await p.locator('.mission-content').getAttribute('data-mission'),'settle-icecave');
  assert.equal(await p.locator('[data-mission-action=select-recon]').isVisible(),false,'completed history collapsed');
  const next=await p.locator('.mission-next').boundingBox();assert.ok(next.y+next.height<=h-12,`current objective first screen ${w}`);
  const action=await p.locator('.mission-actions button').boundingBox();assert.ok(action.y+action.height<=h-12,`relevant action first screen ${w}`);
  await shot(`journal-${w}-${h}`);await p.keyboard.press('Escape');
 }
 await p.setViewportSize({width:1920,height:1080});await p.keyboard.press('j');await p.setViewportSize({width:844,height:390});await p.waitForTimeout(200);assert.equal(await p.locator('.mission-picker').evaluate(d=>d.open),false,'open journal adapts when desktop window narrows');await p.keyboard.press('Escape');
 await p.setViewportSize({width:844,height:390});await p.keyboard.press('j');await p.locator('[data-mission-action=choose-mission]').click();await p.locator('[data-mission-action=group-completed]').click();await p.locator('[data-mission-action=select-recon]').click();
 assert.equal(await p.locator('.mission-content').getAttribute('data-mission'),'recon');await p.keyboard.press('Escape');assert.deepEqual(await saved(),before,'reading completed report does not change mission state/tracking/receipts');
 await p.keyboard.press('j');await p.locator('[data-mission-action=tab-regional]').click();await p.locator('[data-mission-action=choose-mission]').click();
 await p.locator('[data-mission-action=select-exp-forest]').click();await p.locator('[data-mission-action=track]').click();
 await p.keyboard.press('j');assert.equal(await p.locator('.mission-content').getAttribute('data-mission'),'exp-forest');await p.locator('[data-mission-action=untrack]').click();
 await p.reload();await p.locator('.mission-tracker').waitFor();await p.waitForTimeout(800);await clearUpgrades();assert.equal(await p.locator('.mission-tracker button').innerText(),'Diário da expedição');
 report.checks.push('Advanced journal opens the tracked chapter, current objective/action fit short screens; historical reading changes no progress, tracking/untracking is explicit and survives reload');
 await p.keyboard.press('j');await p.locator('[data-mission-action=choose-mission]').focus();
 await p.evaluate(()=>{window.__uxPad={connected:true,mapping:'standard',buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0,0,0]};navigator.getGamepads=()=>[window.__uxPad];window.__uxPad.buttons[0]={pressed:true,value:1};});await p.waitForTimeout(160);await p.evaluate(()=>{window.__uxPad.buttons[0]={pressed:false,value:0}});
 assert.equal(await p.locator('.mission-picker').evaluate(d=>d.open),true,'gamepad opens mission picker');
 await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement?.getClientRects().length>0),true,'arrow focuses visible control');await p.keyboard.press('Escape');
 const end=await saved();assert.deepEqual(end.rewards,before.rewards);assert.equal(end.credits,before.credits);assert.equal(end.flags.vesperDefeated,false);assert.equal(end.flags.titanDefeated,false);
 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'ux-real-character');assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.settings.v1']),'ux-real-settings');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);await shot('failure').catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await b.close();console.log(JSON.stringify({passed:report.passed,failure:report.failure,checks:report.checks}));}
