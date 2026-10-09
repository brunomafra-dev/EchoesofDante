// A full 1100-HP attempt: read telegraphs, drive actual keyboard/mouse, no healing,
// invulnerability, forced attacks, HP edits or accelerated clocks during combat.
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5184/?qa=play',out=process.argv[3]??'docs/glacier-expansion/playthrough';
const hunter = process.argv[4] === 'hunter';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}});
const report={method:'Chrome headless full-HP encounter via actual keyboard/mouse; DEV prior-chapter setup only; bot reads telegraphs, not a human balance test',errors:[]};
report.classId = hunter ? 'hunter' : 'warrior';
page.on('pageerror',e=>report.errors.push(e.message));
try {
  await page.goto(base);await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  if (hunter) {
    await page.evaluate(async () => {
      const { characterProfiles } = await import('/src/systems/CharacterProfiles.ts');
      const hero = characterProfiles.create('Hunter QA', 'hunter'); characterProfiles.select(hero.id);
    });
    await page.reload(); await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  }
  await page.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');
    for(const f of JOURNEY_FLAGS)s[f]=!f.startsWith('vesper');
    s.progression.restore({xp:1000,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[],abilityUpgrades:{chargeWidth:1}});s.area='icenest';for(const id of ['chargeWidth','chargePower','saberArc','saberReach','dashCooldown','dashDuration'])while(s.progression.investUpgrade(id)){};s.scene.restart();});
  await page.waitForTimeout(600);
  let pressed=new Set(),mouse=false,charge=false,chargeAt=0,goal={x:1020,y:970},lastState='',lastAttack='';
  const start=Date.now(),patterns=new Set(),phases=new Set(),timeline=[];
  while(Date.now()-start<120000){
    const s=await page.evaluate(()=>{const g=window.__danteGame,s=g.scene.getScene('Game'),b=s.vesper,c=s.cameras.main;return{
      p:{...s.player.position},hp:s.player.hp,dead:s.player.isDead,won:s.vesperDefeated,now:s.time.now,
      boss:{...b.position},bossHp:b.health.current,state:b.state,attack:b.attackName,phase:b.phase,angle:b.angle,origin:{...b.origin},remaining:b.until-s.time.now,
      marks:b.marks.filter(m=>m.image.visible).map(m=>({x:m.x,y:m.y})),aim:{x:b.position.x-c.scrollX,y:b.position.y-c.scrollY},chargeReady:s.charge.phase==='READY'&&s.charge.getProgress(s.time.now)>=1};});
    phases.add(s.phase);if(s.attack)patterns.add(s.attack);
    if(lastState!==s.state||lastAttack!==s.attack){timeline.push({seconds:Math.round((Date.now()-start)/100)/10,state:s.state,attack:s.attack,bossHp:s.bossHp,hp:s.hp});lastState=s.state;lastAttack=s.attack;
      if(s.state==='TELEGRAPH') {
        if(s.attack==='tail' || s.attack==='breath'||s.attack==='rush') {
          const candidates=[-1,1].map(sign=>({x:s.origin.x+Math.cos(s.angle+sign*Math.PI/2)*240,y:s.origin.y+Math.sin(s.angle+sign*Math.PI/2)*240}));
          goal=candidates.sort((a,b)=>Math.hypot(a.x-s.p.x,a.y-s.p.y)-Math.hypot(b.x-s.p.x,b.y-s.p.y))[0];
        }else{
          const candidates=[{x:s.p.x,y:s.p.y-250},{x:s.p.x,y:s.p.y+250},{x:s.p.x-270,y:s.p.y},{x:s.p.x+270,y:s.p.y}];
          const clearance=p=>Math.min(...s.marks.map(m=>Math.hypot(p.x-m.x,p.y-m.y)));
          goal=candidates.filter(p=>p.x>900&&p.x<1950&&p.y>620&&p.y<1250).sort((a,b)=>clearance(b)-clearance(a))[0]??{x:1020,y:970};
        }
      }
    }
    if(s.won||s.dead){report.won=s.won;report.remainingHp=s.hp;break;}
    const gap=Math.hypot(s.p.x-s.boss.x,s.p.y-s.boss.y);
    if(['RECOVER','IDLE','PHASE'].includes(s.state)){
      const dx=(s.p.x-s.boss.x)/(gap||1),dy=(s.p.y-s.boss.y)/(gap||1);
      goal={x:s.boss.x+dx*(hunter?260:112),y:s.boss.y+dy*(hunter?260:112)};
    }
    goal.x=Math.max(890,Math.min(2000,goal.x));goal.y=Math.max(590,Math.min(1280,goal.y));
    await page.mouse.move(s.aim.x,s.aim.y);
    const wantCharge=s.state==='RECOVER'&&s.remaining>1150&&gap<(hunter?380:160)&&s.chargeReady;
    if(!charge&&wantCharge){await page.keyboard.down('q');charge=true;chargeAt=Date.now();}
    if(charge&&(Date.now()-chargeAt>810||s.state!=='RECOVER')){await page.keyboard.up('q');charge=false;}
    const wantMouse=!charge&&['RECOVER','IDLE'].includes(s.state)&&gap<(hunter?380:160);
    if(wantMouse!==mouse){await page.mouse[wantMouse?'down':'up']();mouse=wantMouse;}
    const desired=new Set();if(!charge){const dx=goal.x-s.p.x,dy=goal.y-s.p.y;if(Math.abs(dx)>14)desired.add(dx>0?'d':'a');if(Math.abs(dy)>14)desired.add(dy>0?'s':'w');}
    for(const k of pressed)if(!desired.has(k))await page.keyboard.up(k);
    for(const k of desired)if(!pressed.has(k))await page.keyboard.down(k);pressed=desired;
    await page.waitForTimeout(65);
  }
  for(const k of pressed)await page.keyboard.up(k);if(charge)await page.keyboard.up('q');if(mouse)await page.mouse.up();
  report.durationSeconds=(Date.now()-start)/1000;report.patterns=[...patterns];report.phases=[...phases];report.timeline=timeline;
  await page.screenshot({path:`${out}/result.png`});assert.equal(report.won,true,'full-HP attempt won without stat overrides');assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({...report,timeline:undefined},null,2));
