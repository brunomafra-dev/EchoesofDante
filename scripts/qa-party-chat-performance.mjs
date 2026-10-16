import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import WebSocket from 'ws';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/party-chat/qa',base='http://localhost:5184',browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720}}),bots=[],report={method:'One rendering Chrome host plus three real relay clients without renderers, approximating the per-device rendering cost. DEV fixtures freeze enemies; three Base/Forest round trips. Not a physical four-device network measurement.',cycles:[],errors:[]};
const S=code=>p.evaluate(code=>new Function('s','r',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop),code),click=id=>p.locator(`[data-shell=${id}]`).click();
p.on('pageerror',e=>report.errors.push(e.message));p.setDefaultTimeout(60000);
async function counts(){return S('return {objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,poststep:s.game.events.listenerCount("poststep"),names:s.children.list.filter(o=>o.name?.startsWith("coop-name-")).length,bubbles:s.children.list.filter(o=>o.name?.startsWith("coop-speech-")).length,chatRoots:document.querySelectorAll(".coop-chat").length}');}
async function forest(){await S('s.transitionArea("forest")');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='forest'&&!window.__danteGame.scene.getScene('Game').transitioning&&window.__danteGame.scene.isActive('Game'));await S('s.enemies.forEach(e=>e.update=()=>{});s.player.invulnerableUntil=Infinity');await p.waitForTimeout(1800);}
try{
 await p.goto(base+'/campaign-playtest.html?chat=1');for(const id of ['play','coop','coop-new','choose-warrior'])await click(id);await p.locator('[name=character-name]').fill('Guilherme');await click('create');await p.locator('[name=party-size]').selectOption('4');await click('choose-difficulty');await click('difficulty-normal');await click('prologue-skip');await p.waitForFunction(()=>window.__danteCoop.connected);
 const state=await p.evaluate(()=>({code:window.__danteCoop.code,url:window.__danteCoop.url,campaign:JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters[0].campaign}));
 for(const [i,classId]of ['hunter','astral','xenobinder'].entries()){
  const id=randomUUID(),ws=new WebSocket(state.url);bots.push(ws);let ready=false;
  await new Promise((resolve,reject)=>{ws.once('open',()=>ws.send(JSON.stringify({type:'join',code:state.code,profile:{characterId:id,name:'Aliado '+i,classId,sex:'female',build:{xp:0}},campaign:{...state.campaign,memberId:id,memberKey:randomBytes(24).toString('hex'),crew:[]}})));ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='joined')resolve();if(m.type==='error')reject(Error(m.message));if(m.type==='roster'&&m.campaign.crew.length&&!ready){ready=true;ws.send(JSON.stringify({type:'ready',ready:true}));}});ws.on('error',reject);});
 }
 await click('coop-start');await p.waitForFunction(()=>window.__danteCoop.campaignRunning&&!document.querySelector('.application-shell').open);await forest();
 const cdp=await p.context().newCDPSession(p);async function listeners(){const obj=await cdp.send('Runtime.evaluate',{expression:'window'});const result=await cdp.send('DOMDebugger.getEventListeners',{objectId:obj.result.objectId});return result.listeners.reduce((n,l)=>(n[l.type]=(n[l.type]??0)+1,n),{});}
 const before=await counts(),eventsBefore=await listeners();
 report.sample=await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game');let frames=0;const step=()=>frames++;s.events.on('update',step);const at=performance.now();await new Promise(r=>setTimeout(r,6000));s.events.off('update',step);return {fps:frames/((performance.now()-at)/1000),loopFps:s.game.loop.actualFps}});
 assert.deepEqual(await counts(),before);report.before=before;
 for(let i=0;i<3;i++){await S('s.transitionArea("base")');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='base'&&!window.__danteGame.scene.getScene('Game').transitioning&&window.__danteGame.scene.isActive('Game'));await forest();const c=await counts();assert.equal(c.names,4);assert.equal(c.bubbles,4);assert.equal(c.poststep,before.poststep);assert.equal(c.chatRoots,1);assert.equal(c.textures,before.textures);report.cycles.push(c);console.log("Travel cycle",i+1,c);}
 report.eventsBefore=eventsBefore;report.eventsAfter=await listeners();assert.deepEqual(report.eventsAfter,eventsBefore);assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report));
}catch(e){report.failure=String(e);throw e;}finally{for(const ws of bots)ws.close();await browser.close();await mkdir(out,{recursive:true});await writeFile(out+'/performance.json',JSON.stringify(report,null,2));}
