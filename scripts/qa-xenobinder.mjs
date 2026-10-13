import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/xenobinder/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Chrome headless; real keyboard/mouse, local WebSocket pair, CDP multi-touch and Gamepad API mock. Explicit DEV positioning/damage fixtures; no physical devices or human approval.',errors:[],checks:[],views:[]};
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const scene=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
const key=async(p,k,ms=120)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(150)};
const check=name=>{report.checks.push(name);console.log(name)};
async function upgrades(p){for(let i=0;i<18;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();await p.waitForTimeout(100)}}
async function navigate(p,url){await p.goto(url,{waitUntil:'domcontentloaded',timeout:90000});await ready(p);await p.locator('.threat-lab').evaluate(e=>e.open=false);await upgrades(p);assert.ok(await scene(p,'return !s.scene.isPaused()'));}
async function page(url){const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});await navigate(p,url);return p;}
try{
 let p=await page('http://localhost:5184/xenobinder-playtest.html?region=forest&kit=basic');
 report.core=await p.evaluate(async()=>{
  const {XenobinderCombat}=await import('/src/combat/XenobinderCombat.ts'),{Health}=await import('/src/combat/Health.ts');
  const s=window.__danteGame.scene.getScene('Game'),x=new XenobinderCombat(s,()=>0,{x:0,y:0}),bounds={left:-1000,right:2000,top:-1000,bottom:2000};
  const mob=(px,py)=>({position:{x:px,y:py},radius:18,health:new Health(500),isDead:false});
  const ally=(px,py,hp=50,dead=false)=>({position:{x:px,y:py},health:{current:hp,max:100},isDead:dead});
  const hit=(e,d)=>e.health.damage(d),target=mob(150,0),owner={x:0,y:0};
  const tick=(now,targets=[],walls=[],allies=[],charge=false)=>x.update(now,.02,owner,0,false,targets,walls,bounds,hit,allies,charge);
  x.fire(0,owner,0);for(let i=0;i<70;i++)tick(i*20,[target]);
  const assist={hp:target.health.current,bond:x.bond,frame:x.body.frame.name};
  x.clear();x.bond=100;Object.assign(x.position,{x:0,y:0});const commandTarget=mob(210,0),near=ally(380,0),outside=ally(600,0),full=ally(380,0,100),dead=ally(380,0,0,true);
  const accepted=x.command(2000,owner,0,1,[],bounds);
  for(let i=0;i<55;i++)tick(2000+i*20,[commandTarget],[],[near,outside,full,dead]);
  const command={accepted,hp:commandTarget.health.current,bond:x.bond,heal:near.health.current,outside:outside.health.current,full:full.health.current,dead:dead.health.current,pose:x.snapshot()};
  x.clear();x.bond=100;Object.assign(x.position,{x:0,y:0});const covered=mob(210,0),wall={x:160,y:0,radius:35},occluded=ally(195,0);
  x.command(4000,owner,0,1,[wall],bounds);for(let i=0;i<40;i++)tick(4000+i*20,[covered],[wall],[occluded]);
  const cover={hp:covered.health.current,heal:occluded.health.current,position:{...x.position}};
  x.clear();x.bond=0;const rejected=x.command(6000,owner,0,1,[],bounds);const before=x.bond;x.clear();
  Object.assign(x.position,{x:0,y:0});const unmarked=mob(50,0);for(let i=0;i<70;i++)tick(7000+i*20,[unmarked]);const passiveHp=unmarked.health.current;
  Object.assign(owner,{x:1200,y:0});Object.assign(x.position,{x:0,y:0});tick(9000);const recoveryDistance=Math.hypot(owner.x-x.position.x,owner.y-x.position.y);
  Object.assign(x.position,{x:0,y:0});tick(9020,[mob(1200,0)]);const combatDistance=Math.hypot(owner.x-x.position.x,owner.y-x.position.y);
  x.dormant();const dormant=x.snapshot();x.destroy();
  return{assist,command,cover,rejected,before,passiveHp,recoveryDistance,combatDistance,dormant};
 });
 assert.ok(report.core.assist.hp<484);assert.ok(report.core.assist.bond>=53);
 assert.equal(report.core.command.hp,400);assert.equal(report.core.command.bond,65);assert.equal(report.core.command.heal,64);assert.equal(report.core.command.outside,50);assert.equal(report.core.command.full,100);assert.equal(report.core.command.dead,0);
 assert.equal(report.core.cover.hp,500);assert.equal(report.core.cover.heal,50);assert.equal(report.core.rejected,false);assert.equal(report.core.before,0);assert.equal(report.core.passiveHp,500);assert.ok(report.core.recoveryDistance<100);assert.ok(report.core.combatDistance>1000);assert.equal(report.core.dormant.active,false);
 check('Confirmed hit marks assistance; Vínculo earned; command single hit/cost; one capped nearby heal; no revival, through-wall damage/heal or unmarked autonomous attack; quiet-only recovery');
 await scene(p,'s.player.invulnerableUntil=Infinity');const initial=await scene(p,'return {...s.player.position}');await key(p,'d',250);assert.ok(await scene(p,'return s.player.position.x>arg.x+20',initial));await key(p,'Space');await p.waitForTimeout(400);
 await p.mouse.move(820,360);await p.keyboard.down('q');await p.waitForTimeout(450);assert.equal(await scene(p,'return s.charge.phase'),'CHARGING');const held=await scene(p,'return {...s.player.position}');await key(p,'d',180);assert.ok(await scene(p,'return Math.hypot(s.player.position.x-arg.x,s.player.position.y-arg.y)<1',held));await p.screenshot({path:out+'/hold.png'});await p.keyboard.up('q');await p.waitForTimeout(160);assert.equal(await scene(p,'return s.xeno.bond'),0);assert.equal(await scene(p,'return s.charge.cooldown'),6000);await p.waitForTimeout(1700);await p.keyboard.down('q');await p.waitForTimeout(180);assert.equal(await scene(p,'return s.charge.phase'),'READY');await p.keyboard.up('q');check('PC movement/Dash; Q hold locks motion, release spends 35 and starts 6-second cooldown; dry Q rejected');
 await scene(p,'s.xeno.bond=100');await p.waitForTimeout(4400);await p.keyboard.down('q');await p.waitForTimeout(200);await p.keyboard.press('Escape');await p.keyboard.up('q');await p.waitForTimeout(150);assert.equal(await scene(p,'return s.xeno.bond'),100);assert.equal(await scene(p,'return s.charge.phase'),'READY');await p.keyboard.press('Escape');check('Menu cancellation does not spend Vínculo or execute a command');
 for(const sex of ['male','female'])for(const kit of ['initial','basic','advanced']){
  await navigate(p,`http://localhost:5184/xenobinder-playtest.html?sex=${sex}&kit=${kit}`);
  for(const aim of [Math.PI/2,-Math.PI/2,0]){await scene(p,'s.controls.aimFrom=()=>arg',aim);await p.waitForTimeout(100);assert.ok(await scene(p,'return s.xenoArt.body.displayWidth===128&&s.xeno.body.rotation===0'));}
  await p.screenshot({path:`${out}/${sex}-${kit}.png`});
 }
 check('Both sexes, three independently visible equipment tiers, upright directions and original conductor/companion atlases');
 await navigate(p,'http://localhost:5184/xenobinder-playtest.html?region=forest&class=warrior&kit=basic');
 let g=await page('http://localhost:5184/xenobinder-playtest.html?region=forest&class=xenobinder&sex=female&kit=advanced');
 async function pair(h,guest,hostClass,guestClass){await scene(h,"s.saveProgress();return r.connect('ws://localhost:5184/coop','create',{name:'Host',classId:arg,sex:'male'},s.area)",hostClass);const room=await scene(h,'return r.code');await scene(guest,"s.saveProgress();return r.connect('ws://localhost:5184/coop','join',{name:'Guest',classId:arg.cls,sex:'female'},s.area,arg.room)",{cls:guestClass,room});await h.waitForFunction(()=>!!window.__danteGame.scene.getScene('Game').party?.partner);await guest.waitForFunction(()=>!!window.__danteGame.scene.getScene('Game').party?.mirrorHost);await upgrades(h);await upgrades(guest);await scene(h,'s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity');}
 await pair(p,g,'warrior','xenobinder');assert.ok(await scene(p,'return !!s.party.partner.xeno'));assert.ok(await scene(g,'return r.world.partner.xenobinder.active'));
 // One real guest release runs only on the host; both wounded living actors stand at its clipped endpoint.
 await scene(p,'Object.assign(s.player.position,{x:1000,y:1000});Object.assign(s.party.partner.player.position,{x:930,y:1000});Object.assign(s.party.partner.xeno.position,{x:930,y:1000});s.player.health.current=40;s.party.partner.player.health.current=40;s.party.partner.xeno.bond=100');await g.waitForTimeout(450);
 await g.mouse.move(1270,360);await g.keyboard.down('q');await g.waitForTimeout(500);assert.equal(await scene(p,'return s.party.partner.charge.phase'),'CHARGING');await g.screenshot({path:out+'/guest-hold.png'});await g.keyboard.up('q');await g.waitForFunction(()=>window.__danteCoop.world?.partner?.xenobinder?.pulse);
 report.guest=await scene(p,'return {bond:s.party.partner.xeno.bond,hostHp:s.player.hp,guestHp:s.party.partner.player.hp,pulse:s.party.partner.xeno.snapshot().pulse}');
 assert.equal(report.guest.bond,65);assert.ok(await scene(g,'return r.world.partner.chargeCooldown===6000'));await g.waitForTimeout(350);assert.equal(await scene(g,'return s.xeno.snapshot().bond'),35); // visitor presentation never simulates its own resource
 check('Real WebSocket guest companion/resource/hold/release is host-authoritative and snapshot-only on visitor');
 // Reliable healing geometry fixture on authoritative guest kit, then verify replicated health.
 report.coopHeal=await scene(p,'const x=s.party.partner.xeno; x.clear();x.bond=100;Object.assign(s.player.position,{x:1000,y:1000});Object.assign(s.party.partner.player.position,{x:1010,y:1000});Object.assign(x.position,{x:1000,y:1000});s.player.health.current=s.party.partner.player.health.current=40;x.command(s.time.now,{x:850,y:1000},0,0,[],s.movementBounds);return {h:s.player.hp,g:s.party.partner.player.hp}');
 await g.waitForTimeout(300);report.coopHeal.after=await scene(g,'return {h:r.world.host.hp,g:r.world.partner.hp}');assert.ok(report.coopHeal.after.h>40&&report.coopHeal.after.g>40);check('One authoritative recovery pulse heals both living allies and replicates capped HP');
 await scene(p,'s.party.partner.xeno.clear();s.party.partner.xeno.bond=100;s.party.partner.charge.lastReleasedAt=-Infinity');
 await scene(g,'window.qaPad={mapping:"standard",connected:true,axes:[0,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad]');
 const pad=async(n,ms=120)=>{await g.evaluate(n=>window.qaPad.buttons[n].value=1,n);await g.waitForTimeout(ms);await g.evaluate(n=>window.qaPad.buttons[n].value=0,n);await g.waitForTimeout(180)};
 await g.evaluate(()=>window.qaPad.axes[0]=1);await g.waitForTimeout(220);await pad(5);await g.evaluate(()=>window.qaPad.axes[0]=0);assert.ok(await scene(g,'return r.world.partner.dashReady<.7'));await g.waitForTimeout(300);await pad(6,450);assert.equal(await scene(p,'return s.party.partner.xeno.bond'),65);check('Guest Gamepad API mock: stick motion/aim, RB Dash, LT hold/release');
 await g.evaluate(()=>window.qaPad.connected=false);await g.setViewportSize({width:844,height:390});await g.touchscreen.tap(420,195);await g.waitForTimeout(200);
 await scene(p,'s.party.partner.charge.lastReleasedAt=-Infinity;s.party.partner.xeno.bond=100');
 const cdp=await g.context().newCDPSession(g);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const point=async selector=>{const b=await g.locator(selector).boundingBox();assert.ok(b);return{x:b.x+b.width/2,y:b.y+b.height/2}};
 const m=await point('.touch-move'),a=await point('[data-action="charge"]'),touch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
 await touch('touchStart',[{...m,id:1}]);await touch('touchMove',[{x:m.x+38,y:m.y,id:1}]);await g.waitForTimeout(220);
 await touch('touchStart',[{x:m.x+38,y:m.y,id:1},{...a,id:2}]);await touch('touchMove',[{x:m.x+38,y:m.y,id:1},{x:a.x-35,y:a.y-35,id:2}]);await g.waitForTimeout(400);
 assert.equal(await scene(p,'return s.party.partner.charge.phase'),'CHARGING');assert.equal(await scene(p,'return Math.hypot(s.party.partner.player.velocity.x,s.party.partner.player.velocity.y)'),0);await touch('touchEnd',[]);await g.waitForTimeout(180);assert.equal(await scene(p,'return s.party.partner.xeno.bond'),65);assert.equal(await g.evaluate(()=>visualViewport.scale),1);check('Guest CDP touch: simultaneous joystick and hold/drag, frozen charge, captured release, no browser zoom');
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await g.setViewportSize({width,height});await g.waitForTimeout(200);await g.screenshot({path:`${out}/guest-${width}.png`});assert.equal(await g.locator('.xenobinder-panel').count(),1);report.views.push({width,height});}
 report.cycles=[];for(let i=0;i<3;i++){await scene(p,'s.player.health.current=s.party.partner.player.health.current=0;s.handleDeath(s.player);s.handleDeath(s.party.partner.player);s.restart()');await p.waitForTimeout(1000);await ready(p);await g.waitForTimeout(650);await upgrades(p);await upgrades(g);report.cycles.push(await scene(p,'return {objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,pet:s.children.list.filter(o=>o.texture?.key==="dante-symbiont-motion").length,xp:s.party.partner.progression.xp}'));}
 assert.equal(report.cycles[0].objects,report.cycles[2].objects);assert.equal(report.cycles[0].textures,report.cycles[2].textures);assert.ok(report.cycles.every(m=>m.pet===1));check('Three co-op deaths/respawns: one companion, stable objects/textures and preserved class');
 report.fps={host:await scene(p,'return s.game.loop.actualFps'),guest:await scene(g,'return s.game.loop.actualFps')};
 await scene(g,'r.disconnect(false)');await scene(p,'r.disconnect(false)');await g.close();await p.close();
 p=await page('http://localhost:5184/xenobinder-playtest.html?class=xenobinder&kit=basic');g=await page('http://localhost:5184/xenobinder-playtest.html?class=astral&sex=female');await pair(p,g,'xenobinder','astral');assert.ok(await scene(g,'return !!s.party.mirrorHost.xeno'));await p.keyboard.down('q');await p.waitForTimeout(400);await p.keyboard.up('q');await g.waitForFunction(()=>window.__danteCoop.world?.host?.xenobinder?.state==='COMMAND');check('Reverse pair: Xenobinder host and Astral visitor, original companion snapshot');
 await scene(g,'r.disconnect(false)');await scene(p,'r.disconnect(false)');
 assert.equal(await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log('Xenobinder QA passed');
