import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/astral/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Chrome headless; real keyboard/mouse and local WebSocket pair; DEV fixture positioning and damage. Touch CDP and Gamepad API mock. No physical devices.',errors:[],checks:[],views:[]};
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const scene=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
const key=async(p,k,ms=100)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(150)};
const check=name=>{report.checks.push(name);console.log(name)};
async function upgrades(p){await p.waitForTimeout(300);for(let i=0;i<15;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();await p.waitForTimeout(150)}}
async function navigate(p,url){await p.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await ready(p);await p.locator('.threat-lab').evaluate(e=>e.open=false);await upgrades(p);assert.ok(await scene(p,'return !s.scene.isPaused()'));}
async function page(url){const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});await navigate(p,url);return p;}
try{
 let p=await page('http://localhost:5184/astral-playtest.html?region=forest&kit=basic');
 report.core=await p.evaluate(async()=>{
  const {AstralCombat}=await import('/src/combat/AstralCombat.ts'),{Health}=await import('/src/combat/Health.ts');
  const s=window.__danteGame.scene.getScene('Game'),a=new AstralCombat(s,()=>0),bounds={left:-1000,right:2000,top:-1000,bottom:2000};
  const mob=(x,y,radius=18)=>({position:{x,y},radius,health:new Health(500),isDead:false,hurt(){},die(){}});
  const hit=(e,d)=>e.health.damage(d),results=[];
  for(const element of ['energy','fire','water','earth']){
   a.clear();a.energy=100;a.element=element;const e=mob(380,0),boss=mob(385,10,60);
   a.cast(0,{x:0,y:0},0,1);for(let i=0;i<25;i++)a.update(i*100,.1,[e,boss],[],bounds,hit);
   results.push({element,damage:500-e.health.current,bossDamage:500-boss.health.current,bossScale:a.movementScale(boss,100),energy:a.energy});
  }
  a.clear();a.element='water';a.energy=100;const water=mob(380,0);a.cast(3000,{x:0,y:0},0,1);a.update(3000,.04,[water],[],bounds,hit);const slow=a.movementScale(water,3000);
  a.clear();a.element='earth';a.energy=100;const earth=mob(380,0);let force=0;const earthHit=(e,d,angle,heavy,element,origin,push)=>{hit(e,d);force=push};a.cast(4000,{x:0,y:0},0,1);a.update(4000,.04,[earth],[],bounds,earthHit);const beforeRise=earth.health.current;a.update(4200,.2,[earth],[],bounds,earthHit);const interrupt=a.movementScale(earth,4200),expired=a.movementScale(earth,4400);
  a.clear();a.energy=10;const shot=mob(100,0);a.fire(5000,{x:0,y:0},0);a.update(5000,.2,[shot],[],bounds,hit);const energyAfterHit=a.energy;
  a.clear();a.energy=100;a.element='energy';const covered=mob(380,0);a.cast(6000,{x:0,y:0},0,1);a.update(6000,.04,[covered],[{x:180,y:0,radius:60}],bounds,hit);const coveredHp=covered.health.current;
  a.energy=0;const rejected=a.cast(7000,{x:0,y:0},0,1);a.clear();const empty=a.snapshot();a.destroy();
  return{results,slow,interrupt,expired,force,beforeRise,energyAfterHit,coveredHp,rejected,empty};
 });
 assert.equal(report.core.results[0].damage,86);assert.ok(report.core.results[1].damage>34);assert.equal(report.core.slow,.55);assert.equal(report.core.interrupt,1);assert.equal(report.core.force,420);assert.equal(report.core.beforeRise,500);assert.equal(report.core.expired,1);assert.ok(report.core.results.every(r=>r.bossScale===1));assert.ok(report.core.energyAfterHit>=20);assert.equal(report.core.coveredHp,500);assert.equal(report.core.rejected,false);assert.equal(report.core.empty.zones.length,0);check('Four distinct elemental responses, resource, boss control resistance, cover and pooled cleanup');
 await scene(p,'s.player.invulnerableUntil=Infinity');
 const initial=await scene(p,'return {...s.player.position}');await key(p,'d',250);assert.ok(await scene(p,'return s.player.position.x>arg.x+20',initial));await key(p,'Space');assert.ok(await scene(p,'return s.player.dashProgress<.8'));await p.waitForTimeout(400);
 await key(p,'f');assert.equal(await scene(p,'return s.astral.element'),'fire');
 await p.keyboard.down('q');await p.waitForTimeout(450);assert.equal(await scene(p,'return s.charge.phase'),'CHARGING');const held=await scene(p,'return {...s.player.position}');await key(p,'d',180);assert.ok(await scene(p,'return Math.hypot(s.player.position.x-arg.x,s.player.position.y-arg.y)<1',held));await key(p,'f');assert.equal(await scene(p,'return s.astral.element'),'fire');await p.keyboard.up('q');await p.waitForTimeout(130);assert.ok(await scene(p,'return s.astral.energy<75&&s.astral.snapshot().zones[0]?.element==="fire"'));check('Keyboard movement, Dash, element lock during hold and directional Q release');
 await p.waitForTimeout(3400);const energy=await scene(p,'return s.astral.energy');await p.keyboard.down('q');await p.waitForTimeout(200);await p.keyboard.press('Escape');await p.keyboard.up('q');await p.waitForTimeout(200);assert.equal(await scene(p,'return s.charge.phase'),'READY');assert.ok(await scene(p,'return s.astral.energy>=arg',energy));await p.keyboard.press('Escape');await p.waitForTimeout(350);check('Cancelling charge through menu does not spend energy');
 for(const sex of ['male','female'])for(const kit of ['initial','basic','advanced']){
  await navigate(p,`http://localhost:5184/astral-playtest.html?region=forest&sex=${sex}&kit=${kit}`);
  for(const aim of [Math.PI/2,-Math.PI/2,0]){await scene(p,'s.controls.aimFrom=()=>arg;s.controls.movement=()=>({x:0,y:0})',aim);await p.waitForTimeout(80);assert.ok(await scene(p,'return s.astralArt.body.frame.name!==undefined&&s.astralArt.body.displayWidth===128'));}
  await p.screenshot({path:`${out}/${sex}-${kit}.png`});
 }
 check('Both presentations, three clothing tiers, upright front/back/side and gauntlet textures');
 await navigate(p,'http://localhost:5184/astral-playtest.html?region=warden&kit=basic');
 let g=await page('http://localhost:5184/astral-playtest.html?region=forest&class=hunter&kit=basic');
 await scene(p,"s.saveProgress();return r.connect('ws://localhost:5184/coop','create',{name:'Astral Host',classId:'astral',sex:'male'},s.area)");const code=await scene(p,'return r.code');await scene(g,"s.saveProgress();return r.connect('ws://localhost:5184/coop','join',{name:'Hunter Guest',classId:'hunter'},s.area,arg)",code);
 await p.waitForFunction(()=>!!window.__danteGame.scene.getScene('Game').party?.partner);await g.waitForFunction(()=>!!window.__danteGame.scene.getScene('Game').party?.mirrorHost);await upgrades(p);await upgrades(g);
 assert.ok(await scene(g,'return s.party.mirrorHost.astral!==undefined'));await key(p,'f');await g.waitForTimeout(250);assert.equal(await scene(g,'return r.world.host.astral.element'),'fire');await p.keyboard.down('q');await p.waitForTimeout(420);await p.keyboard.up('q');await g.waitForFunction(()=>window.__danteCoop.world?.host?.astral?.zones?.some(z=>z.element==='fire'));assert.equal(await scene(g,'return s.party.mirrorHost.astral.formViews[0].texture.key'),'astral-fire-field');check('Astral host renders on Hunter visitor with authoritative resource and illustrated fire field');
 await scene(g,'r.disconnect(false)');await scene(p,'r.disconnect(false)');await g.close();await p.close();
 g=await page('http://localhost:5184/astral-playtest.html?region=forest&class=astral&sex=female&kit=advanced');
 p=await page('http://localhost:5184/astral-playtest.html?region=forest&class=warrior&kit=basic');
 await scene(p,"s.saveProgress();return r.connect('ws://localhost:5184/coop','create',{name:'Warrior Host',classId:'warrior'},s.area)");const room=await scene(p,'return r.code');await scene(g,"s.saveProgress();return r.connect('ws://localhost:5184/coop','join',{name:'Astral Guest',classId:'astral',sex:'female'},s.area,arg)",room);
 await g.waitForFunction(()=>!!window.__danteGame.scene.getScene('Game').party?.mirrorHost).catch(async e=>{report.connection=await scene(g,'return {role:r.role,code:r.code,peer:r.peer,error:r.error,area:s.area,paused:s.scene.isPaused(),world:!!r.world}');throw e});await upgrades(p);await upgrades(g);await scene(p,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity');
 await key(g,'f');await p.waitForTimeout(250);assert.equal(await scene(p,'return s.party.partner.astral.element'),'fire');await g.mouse.move(600,360);await g.mouse.down();await g.waitForFunction(()=>window.__danteCoop.world?.partner?.astral?.shots?.some(s=>s.element==='fire'));await g.mouse.up();assert.equal(await scene(g,'return s.astral.shotViews.find(v=>v.visible).texture.key'),'astral-fire-bolt');await g.keyboard.down('q');await p.waitForTimeout(450);assert.equal(await scene(p,'return s.party.partner.charge.phase'),'CHARGING');await g.keyboard.up('q');await g.waitForTimeout(200);assert.ok(await scene(g,'return r.world.partner.astral.energy<75'));assert.equal(await scene(g,'return s.astral.formViews[0].texture.key'),'astral-fire-field');check('Astral visitor elemental basic and illustrated Q are authoritative through the real relay');
 const metrics=[];for(let i=0;i<3;i++){await scene(p,'s.player.health.current=0;s.handleDeath(s.player);s.party.partner.player.health.current=0;s.handleDeath(s.party.partner.player);s.restart()');await p.waitForTimeout(850);await ready(p);await g.waitForTimeout(600);await upgrades(p);await upgrades(g);metrics.push(await scene(p,'return {objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,credits:s.economy.credits}'));}report.cycles=metrics;assert.equal(metrics[0].objects,metrics[2].objects);assert.equal(metrics[0].textures,metrics[2].textures);check('Coop mortality/respawn preserves builds and does not accumulate objects/textures');
 await scene(p,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;Object.assign(s.party.partner.player.position,{x:1000,y:1050})');await g.waitForTimeout(400);
 await scene(g,'window.qaPad={mapping:"standard",connected:true,axes:[0,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad]');
 const pad=async(n,ms=120)=>{await g.evaluate(n=>window.qaPad.buttons[n].value=1,n);await g.waitForTimeout(ms);await g.evaluate(n=>window.qaPad.buttons[n].value=0,n);await g.waitForTimeout(180)};
 const element=await scene(p,'return s.party.partner.astral.element');await pad(3);assert.notEqual(await scene(p,'return s.party.partner.astral.element'),element);
 await g.evaluate(()=>window.qaPad.axes[0]=1);await g.waitForTimeout(250);await pad(5);await g.evaluate(()=>window.qaPad.axes[0]=0);assert.ok(await scene(g,'return r.world.partner.dashReady<.6'));
 await pad(6,450);assert.ok(await scene(g,'return r.world.partner.chargeReady<.4'));check('Astral visitor Gamepad API mock: movement, Dash, Y element and LT hold/release');
 await g.waitForTimeout(3400);await g.evaluate(()=>window.qaPad.connected=false);await g.setViewportSize({width:844,height:390});await g.touchscreen.tap(420,195);await g.waitForTimeout(200);
 const cdp=await g.context().newCDPSession(g);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const point=async selector=>{const b=await g.locator(selector).boundingBox();assert.ok(b);return{x:b.x+b.width/2,y:b.y+b.height/2}};
 const m=await point('.touch-move'),a=await point('[data-action="charge"]');const touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 await touch('touchStart',[{...m,id:1}]);await touch('touchMove',[{x:m.x+38,y:m.y,id:1}]);await g.waitForTimeout(200);
 await touch('touchStart',[{x:m.x+38,y:m.y,id:1},{...a,id:2}]);await touch('touchMove',[{x:m.x+38,y:m.y,id:1},{x:a.x-35,y:a.y-35,id:2}]);await g.waitForTimeout(400);
 assert.equal(await scene(p,'return s.party.partner.charge.phase'),'CHARGING');assert.equal(await scene(p,'return Math.hypot(s.party.partner.player.velocity.x,s.party.partner.player.velocity.y)'),0);
 await touch('touchEnd',[]);await g.waitForFunction(()=>window.__danteCoop.world?.partner?.chargeReady<.4);
 await g.waitForTimeout(400);await g.locator('[data-action="attack"]').tap();await g.locator('[data-action="dash"]').tap();await g.waitForTimeout(220);assert.ok(await scene(g,'return r.world.partner.dashReady<.6'));
 const touchElement=await scene(p,'return s.party.partner.astral.element');await g.locator('.astral-panel').tap();await g.waitForTimeout(220);assert.notEqual(await scene(p,'return s.party.partner.astral.element'),touchElement);assert.equal(await g.evaluate(()=>visualViewport.scale),1);
 check('Astral visitor CDP touch: movement, hold/drag/release, no movement while charging, attack, Dash and element button');
 for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await g.setViewportSize({width,height});await g.waitForTimeout(200);assert.equal(await g.locator('.astral-panel').count(),1);assert.equal(await g.locator('canvas').count(),1);await g.screenshot({path:`${out}/guest-${width}.png`});report.views.push({width,height});}
 report.fps={host:await scene(p,'return s.game.loop.actualFps'),guest:await scene(g,'return s.game.loop.actualFps')};
 assert.equal(await g.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);assert.deepEqual(report.errors,[]);report.passed=true;
 await scene(p,'r.disconnect()');
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/astral.json',JSON.stringify(report,null,2));}
console.log('Astral QA passed');
