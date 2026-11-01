import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'https://echosofdante.vercel.app',local=process.env.QA_LOCAL??'http://127.0.0.1:5185',out='docs/frontend-ux-audit-178/evidence';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});p.setDefaultTimeout(90000);
const r={publicBase:base,errors:[],checks:[]};p.on('pageerror',e=>r.errors.push(e.message));const tap=id=>p.locator(`[data-shell="${id}"]`).tap();
const shot=name=>p.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:88});
try{
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;const prefix='dante-mobile-review-v1.';if(!sessionStorage[prefix+'audit-seeded']){sessionStorage[prefix+'local.echoes-of-dante.settings.v1']=JSON.stringify({master:0,music:0,sfx:0});sessionStorage[prefix+'session.echoes-of-dante.invite-character-once']='{broken';sessionStorage[prefix+'audit-seeded']='1';}});
 await p.goto(base+'/campaign-playtest.html?mobile-review=1&v=0.1.178');await tap('settings');r.malformedSession=await p.evaluate(()=>({displayed:[...document.querySelectorAll('[data-volume]')].map(i=>({key:i.dataset.volume,value:i.value})),saved:JSON.parse(sessionStorage['dante-mobile-review-v1.local.echoes-of-dante.settings.v1'])}));await shot('settings-stale-session');r.checks.push('A malformed one-shot session flag prevents reading otherwise valid persisted muted settings: fixture only, not a claim about ordinary storage');
 await p.close();
 const q=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});q.setDefaultTimeout(90000);q.on('pageerror',e=>r.errors.push(e.message));
 const f=JSON.parse(await readFile('docs/ice-transfer/qa/solo/loaded-fixture.json','utf8'));
 await q.addInitScript(f=>{Element.prototype.requestFullscreen=undefined;const prefix='dante-permanence-v1.icecave.warrior.';sessionStorage[prefix+'local.echoes-of-dante.characters.v1']=JSON.stringify(f.profiles);sessionStorage[prefix+'local.echoes-of-dante.journey.v1.character.'+f.profiles.selected]=JSON.stringify(f.journey);sessionStorage[prefix+'arrived']='1';},f);
 await q.goto(local+'/campaign-playtest.html?permanence=icecave');
 await q.waitForFunction(()=>window.__danteGame?.scene.keys.Game?.missionUi&&!window.__danteGame.scene.keys.Game.transitioning);
 for(let i=0;i<12;i++){await q.evaluate(()=>document.querySelector('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)')?.click());await q.waitForTimeout(120);}
 await q.evaluate(()=>window.__danteGame.scene.keys.Game.transitionArea('base'));await q.waitForFunction(()=>window.__danteGame.scene.keys.Game.area==='base'&&!window.__danteGame.scene.keys.Game.transitioning);await q.waitForTimeout(500);
 await q.keyboard.press('i');await q.waitForTimeout(300);await q.screenshot({path:out+'/inventory-mobile.jpg',type:'jpeg',quality:88});await q.keyboard.press('Escape');
 await q.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x:385,y:735});s.player.invulnerableUntil=Infinity;});await q.waitForTimeout(400);await q.locator('[data-action=interact]').tap();await q.waitForTimeout(300);await q.screenshot({path:out+'/lia-dialog-mobile.jpg',type:'jpeg',quality:88});await q.keyboard.press('Escape');
 await q.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x:490,y:810});s.player.invulnerableUntil=Infinity;});await q.waitForTimeout(450);await q.screenshot({path:out+'/base-objects-near-mobile.jpg',type:'jpeg',quality:88});
 r.layerInventory=await q.evaluate(()=>[...document.querySelectorAll('dialog')].map(d=>({class:d.className,open:d.open,scrollHeight:d.scrollHeight,clientHeight:d.clientHeight})));
 await q.evaluate(()=>window.__danteGame.scene.keys.Game.transitionArea('terraces'));await q.waitForFunction(()=>window.__danteGame.scene.keys.Game.area==='terraces'&&!window.__danteGame.scene.keys.Game.transitioning);
 await q.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x:2140,y:1020});s.player.invulnerableUntil=Infinity;});await q.waitForTimeout(500);await q.screenshot({path:out+'/first-camp-mobile.jpg',type:'jpeg',quality:88});await q.setViewportSize({width:1280,height:720});await q.waitForTimeout(400);await q.screenshot({path:out+'/first-camp-desktop.jpg',type:'jpeg',quality:88});
 r.checks.push('Inventory, NPC approach and base object labels captured in mobile from an isolated previous chapter fixture; no real campaign or boss outcome changed');
 await q.close();
 console.log(JSON.stringify(r,null,2));
}catch(e){r.failure=String(e);throw e;}finally{await writeFile(out+'/details.json',JSON.stringify(r,null,2)+'\n');await b.close();}
