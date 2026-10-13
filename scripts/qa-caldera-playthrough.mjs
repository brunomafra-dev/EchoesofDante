import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/caldera/normal-fights';await mkdir(out,{recursive:true});
const classes=process.argv[3]?[process.argv[3]]:['warrior','hunter','astral'];
const browser=await chromium.launch({channel:'chrome',headless:true}),report={method:'Real Gamepad API driver reads telegraphs. Normal HP, no forced boss attacks, no HP edits/invulnerability/teleports during fights. Basic kit at regional level; not human balance approval.',errors:[],fights:[]};
try{for(const classId of classes){
 const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
 await p.goto(`http://localhost:5184/caldera-playtest.html?boss=1&kit=basic&class=${classId}`);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.basePanel);await p.locator('.threat-lab').evaluate(e=>e.open=false);await p.waitForTimeout(400);
 for(let i=0;i<10;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();}
 if(classId==='astral'){await p.keyboard.press('f');await p.waitForTimeout(100);await p.keyboard.press('f');await p.waitForTimeout(100);}
 await p.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[0,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});
 const fight={classId,phases:[],attacks:[],dashes:0,hitsTaken:0,charges:0},phases=new Set(),attacks=new Set(),begun=Date.now();let chargeAt=0,lastCharge=0,lastHp=999,won=false;
 for(let tick=0;tick<2200;tick++){
  const a=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.titan;return{now:s.time.now,p:{...s.player.position},b:{...b.position},origin:{...b.origin},angle:b.angle,state:b.state,until:b.until,phase:b.phase,name:b.attackName,marks:b.marks.map(m=>({x:m.x,y:m.y})),hp:s.player.hp,max:s.player.maxHp,dead:s.player.isDead,won:s.titanDefeated,dash:s.player.dashProgress,chargeReady:s.charge.getProgress(s.time.now),energy:s.astral?.energy,bond:s.xeno?.bond}});
  if(a.won){won=true;fight.seconds=(Date.now()-begun)/1000;fight.hp=a.hp;break;}if(a.dead){fight.failure=a;break;}
  if(a.state!=='DORMANT')phases.add(a.phase);if(a.name)attacks.add(a.name);if(a.hp<lastHp)fight.hitsTaken++;lastHp=a.hp;
  const dx=a.b.x-a.p.x,dy=a.b.y-a.p.y,gap=Math.hypot(dx,dy)||1,range=classId==='warrior'?110:classId==='hunter'?340:285;
  let tx=a.b.x-dx/gap*range,ty=a.b.y-dy/gap*range,attack=false,dash=false,held=false;
  if(a.state==='DORMANT'){tx=2290;ty=960;}
  else if(a.state==='INTRO'||a.state==='PHASE'){tx=a.b.x-260;ty=a.b.y+100;}
  else if(a.state==='TELEGRAPH'||a.state==='EXECUTE'){
   if(a.name==='slam'||a.name==='cleave'){const x=a.p.x-a.origin.x,y=a.p.y-a.origin.y,l=Math.hypot(x,y)||1;tx=a.origin.x+x/l*290;ty=a.origin.y+y/l*290;}
   else if(a.name==='boulders'){const fx=Math.cos(a.angle),fy=Math.sin(a.angle),side=(a.p.x-a.origin.x)*(-fy)+(a.p.y-a.origin.y)*fx>=0?1:-1;tx=a.origin.x-fy*side*290;ty=a.origin.y+fx*side*290;}
   else{const m=a.marks.reduce((m,n)=>Math.hypot(n.x-a.p.x,n.y-a.p.y)<Math.hypot(m.x-a.p.x,m.y-a.p.y)?n:m),ox=a.p.x-m.x,oy=a.p.y-m.y,l=Math.hypot(ox,oy);tx=a.p.x+(l>1?ox/l:0)*180;ty=a.p.y+(l>1?oy/l:-1)*180;}
   dash=a.state==='TELEGRAPH'&&a.until-a.now<430&&a.until-a.now>120&&a.dash===1&&Math.hypot(tx-a.p.x,ty-a.p.y)>80;
  }else{
   attack=gap<(classId==='warrior'?155:classId==='hunter'?680:450);
   if(a.state==='RECOVER'&&a.until-a.now>1050&&gap<390&&a.chargeReady===1&&a.now-lastCharge>3300&&!chargeAt&&(classId!=='astral'||a.energy>=30)&&(classId!=='xenobinder'||a.bond>=35)){chargeAt=a.now;lastCharge=a.now;fight.charges++;}
  }
  if(chargeAt){held=a.now-chargeAt<380;if(held){tx=a.p.x;ty=a.p.y;attack=false;dash=false;}else chargeAt=0;}
  if(dash)fight.dashes++;
  tx=Math.max(2240,Math.min(3140,tx));ty=Math.max(540,Math.min(1290,ty));
  let mx=tx-a.p.x,my=ty-a.p.y,l=Math.hypot(mx,my),px=a.p.x-a.b.x,py=a.p.y-a.b.y;
  if(gap<115&&l>12&&mx*px+my*py<0){const side=px*my-py*mx>=0?1:-1;mx=-py*side;my=px*side;l=Math.hypot(mx,my);}
  await p.evaluate(({mx,my,l,dx,dy,gap,attack,dash,held,hp,max})=>{window.qaPad.axes=[l>10?mx/l:0,l>10?my/l:0,dx/gap,dy/gap];window.qaPad.buttons[7].value=attack?1:0;window.qaPad.buttons[5].value=dash?1:0;window.qaPad.buttons[6].value=held?1:0;if(hp<max*.48)window.__danteGame.scene.getScene('Game').usePotion();},{mx,my,l,dx,dy,gap,attack,dash,held,hp:a.hp,max:a.max});
  if(tick%240===0)await p.screenshot({path:out+`/${classId}-${tick}.png`});await p.waitForTimeout(60);
 }
 fight.won=won;fight.phases=[...phases];fight.attacks=[...attacks];report.fights.push(fight);await p.waitForTimeout(2000);await p.screenshot({path:out+`/${classId}-result.png`});await p.close();assert.equal(won,true,JSON.stringify(fight));assert.deepEqual(fight.phases,[1,2,3]);assert.ok(fight.charges>0);
 }}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(report);}
