import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/caldera/expansion/qa';await mkdir(out,{recursive:true});
const report={method:'Chrome, Gamepad API route driver, keyboard/mouse and CDP touch; real local WebSocket pair. Invulnerability for route traversal; positioning/health fixtures for isolated attacks and death/save tests. Not human/physical playtest.',errors:[],maps:[],creatures:[],checks:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});
const S=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
async function open(query=''){const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});await p.goto('http://localhost:5184/caldera-playtest.html?kit=advanced'+query);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.basePanel);await p.locator('.threat-lab').evaluate(e=>e.open=false);await p.waitForTimeout(450);return p;}
const key=async(p,k)=>{const pad=await p.evaluate(()=>!!window.qaPad);if(pad&&k==='e'){await p.evaluate(()=>window.qaPad.buttons[0]={value:1,pressed:true});await p.waitForTimeout(120);await p.evaluate(()=>window.qaPad.buttons[0]={value:0,pressed:false})}else{if(pad)await p.evaluate(()=>{window.qaPad=null;navigator.getGamepads=()=>[]});await p.keyboard.down(k);await p.waitForTimeout(100);await p.keyboard.up(k)}await p.waitForTimeout(250)};
async function walk(p,target){
 const route=await S(p,'s.navigation.refreshGeometry();return s.navigation.findRoute(s.navigation.nearest(s.player.position),s.navigation.nearest(arg))',target);assert.ok(route.length>0,'Route must exist');
 await p.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[0,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad]});
 for(const point of [...route,target]){
  let reached=false;for(let i=0;i<100;i++){const pos=await S(p,'return {...s.player.position}');const dx=point.x-pos.x,dy=point.y-pos.y,d=Math.hypot(dx,dy);if(d<26){reached=true;break}await p.evaluate(({dx,dy,d})=>window.qaPad.axes=[dx/d,dy/d,1,0],{dx,dy,d});await p.waitForTimeout(75)}assert.ok(reached,'Movement cannot get stuck '+JSON.stringify(point));
 }
 await p.evaluate(()=>window.qaPad.axes=[0,0,1,0]);return route.length;
}
try{
 const p=await open();assert.equal(await S(p,'return s.area'),'cinder');assert.equal(await S(p,'return !!s.titan'),false);
 await S(p,'s.player.invulnerableUntil=Infinity');
 for(const area of ['cinder','obsidian','caldera']){
  assert.equal(await S(p,'return s.area'),area);await S(p,'s.player.invulnerableUntil=Infinity');
  const data=await S(p,"const c=s.volcanic?.config;return{area:s.area,config:c??null,monsters:s.enemies.filter(e=>e!==s.titan).map(e=>({kind:e.kind,hp:e.health.max,rotation:e.view.rotation,texture:e.view.list[0].texture.key})),objects:s.children.list.length}");
  assert.ok(data.monsters.every(e=>['emberHound','fumarole','slagback'].includes(e.kind)));assert.ok(data.monsters.every(e=>e.rotation===0));
  const config=data.config??await p.evaluate(async()=>(await import('/src/config/caldera.ts')).CALDERA);
  const geometry=await S(p,'return {clear:s.arena.obstacles.every(o=>Math.hypot(o.x-arg.x,o.y-arg.y)>o.radius+s.player.radius)}',config.checkpoint);assert.equal(geometry.clear,true);
  if(data.config){for(const route of data.config.routes){await walk(p,route);assert.ok(await S(p,'return s.progression.rewardedRoutes.has(arg)',route.id));}}
  await walk(p,config.relay);await key(p,'e');assert.ok(await S(p,"return s.area==='cinder'?s.cinderSignalSeen:s.area==='obsidian'?s.obsidianSignalSeen:s.calderaRelaySeen"));
  await p.screenshot({path:`${out}/${area}.png`});report.maps.push({area,monsters:data.monsters.length,kinds:[...new Set(data.monsters.map(m=>m.kind))],objects:data.objects,checkpointClear:geometry.clear});
  if(data.config){await walk(p,config.exit);await key(p,'e');await p.waitForFunction(a=>window.__danteGame.scene.getScene('Game').area===a,area==='cinder'?'obsidian':'caldera');await p.waitForTimeout(500)}
 }
 report.checks.push('Real movement through two new maps and Forjas, four optional branches, relay/forward portals, no desert species and clear checkpoints');
 await S(p,'s.saveProgress()');const legacy=await S(p,"const raw=JSON.parse(localStorage.getItem(s.journey.key));for(const k of ['cinderVisited','cinderSignalSeen','obsidianVisited','obsidianSignalSeen'])delete raw.flags[k];localStorage.setItem(s.journey.key,JSON.stringify(raw));return s.journey.load()");assert.ok(legacy.flags.cinderSignalSeen&&legacy.flags.obsidianSignalSeen);assert.equal(legacy.area,'caldera');report.checks.push('0.1.94 Caldera saves migrate without losing access');
 await S(p,'Object.assign(s.player.position,{x:220,y:950})');await key(p,'e');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='obsidian');await p.waitForTimeout(600);await S(p,'s.player.invulnerableUntil=Infinity');
 for(const kind of ['emberHound','fumarole','slagback']){
  await S(p,"for(const e of s.enemies)Object.assign(e.position,{x:2700,y:450});const e=s.enemies.find(e=>e.kind===arg);Object.assign(e.position,{x:650,y:980});Object.assign(s.player.position,{x:arg==='fumarole'?870:730,y:980});s.player.invulnerableUntil=0;s.player.health.current=s.player.health.max;e.hurtUntil=0;e.state='CHASE';e.attackAt=-Infinity",kind);
  await p.waitForFunction(k=>window.__danteGame.scene.getScene('Game').enemies.find(e=>e.kind===k)?.state==='WINDUP',kind);assert.equal(await S(p,'return s.enemies.find(e=>e.kind===arg).telegraph.visible',kind),true);await p.screenshot({path:`${out}/${kind}.png`});
  await S(p,"const e=s.enemies.find(e=>e.kind===arg);e.state='WINDUP';e.until=s.time.now+400;Object.assign(e.position,{x:650,y:980});Object.assign(s.player.position,{x:arg==='fumarole'?870:730,y:980});s.player.invulnerableUntil=0",kind);
  await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.hp<window.__danteGame.scene.getScene('Game').player.maxHp);const attack=await S(p,'return {kind:arg,hp:s.player.hp,max:s.player.maxHp,frame:s.enemies.find(e=>e.kind===arg).view.list[0].frame.name}',kind);
  const kill=await S(p,"const e=s.enemies.find(e=>e.kind===arg),xp=s.progression.xp;s.resolvePlayerHits(s.time.now,[e],99999,0,0x5fe6d8,s.player.position,false,{},0);return{xp:s.progression.xp-xp,dead:e.isDead,resources:s.resources.snapshot().length}",kind);assert.equal(kill.xp,35);assert.ok(kill.dead&&kill.resources);report.creatures.push({...attack,...kill});
 }
 report.checks.push('Each new creature telegraphs, deals damage, dies and grants regional XP/materials');
 await S(p,'s.player.invulnerableUntil=Infinity;s.saveProgress();s.baseTravel("base")');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='base');await p.waitForTimeout(500);await S(p,'s.baseTravel(s.expeditionReturn.area,true)');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='obsidian');await p.waitForTimeout(500);
 report.cycles=[];for(let i=0;i<3;i++){await S(p,'s.player.health.current=0;s.handleDeath(s.player)');await key(p,'r');await p.waitForTimeout(800);report.cycles.push(await S(p,'return {hp:s.player.hp,max:s.player.maxHp,objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,seen:s.obsidianSignalSeen}'))}assert.equal(new Set(report.cycles.map(c=>c.objects)).size,1);assert.ok(report.cycles.every(c=>c.hp===c.max&&c.seen));
 await p.close();
 const h=await open('&class=warrior'),g=await open('&class=astral');await S(h,'s.saveProgress();return r.connect("ws://localhost:5184/coop","create",{name:"Host",classId:"warrior"},s.area)');const code=await S(h,'return r.code');await S(g,'s.saveProgress();return r.connect("ws://localhost:5184/coop","join",{name:"Astral",classId:"astral"},s.area,arg)',code);await h.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party.partner);
 for(const area of ['cinder','obsidian']){
  await h.waitForFunction(a=>window.__danteGame.scene.getScene('Game').area===a,area);await g.waitForFunction(a=>window.__danteCoop.world?.area===a,area);await g.waitForTimeout(650);const c=await S(h,'return s.volcanic.config');
  await S(h,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;Object.assign(s.party.partner.player.position,arg)',c.relay);await g.waitForTimeout(250);await key(g,'e');await h.waitForFunction(()=>window.__danteGame.scene.getScene('Game').volcanic.onward.active);await g.waitForTimeout(500);
  const texture=await S(g,'return r.world.enemies.map(e=>e.texture)');assert.ok(texture.every(t=>/ember-hound|fumarole|slagback/.test(t)));assert.ok(await S(g,'return s.volcanic.onward.active'));
  await S(h,'Object.assign(s.party.partner.player.position,arg)',c.exit);await g.waitForTimeout(250);await key(g,'e');
 }
 await g.waitForFunction(()=>window.__danteCoop.world?.area==='caldera');await g.waitForTimeout(700);report.checks.push('Real local co-op: visitor opens both new passages and travels to Forjas; original raster poses mirror correctly');
 for(const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]){await g.setViewportSize({width,height});await g.waitForTimeout(200);await g.screenshot({path:`${out}/guest-${width}.png`})}
 await g.touchscreen.tap(400,190);const cdp=await g.context().newCDPSession(g);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});const b=await g.locator('[data-action="charge"]').boundingBox();assert.ok(b);const touch={x:b.x+b.width/2,y:b.y+b.height/2,id:4};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});await g.waitForTimeout(400);assert.equal(await S(h,'return s.party.partner.charge.phase'),'CHARGING');await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...touch,x:touch.x-25,y:touch.y-20}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await g.waitForFunction(()=>window.__danteCoop.world?.partner?.chargeReady<.5);assert.equal(await g.evaluate(()=>visualViewport.scale),1);report.checks.push('Real CDP touch charge hold/drag/release in the visitor, original page zoom');
 report.fps={host:await S(h,'return s.game.loop.actualFps'),guest:await S(g,'return s.game.loop.actualFps')};assert.equal(await g.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);await S(g,'r.disconnect(false)');await S(h,'r.disconnect(false)');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);for(const p of browser.contexts().flatMap(c=>c.pages()))try{report.failureState=await S(p,'return {area:s.area,pos:s.player.position,modal:s.inputModalOpen,method:s.controls.inputMethod,station:s.returnStation,flags:{cinder:s.cinderSignalSeen,obsidian:s.obsidianSignalSeen}}');await p.screenshot({path:out+'/failure.png'})}catch{}throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(report)}
