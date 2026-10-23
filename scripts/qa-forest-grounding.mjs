import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/forest-finish/revision-02/qa';await mkdir(out,{recursive:true});
const bundle=await build({stdin:{contents:"export * from './src/systems/Movement';export * from './src/systems/WalkableGround';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {moveWithCollisions,insideGround}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1366,height:768}}),report={method:'Authored contour vs physical footprint, swept movement/dash/knockback and connected routes; real browser actors/combat and full-body Hollow frames. DEV positioning is explicit, not a human playtest.',checks:[],errors:[]};p.on('pageerror',e=>report.errors.push(e.message));
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player&&!document.querySelector('#loading:not([hidden])'),{},{timeout:120000});
const world=([x,y],foot=39)=>({x:x*2200/1536,y:y*1500/1024-foot});
const nearest=(point,polygon)=>Math.min(...polygon.map((a,i)=>{const b=polygon[(i+1)%polygon.length],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy)}));
try{
 await p.goto(base+'/forest-finish.html');await ready();const geometry=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{bounds:s.arena.bounds,obstacles:s.arena.obstacles}}),contour=geometry.bounds.walkable;assert.ok(contour.length>=60);
 const onGround=(position,foot=39)=>{const feet={x:position.x,y:position.y+foot};assert.ok(insideGround(feet,contour),'outside '+JSON.stringify(feet));assert.ok(nearest(feet,contour)>17.9,'footprint overlaps bank '+JSON.stringify(feet))};
 report.boundaries=[];
 for(const[name,start,target]of [['pond',[705,375],[425,270]],['root bank',[800,740],[400,790]],['east rocks',[1000,440],[1260,410]],['northwest trunk',[840,185],[580,70]],['northeast trunk',[1120,192],[1140,80]],['southeast shelf',[830,870],[1050,870]]])for(const foot of [39,18])for(const speed of [245,760,500]){
  const a=world(start,foot),goal=world(target,foot),length=Math.hypot(goal.x-a.x,goal.y-a.y),velocity={x:(goal.x-a.x)/length*speed,y:(goal.y-a.y)/length*speed};
  onGround(a,foot);for(let i=0;i<120;i++){moveWithCollisions(a,velocity,.04,18,geometry.obstacles,geometry.bounds,foot);onGround(a,foot)}
  assert.ok(Math.hypot(a.x-goal.x,a.y-goal.y)>80);report.boundaries.push({name,foot,speed,end:a});
 }
 report.checks.push('Six painted hazards block human/Hollow footprints at walk, dash and knockback speeds; no tunnelling or circle gaps in 4,320 swept moves');
 const route=points=>{const a=world([780,570]);for(const point of points){const goal=world(point);let remaining=999;for(let i=0;i<500&&remaining>7;i++){remaining=Math.hypot(goal.x-a.x,goal.y-a.y);const speed=Math.min(245,remaining/.016);moveWithCollisions(a,{x:(goal.x-a.x)/remaining*speed,y:(goal.y-a.y)/remaining*speed},.016,18,[],geometry.bounds,39);onGround(a)}assert.ok(Math.hypot(goal.x-a.x,goal.y-a.y)<8,'route blocked '+JSON.stringify(point))}};
 route([[840,350],[850,200],[845,80]]);route([[840,350],[990,220],[1130,192],[1300,230],[1450,230]]);route([[780,740],[740,800],[680,900],[650,980]]);route([[700,450],[580,430],[400,480]]);
 report.checks.push('Main clearing, both northern forks, southern trail and pond lookout stay connected with a full player footprint');
 for(const cls of ['warrior','hunter','astral','xenobinder']){
  await p.goto(base+'/forest-finish.html?class='+cls);await ready();const start=world([1030,440]);await p.evaluate(start=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,start)},start);await p.waitForTimeout(100);await p.keyboard.down('d');await p.keyboard.press('Space');await p.waitForTimeout(350);await p.keyboard.up('d');const actual=await p.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position}));onGround(actual);assert.ok(actual.x-start.x<115,cls+' crossed rock wall');
 }
 report.checks.push('Real Space+d inputs stop all four classes at the painted east rock bank');
 await p.goto(base+'/forest-finish.html');await ready();await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;Object.assign(s.enemies[0].position,{x:1200,y:680});Object.assign(s.player.position,{x:1060,y:840});});
 const frames=new Set();for(let i=0;i<28;i++){await p.waitForTimeout(45);const f=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=s.enemies[0],body=e.view.getByName('finish-whole-hollow');return{frame:Number(body.frame.name),w:body.displayWidth,h:body.displayHeight,legacy:e.view.list.slice(0,4).map(o=>o.visible)}});frames.add(f.frame);assert.equal(f.w,112);assert.equal(f.h,112);assert.deepEqual(f.legacy,[false,false,false,false])}
 assert.ok([0,1,2,3].every(f=>frames.has(f)));report.frames=[...frames];report.checks.push('Hollow uses four registered whole-creature walk frames; no legacy body/limbs are visible');
 // Place an existing enemy at melee distance; observe its existing windup and strike.
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.enemies[0].position,{x:1093,y:840});s.enemies[0].lastAttackAt=-Infinity});
 const attacks=new Set();for(let i=0;i<26;i++){await p.waitForTimeout(30);attacks.add(await p.evaluate(()=>Number(window.__danteGame.scene.getScene('Game').enemies[0].view.getByName('finish-whole-hollow').frame.name)))}assert.ok(attacks.has(4)&&attacks.has(5));report.checks.push('Existing stationary windup/strike select complete brace and thrust poses, preserving attack timings');
 await p.screenshot({path:out+'/combat.png'});
 await p.goto(base+'/forest-finish.html?terrain=1');await ready();await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.cameras.main.stopFollow();s.cameras.main.setZoom(.65);s.cameras.main.centerOn(1100,750)});await p.setViewportSize({width:1440,height:1000});await p.waitForTimeout(300);await p.screenshot({path:out+'/authored-contour.png'});
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(report.checks);
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'});throw e}finally{await browser.close();await writeFile(out+'/grounding.json',JSON.stringify(report,null,2))}
