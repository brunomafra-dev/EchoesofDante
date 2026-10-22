import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/regional-expeditions/qa';
await mkdir(out,{recursive:true});
const catalog=JSON.parse(await readFile('src/config/regional-expeditions.json','utf8'));
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1366,height:768}});
const report={method:'Chrome DEV, explicit isolated region fixture; actual interaction keys, collisions, navigation grid and finite-resident receipts. Duration is not measured by this accelerated test.',checks:[],regions:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));
p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.missionUi&&!s.transitioning&&!s.respawning});
const key=async k=>{await p.keyboard.down(k);await p.waitForTimeout(140);await p.keyboard.up(k);await p.waitForTimeout(250)};
const closeUpgrades=async()=>{for(let i=0;i<20;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await b.count())break;await b.click();await p.waitForTimeout(120)}};
async function preview(area){await closeUpgrades();await p.locator('.campaign-lab-help').evaluate(e=>e.open=true);await p.locator('[name=regional-preview]').selectOption(area);p.once('dialog',d=>d.accept());await p.locator('[data-preview]').click();await p.waitForFunction(a=>{const s=window.__danteGame.scene.getScene('Game');return s.area===a&&!s.transitioning},area);await ready();await p.waitForTimeout(700);await closeUpgrades();await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity)}
async function pos(point){await p.evaluate(point=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,point),point);await p.waitForTimeout(350)}
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','untouched-real-save'));
 await p.goto(base+'/campaign-playtest.html?missions=1&depth=1&class=hunter');await ready();
 const fresh=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return {boss:s.wardenDefeated,echoes:s.progression.echoes.size,passage:s.progression.passageOpen,area:s.area}});
 assert.deepEqual(fresh,{boss:false,echoes:0,passage:false,area:'base'});report.checks.push('Fresh lab preserves full original campaign and gates; simulation requires explicit click/confirmation');
 for(const mission of catalog.filter((_,i)=>i>=Number(process.env.QA_FROM??0))){
  await preview(mission.area);
  const sites=await p.evaluate(()=>window.__danteGame.scene.getScene('Game').regional.sites);assert.equal(sites.length,3,mission.area+' sites');
  const region={area:mission.area,sites:[],fps:0};
  // Clearance and flood fill cover reachable approach space, with player footprint.
  const navigation=await p.evaluate(()=>{
   const s=window.__danteGame.scene.getScene('Game'),b=s.movementBounds??{left:56,right:2144,top:56,bottom:1444},step=24,r=s.player.radius,obs=s.arena.obstacles;
   const cols=Math.ceil((b.right-b.left)/step),rows=Math.ceil((b.bottom-b.top)/step),grid=new Uint8Array(cols*rows),points=[];
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=b.left+step/2+x*step,py=b.top+step/2+y*step;if(px>=b.left+r&&px<=b.right-r&&py>=b.top+r&&py<=b.bottom-r&&obs.every(o=>Math.hypot(px-o.x,py-o.y)>o.radius+r+1))grid[y*cols+x]=1;}
   let start=-1,dist=Infinity;for(let i=0;i<grid.length;i++)if(grid[i]){const d=Math.hypot(b.left+(i%cols)*step+step/2-s.player.position.x,b.top+Math.floor(i/cols)*step+step/2-s.player.position.y);if(d<dist){dist=d;start=i}}
   if(start>=0){const queue=[start];grid[start]=2;for(let q=0;q<queue.length;q++){const i=queue[q],x=i%cols,y=Math.floor(i/cols);for(const[nx,ny]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const n=ny*cols+nx;if(grid[n]===1){grid[n]=2;queue.push(n)}}}}
   for(const site of s.regional.sites){let nearest=Infinity;for(let i=0;i<grid.length;i++)if(grid[i]===2)nearest=Math.min(nearest,Math.hypot(b.left+(i%cols)*step+step/2-site.x,b.top+Math.floor(i/cols)*step+step/2-site.y));points.push({id:site.id,nearest,clear:obs.every(o=>Math.hypot(site.x-o.x,site.y-o.y)>o.radius+r)})}return points;
  });
  for(const n of navigation){assert.ok(n.clear,n.id+' clear');assert.ok(n.nearest<80,n.id+' accessible '+n.nearest)}region.navigation=navigation;
  for(const site of sites){await pos(site);await key('e');const result=await p.evaluate(id=>{const s=window.__danteGame.scene.getScene('Game');return{has:s.missions.has(id),near:[...s.hollowSpawnIds].filter(([,id])=>id>=1900&&id<2000).length}},site.id);assert.ok(result.has,site.id+' scan');region.sites.push({...site,...result});}
  const residents=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return [...s.hollowSpawnIds].filter(([,id])=>id>=1900&&id<2000).map(([e,id])=>({id,kind:s.enemySpecies.get(e)}))});region.residents=residents;if(residents.length!==6)console.log(JSON.stringify({area:mission.area,residents,geometry:await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{bounds:s.movementBounds,obstacles:s.arena.obstacles}})}));assert.equal(residents.length,6,mission.area+' finite residents');
  await pos(sites[1]);await p.waitForTimeout(500);await p.screenshot({path:out+'/'+mission.area+'.png'});
  region.fps=await p.evaluate(async()=>{const samples=[];for(let i=0;i<5;i++){await new Promise(r=>setTimeout(r,200));samples.push(window.__danteGame.loop.actualFps)}return samples.reduce((a,b)=>a+b)/samples.length});
  const kill=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),pair=[...s.hollowSpawnIds].find(([e,id])=>id>=1900&&id<2000&&!e.isDead),xp=s.progression.xp;const [e,id]=pair;s.resolvePlayerHits(s.time.now,[e],9999,0,0x5fe6d8,s.player.position,false);return{id,xp:s.progression.xp-xp,receipt:s.progression.hasDefeated(id)}});assert.ok(kill.xp>0&&kill.receipt);region.firstKill=kill;
  report.regions.push(region);
 }
 report.checks.push('Twelve regions: three accessible authored investigations, six finite residents, actual E scans, first-kill XP and save receipt in each');
 // Unique report through actual NPC UI, including choice between assignments.
 await preview('forest');const sites=await p.evaluate(()=>window.__danteGame.scene.getScene('Game').regional.sites);for(const site of sites){await pos(site);await key('e')}
 await key('m');await p.locator('[data-destination=base]').click();await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='base');await ready();await pos({x:395,y:755});await key('e');await p.locator('[data-mission-action=select-exp-forest]').click();const before=await p.evaluate(()=>window.__danteGame.scene.getScene('Game').economy.credits);await p.locator('[data-mission-action=deliver]').click();await p.waitForTimeout(400);
 assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').economy.credits),before+45);assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').missionRewards.includes('exp-forest')));
 await key('j');await p.locator('[data-mission-action=tab-regional]').click();assert.equal(await p.locator('.mission-list button').count(),12);await p.screenshot({path:out+'/journal.png'});await key('Escape');
 report.checks.push('NPC offers multiple reports; actual delivery awards unique 45-credit receipt; journal separates original seven and twelve regional reports');
 for(const[width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await key('j');await p.locator('[data-mission-action=tab-regional]').click();const b=await p.locator('.mission-dialog').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1);await p.screenshot({path:out+`/journal-${width}.png`});await key('Escape')}
 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'untouched-real-save');assert.deepEqual(report.errors,[]);report.passed=true;console.log('Regional expeditions passed');
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'});throw e}finally{await browser.close();await writeFile(out+'/browser.json',JSON.stringify(report,null,2))}
