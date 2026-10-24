import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',arc=process.env.QA_ARC??'sirocco',out=process.env.QA_OUT??`docs/route-identity/${arc}/qa`;
const areas={sirocco:['valley','arid','dunes','sandpit'],boreal:['frost','icecave','icenest'],embers:['cinder','obsidian','caldera']}[arc];
await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling']}),p=await b.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(90000);
const report={arc,method:'Chrome DEV, isolated direct visual fixtures and real keyboard movement. Geometry comparison to 0.1.142 and canonical survey approaches; boss attacks invoked explicitly for visual verification. Mission inputs are checked separately in the cooperative campaign. Not human balance/duration or physical devices.',errors:[],regions:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.scene.isActive()&&s.hud&&s.navigation&&!s.transitioning});
const geom=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.navigation.refreshGeometry();return{bounds:s.movementBounds,obstacles:s.arena.obstacles.map(o=>({x:o.x,y:o.y,radius:o.radius})),objects:s.children.list.length,textures:s.textures.getTextureKeys().length,shutdown:s.events.listenerCount('shutdown'),resize:s.scale.listenerCount('resize'),ground:s.children.list.filter(o=>o.getData?.('route-identity')).map(o=>({key:o.texture.key,width:o.displayWidth,height:o.displayHeight,flip:o.flipX})),boss:s.soterrado?.isDead??s.vesper?.isDead??s.titan?.isDead}});
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','route-real-save-sentinel'));
 for(const area of areas){
  console.log('Region',area);
  await p.goto(base+`/world-finish-playtest.html?area=${area}&trails=previous`);await ready();await p.waitForTimeout(500);const previous=await geom();
  await p.screenshot({path:out+'/'+area+'-previous.jpg',type:'jpeg',quality:85});
  await p.goto(base+`/world-finish-playtest.html?area=${area}&trails=1`);await ready();await p.waitForTimeout(700);
  const config=await p.evaluate(async area=>(await import('/src/config/routeIdentity.ts')).ROUTE_IDENTITY[area],area),current=await geom();
  assert.deepEqual(current.bounds,previous.bounds);assert.equal(current.ground.length,1);assert.equal(current.ground[0].key,'route-floor-'+area);assert.equal(current.ground[0].flip,false);
  const oldSet=current.obstacles.filter(o=>!config.solids.some(s=>s.x===o.x&&s.y===o.y&&s.radius===o.radius));assert.deepEqual(oldSet,previous.obstacles,'Only documented terrain cores alter collision');
  const region={area,ground:current.ground,addedSolids:config.solids.length,sites:[],bossAlive:current.boss===false};
  if(['sandpit','icenest','caldera'].includes(area))assert.equal(current.boss,false);
  for(const [i,spot]of config.spots.entries()){
   await p.evaluate(point=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,point),spot);await p.waitForTimeout(500);await p.screenshot({path:out+`/${area}-${i}.jpg`,type:'jpeg',quality:85});
  }
  const routes=await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{REGIONAL_SITES}=await import('/src/config/regionalExpeditions.ts'),{safeExpeditionPosition}=await import('/src/systems/ExpeditionReturn.ts');s.navigation.refreshGeometry();const start=s.navigation.nearest(s.glacierPlaytest.environmentEntry);return REGIONAL_SITES.filter(t=>t.area===s.area).map(authored=>{const t=safeExpeditionPosition(authored,24,s.arena.obstacles,s.movementBounds);if(!t)return{id:authored.id,steps:0,gap:Infinity};const path=s.navigation.findRoute(start,s.navigation.nearest(t)),last=path.at(-1);return{id:authored.id,steps:path.length,gap:last?Math.hypot(last.x-t.x,last.y-t.y):Infinity}})});
  for(const r of routes){assert.ok(r.steps>0,r.id+' connected');assert.ok(r.gap<100,r.id+' reachable');}region.routes=routes;
  const cycles=[];for(let i=0;i<4;i++){
   await p.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await p.waitForTimeout(1800);await ready();const sample=await geom();
   const keys=await p.evaluate(()=>window.__danteGame.textures.getTextureKeys());
   console.log('Cycle',area,i,sample.objects,sample.textures);
   if(i)cycles.push({...sample,textureKeys:keys}); // First restart warms lazy projectile/pose caches.
  }
  for(const c of cycles)for(const key of ['shutdown','resize'])assert.equal(c[key],cycles[0][key],area+' stable '+key);
  for(const c of cycles)assert.deepEqual(c.textureKeys.filter(k=>k.startsWith('route-floor-')).sort(),cycles[0].textureKeys.filter(k=>k.startsWith('route-floor-')).sort(),area+' stable scenery textures');
  // Complete-actor pose canvases and live attack RenderTextures are lazy and
  // ephemeral; they can differ by one pose/attack at these sampling instants.
  assert.ok(Math.max(...cycles.map(c=>c.textures))-Math.min(...cycles.map(c=>c.textures))<=2,area+' bounded dynamic textures');
  // Live enemy tells/projectiles can add a few transient objects between frames.
  // Texture/listener counts are exact; scene population must remain bounded.
  assert.ok(Math.max(...cycles.map(c=>c.objects))-Math.min(...cycles.map(c=>c.objects))<=8,area+' bounded transient objects');
  region.stability=cycles.map(({objects,textures,shutdown,resize})=>({objects,textures,shutdown,resize}));
  await p.waitForTimeout(3000);region.fps=await p.evaluate(async()=>{const samples=[];for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,200));samples.push(window.__danteGame.loop.actualFps)}return samples.reduce((a,b)=>a+b)/samples.length});
  // Movement and Dash retain normal input; the paintings do not eat touch/keys.
  const before=await p.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position}));await p.keyboard.down('s');await p.keyboard.press('Space',{delay:100});await p.waitForTimeout(180);await p.keyboard.up('s');
  const after=await p.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position}));assert.ok(Math.hypot(before.x-after.x,before.y-after.y)>10);
  if(['sandpit','icenest','caldera'].includes(area)){
   await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),boss=s.soterrado??s.vesper??s.titan;Object.assign(s.player.position,boss.position);s.player.position.x-=180;s.player.invulnerableUntil=Infinity;boss.beginIntro(s.time.now)});await p.waitForTimeout(3000);
   const attacks={sandpit:['sweep','rush','burrow','fissure'],icenest:['breath','tail','rush','eruption'],caldera:['cleave','slam','fissure','boulders']}[area];
   for(const attack of attacks){await p.evaluate(a=>{const s=window.__danteGame.scene.getScene('Game'),boss=s.soterrado??s.vesper??s.titan;boss.beginAttack(s.time.now,a,s.player.position,s.arena.obstacles)},attack);await p.waitForTimeout(180);await p.screenshot({path:out+`/${area}-tell-${attack}.jpg`,type:'jpeg',quality:85});await p.waitForTimeout(4300);}
   region.attacks=attacks;
  }
  report.regions.push(region);
 }
 for(const[width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(200);await p.screenshot({path:out+'/layout-'+width+'.jpg',type:'jpeg',quality:85});
  for(const selector of ['.mobile-vitals','.inventory-launcher']){const r=await p.locator(selector).boundingBox();assert.ok(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1);}
 }
 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'route-real-save-sentinel');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/routes.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
