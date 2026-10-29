import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5195',out=process.env.QA_OUT??'docs/signal-expedition/qa/compiled-coop';await mkdir(out,{recursive:true});
const browsers=[],pages=[],report={at:new Date().toISOString(),base,method:'Compiled build; two separate Chrome instances, real relay and normal movement/UI with feedback-controlled key pulses for WAN latency. Explicit preceding post/reports preparation only through reserved lab buttons; no DEV globals.',checks:[],errors:[]},sleep=ms=>new Promise(r=>setTimeout(r,ms)),check=s=>{console.log(s);report.checks.push(s)};
async function page(){const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});browsers.push(b);const p=await b.newPage({viewport:{width:1280,height:720}});pages.push(p);p.setDefaultTimeout(90000);await p.addInitScript(()=>{Object.defineProperty(document,'hidden',{get:()=>false});Object.defineProperty(document,'visibilityState',{get:()=>'visible'})});await(await p.context().newCDPSession(p)).send('Emulation.setFocusEmulationEnabled',{enabled:true});p.configRequests=0;p.navigations=0;p.on('framenavigated',f=>{if(f===p.mainFrame()&&f.url().startsWith(base))p.navigations++});p.on('request',r=>{if(new URL(r.url()).pathname.endsWith('/api/coop-config'))p.configRequests++});p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='public-coop-real-characters-sentinel';localStorage['echoes-of-dante.settings.v1']='public-coop-real-settings-sentinel'});p.wire={joins:0};p.on('websocket',ws=>{for(const dir of ['framereceived','framesent'])ws.on(dir,({payload})=>{let m;try{m=JSON.parse(payload.toString())}catch{return}if(m.type==='joined')Object.assign(p.wire,{joins:p.wire.joins+1,id:m.role==='host'?'host':m.id,protocol:m.protocol,outposts:m.outposts,signals:m.signals});if(m.type==='world')p.wire.world=m.world;if(m.type==='chat')p.wire.chat=m.message})});return p;}
const click=(p,id)=>p.locator(`[data-shell=${id}]`).click();
async function clear(p){for(let i=0;i<10&&await p.locator('.ability-upgrade-dialog[open]').count();i++){await p.evaluate(()=>document.querySelector('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)')?.click());await sleep(150)}}
const key=async(p,k)=>{await clear(p);await p.keyboard.down(k);await sleep(180);await p.keyboard.up(k);await sleep(300)};
async function hero(p,cls,name,host){await click(p,'choose-'+cls);await p.locator('[name=character-name]').fill(name);await click(p,'create');if(host){await p.locator('[name=party-size]').selectOption('2');await click(p,'choose-difficulty');await click(p,'difficulty-normal')}await p.locator('.prologue-video').waitFor();await click(p,'prologue-skip');await p.locator('[name=coop-invite]').waitFor();assert.equal(p.wire.protocol,16);assert.equal(p.wire.outposts,1);assert.equal(p.wire.signals,1)}
async function waitWorld(predicate){for(let i=0;i<600;i++){if(pages.every(p=>p.wire.world&&predicate(p.wire.world))){await sleep(700);return;}await sleep(100)}throw Error('World did not synchronize '+JSON.stringify(pages.map(p=>p.wire.world?.area)))}
async function walk(p,x,y){console.log("Walking",p.wire.id,x,y);await clear(p);for(const[axis,target,negative,positive]of [['x',x,'a','d'],['y',y,'w','s']]){let reached=false;for(let attempt=0;attempt<25;attempt++){const own=p.wire.world?.players[p.wire.id];if(own?.dead)throw Error('Character fell while walking');const delta=target-own[axis];if(Math.abs(delta)<=18){reached=true;break}const k=delta<0?negative:positive,ms=Math.max(100,Math.min(700,Math.abs(delta)/245*1000-120));await p.keyboard.down(k);await sleep(ms);await p.keyboard.up(k);await sleep(1100)}assert.ok(reached,'Reach WAN waypoint '+axis+target)}}

async function personal(p){return p.evaluate(()=>{
 const profiles=Object.keys(sessionStorage).filter(k=>k.startsWith('dante-permanence-v1.signal.')&&k.endsWith('echoes-of-dante.characters.v1')).map(k=>JSON.parse(sessionStorage[k]));
 const profile=profiles.flatMap(p=>p.characters).find(p=>p.campaign?.mode==='coop');
 const key=Object.keys(sessionStorage).find(k=>k.startsWith('dante-permanence-v1.signal.')&&k.endsWith('echoes-of-dante.journey.v1.character.'+profile.id));
 const saved=JSON.parse(sessionStorage[key]);return {credits:saved.economy.credits,receipts:saved.missionRewards,bosses:['soterradoDefeated','vesperDefeated','titanDefeated'].map(k=>saved.flags[k])};
})}

try{
 console.log('Opening public chapter');const h=await page();await h.goto(base+'/campaign-playtest.html?permanence=signal&v=0.1.169',{waitUntil:'domcontentloaded'});
 await h.waitForFunction(()=>document.querySelector('.mission-tracker')&&!document.querySelector('.application-shell')?.open);
 console.log('Solo chapter ready; creating temporary coop');assert.equal(await h.evaluate(()=>typeof window.__danteGame),'undefined');await key(h,'Escape');await click(h,'home');await click(h,'play');await click(h,'coop');await click(h,'coop-new');await hero(h,'warrior','Guilherme',true);
 console.log('Host ready');const invite=await h.locator('[name=coop-invite]').inputValue();assert.equal(new URL(invite).searchParams.get('permanence'),'signal');
 const g=await page();await g.goto(invite,{waitUntil:'domcontentloaded'});await hero(g,'hunter','Lúcia',false);assert.equal(g.configRequests,1);assert.ok(g.navigations>=2);
 console.log('Guest ready');await click(h,'coop-start');await waitWorld(w=>Object.keys(w.players).length===2);
 await h.locator('.campaign-lab-help summary').click();h.once('dialog',d=>d.accept());await h.locator('[data-permanence-prepare]').click();
 await waitWorld(w=>w.missions?.completed.includes('settle-outpost')&&!w.missions.accepted.includes('settle-signal')&&w.missions.evidence.includes('po-secure'));await sleep(1000);
 for(const p of pages)await clear(p);
 check('Two independent public Chrome instances join protocol 16; explicit host lab button simulates only prior reports/chapters');
 await walk(h,1200,740);await walk(g,790,750);await key(g,'e');await g.locator('.mission-dialog[open]').waitFor();
 const select=g.locator('[data-mission-action=select-settle-signal]');if(await select.count())await select.click();
 await g.locator('[data-mission-action=accept]').click();await waitWorld(w=>w.missions.accepted.includes('settle-signal'));await g.waitForFunction(()=>!document.querySelector('.mission-dialog[open]'));
 check('Actual guest NPC dialogue accepts the signal chapter on the selected compiled client/relay 16');
 const before=await Promise.all(pages.map(personal));
 await walk(g,790,850);await key(g,'e');await waitWorld(w=>w.missions.evidence.includes('ps-kit'));
 for(const p of pages)assert.ok(!p.wire.world.missions.completed.includes('settle-signal'));
 check('Guest walks and presses E on the reserved comparison receiver; research evidence reaches both browsers without completing or rewarding the chapter');
 console.log('Reloading guest');const joins=g.wire.joins;delete g.wire.world;await g.reload({waitUntil:'domcontentloaded'});await click(g,'play');await click(g,'coop');await click(g,'invite');await g.locator('[name=coop-code]').fill(invite);await click(g,'coop-join');await click(g,'play-character');
 for(let i=0;i<600&&g.wire.joins===joins;i++)await sleep(100);assert.ok(g.wire.joins>joins,'Guest rejoins through saved original character');
 await waitWorld(w=>w.missions.accepted.includes('settle-signal')&&w.missions.evidence.includes('ps-kit'));
 await sleep(1200);for(const p of pages)await clear(p);
 const after=await Promise.all(pages.map(personal));assert.deepEqual(after,before);
 for(const p of pages){assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'public-coop-real-characters-sentinel');assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.settings.v1']),'public-coop-real-settings-sentinel');}
 for(const saved of after){assert.deepEqual(saved.bosses,[false,false,false]);assert.ok(!saved.receipts.includes('settle-signal'));}
 report.personal=after;report.protocols=pages.map(p=>p.wire.protocol);report.guestJoins=g.wire.joins;
 check('Guest reload/rejoin retains accepted chapter and bank observation; personal credits/receipts and later living bosses remain unchanged, real-save sentinels untouched');
 for(let i=0;i<pages.length;i++){await key(pages[i],'j');await pages[i].screenshot({path:out+`/participant-${i+1}.png`});await key(pages[i],'Escape');}
 await key(h,'Escape');await click(h,'home');await g.locator('[data-shell=coop-home]').waitFor();check('Temporary public room ends through the normal host menu');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error);report.positions=pages.map(p=>({id:p.wire.id,area:p.wire.world?.area,players:p.wire.world?.players}));for(let i=0;i<pages.length;i++)try{await pages[i].screenshot({path:out+`/failure-${i+1}.png`})}catch{}throw error}
finally{await Promise.all(browsers.map(b=>b.close()));await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,failure:report.failure,checks:report.checks},null,2))}
