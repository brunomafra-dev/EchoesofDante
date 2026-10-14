import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5190',out=process.env.QA_OUT??'docs/prologue-menu/qa/production';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={base,method:process.env.QA_NO_COOP==='1'?'Compiled public build, DOM-only Chrome solo/menu checks; cooperative relay not checked. No DEV exports or physical-device claim.':'Compiled build, DOM-only Chrome automation, real relay. No DEV exports, no physical-device claim.',checks:[],errors:[],participants:[]},pages=[];
const click=(p,id)=>p.locator(`[data-shell="${id}"]`).click();const wait=ms=>new Promise(r=>setTimeout(r,ms));
const check=t=>{console.log(t);report.checks.push(t)};
async function page(viewport={width:1280,height:720}){const p=await browser.newPage({viewport,hasTouch:true});pages.push(p);p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});p.wire={};p.on('websocket',ws=>{for(const direction of ['framereceived','framesent'])ws.on(direction,({payload})=>{let m;try{m=JSON.parse(payload.toString())}catch{return;}if(m.type==='joined')Object.assign(p.wire,{protocol:m.protocol,id:m.id,code:m.code});if(m.type==='world'&&m.world)p.wire.players=Object.keys(m.world.players??{});});});return p;}
async function hero(p,cls){await click(p,'choose-'+cls);await p.locator('[name=character-name]').fill('Teste '+cls);await click(p,'create');await click(p,'prologue-skip');for(let n=0;n<600&&!p.wire.code;n++)await wait(100);assert.equal(p.wire.protocol,11);}
try{
 if(process.env.QA_NO_COOP!=='1'){
 const h=await page();await h.goto(base+'/campaign-playtest.html');await click(h,'play');await click(h,'coop');await click(h,'coop-new');await h.locator('[name=party-size]').selectOption('4');await click(h,'new-character');await hero(h,'warrior');
 const invite=await h.locator('[name=coop-invite]').inputValue();assert.ok(invite.includes('campaign-playtest.html?sala='));
 for(const cls of ['hunter','astral','xenobinder']){const p=await page();await p.goto(invite);await hero(p,cls);}
 await click(h,'coop-start');for(const p of pages)await p.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open);
 for(let i=0;i<300&&!pages.every(p=>p.wire.players?.length===4);i++)await wait(100);
 assert.ok(pages.every(p=>p.wire.players?.length===4));report.participants=pages.map(p=>({protocol:p.wire.protocol,id:p.wire.id,players:p.wire.players.length}));check('Compiled campaign: four different classes form and start through real invitations, protocol 11 and four-player world in every browser');
 await h.keyboard.press('Escape');await click(h,'home');for(const p of pages.slice(1)){await p.locator('[data-shell=coop-home]').waitFor();assert.equal(await p.locator('[data-shell=coop-solo]').count(),0);}check('Compiled host departure offers menu only to every cooperative hero');
 for(const p of pages)await p.close();report.cooperativeChecked=true;
 }else{
 report.cooperativeChecked=false;report.cooperativePending='Relay deployment not available; see deployment.json';
 const solo=await page();await solo.goto(base+'/campaign-playtest.html');for(const id of ['play','new-game','difficulty-hard','new-character','choose-astral'])await click(solo,id);await solo.locator('[name=character-name]').fill('AL Teste publico');await click(solo,'create');await solo.locator('.prologue').waitFor();
 for(const take of ['earth','evacuation','voyage','dante','landing']){await solo.waitForFunction(take=>document.querySelector('.prologue')?.dataset.take===take&&document.querySelector('.prologue-painting')?.naturalWidth>0,take);if(take!=='landing')await click(solo,'prologue-next');}
 await solo.screenshot({path:out+'/public-landing.png'});await click(solo,'prologue-skip');await solo.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open);
 const profile=await solo.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters[0]);assert.equal(profile.campaign.mode,'solo');assert.equal(profile.campaign.difficulty,'hard');assert.equal(profile.campaign.introSeen,true);check('Public solo: create named Astral, five original images, finish prologue, persist difficulty and enter the game');await solo.close();
 }
 const p=await page({width:844,height:390});await p.addInitScript(()=>{window.qaPad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});await p.goto(base+'/campaign-playtest.html');await p.locator('[data-shell=play]').focus();
 const pad=async index=>{await p.evaluate(index=>{window.qaPad.buttons[index]={value:1,pressed:true}},index);await p.waitForTimeout(120);await p.evaluate(index=>{window.qaPad.buttons[index]={value:0,pressed:false}},index);await p.waitForTimeout(120);};
 await pad(0);await p.locator('[data-shell=new-game]').waitFor();await pad(1);await p.locator('[data-shell=play]').waitFor();await p.touchscreen.tap(...await p.locator('[data-shell=settings]').evaluate(b=>{const r=b.getBoundingClientRect();return[r.x+r.width/2,r.y+r.height/2]}));
 const music=p.locator('[data-volume=music]');await music.focus();const before=Number(await music.inputValue());await pad(15);assert.equal(Number(await music.inputValue()),Math.min(100,before+5));await click(p,'back');await p.screenshot({path:out+'/mobile-home.png'});check('Compiled mobile menu: touch settings, gamepad A/B navigation and D-pad volume adjustment');
 const normal=await page();await normal.goto(base+'/');await normal.locator('[data-shell=play]').waitFor();assert.deepEqual(await normal.locator('.shell-content > button').allTextContents(),['JOGAR','CONFIGURAÇÕES']);check('Official entry point uses the same new menu; no automatic character or active expedition');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
