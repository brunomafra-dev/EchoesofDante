import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

// Historical playback QA must not claim the rejected cutout movie is current.
throw new Error('QA da 0.1.105 rejeitada. Use qa-cinematic-reference.mjs para o quadro-base; o novo filme ainda não foi gerado.');

const base=process.env.QA_BASE??'http://localhost:5190';
const out=process.env.QA_OUT??'docs/cinematic-pilot/qa/browser';
await mkdir(out,{recursive:true});
const report={base,method:'Chrome, compiled standalone viewer; real H.264/AAC playback. Touch and gamepad emulated, not physical-device or artistic approval.',checks:[],errors:[]};
const browser=await chromium.launch({channel:'chrome'});
const check=t=>{report.checks.push(t);console.log(t)};
try{
 const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
 p.setDefaultTimeout(90000);
 const requests=[];p.on('request',r=>requests.push(r.url()));
 p.on('pageerror',e=>report.errors.push(e.message));
 p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
 await p.addInitScript(()=>{
  localStorage.setItem('dante-pilot-save-sentinel','preserve');sessionStorage.setItem('dante-pilot-tab-sentinel','preserve');
  window.qaPad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  navigator.getGamepads=()=>[window.qaPad];
 });
 await p.goto(base+'/cinematic-pilot.html?v=0.1.105');
 await p.waitForFunction(()=>document.querySelector('video').readyState>=2);
 report.video=await p.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,paused:v.paused,playsInline:v.playsInline,tracks:v.textTracks.length}));
 assert.deepEqual([report.video.width,report.video.height],[1280,720]);assert.ok(Math.abs(report.video.duration-12)<.1);assert.ok(report.video.paused&&report.video.playsInline);assert.equal(report.video.tracks,1);
 check('MP4 real, 1280×720 / 12s, inline playback and Portuguese caption track; no autoplay with sound');
 await p.locator('#play').click();await p.waitForFunction(()=>document.querySelector('video').currentTime>.8);
 await p.locator('#play').click();const held=await p.locator('video').evaluate(v=>v.currentTime);await p.waitForTimeout(350);assert.ok(Math.abs((await p.locator('video').evaluate(v=>v.currentTime))-held)<.05);
 await p.locator('#sound').click();assert.equal(await p.locator('video').evaluate(v=>v.muted),true);
 await p.locator('#sound').click();assert.equal(await p.locator('video').evaluate(v=>v.muted),false);
 check('Play, pause and sound toggle work through the viewer');
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){
  await p.setViewportSize({width,height});
  await p.locator('video').evaluate(v=>{v.pause();v.currentTime=9.4});
  await p.waitForFunction(()=>!document.querySelector('video').seeking);
  await p.waitForTimeout(150);
  await p.evaluate(()=>window.scrollTo(0,0));
  const r=await p.locator('video').boundingBox();assert.ok(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+.5&&r.y+r.height<=height);
  const playRect=await p.locator('#play').boundingBox();assert.ok(playRect&&playRect.y+playRect.height<=height);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.screenshot({path:out+`/pilot-${width}.png`});
 }
 check('Four target resolutions, no horizontal overflow; captioned frame visible');
 await p.locator('#replay').tap();await p.waitForFunction(()=>document.querySelector('video').currentTime>.3&&document.querySelector('video').currentTime<3&&!document.querySelector('video').paused);
 await p.waitForFunction(()=>document.querySelector('video').ended,null,{timeout:20000});
 assert.match(await p.locator('#state').textContent(),/Cena concluída/);
 report.decode=await p.locator('video').evaluate(v=>{const q=v.getVideoPlaybackQuality();return{totalFrames:q.totalVideoFrames,droppedFrames:q.droppedVideoFrames}});
 assert.ok(report.decode.totalFrames>=280);
 check('Touch replay starts at zero and the complete 12-second film reaches its final state');
 const pad=async i=>{await p.evaluate(i=>{window.qaPad.buttons[i]={pressed:true,value:1}},i);await p.waitForTimeout(130);await p.evaluate(i=>{window.qaPad.buttons[i]={pressed:false,value:0}},i);await p.waitForTimeout(100)};
 await p.locator('#play').focus();await pad(0);await p.waitForFunction(()=>!document.querySelector('video').paused);await pad(0);assert.ok(await p.locator('video').evaluate(v=>v.paused));
 await pad(15);assert.equal(await p.evaluate(()=>document.activeElement.id),'replay');
 check('Gamepad mock: A starts/pauses and directional input moves focus to Replay');
 assert.deepEqual(await p.evaluate(()=>({local:localStorage.getItem('dante-pilot-save-sentinel'),session:sessionStorage.getItem('dante-pilot-tab-sentinel'),localKeys:Object.keys(localStorage),sessionKeys:Object.keys(sessionStorage)})),{local:'preserve',session:'preserve',localKeys:['dante-pilot-save-sentinel'],sessionKeys:['dante-pilot-tab-sentinel']});
 assert.ok(!requests.some(r=>/assets\/visual|GameScene|phaser/i.test(r)));
 check('No game boot, world art loading or save/session mutation in the reserved viewer');
 await p.locator('#skip').click();await p.waitForURL(/test-library\.html/);await p.locator('a[href*="cinematic-pilot.html"]').first().waitFor();
 check('Skip returns to the test library, which links directly to this pilot');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
