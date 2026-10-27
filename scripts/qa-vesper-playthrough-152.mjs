import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/vesper-counterplay/qa/playthrough';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(120000);
const report={method:'Live normal AI and original 1760 HP boss. Warrior at the legitimate simulated arrival level, 145 HP, normal kit. Script reads boss state and plans paths to choose real WASD/Dash/Q/mouse. No position, HP, AI, invulnerability, potions or time mutations during the fight. Controller knows the solution; not a human discovery or difficulty assessment.',errors:[],samples:[]};p.on('pageerror',e=>report.errors.push(e.message));
const get=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.vesper;return{p:{...s.player.position},hp:s.player.hp,dead:s.player.isDead,dashReady:s.player.dashReady,boss:b?{p:{...b.position},state:b.state,attack:b.attackName,phase:b.phase,age:s.time.now-b.at,angle:b.angle,facing:b.facingAngle,hp:b.health.current,max:b.health.max,exposed:b.coreExposed,broken:b.tailShattered}:null,won:s.vesperDefeated,xp:s.progression.xp,clue:s.vesperClueSeen}});
let keys=new Set(),charging=false,chargeAt=0;
async function moveTo(q,s){const waypoint=await p.evaluate(({q})=>{const s=window.__danteGame.scene.getScene('Game'),start=s.player.position,ob=[...s.arena.obstacles,...(s.vesper.solid?[{...s.vesper.position,radius:58}]:[]),...s.vesper.frost.patches.filter(p=>p.active).map(p=>({...p,radius:76}))],step=22,minX=915,minY=470;
 const free=(x,y)=>x>=915&&x<=2220&&y>=465&&y<=1370&&ob.every(o=>Math.hypot(x-o.x,y-o.y)>o.radius+22);
 if(!free(start.x,start.y)){const touching=ob.filter(o=>Math.hypot(start.x-o.x,start.y-o.y)<=o.radius+22),options=[];for(const radius of [35,70,115,170,220])for(let i=0;i<16;i++){const a=i*Math.PI/8,q2={x:start.x+Math.cos(a)*radius,y:start.y+Math.sin(a)*radius};if(free(q2.x,q2.y)&&touching.every(o=>(q2.x-start.x)*(start.x-o.x)+(q2.y-start.y)*(start.y-o.y)>=-1))options.push(q2);}if(options.length)return options.sort((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)-Math.hypot(b.x-q.x,b.y-q.y))[0];}
 const direct=(a,b)=>{const d=Math.hypot(a.x-b.x,a.y-b.y);for(let t=0;t<=d;t+=8){const u=d?t/d:0;if(!free(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u))return false;}return true};
 if(direct(start,q))return q;
 const sx=Math.round((start.x-minX)/step),sy=Math.round((start.y-minY)/step),queue=[[sx,sy,-1]],seen=new Set([sx+','+sy]);let last=-1;
 for(let n=0;n<queue.length;n++){const[x,y]=queue[n],pt={x:minX+x*step,y:minY+y*step};if(Math.hypot(pt.x-q.x,pt.y-q.y)<35){last=n;break;}for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny,p2={x:minX+nx*step,y:minY+ny*step};if(!seen.has(key)&&free(p2.x,p2.y)&&direct(n===0?start:pt,p2)){seen.add(key);queue.push([nx,ny,n])}}}
 if(last<0)return start;const path=[];while(last>=0){const[x,y,prev]=queue[last];path.unshift({x:minX+x*step,y:minY+y*step});last=prev}for(let i=path.length-1;i>=0;i--)if(direct(start,path[i]))return path[i];return path[1]??start;
 },{q});const dx=waypoint.x-s.p.x,dy=waypoint.y-s.p.y,desired=new Set();if(Math.abs(dx)>10)desired.add(dx>0?'d':'a');if(Math.abs(dy)>10)desired.add(dy>0?'s':'w');for(const k of keys)if(!desired.has(k))await p.keyboard.up(k);for(const k of desired)if(!keys.has(k))await p.keyboard.down(k);keys=desired;}
async function aim(){const q=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return{x:r.left+(s.vesper.position.x-c.scrollX)*r.width/s.scale.gameSize.width,y:r.top+(s.vesper.position.y-c.scrollY)*r.height/s.scale.gameSize.height}});await p.mouse.move(q.x,q.y)}
try{
 await p.goto(base+'/campaign-playtest.html?vesper=1&v=0.1.152');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.vesper);for(let i=0;i<20;i++){await p.waitForTimeout(220);const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await b.count())await b.click();else if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break;}
 await p.keyboard.down('d');await p.waitForTimeout(1100);await p.keyboard.up('d');const start=await get();report.start=start;assert.equal(start.boss.hp,1760);
 const deadline=Date.now()+240000;let previous='',target={x:1280,y:960},dashUsed=false,openings=0;
 await aim();await p.mouse.down();
 while(Date.now()<deadline){const s=await get();if(s.won||s.dead)break;const b=s.boss,tag=b.state+':'+b.attack+':'+b.exposed;
  if(tag!==previous){report.samples.push(s);console.log(tag,b.hp,s.hp);previous=tag;
   if(b.state==='TELEGRAPH'){
    dashUsed=false;
    if(b.attack==='breath')target=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.vesper;for(const offset of [Math.PI,Math.PI-.55,Math.PI+.55,Math.PI-1,Math.PI+1,Math.PI/2,-Math.PI/2]){const a=b.angle+offset,q={x:b.position.x+Math.cos(a)*115,y:b.position.y+Math.sin(a)*115};if(q.x>920&&q.x<2220&&q.y>465&&q.y<1370&&s.arena.obstacles.every(o=>Math.hypot(o.x-q.x,o.y-q.y)>o.radius+24)&&b.frost.patches.filter(p=>p.active).every(p=>Math.hypot(p.x-q.x,p.y-q.y)>100))return q;}return{x:b.position.x-Math.sin(b.angle)*120,y:b.position.y+Math.cos(b.angle)*120};});
    else if(b.attack==='tail')target={...s.p};
    else if(b.attack==='eruption')target={x:s.p.x,y:s.p.y+(s.p.y>950?-180:180)};
    else {const a=b.angle+Math.PI/2,options=[-1,1].map(sign=>({x:s.p.x+Math.cos(a)*190*sign,y:s.p.y+Math.sin(a)*190*sign}));target=options.filter(q=>q.x>930&&q.x<2200&&q.y>480&&q.y<1350).sort((a,c)=>Math.hypot(a.x-1450,a.y-950)-Math.hypot(c.x-1450,c.y-950))[0]??options[0];}
   }else if(b.state==='RECOVER'&&b.broken){openings++;target={x:b.p.x+Math.cos(b.facing)*100,y:b.p.y+Math.sin(b.facing)*100};}
  }
  const gap=Math.hypot(s.p.x-b.p.x,s.p.y-b.p.y);
  if(b.exposed&&gap<155&&!charging&&b.age<1400){await p.keyboard.down('q');charging=true;chargeAt=Date.now()}
  if(charging&&(!b.exposed||Date.now()-chargeAt>850)){await p.keyboard.up('q');charging=false}
  target={x:Math.max(930,Math.min(2200,target.x)),y:Math.max(480,Math.min(1350,target.y))};await moveTo(target,s);
  if(b.state==='TELEGRAPH'&&!dashUsed&&b.attack!=='tail'&&b.age>170&&s.dashReady){await p.keyboard.press(' ',{delay:60});dashUsed=true}
  await aim();await p.waitForTimeout(65);
 }
 await p.mouse.up();if(charging)await p.keyboard.up('q');for(const k of keys)await p.keyboard.up(k);keys.clear();const end=await get();report.end=end;report.openingStateSamples=openings;report.earnedOpenings=report.samples.filter((s,i)=>s.boss.state==='RECOVER'&&s.boss.broken&&(i===0||report.samples[i-1].boss.state!=='RECOVER')).length;assert.equal(end.dead,false);assert.equal(end.won,true);assert.ok(report.earnedOpenings>=2);assert.equal(end.xp,start.xp+220);assert.equal(end.clue,false);
 await p.waitForTimeout(3000);for(let i=0;i<12;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await b.count())break;await b.click();await p.waitForTimeout(220)}await p.screenshot({path:out+'/victory.png'});
 let s=await get();const travel=Date.now()+20000;while(Math.hypot(s.p.x-2140,s.p.y-840)>25&&Date.now()<travel){await moveTo({x:2140,y:840},s);await p.waitForTimeout(80);s=await get()}for(const k of keys)await p.keyboard.up(k);keys.clear();report.beforeClue=s;await p.keyboard.press('e',{delay:220});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').vesperClueSeen,null,{timeout:15000});await p.reload();await p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.vesperDefeated&&s.player&&s.sys.isActive()});const reload=await get();assert.equal(reload.xp,start.xp+220);assert.equal(reload.clue,true);assert.equal(reload.boss,null);report.reload=reload;assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);report.state=await get().catch(()=>null);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await writeFile(out+'/playthrough.json',JSON.stringify(report,null,2));await browser.close();}
