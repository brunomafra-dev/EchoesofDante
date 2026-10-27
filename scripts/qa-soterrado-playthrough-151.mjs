import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/soterrado-counterplay/qa/playthrough';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(120000);
const report={method:'Live normal AI and original 1233 HP boss. Warrior at the legitimate simulated arrival level, 140 HP, normal kit. Script reads boss state and plans paths to choose real WASD/Dash/Q/mouse. No position, HP, AI, invulnerability, potions or time mutations during the fight. Controller knows the solution; not a human discovery or difficulty assessment.',errors:[],samples:[]};p.on('pageerror',e=>report.errors.push(e.message));
const get=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.soterrado;return{p:{...s.player.position},hp:s.player.hp,dead:s.player.isDead,dashReady:s.player.dashReady,boss:b?{p:{...b.position},state:b.state,attack:b.attackName,phase:b.phase,age:s.time.now-b.stateAt,angle:b.angle,hp:b.health.current,max:b.health.max,exposed:b.coreExposed,broken:b.carapaceBroken}:null,won:s.soterradoDefeated,xp:s.progression.xp,clue:s.soterradoClueSeen}});
let keys=new Set(),charging=false,chargeAt=0;
async function moveTo(q,s){const waypoint=await p.evaluate(({q})=>{const s=window.__danteGame.scene.getScene('Game'),start=s.player.position,ob=[...s.arena.obstacles,...(s.soterrado.solid?[{...s.soterrado.position,radius:60}]:[])],step=22,minX=280,minY=450;
 const free=(x,y)=>x>=270&&x<=1560&&y>=440&&y<=1120&&ob.every(o=>Math.hypot(x-o.x,y-o.y)>o.radius+22);
 const direct=(a,b)=>{const d=Math.hypot(a.x-b.x,a.y-b.y);for(let t=0;t<=d;t+=8){const u=d?t/d:0;if(!free(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u))return false;}return true};
 if(direct(start,q))return q;
 const sx=Math.round((start.x-minX)/step),sy=Math.round((start.y-minY)/step),queue=[[sx,sy,-1]],seen=new Set([sx+','+sy]);let last=-1;
 for(let n=0;n<queue.length;n++){const[x,y]=queue[n],pt={x:minX+x*step,y:minY+y*step};if(Math.hypot(pt.x-q.x,pt.y-q.y)<35){last=n;break;}for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny,p2={x:minX+nx*step,y:minY+ny*step};if(!seen.has(key)&&free(p2.x,p2.y)&&direct(pt,p2)){seen.add(key);queue.push([nx,ny,n])}}}
 if(last<0)return start;const path=[];while(last>=0){const[x,y,prev]=queue[last];path.unshift({x:minX+x*step,y:minY+y*step});last=prev}for(let i=path.length-1;i>=0;i--)if(direct(start,path[i]))return path[i];return path[1]??start;
 },{q});const dx=waypoint.x-s.p.x,dy=waypoint.y-s.p.y,desired=new Set();if(Math.abs(dx)>10)desired.add(dx>0?'d':'a');if(Math.abs(dy)>10)desired.add(dy>0?'s':'w');for(const k of keys)if(!desired.has(k))await p.keyboard.up(k);for(const k of desired)if(!keys.has(k))await p.keyboard.down(k);keys=desired;}
async function aim(){const q=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return{x:r.left+(s.soterrado.position.x-c.scrollX)*r.width/s.scale.gameSize.width,y:r.top+(s.soterrado.position.y-c.scrollY)*r.height/s.scale.gameSize.height}});await p.mouse.move(q.x,q.y)}
function bait(s){const rocks=[{x:820,y:590},{x:1190,y:965}];return rocks.map(r=>{const d=Math.hypot(r.x-s.boss.p.x,r.y-s.boss.p.y),q={x:r.x+(r.x-s.boss.p.x)/d*110,y:r.y+(r.y-s.boss.p.y)/d*110};return{q,score:Math.hypot(q.x-s.p.x,q.y-s.p.y)+(d<160?300:0)}}).sort((a,b)=>a.score-b.score)[0].q;}
try{
 await p.goto(base+'/campaign-playtest.html?soterrado=1&v=0.1.151');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.soterrado);for(let i=0;i<20;i++){await p.waitForTimeout(220);const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await b.count())await b.click();else if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break;}
 const start=await get();report.start=start;assert.equal(start.boss.hp,1233);const deadline=Date.now()+240000;let previous='',target=bait(start),lastDash=0;
 await aim();await p.mouse.down();
 while(Date.now()<deadline){const s=await get();if(s.won||s.dead)break;const b=s.boss,tag=b.state+':'+b.attack+':'+b.exposed;
  if(tag!==previous){report.samples.push(s);console.log(tag,b.hp,s.hp);previous=tag;
   if(b.state==='IDLE'||b.state==='PHASE'||b.state==='INTRO')target=bait(s);
   else if(b.state==='TELEGRAPH'){
    if(b.attack==='rush'){
     const dx=Math.cos(b.angle),dy=Math.sin(b.angle),lateral=(s.p.x-b.p.x)*-dy+(s.p.y-b.p.y)*dx;
     // Keep a baited line when behind a formation; otherwise leave the locked lane.
     const rockOnLine=[{x:820,y:590},{x:1190,y:965}].some(r=>{const forward=(r.x-b.p.x)*dx+(r.y-b.p.y)*dy;return forward>0&&forward<700&&Math.abs((r.x-b.p.x)*-dy+(r.y-b.p.y)*dx)<95});
     if(rockOnLine)target={...s.p};else target={x:s.p.x-dy*(lateral>=0?160:-160),y:s.p.y+dx*(lateral>=0?160:-160)};
    }else if(b.attack==='burrow')target={x:s.p.x,y:s.p.y+(s.p.y>780?-185:185)};
    else if(b.attack==='fissure')target={x:s.p.x,y:s.p.y+(s.p.y>780?-160:160)};
    else {const a=b.angle+Math.PI/2,options=[-1,1].map(sign=>({x:s.p.x+Math.cos(a)*175*sign,y:s.p.y+Math.sin(a)*175*sign}));target=options.filter(q=>q.y>455&&q.y<1100&&q.x>285&&q.x<1540).sort((a,c)=>Math.hypot(a.x-1000,a.y-780)-Math.hypot(c.x-1000,c.y-780))[0]??options[0];}
   }else if(b.state==='RECOVER'&&b.broken){
    const a=b.angle+Math.PI/2,options=[-1,1].map(sign=>({x:b.p.x+Math.cos(a)*100*sign,y:b.p.y+Math.sin(a)*100*sign}));target=options.sort((a,c)=>Math.hypot(a.x-s.p.x,a.y-s.p.y)-Math.hypot(c.x-s.p.x,c.y-s.p.y))[0];
   }
  }
  if(b.state==='RECOVER'&&b.broken&&b.age>2850)target=bait(s);
  const gap=Math.hypot(s.p.x-b.p.x,s.p.y-b.p.y);
  if(b.exposed&&gap<150&&!charging&&b.age<1400){await p.keyboard.down('q');charging=true;chargeAt=Date.now()}
  if(charging&&(!b.exposed||Date.now()-chargeAt>850)){await p.keyboard.up('q');charging=false}
  if(b.state==='TELEGRAPH'&&['burrow','sweep'].includes(b.attack)&&b.age>(b.attack==='sweep'?150:600)&&s.dashReady&&Date.now()-lastDash>1000&&target){await moveTo(target,s);await p.keyboard.press(' ',{delay:60});lastDash=Date.now()}
  target={x:Math.min(1540,Math.max(290,target.x)),y:Math.min(1100,Math.max(460,target.y))};await moveTo(target,s);await aim();await p.waitForTimeout(65);
 }
 await p.mouse.up();if(charging)await p.keyboard.up('q');for(const k of keys)await p.keyboard.up(k);keys.clear();const end=await get();report.end=end;assert.equal(end.dead,false);assert.equal(end.won,true);assert.equal(end.xp,start.xp+180);assert.equal(end.clue,false);
 await p.waitForTimeout(3500);for(let i=0;i<10;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await b.count())break;await b.click();await p.waitForTimeout(220)}await p.screenshot({path:out+'/victory.png'});
 // Actual movement to the old clue, then E. Boss victory alone never activates it.
 let s=await get();const travel=Date.now()+20000;while(Math.hypot(s.p.x-1390,s.p.y-790)>25&&Date.now()<travel){await moveTo({x:1390,y:790},s);await p.waitForTimeout(80);s=await get()}for(const k of keys)await p.keyboard.up(k);keys.clear();report.beforeClue=s;console.log('Before clue',JSON.stringify(s));await p.keyboard.press('e',{delay:220});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterradoClueSeen,null,{timeout:15000});await p.reload();await p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.soterradoDefeated&&s.player&&s.sys.isActive()});const reload=await get();assert.equal(reload.xp,start.xp+180);assert.equal(reload.clue,true);assert.equal(reload.boss,null);report.reload=reload;assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);report.state=await get().catch(()=>null);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await writeFile(out+'/playthrough.json',JSON.stringify(report,null,2));await browser.close();}
