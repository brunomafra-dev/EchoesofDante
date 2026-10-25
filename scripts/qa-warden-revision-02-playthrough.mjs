import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/warden-revision-02/qa/playthrough';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(120000);
const report={method:'Live normal AI, normal 1125 HP boss, starting gear and 120 HP Warrior. Script reads boss state to choose real keyboard movement/Dash and mouse attacks. Only initial approach position fixture; no HP reduction/invulnerability or AI/state manipulation during the fight.',errors:[],samples:[]};p.on('pageerror',e=>report.errors.push(e.message));
const get=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.warden;return{p:{...s.player.position},hp:s.player.hp,dead:s.player.isDead,dashReady:s.player.dashReady,boss:b?{p:{...b.position},state:b.state,attack:b.attackName,age:s.time.now-b.stateAt,angle:b.attackAngle,wave:b.lastWaveRadius,hp:b.health.current,exposed:b.coreExposed}:null,won:s.wardenDefeated,xp:s.progression.xp,portal:s.signalPortal.active}});
let keys=new Set();async function moveTo(q,s){const dx=q.x-s.p.x,dy=q.y-s.p.y,desired=new Set();if(Math.abs(dx)>14)desired.add(dx>0?'d':'a');if(Math.abs(dy)>14)desired.add(dy>0?'s':'w');for(const k of keys)if(!desired.has(k))await p.keyboard.up(k);for(const k of desired)if(!keys.has(k))await p.keyboard.down(k);keys=desired;}
async function aim(){const q=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return{x:r.left+(s.warden.position.x-c.scrollX)*r.width/s.scale.gameSize.width,y:r.top+(s.warden.position.y-c.scrollY)*r.height/s.scale.gameSize.height}});await p.mouse.move(q.x,q.y)}
try{
 await p.goto(base+'/campaign-playtest.html?warden=1&v=0.1.150');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.warden);for(let i=0;i<12;i++){await p.waitForTimeout(200);const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await b.count())await b.click();else if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break;}
 await p.keyboard.down('d');await p.waitForTimeout(1100);await p.keyboard.up('d');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.introComplete);const start=await get();report.start=start;assert.equal(start.boss.hp,1125);
 const deadline=Date.now()+150000;let previous='',target,slamDashed=false,lastSample=0;
 await aim();await p.mouse.down();
 while(Date.now()<deadline){const s=await get();if(s.won||s.dead)break;const b=s.boss,tag=b.state+':'+b.attack;
  if(tag!==previous){report.samples.push(s);console.log(tag,b.hp,s.hp);previous=tag;
   if(b.state==='TELEGRAPH'){
    slamDashed=false;
    if(b.attack==='slam'){const angle=Math.atan2(s.p.y-b.p.y,s.p.x-b.p.x);target={x:b.p.x+Math.cos(angle)*235,y:b.p.y+Math.sin(angle)*235};}
    else if(b.attack==='echoes'){const a=Math.atan2(s.p.y-b.p.y,s.p.x-b.p.x);target={x:b.p.x+Math.cos(a)*100,y:b.p.y+Math.sin(a)*100};}
    else {const a=b.angle+Math.PI/2;target={x:b.p.x+Math.cos(a)*(b.attack==='rush'?210:130),y:b.p.y+Math.sin(a)*(b.attack==='rush'?210:130)};}
   }else if(b.state==='RECOVER'){
    const a=Math.atan2(s.p.y-b.p.y,s.p.x-b.p.x);target={x:b.p.x+Math.cos(a)*100,y:b.p.y+Math.sin(a)*100};
   }else if(b.state==='IDLE'||b.state==='PHASE'){target={...s.p};}
  }
  if(b.state==='EXECUTE'&&b.attack==='slam'&&!slamDashed&&b.wave>145&&b.wave>Math.hypot(s.p.x-b.p.x,s.p.y-b.p.y)-90&&s.dashReady){
    target={...b.p};await moveTo(target,s);await p.keyboard.press(' ',{delay:50});slamDashed=true;
    // Let dash finish against the solid footprint; do not drift back into the ring.
    await p.waitForTimeout(150);const after=await get();target={...after.p};
  }
  if(target)await moveTo(target,s);await aim();await p.waitForTimeout(65);
 }
 await p.mouse.up();for(const k of keys)await p.keyboard.up(k);const end=await get();report.end=end;assert.equal(end.dead,false);assert.equal(end.won,true);assert.equal(end.xp,start.xp+120);
 await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').signalPortal.active);await p.screenshot({path:out+'/victory.png'});await p.reload();await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.wardenDefeated);assert.equal((await get()).xp,start.xp+120);report.passed=true;
}catch(e){report.failure=String(e);report.state=await get().catch(()=>null);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await writeFile(out+'/playthrough.json',JSON.stringify(report,null,2));await browser.close();}
