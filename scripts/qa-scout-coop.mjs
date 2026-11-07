import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5195',out=process.env.QA_OUT??'docs/2d-refinement/qa/203/coop';await mkdir(out,{recursive:true});
const report={passed:false,base,cases:[],relay:[],errors:[],fixture:'Two separate automated Chrome instances per team. Native creation, invitation and gameplay. Solo reload is covered separately; secret-token compatibility by the relay suite. Same scout visual, distinct professions; no boss fixture or real saves.'};
const click=(p,id)=>p.locator(`[data-shell="${id}"]`).click();
for(const pair of [['warrior','astral'],['xenobinder','hunter']]){
 const browsers=[],pages=[];
 async function page(){const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});browsers.push(b);const p=await b.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});pages.push(p);p.setDefaultTimeout(90000);await(await p.context().newCDPSession(p)).send('Emulation.setFocusEmulationEnabled',{enabled:true});await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='coop-canonical';});p.on('pageerror',e=>report.errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});p.on('websocket',ws=>ws.on('framereceived',({payload})=>{try{const m=JSON.parse(String(payload));if(m.type==='joined')report.relay.push({protocol:m.protocol,identities:m.identities,scouts:m.scouts,role:m.role});}catch{}}));return p;}
 async function hero(p,cls,host){await p.locator('[name=character-preset]').selectOption('hunter');await p.locator('[name=character-profession]').selectOption(cls);await p.locator('[name=character-sex]').selectOption(host?'male':'female');await p.locator('[name=character-name]').fill('Batedor '+cls);await click(p,'create');if(host){await p.locator('[name=party-size]').selectOption('2');await click(p,'choose-difficulty');await click(p,'difficulty-normal');}await click(p,'prologue-skip');}
 try{
  const h=await page();await h.goto(base+'/campaign-playtest.html?refinement=203');await click(h,'play');await click(h,'coop');await click(h,'coop-new');await hero(h,pair[0],true);console.log('Host ready',pair[0]);
  await h.waitForFunction(()=>document.querySelector('[name=coop-invite]')?.value.startsWith('http'));const invitation=await h.locator('[name=coop-invite]').inputValue();assert.ok(invitation.includes('refinement=203'));
  const g=await page();await g.goto(invitation);await hero(g,pair[1],false);console.log('Guest ready',pair[1]);await h.locator('[data-shell=coop-start]:not(:disabled)').waitFor();await click(h,'coop-start');
  const samples=[];
  for(const p of pages){await p.waitForFunction(()=>!document.querySelector('.application-shell')?.open&&window.__dante2dReview?.().ready&&window.__dante2dReview().peers.length===1);const s=await p.evaluate(()=>window.__dante2dReview());assert.equal(s.actor.visualPreset,'hunter');assert.equal(s.actor.identity,s.profile.classId);assert.equal(s.peers[0].visualPreset,'hunter');samples.push({profession:s.profile.classId,actor:s.actor,peers:s.peers,sources:s.sources});await p.screenshot({path:`${out}/${pair.join('-')}-${s.profile.classId}.jpg`,type:'jpeg',quality:86});assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'coop-canonical');}
  for(const p of pages){const s=await p.evaluate(()=>window.__dante2dReview());await p.keyboard.down('a');await p.waitForTimeout(350);await p.keyboard.up('a');const t=await p.evaluate(()=>window.__dante2dReview());assert.ok(Math.hypot(t.position.x-s.position.x,t.position.y-s.position.y)>10);}
  const caster=pair[0]==='xenobinder'?h:g;await caster.mouse.move(750,300);await caster.mouse.down();await caster.waitForTimeout(250);await caster.mouse.up();await caster.keyboard.down('q');await caster.waitForTimeout(550);await caster.keyboard.up('q');
  assert.deepEqual(report.errors,[]);report.cases.push({pair,samples});console.log('Coop passed',pair.join(' + '));
 }catch(e){report.failure=String(e.stack??e);for(let i=0;i<pages.length;i++)await pages[i].screenshot({path:`${out}/failure-${pair[0]}-${i}.jpg`,type:'jpeg',quality:82}).catch(()=>{});throw e;}
 finally{for(const b of browsers)await b.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
}
assert.ok(report.relay.every(r=>r.protocol===16&&r.identities===1&&r.scouts===1));report.passed=true;await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log('203 co-op',report.passed);
