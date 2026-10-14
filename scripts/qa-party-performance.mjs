import {randomBytes,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import WebSocket from 'ws';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5184',out=process.env.QA_OUT??'docs/party-four/performance-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],measurements=[];
const scene=(code,arg)=>page.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
const clients=[];let timer,passed=false,failure;
page.on('pageerror',e=>errors.push(e.message));
try{
 for(const [area,size] of [['forest',2],['forest',3],...['forest','cavern','warden','arid','frost','caldera'].map(area=>[area,4])]){
  await page.goto(`${base}/party-playtest.html?region=${area}&class=warrior&kit=basic`);await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  const campaign=await page.evaluate(async size=>{const {createCampaign}=await import('/src/systems/Campaign.ts');const {characterProfiles:p}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/systems/CharacterProfiles.ts').name);p.active.campaign=createCampaign(p.active.id,{mode:'coop',difficulty:'normal',size});p.active.campaign.introSeen=true;p.select(p.active.id);return p.active.campaign;},size);
  await scene("s.saveProgress();return r.connect(arg,'create',{name:'Host QA',classId:'warrior'},s.area)",base.replace(/^http/,'ws')+'/coop');const code=await scene('return r.code');
  for(const classId of ['hunter','astral','xenobinder'].slice(0,size-1)){
   const ws=new WebSocket(base.replace(/^http/,'ws')+'/coop');clients.push(ws);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});
   let ack=false;const joined=new Promise(r=>ws.on('message',raw=>{const m=JSON.parse(raw);if(m.campaign?.crew.length&&!ack){ack=true;ws.send(JSON.stringify({type:'ready',ready:true}));}if(m.type==='joined')r(m)}));const memberId=randomUUID();ws.send(JSON.stringify({type:'join',code,campaign:{...campaign,memberId,memberKey:randomBytes(24).toString('hex')},profile:{characterId:memberId,classId,name:'QA '+classId,bagFree:24,build:{xp:0}}}));await joined;
  }
  await scene('r.startCampaign()');await page.waitForFunction(()=>window.__danteCoop.campaignRunning);
  let held=false;
  timer=setInterval(()=>{held=!held;for(const ws of clients)if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'input',epoch:0,input:{x:0,y:0,aim:.3,attack:!held,charge:held,held,release:!held}}));},450);
  await page.waitForFunction(size=>window.__danteGame.scene.getScene('Game').party.actors.size===size-1,size);await scene('s.player.invulnerableUntil=Infinity;for(const p of s.party.players)p.invulnerableUntil=Infinity');
  await page.waitForTimeout(5000);const samples=[];for(let i=0;i<5;i++){await page.waitForTimeout(500);samples.push(await scene('return s.game.loop.actualFps'));}
  measurements.push(await scene('return {area:s.area,actors:s.party.actors.size,objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length}',area));measurements.at(-1).size=size;measurements.at(-1).fps=samples;measurements.at(-1).enemy=await scene('const e=s.enemies[0];return {max:e.health.max,base:s.party.resilience.get(e),boss:[s.warden,s.soterrado,s.vesper,s.titan].includes(e)}');assert.equal(measurements.at(-1).enemy.max,Math.round(measurements.at(-1).enemy.base*(measurements.at(-1).enemy.boss?[1,1.65,2.3,3]:[1,1.55,2.05,2.6])[size-1]));
  clearInterval(timer);for(const ws of clients.splice(0))ws.close();await scene('r.disconnect(false)');console.log(area,size,samples.map(n=>n.toFixed(1)).join(', '));
 }
 assert.deepEqual(errors,[]);passed=true;
}catch(e){failure=String(e);throw e;}finally{clearInterval(timer);for(const ws of clients)ws.close();await browser.close();await writeFile(out+'/report.json',JSON.stringify({method:'One visible Chrome host at 1280x720, three Node WebSocket mock guests using existing kits; no visitor browser/render load on this workstation. DEV isolated region fixtures. Five warm FPS samples per region; not a four-device benchmark.',measurements,errors,passed,failure},null,2));}
