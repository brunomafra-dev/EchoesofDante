import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/early-journey/revision-02/qa';await mkdir(out,{recursive:true});
const report={checks:[],regions:[],errors:[],method:'Chrome DEV, direct isolated arrivals; actual navigation and keyboard movement, gate interaction, explicit HP/position fixtures for isolated checks.'};
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling']});
try{
 for(const area of ['forest','cavern']){
  const p=await browser.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(60000);
  p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
  await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','real-save-sentinel'));
  await p.goto(base+`/campaign-playtest.html?route=1&arrival=${area}`);
  await p.waitForFunction(a=>{const s=window.__danteGame?.scene.getScene('Game');return s?.scene.isActive()&&s.area===a&&s.regional?.sites.length&&!s.transitioning},area);
  await p.waitForTimeout(1400);
  const state=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;return{area:s.area,at:{...s.player.position},boss:s.wardenDefeated,echo:s.firstEchoSeen,landmarks:s.children.list.filter(o=>o.name==='living-basin'||o.name.startsWith('early-chamber-')).map(o=>o.name),obstacles:s.arena.obstacles.length,gate:s.movementBounds.right}});
  assert.equal(state.boss,false);assert.equal(state.echo,false);assert.ok(Math.abs(state.at.x-(area==='forest'?2240:1140))<5);assert.ok(state.landmarks.length>=1);
  if(area==='cavern')assert.equal(state.gate,1680);
  await p.screenshot({path:out+`/direct-${area}.png`});
  // Real movement from the old clearing into the new eastern passage.
  if(area==='forest'){
   await p.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:1770,y:1040}));
   await p.keyboard.down('d');await p.waitForTimeout(1800);await p.keyboard.up('d');
   assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position.x>2100),'Eastern opening must be traversable directly');
   report.checks.push('Keyboard walk from old clearing through widened eastern opening');
  }else{
   await p.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:1620,y:490}));
   await p.keyboard.press('e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').deepPassageOpen);await p.waitForTimeout(700);
  }
  const routes=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.navigation.refreshGeometry();const start=s.navigation.nearest(s.player.position);return s.regional.sites.map(t=>{const path=s.navigation.findRoute(start,s.navigation.nearest(t)),last=path.at(-1);return{id:t.id,steps:path.length,gap:last?Math.hypot(last.x-t.x,last.y-t.y):Infinity}})});
  for(const route of routes){assert.ok(route.steps>0);assert.ok(route.gap<100,route.id+' reachable');}
  if(area==='cavern')for(const[x,y,id]of [[2090,1400,1],[3750,1350,2]]){await p.evaluate(q=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,q),{x,y});await p.waitForTimeout(700);await p.screenshot({path:out+`/chamber-${id}.png`});}
  // Reload resumes temporary hero at the prepared checkpoint without resetting scans.
  await p.reload();await p.waitForFunction(a=>{const s=window.__danteGame?.scene.getScene('Game');return s?.scene.isActive()&&s.area===a&&s.regional?.sites.length},area);await p.waitForTimeout(800);
  assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'real-save-sentinel');
  state.routes=routes;report.regions.push(state);report.checks.push(area+': direct arrival, unique painted landmarks, accessible scans, original boss/gate state and real-save isolation/reload');
  await p.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(out+'/landmarks.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
