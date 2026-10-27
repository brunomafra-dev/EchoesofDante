import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/titan-counterplay/qa/auto';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(120000);
const report={method:'Twelve negative trials: four arrival kits with fixed front, fixed rear and follow-rear policies, real held basic attack and normal AI/HP/damage. One initial position/locked boulder fixture, no combat mutations afterward, no Dash or potions. Follow policy does not react to warning marks. Not human balance approval.',errors:[],trials:[]};p.on('pageerror',e=>report.errors.push(e.message));
const get=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.titan;return{p:{...s.player.position},hp:s.player.hp,dead:s.player.isDead,dashReady:s.player.dashReady,boss:b?{p:{...b.position},state:b.state,attack:b.attackName,phase:b.phase,age:s.time.now-b.at,angle:b.angle,facing:b.angle,hp:b.health.current,max:b.health.max,exposed:b.coreExposed,broken:b.vented,covers:b.coverObstacles,marks:b.marks.map(m=>({x:m.x,y:m.y})),radius:b.waveRadius}:null,won:s.titanDefeated,xp:s.progression.xp,clue:s.titanClueSeen}});
let keys=new Set(),charging=false,chargeAt=0;
async function moveTo(q,s){const waypoint=await p.evaluate(({q})=>{const s=window.__danteGame.scene.getScene('Game'),start=s.player.position,ob=[...s.arena.obstacles,...(s.titan.solid?[{...s.titan.position,radius:64}]:[]),...s.titan.coverObstacles],step=22,minX=2235,minY=535;
 const free=(x,y)=>x>=2235&&x<=3145&&y>=535&&y<=1265&&ob.every(o=>Math.hypot(x-o.x,y-o.y)>o.radius+22);
 if(!free(start.x,start.y)){const touching=ob.filter(o=>Math.hypot(start.x-o.x,start.y-o.y)<=o.radius+22),options=[];for(const radius of [35,70,115,170,220])for(let i=0;i<16;i++){const a=i*Math.PI/8,q2={x:start.x+Math.cos(a)*radius,y:start.y+Math.sin(a)*radius};if(free(q2.x,q2.y)&&touching.every(o=>(q2.x-start.x)*(start.x-o.x)+(q2.y-start.y)*(start.y-o.y)>=-1))options.push(q2);}if(options.length)return options.sort((a,b)=>Math.hypot(a.x-q.x,a.y-q.y)-Math.hypot(b.x-q.x,b.y-q.y))[0];}
 const direct=(a,b)=>{const d=Math.hypot(a.x-b.x,a.y-b.y);for(let t=0;t<=d;t+=8){const u=d?t/d:0;if(!free(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u))return false;}return true};
 if(direct(start,q))return q;
 const sx=Math.round((start.x-minX)/step),sy=Math.round((start.y-minY)/step),queue=[[sx,sy,-1]],seen=new Set([sx+','+sy]);let last=-1;
 for(let n=0;n<queue.length;n++){const[x,y]=queue[n],pt={x:minX+x*step,y:minY+y*step};if(Math.hypot(pt.x-q.x,pt.y-q.y)<35){last=n;break;}for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny,p2={x:minX+nx*step,y:minY+ny*step};if(!seen.has(key)&&free(p2.x,p2.y)&&direct(n===0?start:pt,p2)){seen.add(key);queue.push([nx,ny,n])}}}
 if(last<0)return start;const path=[];while(last>=0){const[x,y,prev]=queue[last];path.unshift({x:minX+x*step,y:minY+y*step});last=prev}for(let i=path.length-1;i>=0;i--)if(direct(start,path[i]))return path[i];return path[1]??start;
 },{q});const dx=waypoint.x-s.p.x,dy=waypoint.y-s.p.y,desired=new Set();if(Math.abs(dx)>10)desired.add(dx>0?'d':'a');if(Math.abs(dy)>10)desired.add(dy>0?'s':'w');for(const k of keys)if(!desired.has(k))await p.keyboard.up(k);for(const k of desired)if(!keys.has(k))await p.keyboard.down(k);keys=desired;}
async function aim(){const q=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return{x:r.left+(s.titan.position.x-c.scrollX)*r.width/s.scale.gameSize.width,y:r.top+(s.titan.position.y-c.scrollY)*r.height/s.scale.gameSize.height}});await p.mouse.move(q.x,q.y)}
try{
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const mode of ['fixedFront','fixedRear','followRear']){
  await p.goto(base+'/campaign-playtest.html?titan=1&v=0.1.154&class='+cls);
  await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.titan);
  for(let i=0;i<24;i++){await p.waitForTimeout(220);const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await b.count())await b.click();else if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break;}
  await p.evaluate(mode=>{const s=window.__danteGame.scene.getScene('Game'),b=s.titan;Object.assign(s.player.position,{x:mode==='fixedFront'?2590:2790,y:910});s.player.invulnerableUntil=0;b.beginAttack(s.time.now,'boulders',{x:2390,y:910},s.arena.obstacles);b.index=1;},mode);
  const start=await get(),deadline=Date.now()+85000,events=[];let tag='';
  await aim();await p.mouse.down();
  while(Date.now()<deadline){const s=await get();if(s.dead||s.won)break;
   const b=s.boss,next=b.state+':'+b.attack+':'+s.hp;
   if(next!==tag){events.push(s);tag=next;}
   if(mode==='followRear')await moveTo({x:b.p.x-Math.cos(b.facing)*110,y:b.p.y-Math.sin(b.facing)*110},s);
   await aim();await p.waitForTimeout(90);
  }
  await p.mouse.up();for(const k of keys)await p.keyboard.up(k);keys.clear();
  const end=await get();report.trials.push({cls,mode,start,end,events});
  console.log(cls,mode,'dead',end.dead,'boss',end.boss?.hp);
  assert.equal(end.won,false,cls+' '+mode);assert.equal(end.dead,true,cls+' '+mode);
  await p.evaluate(()=>{sessionStorage.clear()});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);report.state=await get().catch(()=>null);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await writeFile(out+'/rear-auto.json',JSON.stringify(report,null,2));await browser.close();}
