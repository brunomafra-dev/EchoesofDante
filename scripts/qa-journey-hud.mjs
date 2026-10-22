import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/journey-hud/qa';
await mkdir(out,{recursive:true});
const report={method:'Chrome DEV, real UI/keys; explicit positioning for conversations and deliberate invalid visited-list injection. Region gate matrix via bundled production function. Physical devices pending.',checks:[],errors:[]};
const check=s=>{report.checks.push(s);console.log(s)};
const bundled=await build({stdin:{contents:"export * from './src/systems/RegionAccess';export {JOURNEY_FLAGS} from './src/systems/LocalJourney';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.DEV':'false'}});
const {regionUnlocked,JOURNEY_FLAGS}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const f=Object.fromEntries(JOURNEY_FLAGS.map(k=>[k,true]));
for(const area of ['cavern','warden','valley','springs','terraces','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera']){
 assert.ok(regionUnlocked(area,true,f),area+' reachable with legitimate completed progression');
 assert.equal(regionUnlocked(area,false,f),false,area+' requires the fissure');
}
for(const [area,key]of [['warden','firstEchoSeen'],['valley','wardenDefeated'],['springs','wardenDefeated'],['terraces','springsVisited'],['arid','valleyFrontierEndSeen'],['dunes','aridSignalSeen'],['sandpit','dunesDepthSeen'],['frost','soterradoDefeated'],['icecave','frostSignalSeen'],['icenest','icecaveSignalSeen'],['cinder','vesperDefeated'],['obsidian','cinderSignalSeen'],['caldera','obsidianSignalSeen']])assert.equal(regionUnlocked(area,true,{...f,[key]:false}),false,area+' prerequisite '+key);
check('All campaign destinations retain prerequisite gates; bosses and world records cannot be replaced by visited flags');
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1912,height:886}});
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.missionUi&&s.player&&!s.transitioning});
const state=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{area:s.area,gate:s.wardenGateOpen,won:s.wardenDefeated,first:s.firstEchoSeen,echoes:s.progression.echoes.size,xp:s.progression.xp,passage:s.progression.passageOpen,current:s.missions.current,visited:s.economy.visited}});
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','real-save-sentinel'));
 await p.goto(base+'/campaign-playtest.html?missions=1&journey=1');await ready();
 const fresh=await state();assert.equal(fresh.won,false);assert.equal(fresh.passage,false);assert.equal(fresh.echoes,0);assert.equal(fresh.xp,0);assert.equal(fresh.current,'recon');
 check('Isolated journey starts with original Warden undefeated, zero Echoes/XP and no passage');
 await p.keyboard.press('m');await p.locator('.base-dialog[open]').waitFor();
 for(const area of ['cavern','warden','valley','springs','terraces'])assert.ok(await p.locator(`[data-destination=${area}]`).isDisabled());
 await p.locator('.base-dialog [data-close]').click();
 const denied=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');const old=[...s.economy.visited];s.economy.visited.push('warden','valley','terraces');const results=['warden','valley','terraces'].map(a=>s.baseTravel(a));s.economy.visited=old;return results;});assert.deepEqual(denied,[false,false,false]);
 check('Atlas locks unseen regions; authoritative travel rejects even injected destination names');
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:1075,y:520});});await p.waitForTimeout(250);await p.keyboard.press('e');await p.locator('[data-mission-action=accept]').click();await p.waitForFunction(()=>!document.querySelector('.mission-dialog[open]'));
 const accepted=await state();assert.equal(accepted.won,false);assert.equal(accepted.gate,false);assert.equal(accepted.passage,false);assert.equal(accepted.xp,0);
 check('Accepting Nara mission changes only its journal state, with no boss, gate or XP shortcut');
 for(const[width,height]of [[1280,720],[1366,768],[1920,1080],[1912,886],[1024,768]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(400);
  const boxes=await p.evaluate(()=>{
   const selectors=['.mobile-vitals','.desktop-combat','.expedition-launcher','.main-menu-button','.inventory-launcher','.records-button','.world-minimap','.mission-tracker'];
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
   return{canvas:rect('#game canvas'),hud:selectors.map(name=>({name,...rect(name)}))};
  });
  assert.ok(boxes.canvas.x<1&&boxes.canvas.y<1);assert.ok(Math.abs(boxes.canvas.width-width)<2&&Math.abs(boxes.canvas.height-height)<2,'Canvas must fill the viewport proportionally');
  for(const r of boxes.hud)assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,JSON.stringify(r));
  const overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
  for(let i=0;i<boxes.hud.length;i++)for(let j=i+1;j<boxes.hud.length;j++)assert.ok(!overlap(boxes.hud[i],boxes.hud[j]),'Overlap '+boxes.hud[i].name+' / '+boxes.hud[j].name);
  report[`${width}x${height}`]=boxes;await p.screenshot({path:out+`/desktop-${width}x${height}.png`});
 }
 check('Five desktop layouts: canvas fills 16:9, wide and 4:3 viewports; all eight HUD clusters fit without overlap');
 await p.reload();await ready();assert.equal((await state()).won,false);assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').missions.snapshot().accepted.includes('recon')));
 const count=()=>p.evaluate(()=>({vitals:document.querySelectorAll('.mobile-vitals').length,hud:document.querySelectorAll('.desktop-hud').length,tracker:document.querySelectorAll('.mission-tracker').length,resize:window.__danteGame.scale.listenerCount('resize')}));
 const initial=await count();for(let i=0;i<3;i++){await p.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await ready();await p.waitForTimeout(150)}assert.deepEqual(await count(),initial);report.counts=initial;
 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'real-save-sentinel');check('Reload keeps real exploration state, protects real saves and three restarts do not duplicate HUD or resize listeners');
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.progression.restore({...s.progression.snapshot(),echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true});s.saveProgress();});
 await p.reload();await ready();assert.ok(!(await state()).visited.includes('cavern'));
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.deepPassageOpen=true;s.deepCavernEntered=true;s.firstEchoSeen=true;s.wardenGateOpen=true;s.saveProgress();});
 await p.reload();await ready();const opened=await state();assert.equal(opened.gate,true);assert.equal(opened.won,false);assert.ok(!opened.visited.includes('warden'));
 assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').baseTravel('warden')),false);
 check('Reload does not invent cavern or Warden discovery merely because the preceding passage was opened');
 await p.goto(base+'/campaign-playtest.html?missions=1&settlement=1');await ready();assert.equal((await state()).won,false);assert.equal((await state()).current,'recon');
 await p.locator('.campaign-lab-help summary').click();p.once('dialog',d=>d.dismiss());await p.locator('[data-stage=water-source]').click();assert.equal((await state()).won,false);
 p.once('dialog',d=>d.accept());await p.locator('[data-stage=water-source]').click();await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').missions.current==='water-source');assert.equal((await state()).won,true);await p.reload();await ready();assert.match(await p.locator('.campaign-lab-help summary').innerText(),/SIMULAÇÃO ATIVA/);
 check('Settlement link no longer auto-defeats Warden; simulation requires confirmation and persists a conspicuous label across reload');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
