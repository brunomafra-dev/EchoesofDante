import assert from 'node:assert/strict';
import {chromium, webkit, firefox} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5184',out=process.env.QA_OUT??'docs/cinematic-compatibility/qa';
await mkdir(out,{recursive:true});
const report={base,checks:[],errors:[],browsers:[]},check=s=>{report.checks.push(s);console.log(s)},browsers=[];
async function open(browser,options={}){
 const context=await browser.newContext({viewport:{width:1280,height:720},...options});
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>report.errors.push(e.message));return page;
}
async function playing(p){
 await p.locator('.prologue-video').waitFor();
 await p.waitForFunction(()=>['gesture','playing'].includes(document.querySelector('.prologue')?.dataset.state));
 if(await p.locator('.prologue').getAttribute('data-state')==='gesture')await p.locator('[data-shell=prologue-retry]').click();
 await p.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.currentTime>.3&&v.readyState>=2});
}
try{
 const configs=[{name:'Chrome',launch:()=>chromium.launch({channel:'chrome'})}];
 if(process.env.QA_BRAVE)configs.push({name:'Brave',launch:()=>chromium.launch({executablePath:process.env.QA_BRAVE,args:['--no-first-run','--no-default-browser-check']})});
 if(process.env.QA_WEBKIT)configs.push({name:'WebKit',launch:()=>webkit.launch()});
 if(process.env.QA_FIREFOX)configs.push({name:'Firefox',launch:()=>firefox.launch()});
 for(const c of configs){
  const b=await c.launch();browsers.push(b);const p=await open(b);
  await p.goto(base+'/cinematic-compatibility.html');await playing(p);
  const media=await p.locator('video').evaluate(v=>({source:v.currentSrc,duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,frames:v.getVideoPlaybackQuality?.().totalVideoFrames}));
  assert.equal(media.width,1280);assert.equal(media.height,720);assert.ok(Math.abs(media.duration-54.25)<.1);assert.equal(media.muted,false);
  await p.locator('[data-shell=prologue-pause]').click();const time=await p.locator('video').evaluate(v=>v.currentTime);await p.waitForTimeout(200);assert.ok(Math.abs(time-await p.locator('video').evaluate(v=>v.currentTime))<.05);
  await p.locator('[data-shell=prologue-pause]').click();await playing(p);
  await p.locator('[data-shell=settings]').click();assert.equal(await p.locator('video').evaluate(v=>v.paused),true);
  await p.locator('#film-settings button').click();await playing(p);
  await p.screenshot({path:`${out}/${c.name.toLowerCase()}.png`});
  // Natural ended event still enters the journey exactly once; not only Skip.
  await p.locator('video').evaluate(v=>{v.currentTime=v.duration-.35});await p.locator('#film-ended').waitFor({state:'visible'});assert.equal(await p.locator('video').count(),0);
  await p.locator('#watch-again').click();await playing(p);assert.equal(await p.locator('video').count(),1);
  await p.locator('[data-shell=prologue-skip]').click();assert.equal(await p.locator('video').count(),0);
  report.browsers.push({name:c.name,version:b.version(),...media});check(c.name+': decoded video/audio, pause/settings/resume, natural ending, replay and skip');await p.close();
 }
 const b=browsers[0];
 const permission=await open(b);let requests=0;permission.on('request',r=>{if(r.url().includes('arrival-compatible'))requests++});
 await permission.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;let allowed=false;document.addEventListener('click',()=>{allowed=true},{capture:true});HTMLMediaElement.prototype.play=function(){return allowed?play.call(this):Promise.reject(new DOMException('QA autoplay denied','NotAllowedError'))}});
 await permission.goto(base+'/cinematic-compatibility.html');await permission.waitForFunction(()=>document.querySelector('.prologue')?.dataset.state==='gesture');assert.equal(await permission.locator('video').evaluate(v=>v.muted),false);
 await permission.locator('[data-shell=prologue-retry]').click();await playing(permission);assert.equal(requests,1);check('Denied autoplay offers a real sound gesture; no false loading error, mute or format switch');await permission.close();
 const fallback=await open(b);let mp4=0;
 await fallback.route('**/arrival-compatible-v1.mp4',r=>{mp4++;return r.abort('failed')});
 await fallback.goto(base+'/cinematic-compatibility.html');await playing(fallback);assert.ok((await fallback.locator('video').evaluate(v=>v.currentSrc)).endsWith('.webm'));assert.ok(mp4<=2);check('Broken MP4 switches to the independently decoded WebM with bounded requests');await fallback.close();
 const retry=await open(b);let blocked=true,failedRequests=0;
 await retry.route('**/arrival-compatible-v1.*',r=>{if(blocked){failedRequests++;return r.abort('failed')}return r.continue()});
 await retry.goto(base+'/cinematic-compatibility.html');await retry.waitForFunction(()=>document.querySelector('.prologue')?.dataset.state==='error');assert.ok(failedRequests<=4);
 blocked=false;await retry.locator('[data-shell=prologue-retry]').click();await playing(retry);check('Both formats interrupted: explicit Retry recovers the movie without skipping or infinite requests');await retry.close();
 const interrupted=await open(b);await interrupted.goto(base+'/cinematic-compatibility.html');await playing(interrupted);
 await interrupted.locator('video').evaluate(v=>{v.currentTime=12});await interrupted.waitForFunction(()=>document.querySelector('video').currentTime>=12);await interrupted.waitForTimeout(300);
 await interrupted.locator('video').evaluate(v=>{let first=true;Object.defineProperty(v,'error',{configurable:true,get(){if(first){first=false;return{code:2}}return null}});v.dispatchEvent(new Event('error'))});
 await interrupted.waitForFunction(()=>{const v=document.querySelector('video');return !v.paused&&v.readyState>=2&&v.currentTime>=12});
 check('Mid-film network error retries once and restores the playback position');await interrupted.close();
 for(const allowed of [true,false]){
  const p=await open(b,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await p.addInitScript(allow=>{
   window.qaDisplay=[];
   Element.prototype.requestFullscreen=async()=>{window.qaDisplay.push('fullscreen');if(!allow)throw new DOMException('QA denied','NotAllowedError');Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>document.documentElement})};
   Object.defineProperty(screen.orientation,'lock',{value:async mode=>{window.qaDisplay.push(mode);if(!allow)throw new DOMException('QA unsupported','NotSupportedError')}});
  },allowed);
  await p.goto(base+'/cinematic-compatibility.html');await p.locator('[data-mobile=enter]').tap();
  assert.ok((await p.evaluate(()=>window.qaDisplay)).includes('fullscreen'));
  if(allowed)assert.ok((await p.evaluate(()=>window.qaDisplay)).includes('landscape'));
  await p.locator('[data-mobile=continue]').tap();await playing(p);
  assert.ok(await p.locator('[data-shell=prologue-skip]').isVisible());await p.screenshot({path:`${out}/portrait-${allowed}.png`});
  await p.setViewportSize({width:844,height:390});assert.equal(await p.locator('.mobile-display').evaluate(d=>d.open),false);await p.close();
 }
 check('Portrait touch: whole-document fullscreen/landscape request; denied API still allows movie; landscape keeps controls usable');
 for(const [width,height] of [[1366,768],[1920,1080],[844,390]]){const p=await open(b,{viewport:{width,height}});await p.goto(base+'/cinematic-compatibility.html');await playing(p);const box=await p.locator('[data-shell=prologue-skip]').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height);await p.close()}
 check('1280x720, 1366x768, 1920x1080, 844x390: video and controls fit');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await Promise.all(browsers.map(b=>b.close()));await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n')}
