import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/sirocco-journey/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling']}),p=await browser.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(60000);
const report={method:'Chrome DEV, isolated campaign lab; explicit position/combat fixtures, real navigation graph, E scans, NPC dialogs, save/reload and original gate interactions. Not human playtime or balance.',errors:[],checks:[],regions:[]};p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.regional&&s.scene.isActive()&&!s.transitioning&&!s.respawning});
const key=async k=>{await p.keyboard.press(k,{delay:180});await p.waitForTimeout(400)};
const position=async point=>{await p.evaluate(q=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,q);s.player.invulnerableUntil=Infinity},point);await p.waitForTimeout(500)};
async function clear(){for(let i=0;i<15;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await b.count())break;await b.click();await p.waitForTimeout(120)}}
async function preview(area){await clear();await p.locator('.campaign-lab-help').evaluate(e=>e.open=true);await p.locator('[name=route-preview]').selectOption(area);p.once('dialog',d=>d.accept());await p.locator('[data-route-preview]').click();await p.waitForFunction(a=>window.__danteGame.scene.getScene('Game').area===a,area);await ready();await p.waitForTimeout(800);await clear();}
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','real-sirocco-save-sentinel'));
 await p.goto(base+'/campaign-playtest.html?sirocco=1&arrival=valley&class=hunter');await ready();await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='valley');await clear();
 await preview('valley');
 for(const area of ['valley','arid','dunes']){
  console.log('Sirocco journey',area);
  const route=await p.evaluate(async()=>{
   const s=window.__danteGame.scene.getScene('Game'),{SIROCCO_TRAILS}=await import('/src/config/siroccoJourney.ts');s.navigation.refreshGeometry();
   return SIROCCO_TRAILS[s.area].map(t=>{const site=s.regional.sites.find(q=>q.id===t.site);const paths=[[t.entry,site],[site,t.exit]].map(([a,b])=>{const path=s.navigation.findRoute(s.navigation.nearest(a),s.navigation.nearest(b)),last=path.at(-1);return{steps:path.length,gap:last?Math.hypot(last.x-b.x,last.y-b.y):Infinity}});return{...t,site,paths}});
  });assert.equal(route.length,3);for(const t of route){assert.ok(t.site);for(const path of t.paths){assert.ok(path.steps>0,t.site.id+' connected');assert.ok(path.gap<100,t.site.id+' reachable '+path.gap)}}
  for(const t of route){await position(t.site);await key('e');assert.ok(await p.evaluate(id=>window.__danteGame.scene.getScene('Game').missions.has(id),t.site.id));await p.screenshot({path:out+'/'+t.site.id+'.jpg',type:'jpeg',quality:84});}
  const region=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{area:s.area,population:[...s.hollowSpawnIds].map(([e,id])=>({id,kind:s.enemySpecies.get(e)})),gates:{valley:s.valleyFrontierSignalSeen,arid:s.aridSignalSeen,dunes:s.dunesRuinsSeen,descent:s.dunesDepthSeen},won:s.soterradoDefeated,rewards:s.progression.snapshot().bossRewards,ground:s.children.list.filter(o=>o.getData?.('route-identity')).map(o=>o.texture.key),ridges:s.children.list.filter(o=>o.name==='sirocco-trail-ridge').length}});
  assert.equal(region.won,false);assert.deepEqual(region.rewards,['warden']);assert.equal(region.ridges,3);assert.deepEqual(region.ground,['route-floor-'+area]);assert.equal(region.population.filter(e=>e.id>=1976&&e.id<=1981).length,2);assert.ok(region.population.length+3<=32);
  assert.equal(region.gates[area],false,'Report must not open original signal '+area);if(area==='dunes')assert.equal(region.gates.descent,false);
  const id={valley:1977,arid:1979,dunes:1981}[area];
  const receipt=await p.evaluate(id=>{const s=window.__danteGame.scene.getScene('Game'),e=[...s.hollowSpawnIds].find(([,n])=>n===id)[0];const before=s.progression.xp;s.resolvePlayerHits(s.time.now,[e],9999,0,0x5fe6d8,s.player.position,false);s.saveProgress();return{before,after:s.progression.xp,valid:s.journey.load().progression.rewardedHollows.includes(id)}},id);assert.ok(receipt.valid);assert.ok(receipt.after>receipt.before);region.receipt=receipt;
  await p.waitForTimeout(2500);region.fps=await p.evaluate(async()=>{const samples=[];for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,200));samples.push(window.__danteGame.loop.actualFps)}return samples.reduce((a,b)=>a+b)/samples.length});
  region.routes=route.map(t=>({id:t.site.id,paths:t.paths}));report.regions.push(region);await clear();
  if(area==='valley'){
   await position({x:4230,y:710});await key('e');assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').valleyFrontierSignalSeen));
   await position({x:4920,y:795});await position({x:5050,y:795});await key('e');
  }else if(area==='arid'){
   await position({x:2240,y:740});await key('e');assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').aridSignalSeen));
   await position({x:4880,y:805});await position({x:4990,y:805});await key('e');
  }else{
   await position({x:1830,y:850});await key('e');assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').dunesRuinsSeen));
   await position({x:2640,y:1160});await key('e');
  }
  const next=area==='valley'?'arid':area==='arid'?'dunes':'sandpit';await p.waitForFunction(a=>{const s=window.__danteGame.scene.getScene('Game');return s.area===a&&s.scene.isActive()&&!s.transitioning&&!!s.regional},next);await p.waitForTimeout(800);await clear();
 }
 assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').soterrado.isDead),false);
 report.checks.push('Original Vale signal → frontier portal → Sirocco signal → dunes portal → ruins → descent still work with real E; arrive at living Soterrado.');
 report.checks.push('Nine original evidence IDs at authored loop approaches; entry/site/exit paths connected, E works, nine solid ridges and six new finite residents. Reports do not open signals/descent or defeat Soterrado.');
 // Return to base and deliver all reports through the actual NPC dialog.
 await p.evaluate(()=>window.__danteGame.scene.getScene('Game').transitionArea('base'));await ready();await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='base');await p.waitForTimeout(800);await clear();
 const before=await p.evaluate(()=>window.__danteGame.scene.getScene('Game').economy.credits);
 for(const [id,npc]of [['exp-valley','expedition'],['exp-arid','medic'],['exp-dunes','smith']]){
  const at=await p.evaluate(async npc=>{const c=(await import('/src/config/base.ts')).BASE.services.find(s=>s.id===npc);return{x:c.x+65,y:c.y+55}},npc);await position(at);await key('e');const select=p.locator('[data-mission-action=select-'+id+']');if(await select.count())await select.click();await p.locator('[data-mission-action=deliver]').click();await p.waitForTimeout(500);
 }
 const rewards=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();return{credits:s.economy.credits,receipts:s.missionRewards,completed:s.missions.snapshot().completed,saved:s.journey.load().missionRewards}});assert.equal(rewards.credits,before+210);assert.ok(['exp-valley','exp-arid','exp-dunes'].every(id=>rewards.receipts.includes(id)&&rewards.saved.includes(id)));
 await p.evaluate(()=>sessionStorage.setItem('echoes-of-dante.launch-once',window.__danteGame.scene.getScene('Game').journey.owner));await p.reload();await ready();await p.waitForTimeout(800);assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').economy.credits),rewards.credits);assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.hasDefeated(1981)));
 report.checks.push('Real NPC turn-in pays exactly 65+70+75 credits; all three mission receipts and new finite XP survive actual save validation and reload.');
 // Repeat at identical preview checkpoint to check disposal, not transient combat.
 report.stability=[];await preview('arid');
 for(let i=0;i<4;i++){if(i){await p.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await p.waitForTimeout(1400);await ready();}await position({x:470,y:805});const sample=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{objects:s.children.list.length,textures:Object.keys(s.textures.list).length,shutdown:s.events.listenerCount('shutdown'),resize:s.scale.listenerCount('resize'),ridges:s.children.list.filter(o=>o.name==='sirocco-trail-ridge').length}});if(i)report.stability.push(sample);}
 for(const c of report.stability){assert.equal(c.ridges,3);assert.equal(c.shutdown,report.stability[0].shutdown);assert.equal(c.resize,report.stability[0].resize)}assert.ok(Math.max(...report.stability.map(c=>c.textures))-Math.min(...report.stability.map(c=>c.textures))<=2);assert.ok(Math.max(...report.stability.map(c=>c.objects))-Math.min(...report.stability.map(c=>c.objects))<=8);
 // Real input movement, Dash, resolutions. Positions avoid native cover.
 await position({x:470,y:805});const start=await p.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position}));await p.keyboard.down('d');await key('Space');await p.keyboard.up('d');const end=await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position);assert.ok(Math.hypot(start.x-end.x,start.y-end.y)>30);
 for(const[width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(250);for(const selector of ['.mobile-vitals','.mission-tracker','.inventory-launcher']){const r=await p.locator(selector).boundingBox();assert.ok(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,selector+' within '+width)}await p.screenshot({path:out+'/layout-'+width+'.jpg',type:'jpeg',quality:84});}
 report.checks.push('Three measured restarts after warmup keep ridge/listener counts stable and dynamic objects bounded; movement/Dash and HUD at four resolutions pass.');
 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'real-sirocco-save-sentinel');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:84}).catch(()=>{});throw e}finally{await browser.close();await writeFile(out+'/browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
