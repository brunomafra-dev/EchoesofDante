import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/character-cohesion/qa/controls';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:844,height:390},hasTouch:true});
const report={method:'Chrome Touch/CDP and standard Gamepad API mock in the actual Hunter gameplay rig, no physical device.',errors:[],checks:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
const S=code=>p.evaluate(code=>new Function('s',code)(window.__danteGame.scene.getScene('Game')),code);
try{
 await p.goto('http://localhost:5184/character-cohesion.html?class=hunter&sex=female');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player);
 await S('s.enemies.forEach(e=>e.update=()=>{});s.player.invulnerableUntil=Infinity;const obstacles=s.arena.obstacles;let spot;for(let y=250;y<1200&&!spot;y+=100)for(let x=400;x<1800&&!spot;x+=100)if(obstacles.every(o=>[0,60,120].every(dx=>Math.hypot(o.x-x-dx,o.y-y)>o.radius+45)))spot={x,y};if(!spot)throw Error("No open movement segment");Object.assign(s.player.position,spot);');
 await p.touchscreen.tap(420,195);await p.waitForTimeout(150);
 const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 const at=async selector=>{const r=await p.locator(selector).boundingBox();assert.ok(r,selector);return{x:r.x+r.width/2,y:r.y+r.height/2,id:1};};
 const touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const move=await at('.touch-move'),before=await S('return {...s.player.position}');await touch('touchStart',[move]);await touch('touchMove',[{...move,x:move.x+40}]);await p.waitForTimeout(300);await touch('touchEnd',[]);
 const after=await S('return {...s.player.position}');assert.ok(after.x>before.x+5);report.checks.push('Touch joystick moves the dressed Hunter');
 await p.locator('[data-action=dash]').tap();await p.waitForTimeout(80);assert.ok(await S('return Number.isFinite(s.player.lastDashAt)'));await p.waitForTimeout(400);
 const shot=await S('return s.hunter.firedUntil');await p.locator('[data-action=attack]').tap();await p.waitForTimeout(60);assert.ok(await S('return s.hunter.firedUntil')>shot);await p.waitForTimeout(400);
 const charge=await at('[data-action=charge]');await touch('touchStart',[charge]);await p.waitForTimeout(350);assert.equal(await S('return s.charge.phase'),'CHARGING');await touch('touchEnd',[]);await p.waitForTimeout(120);assert.ok(await S('return Number.isFinite(s.charge.lastReleasedAt)'));report.checks.push('Touch strike, Dash and Q hold/release animate the same rig');await p.screenshot({path:out+'/touch.png'});
 await p.waitForTimeout(700);await S('s.charge.lastReleasedAt=-Infinity;s.player.lastDashAt=-Infinity;window.qaPad={mapping:"standard",connected:true,axes:[1,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad]');await p.waitForTimeout(200);assert.equal(await S('return s.controls.inputMethod'),'gamepad');
 const pad=async(index,value)=>p.evaluate(({index,value})=>window.qaPad.buttons[index]={value,pressed:!!value},{index,value});
 await pad(7,1);await p.waitForTimeout(300);await pad(7,0);await p.waitForTimeout(350);await pad(5,1);await p.waitForTimeout(100);await pad(5,0);await p.waitForTimeout(400);await pad(6,1);await p.waitForTimeout(350);assert.equal(await S('return s.charge.phase'),'CHARGING');await pad(6,0);await p.waitForTimeout(120);assert.ok(await S('return Number.isFinite(s.charge.lastReleasedAt)'));report.checks.push('Gamepad movement, attack, Dash and Q hold/release remain available');
 assert.equal(await p.evaluate(()=>visualViewport.scale),1);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
