import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5190',out=process.env.QA_OUT??'docs/prologue-menu/qa/production';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={base,method:process.env.QA_NO_COOP==='1'?'Compiled public build, DOM-only Chrome solo/menu checks; cooperative relay not checked. No DEV exports or physical-device claim.':'Compiled build, DOM-only Chrome automation, real relay. No DEV exports, no physical-device claim.',checks:[],errors:[],participants:[]},pages=[];
const click=(p,id)=>p.locator(`[data-shell="${id}"]`).click();const wait=ms=>new Promise(r=>setTimeout(r,ms));
const check=t=>{console.log(t);report.checks.push(t)};
async function page(viewport={width:1280,height:720}){const p=await browser.newPage({viewport,hasTouch:true});pages.push(p);const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:true});p.setDefaultTimeout(process.env.QA_NO_COOP==='1'?30000:90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});p.wire={poses:[],};p.on('websocket',ws=>{for(const direction of ['framereceived','framesent'])ws.on(direction,({payload})=>{let m;try{m=JSON.parse(payload.toString())}catch{return;}if(m.type==='joined')Object.assign(p.wire,{protocol:m.protocol,id:m.id,code:m.code});if(m.type==='world'&&m.world){p.wire.players=Object.keys(m.world.players??{});p.wire.world=m.world.players;for(const [id,pose]of Object.entries(m.world.players??{})){p.wire.poses.push({id,x:pose.x,y:pose.y,phase:pose.phase,firing:pose.firing,dash:pose.dash,dashReady:pose.dashReady});}if(p.wire.poses.length>4000)p.wire.poses.splice(0,2000);}});});return p;}
async function hero(p,cls,{difficulty='normal',size,cooperative=false}={}){
 await click(p,'choose-'+cls);await p.locator('[name=character-name]').fill('Teste '+cls);await click(p,'create');
 if(await p.locator('[name=party-size]').count()){
  if(size)await p.locator('[name=party-size]').selectOption(String(size));
  await click(p,'choose-difficulty');
 }
 if(await p.locator('[data-shell="difficulty-normal"]').count())await click(p,'difficulty-'+difficulty);
 await p.locator('.prologue-video').waitFor();await click(p,'prologue-skip');
 if(cooperative){for(let n=0;n<600&&!p.wire.code;n++)await wait(100);assert.equal(p.wire.protocol,11);}
}
try{
 if(process.env.QA_NO_COOP!=='1'){
 const h=await page();await h.goto(base+'/campaign-playtest.html');await click(h,'play');await click(h,'coop');await click(h,'coop-new');await hero(h,'warrior',{size:4,cooperative:true});
 const invite=await h.locator('[name=coop-invite]').inputValue();assert.ok(invite.includes('campaign-playtest.html?sala='));
 for(const cls of ['hunter','astral','xenobinder']){const p=await page();await p.goto(invite);await hero(p,cls,{cooperative:true});}
 await click(h,'coop-start');for(const p of pages)await p.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open);
 for(let i=0;i<300&&!pages.every(p=>p.wire.players?.length===4);i++)await wait(100);
 assert.ok(pages.every(p=>p.wire.players?.length===4));report.participants=pages.map(p=>({protocol:p.wire.protocol,id:p.wire.id,players:p.wire.players.length}));check('Compiled campaign: four different classes form and start through real invitations, protocol 11 and four-player world in every browser');
 if(process.env.QA_ACTIONS==='1'){
  report.actions=[];
  for(const p of pages){
   await p.bringToFront();await p.waitForTimeout(1000);const id=p.wire.id,before=p.wire.world[id];p.wire.poses=[];
   // Input is consumed by Phaser and then sampled by the relay. Await the
   // observed action, rather than releasing a key before a busy frame sees it.
   const observed=async(test,label)=>{for(let n=0;n<100;n++){if(test())return;await wait(50);}throw Error('Unobserved '+label+' for '+id);};
   const ownHas=test=>p.wire.poses.some(s=>s.id===id&&test(s));
   await p.keyboard.down('d');try{await observed(()=>Math.hypot(p.wire.world[id].x-before.x,p.wire.world[id].y-before.y)>3,'movement');}finally{await p.keyboard.up('d');}
   const after=p.wire.world[id];assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>3,JSON.stringify({id,before,after}));
   await p.mouse.move(900,400);await p.mouse.down();try{await observed(()=>ownHas(s=>s.firing),'attack');}finally{await p.mouse.up();}await p.waitForTimeout(350);
   await p.keyboard.down('Space');try{await observed(()=>ownHas(s=>s.dash||s.dashReady<.95),'dash');}finally{await p.keyboard.up('Space');}
   await observed(()=>!p.wire.world[id].dash&&p.wire.world[id].strike?.phase==='READY','recovery before Q');
   await p.keyboard.down('q');try{await observed(()=>ownHas(s=>s.phase==='CHARGING'),'Q hold');await p.waitForTimeout(450);}finally{await p.keyboard.up('q');}
   await observed(()=>ownHas(s=>s.phase==='RELEASE'),'Q release');
   const own=p.wire.poses.filter(s=>s.id===id),result={id,moved:true,attack:own.some(s=>s.firing),dash:own.some(s=>s.dash||s.dashReady<.95),hold:own.some(s=>s.phase==='CHARGING'),release:own.some(s=>s.phase==='RELEASE')};
   assert.ok(result.attack&&result.dash&&result.hold&&result.release,JSON.stringify(result));report.actions.push(result);
  }
  check('Compiled four-player campaign: each existing class moves, attacks, dashes and holds/releases Q through real network snapshots');
 }
 await h.keyboard.press('Escape');await click(h,'home');for(const p of pages.slice(1)){await p.locator('[data-shell=coop-home]').waitFor();assert.equal(await p.locator('[data-shell=coop-solo]').count(),0);}check('Compiled host departure offers menu only to every cooperative hero');
 for(const p of pages)await p.close();report.cooperativeChecked=true;
 }else{
 report.cooperativeChecked=false;report.cooperativePending='Relay intentionally excluded by QA_NO_COOP; no public relay verification.';
 const solo=await page();await solo.goto(base+'/campaign-playtest.html');for(const id of ['play','new-game'])await click(solo,id);await hero(solo,'astral',{difficulty:'hard'});
  await solo.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open);
 const profile=await solo.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters[0]);assert.equal(profile.campaign.mode,'solo');assert.equal(profile.campaign.difficulty,'hard');assert.equal(profile.campaign.introSeen,true);check('Compiled solo: create named Astral, play the original cinematic MP4, persist difficulty and enter the game');await solo.close();
 }
  const p=await page({width:1280,height:720});await p.addInitScript(()=>{window.qaPad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});await p.goto(base+'/campaign-playtest.html');await p.locator('[data-shell=play]').focus();
 const pad=async(index,holdMs=300)=>{await p.evaluate(index=>{window.qaPad.buttons[index]={value:1,pressed:true}},index);await p.waitForTimeout(holdMs);await p.evaluate(index=>{window.qaPad.buttons[index]={value:0,pressed:false}},index);await p.waitForTimeout(250);};
  await pad(0);await p.locator('[data-shell=new-game]').waitFor();await pad(1);await p.locator('[data-shell=play]').waitFor();await click(p,'settings');
 const music=p.locator('[data-volume=music]');await music.waitFor();await music.focus();const before=Number(await music.inputValue());await pad(15,700);assert.equal(Number(await music.inputValue()),Math.min(100,before+5));await click(p,'back');await p.screenshot({path:out+'/gamepad-menu.png'});check('Compiled menu: gamepad A/B navigation and D-pad volume adjustment');
 const touch=await page({width:1280,height:720});await touch.goto(base+'/campaign-playtest.html');const play=touch.locator('[data-shell=play]');await touch.touchscreen.tap(...await play.evaluate(b=>{const r=b.getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]}));await touch.locator('.shell-content h2').filter({hasText:'Jogar'}).waitFor();check('Compiled touch input opens the Play menu from the title screen');
 const normal=await page();await normal.goto(base+'/');await normal.locator('[data-shell=play]').waitFor();assert.deepEqual(await normal.locator('.shell-content > button').allTextContents(),['JOGAR','CONFIGURAÇÕES']);check('Official entry point uses the same new menu; no automatic character or active expedition');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
