import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/early-journey/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling']}),p=await browser.newPage({viewport:{width:1366,height:768}});
p.setDefaultTimeout(45000);console.log('Early route QA started');
const report={method:'Chrome DEV; isolated lab; actual collision/navigation graph and E scans; explicit preview/position fixtures, not measured campaign duration.',checks:[],regions:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.regional&&!s.transitioning&&!s.respawning});
const key=async k=>{await p.keyboard.down(k);await p.waitForTimeout(160);await p.keyboard.up(k);await p.waitForTimeout(300)};
const position=async point=>{await p.evaluate(q=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,q);s.player.invulnerableUntil=Infinity},point);await p.waitForTimeout(500)};
async function preview(area){await p.locator('.campaign-lab-help').evaluate(e=>e.open=true);await p.locator('[name=route-preview]').selectOption(area);p.once('dialog',d=>d.accept());await p.locator('[data-route-preview]').click();await p.waitForFunction(a=>{const s=window.__danteGame.scene.getScene('Game');return s.area===a&&!s.transitioning},area);await ready();await p.waitForTimeout(700)}
async function graph(){return p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),n=s.navigation;n.refreshGeometry();const start=n.nearest(s.player.position),targets=[...s.regional.sites,...(s.area==='forest'?[{id:'echo-north',x:1500,y:285},{id:'mechanism',x:1670,y:230},{id:'threshold',x:1870,y:245}]:[{id:'deep-opening',x:1620,y:490},{id:'first-echo',x:5530,y:735}])];return targets.map(t=>{const end=n.nearest(t),path=n.findRoute(start,end),last=path.at(-1);return{id:t.id,steps:path.length,gap:last?Math.hypot(last.x-t.x,last.y-t.y):Infinity}})})}
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','real-save-sentinel'));
 await p.goto(base+'/campaign-playtest.html?route=1&class=hunter');await ready();
 assert.deepEqual(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{area:s.area,echoes:s.progression.echoes.size,passage:s.progression.passageOpen,warden:s.wardenDefeated}}),{area:'base',echoes:0,passage:false,warden:false});report.checks.push('Fresh isolated lab starts at base: no Echoes, no passage, Warden alive');
 for(const area of ['forest','cavern']){
  console.log('Scanning',area);
  await preview(area);await position(area==='forest'?{x:1770,y:1000}:{x:1200,y:1300});
  if(area==='cavern'){
   const locked=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{right:s.movementBounds.right,sites:s.regional.sites.map(t=>t.id),deep:s.deepPassageOpen}});assert.equal(locked.right,1680);assert.equal(locked.deep,false);assert.deepEqual(locked.sites,['exp-cavern-1']);report.checks.push('Closed collapse only exposes first side chamber; deeper sites and residents remain gated');
   await position({x:1620,y:490});await key('e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').deepPassageOpen);await p.waitForTimeout(600);
  }
  const region={area,graph:await graph(),sites:await p.evaluate(()=>window.__danteGame.scene.getScene('Game').regional.sites)};
  assert.equal(region.sites.length,3);for(const t of region.graph.filter(t=>!['first-echo'].includes(t.id))){assert.ok(t.steps>0,t.id+' connected');assert.ok(t.gap<100,t.id+' reachable '+t.gap)}
  for(const site of region.sites){await position(site);await key('e');assert.ok(await p.evaluate(id=>window.__danteGame.scene.getScene('Game').missions.has(id),site.id));await p.screenshot({path:out+'/'+site.id+'.png'})}
  for(const point of area==='forest'?[{x:2430,y:1030},{x:2500,y:1610}]:[{x:2280,y:1310},{x:3650,y:1195}])await position(point);
  const population=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return [...s.hollowSpawnIds].map(([e,id])=>({id,kind:s.enemySpecies.get(e)}))});assert.equal(population.filter(e=>e.id>=1972&&e.id<=1975).length,2);region.population=population;
  region.warden=await p.evaluate(()=>window.__danteGame.scene.getScene('Game').wardenDefeated);assert.equal(region.warden,false);
  region.fps=await p.evaluate(async()=>{const samples=[];for(let i=0;i<6;i++){await new Promise(r=>setTimeout(r,200));samples.push(window.__danteGame.loop.actualFps)}return samples.reduce((a,b)=>a+b)/samples.length});
  report.regions.push(region);
 }
 report.checks.push('All six investigations accessible, E scans work, four new stable finite residents spawn; previews never defeat Warden');
 // Persist a new finite reward through the actual LocalJourney validator.
 console.log('Checking finite receipt and reload');
 const kill=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=[...s.hollowSpawnIds].find(([,id])=>id===1975)?.[0];s.resolvePlayerHits(s.time.now,[e],9999,0,0x5fe6d8,s.player.position,false);s.saveProgress();return{xp:s.progression.xp,receipt:s.journey.load().progression.rewardedHollows.includes(1975)}});
 assert.ok(kill.receipt);await p.evaluate(()=>sessionStorage.setItem('echoes-of-dante.launch-once',window.__danteGame.scene.getScene('Game').journey.owner));await p.reload();await ready();await p.waitForTimeout(700);assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.hasDefeated(1975)));
 report.checks.push('New resident XP receipt survives actual local save validator and browser reload');
 for(const area of ['forest','cavern']){
  console.log('Recreating',area);
  await preview(area);const cycles=[];
  for(let i=0;i<4;i++){
   console.log('Cycle',area,i);
   if(i){await p.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await p.waitForTimeout(650);await ready();}
   await position(area==='forest'?{x:2430,y:1030}:{x:1200,y:1300});
   cycles.push(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{objects:s.children.list.length,textures:Object.keys(s.textures.list).length,shutdown:s.events.listenerCount('shutdown'),resize:s.scale.listenerCount('resize'),tweens:s.tweens.getTweens().length,bakedPixels:s.children.list.filter(o=>o.type==='RenderTexture').reduce((n,o)=>n+o.width*o.height,0),sites:s.regional.sites.length}}));
  }
  for(const c of cycles)assert.deepEqual(c,cycles[0]);report.regions.find(r=>r.area===area).cycles=cycles;
 }
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){
  console.log('Viewport',width,height);
  await p.setViewportSize({width,height});await position({x:1200,y:1300});await p.screenshot({path:out+`/chamber-${width}.png`});
  const rect=await p.locator('.mission-tracker').boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1);
 }
 report.checks.push('Four recreations per expanded region retain stable object/texture/listener/tween counts; HUD stays inside all four resolutions');

 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'real-save-sentinel');
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'});throw e}finally{await browser.close();await writeFile(out+'/browser.json',JSON.stringify(report,null,2))}
