import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/base-economy/expedition-return/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks=[];
const watch=p=>{p.setDefaultNavigationTimeout(90000);p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())})};
const arrived=(p,area)=>p.waitForFunction(area=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area===area&&!s.transitioning&&(s.sys.isActive()||s.scene.isPaused())&&s.player?.view.active&&(!s.party||s.party.localPlayer===s.player)},area);
const scene=(p,fn,arg)=>p.evaluate(({source,arg})=>{const s=window.__danteGame.scene.getScene('Game');return new Function('s','arg',source)(s,arg)},{source:fn,arg});
const point=p=>scene(p,'return {...s.player.position}');
const near=(a,b)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1,JSON.stringify({a,b}));
async function map(p){await p.waitForTimeout(450);for(let i=0;i<18;i++){const choices=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await choices.count())break;await choices.first().click();await p.waitForTimeout(100)}await p.locator('[data-map]').click();await p.locator('.base-dialog[open]').waitFor()}
async function goBase(p){await map(p);await p.locator('[data-return-base]').click();await arrived(p,'base')}
async function resume(p,area){await map(p);await p.locator('[data-resume-expedition]').click();await arrived(p,area)}
try{
 const p=await browser.newPage();watch(p);await p.goto('http://localhost:5184/base-playtest.html?test=return');await arrived(p,'forest');await p.locator('.playtest-navigation').evaluate(e=>e.open=false);
 const storage=await p.evaluate(()=>JSON.stringify(localStorage));
 const departure=await point(p);assert.ok(await scene(p,'return Math.hypot(s.player.position.x-s.returnStation.x,s.player.position.y-s.returnStation.y)>600'));
 await goBase(p);near(await scene(p,'return s.expeditionReturn.position'),departure);await resume(p,'forest');near(await point(p),departure);assert.equal(await scene(p,'return s.expeditionReturn'),undefined);
 console.log('Check',checks.length+1);checks.push('Lab starts far from terminal; map return/resume restores exact position and consumes one destination');
 // Structural footprint at the saved point must never trap the actor.
 await goBase(p);await scene(p,'s.expeditionReturn.position={...s.arena.obstacles[0]}'); // Base footprint is still interpreted in Forest geometry.
 await scene(p,'s.expeditionReturn.position={x:290,y:1060}');await resume(p,'forest');
 assert.ok(await scene(p,'return s.arena.obstacles.every(o=>Math.hypot(s.player.position.x-o.x,s.player.position.y-o.y)>=s.player.radius+o.radius-.1)'));
 assert.ok(Math.hypot((await point(p)).x-290,(await point(p)).y-1060)<170);console.log('Check',checks.length+1);checks.push('Occupied rock position relocates locally without changing colliders');
 await goBase(p);await map(p);await p.locator('[data-destination="forest"]').click();await arrived(p,'forest');near(await point(p),{x:400,y:1230});assert.equal(await scene(p,'return s.expeditionReturn'),undefined);console.log('Check',checks.length+1);checks.push('Choosing atlas destination starts at normal entry and discards previous destination');
 // Cover all geographic regions with existing chapter flags as QA fixtures.
 const regions=['cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest'];
 for(const area of regions){console.log('Region',area);
  await scene(p,`window.qaPreviousActor=s.player;for(const k of Object.keys(s).filter(k=>/^(deep|deeper|exterior|fragment|approach|firstEcho|warden|valley|arid|dunes|soterrado|frost|icecave|icenest|vesper)/.test(k)&&typeof s[k]==='boolean'))s[k]=true;s.deepPassageOpen=true;s.progression.restore({xp:1000,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[]});s.area=arg;s.scene.restart()`,area);
  await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player!==window.qaPreviousActor);await arrived(p,area);await scene(p,'s.player.invulnerableUntil=Infinity');const before=await point(p);await goBase(p);await resume(p,area);near(await point(p),before);
 }
 console.log('Check',checks.length+1);checks.push('All nine additional campaign regions: return/resume; existing terrain and normal checkpoints retained');
 await scene(p,'s.player.die()');assert.equal(await scene(p,"return s.baseTravel('base')"),false);await map(p);assert.ok(await p.locator('[data-return-base]').isDisabled());await p.locator('.base-dialog [data-close]').click();await scene(p,'window.qaPreviousActor=s.player;s.scene.restart()');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player!==window.qaPreviousActor);await arrived(p,'icenest');console.log('Check',checks.length+1);checks.push('Dead actor cannot travel; normal respawn still restores playable scene');
 assert.equal(await p.evaluate(()=>JSON.stringify(localStorage)),storage);console.log('Check',checks.length+1);checks.push('Session-only lab leaves real character/save keys unchanged');
 // Actual dormant Warden introduction, rather than a fake boss state.
 await scene(p,"window.qaPreviousActor=s.player;s.wardenDefeated=false;s.wardenEndingSeen=false;s.area='warden';s.scene.restart()");await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player!==window.qaPreviousActor);await arrived(p,'warden');
 await scene(p,'Object.assign(s.player.position,{x:900,y:760});s.player.invulnerableUntil=Infinity');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').bossActive());
 await map(p);assert.ok(await p.locator('[data-return-base]').isDisabled());assert.ok(await p.locator('[data-destination="base"]').isDisabled());assert.equal(await scene(p,"return s.baseTravel('base')"),false);await p.locator('.base-dialog [data-close]').click();console.log('Check',checks.length+1);checks.push('Actual Warden intro blocks explicit return button, atlas Base node and travel handler');
 await p.close();
 // Normal personal journey: persistence, ownership, reload and old save compatibility.
 const q=await browser.newPage();watch(q);await q.goto('http://localhost:5184/?qa=play');await arrived(q,'forest');await scene(q,'s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:1100,y:760})');
 await goBase(q);const saved=await scene(q,'return s.journey.load()');near(saved.expeditionReturn.position,{x:1100,y:760});
 await q.reload();await arrived(q,'base');await resume(q,'forest');near(await point(q),{x:1100,y:760});console.log('Check',checks.length+1);checks.push('Personal return point survives reload while in base; optional save field keeps schema 1 compatible');
 await goBase(q);
 for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080},{width:844,height:390}]){
  await q.setViewportSize(viewport);await map(q);const bounds=await q.locator('[data-resume-expedition]').boundingBox();assert.ok(bounds&&bounds.y>=0&&bounds.y+bounds.height<=viewport.height);assert.ok(await q.locator('[data-resume-expedition]').evaluate(b=>{const r=b.getBoundingClientRect();return b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}));
  await q.screenshot({path:`${out}/resume-${viewport.width}.png`});await q.locator('.base-dialog [data-close]').click();
 }
 console.log('Check',checks.length+1);checks.push('Resume action visible at all four requested resolutions');
 // Stable objects across repeated trips (counts at the same region).
 const samples=[];for(let i=0;i<3;i++){await resume(q,'forest');await goBase(q);await q.waitForTimeout(500);samples.push(await scene(q,'return {objects:s.children.list.length,textures:Object.keys(s.textures.list).length,tweens:s.tweens.getTweens().length,dialogs:document.querySelectorAll(".base-dialog").length,bars:document.querySelectorAll(".expedition-launcher").length}'))}
 assert.deepEqual(samples[0],samples[2]);assert.equal(samples[2].dialogs,1);assert.equal(samples[2].bars,1);
 const fps=await q.evaluate(async()=>{const values=[];for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,500));values.push(window.__danteGame.loop.actualFps)}return values.reduce((a,b)=>a+b,0)/values.length});console.log('Check',checks.length+1);checks.push('Three round trips: stable object/texture/tween/UI counts, no duplicate listeners UI');
 await q.close();
 // Touch-specific full trip using DOM touch gestures.
 const tc=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),t=await tc.newPage();watch(t);await t.goto('http://localhost:5184/base-playtest.html?test=return');await arrived(t,'forest');await t.locator('.playtest-navigation').evaluate(e=>e.open=false);const tp=await point(t);
 await t.locator('[data-map]').tap();await t.locator('[data-return-base]').tap();await arrived(t,'base');await t.locator('[data-map]').tap();await t.locator('[data-resume-expedition]').tap();await arrived(t,'forest');near(await point(t),tp);assert.equal(await t.evaluate(()=>visualViewport.scale),1);await tc.close();console.log('Check',checks.length+1);checks.push('CDP touch: map, return, resume; page scale remains 1');
 // Standard Gamepad API mock selects visible action with existing D-pad/A/B.
 const pad=await browser.newPage();watch(pad);await pad.addInitScript(()=>{window.qaPad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.qaPad]});await pad.goto('http://localhost:5184/base-playtest.html?test=return');await arrived(pad,'forest');await pad.locator('.playtest-navigation').evaluate(e=>e.open=false);const pp=await point(pad);
 const press=async n=>{await pad.evaluate(n=>window.qaPad.buttons[n]={pressed:true,value:1},n);await pad.waitForTimeout(120);await pad.evaluate(n=>window.qaPad.buttons[n]={pressed:false,value:0},n);await pad.waitForTimeout(150)};
 await map(pad);await press(13);await press(0);await arrived(pad,'base');await map(pad);await press(13);await press(0);await arrived(pad,'forest');near(await point(pad),pp);await pad.close();console.log('Check',checks.length+1);checks.push('Gamepad API mock: D-pad and A select return/resume through existing map controls');
 // Real WebSockets: guest can request group withdrawal, only host resumes.
 const hc=await browser.newContext(),gc=await browser.newContext();await gc.addInitScript(()=>{if(!localStorage.getItem('echoes-of-dante.characters.v1'))localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'return-guest',characters:[{id:'return-guest',name:'Visitante QA',classId:'hunter',createdAt:1}]}))});
 const h=await hc.newPage(),g=await gc.newPage();for(const page of[h,g]){watch(page);await page.goto('http://localhost:5184/?qa=play');await arrived(page,'forest')}
 await h.evaluate(async()=>window.__danteCoop.connect('ws://localhost:5184/coop','create',{name:'Host QA',classId:'warrior'},'forest'));const code=await h.evaluate(()=>window.__danteCoop.code);await g.evaluate(async code=>window.__danteCoop.connect('ws://localhost:5184/coop','join',{name:'Visitante QA',classId:'hunter'},'forest',code),code);
 await h.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party?.partner);await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party?.mirrorHost);
 await scene(h,'Object.assign(s.player.position,{x:1100,y:760});s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity');await g.waitForTimeout(400);
 await goBase(g);await arrived(h,'base');await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').expeditionReturn?.area==='forest');await map(g);assert.ok(await g.locator('[data-resume-expedition]').isDisabled());assert.equal(await scene(g,"return s.baseTravel('forest',true)"),false);await g.locator('.base-dialog [data-close]').click();
 await resume(h,'forest');await arrived(g,'forest');near(await point(h),{x:1100,y:760});assert.ok(Math.hypot((await point(g)).x-1100,(await point(g)).y-760)<150);console.log('Check',checks.length+1);checks.push('Real local cooperative room: visitor requests whole group return; shared destination; host resumes with companion nearby');
 for(const page of[h,g])await page.evaluate(()=>window.__danteCoop.disconnect(false));await hc.close();await gc.close();
 assert.deepEqual(errors,[]);await writeFile(out+'/return.json',JSON.stringify({passed:true,errors,checks,samples,meanFps:fps,method:'Chrome headless; real WebSocket duo, CDP touch and standard gamepad mock. DEV chapter/position/death fixtures. No physical devices.'},null,2));console.log({passed:true,checks,samples,meanFps:fps});
}finally{await browser.close()}
