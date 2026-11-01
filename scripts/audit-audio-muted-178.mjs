import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'https://echosofdante.vercel.app',out='docs/frontend-ux-audit-178/evidence';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});p.setDefaultTimeout(90000);
const report={base,method:'Published client with normal creation, actual touch sliders, stored zero before first unlock. AudioNodes observed through browser instrumentation; output peak measured after the actual music gain. No DEV globals or game state mutation.',errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));
const cdp=await p.context().newCDPSession(p),tap=id=>p.locator(`[data-shell="${id}"]`).tap();
async function drag(key,target){const e=p.locator(`[data-volume="${key}"]`),r=await e.boundingBox(),v=Number(await e.inputValue()),y=r.y+r.height/2,from=r.x+8+(r.width-16)*v/100,to=r.x+8+(r.width-16)*target/100;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from,y,id:1}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from+(to-from)*i/6,y,id:1}]});await p.waitForTimeout(40);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return Number(await e.inputValue());}
async function signal(){await p.waitForTimeout(900);return p.evaluate(async()=>{const q=window.__mutedAudit;let peak=0;for(let i=0;i<16;i++){const data=new Float32Array(q.analyser.fftSize);q.analyser.getFloatTimeDomainData(data);for(const n of data)peak=Math.max(peak,Math.abs(n));await new Promise(r=>setTimeout(r,50));}return {mediaMuted:q.media.muted,mediaVolume:q.media.volume,paused:q.media.paused,time:q.media.currentTime,gain:q.gain.gain.value,peak,context:q.gain.context.state};});}
try{
 await p.addInitScript(()=>{
  Element.prototype.requestFullscreen=undefined;
  localStorage['echoes-of-dante.characters.v1']='audit-public-real-character';localStorage['echoes-of-dante.settings.v1']='audit-public-real-settings';
  window.__mutedAudit={};const original=AudioContext.prototype.createMediaElementSource;
  AudioContext.prototype.createMediaElementSource=function(media){const source=original.call(this,media),connect=source.connect;window.__mutedAudit.media=media;source.connect=function(gain,...args){const q=window.__mutedAudit;q.gain=gain;q.analyser=this.context.createAnalyser();q.analyser.fftSize=2048;gain.connect(q.analyser);return connect.call(this,gain,...args);};return source;};
 });
 await p.goto(base+'/campaign-playtest.html?mobile-review=1&v=0.1.178');await tap('settings');report.storedBeforeLaunch={master:await drag('master',0),music:await drag('music',48),sfx:await drag('sfx',90)};
 await tap('back');await tap('play');await tap('new-game');await tap('choose-warrior');await p.locator('[name=character-name]').fill('Audit som zero');await tap('create');await tap('difficulty-normal');await p.locator('.prologue-video').waitFor();await tap('prologue-skip');
 await p.waitForFunction(()=>document.querySelector('.touch-controls')&&!document.querySelector('.application-shell')?.open);await p.locator('[data-action=attack]').tap();await p.waitForFunction(()=>window.__mutedAudit.gain?.context.state==='running');report.initial=await signal();
 await p.locator('.main-menu-button').tap();await tap('settings');report.restored={master:await drag('master',80),music:await drag('music',48),sfx:await drag('sfx',90)};
 await p.screenshot({path:out+'/audio-public-restored.jpg',type:'jpeg',quality:88});await tap('back');await tap('continue');report.afterRestore=await signal();
 report.realStorage=await p.evaluate(()=>({characters:localStorage['echoes-of-dante.characters.v1'],settings:localStorage['echoes-of-dante.settings.v1']}));
 report.reproduced=report.afterRestore.mediaMuted&&report.afterRestore.gain>0&&report.afterRestore.peak===0;
 console.log(JSON.stringify(report,null,2));
}catch(e){report.failure=String(e);throw e;}finally{await writeFile(out+'/audio-public-zero.json',JSON.stringify(report,null,2)+'\n');await b.close();}
