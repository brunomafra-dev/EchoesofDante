// A deterministic Gamepad API driver reads warnings and uses the ordinary kit.
// Initial arrival setup only; no HP edits, invulnerability, teleports or forced boss patterns during the fight.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://127.0.0.1:5182/',out=process.argv[3]??'docs/warden-boss/playthrough-qa';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],report={method:'Gamepad API automated driver; normal player and boss HP, no forced attacks or invulnerability; not a human balance assessment',errors};
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base);await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const id of ['northern-ruin','mineral-signal','unknown-trace'])s.progression.discover(id);s.area='warden';s.firstEchoSeen=true;s.wardenGateOpen=true;s.scene.restart();});await page.waitForTimeout(700);
  await page.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[0,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});
  const begun=Date.now(),phases=new Set(),attacks=new Set();let chargeAt=0,lastCharge=0,dashes=0,hitsTaken=0,lastHp=110,won=false;
  for(let tick=0;tick<1900;tick++){
    const a=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.warden;return{now:s.time.now,p:{...s.player.position},boss:{...b.position},state:b.state,attack:b.attackName,phase:b.phase,hp:s.player.hp,bossHp:b.health.current,dead:s.player.isDead,won:s.wardenDefeated,angle:b.attackAngle,origin:{...b.attackOrigin},until:b.stateUntil,dash:s.player.dashProgress,charge:s.charge.phase,chargeReady:s.charge.getProgress(s.time.now),marks:b.marks.map(m=>({x:m.x,y:m.y}))};});
    if(a.won){won=true;report.seconds=(Date.now()-begun)/1000;report.hpRemaining=a.hp;break;}if(a.dead){report.failedAt=a;break;}
    phases.add(a.phase);if(a.attack)attacks.add(a.attack);if(a.hp<lastHp)hitsTaken++;lastHp=a.hp;
    const dx=a.boss.x-a.p.x,dy=a.boss.y-a.p.y,gap=Math.hypot(dx,dy),fx=Math.cos(a.angle),fy=Math.sin(a.angle);
    let tx=a.boss.x,ty=a.boss.y,attack=false,dash=false,charge=false;
    if(a.state==='DORMANT'){tx=900;ty=760;}
    else if(a.state==='INTRO'||a.state==='PHASE'){tx=a.boss.x-230;ty=a.boss.y+100;}
    else if(a.state==='TELEGRAPH'||a.state==='EXECUTE'){
      if(a.attack==='slam'){const ox=a.p.x-a.origin.x,oy=a.p.y-a.origin.y,l=Math.hypot(ox,oy)||1;tx=a.origin.x+ox/l*245;ty=a.origin.y+oy/l*245;}
      else if(a.attack==='echoes'){tx=a.marks[0].x+fx*160;ty=a.marks[0].y+fy*160;}
      else {const side=(a.p.x-a.origin.x)*(-fy)+(a.p.y-a.origin.y)*fx>=0?1:-1;tx=a.origin.x-fy*side*240;ty=a.origin.y+fx*side*240;}
      dash=a.state==='TELEGRAPH'&&a.until-a.now<280&&a.until-a.now>100&&a.dash===1&&Math.hypot(tx-a.p.x,ty-a.p.y)>65;
      if(dash)dashes++;
    }else{
      // Advance to melee contact without attempting to cross the guardian body.
      const l=gap||1;tx=a.boss.x-dx/l*110;ty=a.boss.y-dy/l*110;
      attack=gap<160;
      if(a.state==='RECOVER'&&a.until-a.now>1100&&gap<210&&a.chargeReady===1&&a.now-lastCharge>3300&&chargeAt===0){chargeAt=a.now;lastCharge=a.now;}
    }
    if(chargeAt){charge=a.now-chargeAt<820;if(charge){tx=a.p.x;ty=a.p.y;attack=false;dash=false;}else chargeAt=0;}
    tx=Math.max(580,Math.min(1580,tx));ty=Math.max(470,Math.min(1030,ty));
    let mx=tx-a.p.x,my=ty-a.p.y,ml=Math.hypot(mx,my);
    // Tangential steering around the one dynamic footprint; no pathfinding/gameplay changes.
    const px=a.p.x-a.boss.x,py=a.p.y-a.boss.y;
    if(ml>12&&gap<130&&(mx*px+my*py)<-1000){const cross=px*my-py*mx;const side=cross>=0?1:-1;mx=-py*side;my=px*side;ml=Math.hypot(mx,my);}
    const movement=ml>12?{x:mx/ml,y:my/ml}:{x:0,y:0};
    await page.evaluate(({movement,dx,dy,attack,dash,charge})=>{const p=window.qaPad,l=Math.hypot(dx,dy)||1;p.axes=[movement.x,movement.y,dx/l,dy/l];p.buttons[7].value=attack?1:0;p.buttons[5].value=dash?1:0;p.buttons[6].value=charge?1:0;},{movement,dx,dy,attack,dash,charge});
    if(tick%180===0)await page.screenshot({path:`${out}/progress-${tick}.png`});
    await page.waitForTimeout(60);
  }
  report.phases=[...phases];report.attacks=[...attacks];report.hitsTaken=hitsTaken;report.dashes=dashes;report.won=won;
  await page.evaluate(()=>{window.qaPad.axes=[0,0,1,0];window.qaPad.buttons.forEach(b=>b.value=0);});await page.waitForTimeout(2700);await page.screenshot({path:`${out}/final.png`});
  assert.ok(won,'Normal-HP driver must complete encounter');assert.deepEqual([...phases],[1,2,3]);assert.deepEqual(errors,[]);report.passed=true;
}finally{await writeFile(`${out}/qa-report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
