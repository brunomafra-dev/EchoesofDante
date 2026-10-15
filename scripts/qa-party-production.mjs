import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5190',out=process.argv[2]??'docs/party-four/production-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),pages=[];
const report={method:'Compiled production build, four independent Chrome contexts, real UI and WebSocket frames. No DEV globals or simulation fixtures. Newly created main-game character is in a private QA browser profile.',checks:[],errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async predicate=>{for(let i=0;i<1200;i++){if(predicate())return;await sleep(100);}throw Error('Network state did not arrive');};
const check=t=>{report.checks.push(t);console.log(t)};
async function page(path){const p=await browser.newPage({viewport:{width:1280,height:720}});pages.push(p);p.setDefaultTimeout(120000);p.qa={};
 p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
 p.on('websocket',socket=>socket.on('framereceived',({payload})=>{let m;try{m=JSON.parse(payload.toString());}catch{return;}if(m.type==='joined'){p.qa.id=m.id;p.qa.role=m.role;p.qa.protocol=m.protocol;p.qa.world=undefined;}if(m.type==='world')p.qa.world=m.world;if(m.type==='roster')p.qa.members=m.members;if(m.type==='ended')p.qa.ended=true;}));
 await p.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});await p.locator('.expedition-launcher').waitFor({state:'attached'});return p;}
try{
 const h=await page('/party-playtest.html?region=base&class=warrior');await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click();await h.locator('[data-shell="coop-create"]').click();await until(()=>h.qa.role==='host');assert.equal(h.qa.protocol,10);
 const invite=await h.locator('[name="coop-invite"]').inputValue();assert.match(invite,/party-playtest.html/);
 const hunter=await page(invite);assert.ok(await hunter.locator('.application-shell[open] [data-shell="play-character"]').isVisible());assert.equal(hunter.qa.role,undefined);
 await hunter.waitForFunction(()=>document.querySelector('[data-party-class="warrior"]')?.textContent.includes('conectado'));await hunter.locator('[data-shell="play-character"]').click();await until(()=>!!hunter.qa.world?.players[hunter.qa.id]);check('Production invite asks for own character, shows occupied classes and joins only after explicit confirmation');
 const astral=await page(invite);await astral.waitForFunction(()=>document.querySelector('[data-party-class="hunter"]')?.textContent.includes('conectado'));assert.ok(await astral.locator('[data-shell="play-character"]').isDisabled());await astral.locator('[data-shell="character-threat-astral"]').click();await astral.locator('[data-shell="play-character"]').click();await until(()=>!!astral.qa.world?.players[astral.qa.id]?.astral);check('Duplicate class disabled; explicit Astral choice survives reload and uses its own network kit');
 const url=new URL('/',base);url.searchParams.set('sala',new URL(invite).searchParams.get('sala'));
 const xeno=await page(url.href);await xeno.waitForFunction(()=>document.querySelector('[data-party-class="astral"]')?.textContent.includes('conectado'));if(!await xeno.locator('[data-class="xenobinder"]').count())await xeno.locator('[data-shell="new-character"]').click();await xeno.locator('[data-class="xenobinder"]').click();await xeno.locator('[name="character-name"]').pressSequentially('AL Domadora de feras');assert.equal(await xeno.locator('[name="character-name"]').inputValue(),'AL Domadora de feras');await xeno.locator('[name="character-sex"]').selectOption('female');await xeno.locator('[data-shell="create"]').click();await until(()=>!!xeno.qa.world?.players[xeno.qa.id]?.xenobinder);check('Normal main-game invite creates a missing Xenobinder, types A/L, preserves female presentation and joins after reload');
 for(const p of [hunter,astral,xeno])await until(()=>Object.keys(p.qa.world?.players??{}).length===4);assert.equal(new Set(pages.map(p=>p.qa.id)).size,4);
 assert.equal(new Set(h.qa.members.map(m=>m.profile.classId)).size,4);await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click();assert.equal(await h.locator('.party-lobby [data-party-class]').count(),4);await h.screenshot({path:out+'/four-slots.png'});
 const tick=hunter.qa.world.time;await until(()=>hunter.qa.world.time>tick+300);check('Four live production participants; four-slot lobby and snapshots continue while host uses its menu');
 await h.locator('[data-shell="coop-leave"]').click();for(const p of [hunter,astral,xeno]){await until(()=>p.qa.ended);await p.locator('[data-shell="coop-solo"]').waitFor();}
 await Promise.all([xeno.waitForEvent('domcontentloaded'),xeno.locator('[data-shell="coop-solo"]').click()]);await xeno.locator('.expedition-launcher').waitFor({state:'attached'});
 const own=await xeno.evaluate(()=>{const book=JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1'));const hero=book.characters.find(h=>h.id===book.selected);const save=JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.'+hero.id));return{classId:hero.classId,sex:hero.sex,name:hero.name,area:save.area};});assert.deepEqual(own,{classId:'xenobinder',sex:'female',name:'AL Domadora de feras',area:'base'});check('Host leave reaches all three visitors; solo restoration preserves the new character and its own campaign');
 for(const p of [h,hunter,astral])assert.equal(await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
