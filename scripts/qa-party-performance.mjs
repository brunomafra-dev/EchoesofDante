import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import WebSocket from 'ws';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5184',out='docs/party-four/performance-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],measurements=[];
const scene=(code,arg)=>page.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
const clients=[];let timer;
page.on('pageerror',e=>errors.push(e.message));
try{
 for(const area of ['forest','cavern','warden','arid','frost','caldera']){
  await page.goto(`${base}/party-playtest.html?region=${area}&class=warrior&kit=basic`);await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  await scene("s.saveProgress();return r.connect(arg,'create',{name:'Host QA',classId:'warrior'},s.area)",base.replace(/^http/,'ws')+'/coop');const code=await scene('return r.code');
  for(const classId of ['hunter','astral','xenobinder']){
   const ws=new WebSocket(base.replace(/^http/,'ws')+'/coop');clients.push(ws);await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j)});
   const joined=new Promise(r=>ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')r(m)}));ws.send(JSON.stringify({type:'join',code,profile:{classId,name:'QA '+classId,bagFree:24,build:{xp:0}}}));await joined;
  }
  let held=false;
  timer=setInterval(()=>{held=!held;for(const ws of clients)if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'input',epoch:0,input:{x:0,y:0,aim:.3,attack:!held,charge:held,held,release:!held}}));},450);
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party.actors.size===3);await scene('s.player.invulnerableUntil=Infinity;for(const p of s.party.players)p.invulnerableUntil=Infinity');
  await page.waitForTimeout(5000);const samples=[];for(let i=0;i<5;i++){await page.waitForTimeout(500);samples.push(await scene('return s.game.loop.actualFps'));}
  measurements.push(await scene('return {area:s.area,actors:s.party.actors.size,objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length}',area));measurements.at(-1).fps=samples;
  clearInterval(timer);for(const ws of clients.splice(0))ws.close();await scene('r.disconnect(false)');console.log(area,samples.map(n=>n.toFixed(1)).join(', '));
 }
 assert.deepEqual(errors,[]);
}finally{clearInterval(timer);for(const ws of clients)ws.close();await browser.close();await writeFile(out+'/report.json',JSON.stringify({method:'One visible Chrome host at 1280x720, three Node WebSocket mock guests using existing kits; no visitor browser/render load on this workstation. DEV isolated region fixtures. Five warm FPS samples per region; not a four-device benchmark.',measurements,errors},null,2));}
