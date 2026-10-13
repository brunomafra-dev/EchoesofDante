import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const out=process.argv[2]??'docs/astral/species-profiles/qa';
await mkdir(out,{recursive:true});
const report={method:'Chrome headless; actual GameScene damage and both renderers, deterministic target fixtures, real local WebSocket pair. Not physical/human validation.',errors:[],checks:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});
const S=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
async function open(url){
 const p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(45000);
 p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.basePanel);
 await p.locator('.threat-lab').evaluate(e=>e.open=false);await p.waitForTimeout(200);
 for(let i=0;i<15;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();}
 return p;
}
try{
 let p=await open('http://localhost:5184/astral-playtest.html?region=forest&element=fire&kit=initial');
 report.matrix=await p.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),{Health}=await import('/src/combat/Health.ts'),{ELEMENT_COLORS}=await import('/src/config/classes.ts'),{elementalMultiplier,damageTextColor,ELEMENTAL_PROFILES}=await import('/src/config/elementalCombat.ts'),{SPECIES}=await import('/src/config/bestiary.ts');
  const rows=[];s.player.invulnerableUntil=Infinity;
  for(const species of Object.keys(SPECIES))for(const element of ['energy','fire','water','earth']){
   const e={position:{...s.player.position},radius:18,health:new Health(500),isDead:false,hurt(){},die(){this.isDead=true}};s.enemySpecies.set(e,species);
   s.resolvePlayerHits(s.time.now,[e],20,0,ELEMENT_COLORS[element],s.player.position,false,{},0,element);
   const label=s.children.list.filter(v=>v.type==='Text'&&v.depth===15002).at(-1);
   rows.push({species,element,damage:500-e.health.current,multiplier:elementalMultiplier(element,species),color:label.style.color,text:label.text});
  }
  const incoming=damageTextColor(0xff8f82),neutral=damageTextColor(0xaafce1);
  // Legacy non-elemental attacks stay neutral even against susceptible species.
  const e={position:s.player.position,radius:18,health:new Health(500),isDead:false,hurt(){}};s.enemySpecies.set(e,'frostPouncer');s.resolvePlayerHits(s.time.now,[e],20,0,0xaafce1,s.player.position,false,{},0);
  // A single area attack must evaluate the anatomy of each target independently.
  const mixed=['frostPouncer','dunePouncer','spitter'].map(species=>{const e={position:s.player.position,radius:18,health:new Health(500),isDead:false,hurt(){}};s.enemySpecies.set(e,species);return e});
  s.resolvePlayerHits(s.time.now,mixed,20,0,ELEMENT_COLORS.fire,s.player.position,true,{},0,'fire');
  const mixDamage=mixed.map(e=>500-e.health.current);
  // Boss vulnerability gates remain authoritative even when an element has advantage.
  const boss={position:s.player.position,radius:60,health:new Health(500),isDead:false,canBeHit:false,hurt(){}};const previous=s.vesper;s.vesper=boss;s.enemySpecies.set(boss,'vesper');
  s.resolvePlayerHits(s.time.now,[boss],20,0,ELEMENT_COLORS.fire,s.player.position,true,{},0,'fire');const gated=boss.health.current;boss.canBeHit=true;
  s.resolvePlayerHits(s.time.now,[boss],20,0,ELEMENT_COLORS.fire,s.player.position,true,{},0,'fire');const vulnerable=boss.health.current;s.vesper=previous;
  return{rows,speciesCount:Object.keys(SPECIES).length,profiles:ELEMENTAL_PROFILES,incoming,neutral,warriorDamage:500-e.health.current,mixDamage,gated,vulnerable};
 });
 for(const row of report.matrix.rows){assert.equal(row.damage,row.multiplier===1.25?25:row.multiplier===.75?15:20);assert.equal(row.text,`${row.damage}${row.multiplier>1?' \u2191':row.multiplier<1?' \u2193':''}`);assert.equal(row.color,{energy:'#5fe6d8',fire:'#ff6a4a',water:'#83ccd8',earth:'#ffbd54'}[row.element]);}
 assert.equal(report.matrix.rows.length,report.matrix.speciesCount*4);
 assert.equal(Object.keys(report.matrix.profiles).length,report.matrix.speciesCount);
 for(const species of Object.keys(report.matrix.profiles)){
  const rows=report.matrix.rows.filter(r=>r.species===species);
  assert.equal(rows.filter(r=>r.damage===25).length,1);assert.equal(rows.filter(r=>r.damage===15).length,1);assert.equal(rows.filter(r=>r.damage===20).length,2);
 }
 for(const species of ['frostPouncer','frostSpitter','iceCarapace','vesper']){assert.equal(report.matrix.rows.find(r=>r.species===species&&r.element==='fire').damage,25);assert.equal(report.matrix.rows.find(r=>r.species===species&&r.element==='water').damage,15);}
 for(const species of ['dunePouncer','glassSpitter','soterrado']){assert.equal(report.matrix.rows.find(r=>r.species===species&&r.element==='water').damage,25);assert.equal(report.matrix.rows.find(r=>r.species===species&&r.element==='fire').damage,15);}
 assert.deepEqual(report.matrix.mixDamage,[25,15,20]);assert.equal(report.matrix.gated,500);assert.equal(report.matrix.vulnerable,475);
 assert.equal(report.matrix.incoming,'#ff968a');assert.equal(report.matrix.neutral,'#e8efce');assert.equal(report.matrix.warriorDamage,20);
 report.checks.push(`All ${report.matrix.speciesCount} species x 4 elements: exactly one weakness, one resistance, two neutral; real mixed-target damage, colors, markers, boss gate; incoming and Warrior preserved`);
 report.retained=await p.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),{Health}=await import('/src/combat/Health.ts'),{AstralCombat}=await import('/src/combat/AstralCombat.ts'),{ELEMENT_COLORS}=await import('/src/config/classes.ts');
  const a=new AstralCombat(s,()=>0),e={position:{x:1100,y:900},radius:18,health:new Health(1000),isDead:false,hurt(){}};s.enemySpecies.set(e,'frostPouncer');
  const colors=[],hit=(enemy,d,angle,heavy,element,origin,push)=>{s.resolvePlayerHits(s.time.now,[enemy],d,angle,ELEMENT_COLORS[element],origin,heavy,{},push,element);colors.push(s.children.list.filter(v=>v.type==='Text'&&v.depth===15002).at(-1).style.color)};
  a.element='fire';a.fire(0,{x:1000,y:900},0);a.cycle();a.update(200,.2,[e],[],undefined,hit);const shotDamage=1000-e.health.current;
  a.clear();a.energy=100;a.element='fire';e.position.x=1380;e.health.current=1000;a.cast(1000,{x:1000,y:900},0,1);a.cycle();a.update(1000,.04,[e],[],undefined,hit);const first=1000-e.health.current;a.update(1600,.55,[e],[],undefined,hit);const tick=1000-e.health.current-first;
  a.destroy();return{shotDamage,first,tick,colors};
 });
 assert.equal(report.retained.shotDamage,23);assert.equal(report.retained.first,43);assert.equal(report.retained.tick,15);assert.ok(report.retained.colors.every(c=>c==='#ff6a4a'));
 report.checks.push('Projectile and fire DOT keep captured fire after selection changes to water; +25% applied once');
 report.reference=await p.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),{ReferenceImpacts}=await import('/src/experiments/quality-reference/ReferenceImpacts.ts');
  const pool=new ReferenceImpacts(s),before=s.children.list.length,rows=[];
  for(const color of [0x5fe6d8,0xff6a4a,0x83ccd8,0xffbd54])for(const response of ['weak','resisted','neutral']){pool.hit(s.time.now,s.player.position,color,response==='weak'?25:response==='resisted'?15:20,0,response==='weak',response==='resisted');const b=pool.bursts[(pool.cursor-1)%4];rows.push({response,color:b.label.style.color,text:b.label.text})}
  for(let i=0;i<100;i++){pool.hit(s.time.now,s.player.position,0xff6a4a,25,0,true);pool.update(s.time.now+420)}
  const after=s.children.list.length;pool.bursts.forEach(b=>{b.label.destroy();b.sprites.forEach(v=>v.destroy())});return{before,after,rows};
 });
 assert.equal(report.reference.before,report.reference.after);assert.deepEqual([...new Set(report.reference.rows.map(r=>r.color))],['#5fe6d8','#ff6a4a','#83ccd8','#ffbd54']);for(const row of report.reference.rows)assert.equal(row.text,row.response==='weak'?'25 \u2191':row.response==='resisted'?'15 \u2193':'20');report.checks.push('Both renderers agree on weakness, resistance and neutral markers; pool stable over 100 impacts');
 await p.close();
 // Real frost creatures; arrange safely only for same-frame capture of impact labels.
 p=await open('http://localhost:5184/astral-playtest.html?region=frost&element=fire&kit=basic&affinities=1');
 await S(p,`s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:790,y:1090});s.controls.movement=()=>({x:0,y:0});s.controls.aimFrom=()=>0;`);await p.waitForTimeout(250);
 await S(p,`const e=s.enemies.find(e=>s.enemySpecies.get(e)==='frostPouncer');if(!e)throw Error('No real frost creature');Object.assign(e.position,{x:s.player.position.x+100,y:s.player.position.y});e.update=()=>{};s.astral.clear();s.astral.element='fire';s.resolvePlayerHits(s.time.now,[e],20,0,0xff6a4a,s.player.position,false,{},0,'fire');s.bestiary.see('frostPouncer');s.records.open();`);
 const bestiary=await p.locator('.records-dialog[aria-labelledby="records-title"]').textContent();assert.equal((bestiary.match(/Fraqueza:/g)||[]).length,report.matrix.speciesCount);assert.equal((bestiary.match(/Resist\u00eancia:/g)||[]).length,report.matrix.speciesCount);await p.screenshot({path:out+'/bestiary.png'});await p.keyboard.press('Escape');
 await S(p,`const e=s.enemies.find(e=>s.enemySpecies.get(e)==='frostPouncer');s.resolvePlayerHits(s.time.now,[e],20,0,0xff6a4a,s.player.position,false,{},0,'fire');`);
 await p.screenshot({path:out+'/fire-frost.png'});report.checks.push('Real frost resident and bestiary weakness text');await p.close();
 // Guest attacks are simulated by host and damage feedback crosses the real relay.
 p=await open('http://localhost:5184/astral-playtest.html?class=warrior&region=forest&kit=initial');
 const g=await open('http://localhost:5184/astral-playtest.html?class=astral&region=forest&kit=initial&element=fire');
 await S(p,`s.saveProgress();return r.connect('ws://localhost:5184/coop','create',{name:'Host',classId:'warrior'},s.area)`);const code=await S(p,'return r.code');
 await S(g,`s.saveProgress();return r.connect('ws://localhost:5184/coop','join',{name:'Astral',classId:'astral'},s.area,arg)`,code);
 await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party.partner?.astral);
 await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party.mirrorHost);
 await S(p,`s.player.invulnerableUntil=s.party.partner.player.invulnerableUntil=Infinity;
  s.qaTarget=s.enemies[0];s.qaTarget.health.max=s.qaTarget.health.current=1000;s.qaTarget.update=()=>{};s.enemySpecies.set(s.qaTarget,'frostPouncer');
  Object.assign(s.party.partner.player.position,{x:1000,y:900});Object.assign(s.qaTarget.position,{x:1100,y:900});s.party.partner.astral.element='fire';s.party.partner.astral.fire(s.time.now,s.party.partner.player.position,0);`);
 await g.waitForFunction(()=>window.__danteCoop.world?.impacts?.some(h=>h.color===0xff6a4a&&h.effective));
 report.coop=await S(g,`return {impacts:r.world.impacts,labels:s.children.list.filter(v=>v.type==='Text'&&v.depth===15002).map(v=>({text:v.text,color:v.style.color})),last:s.party.lastImpact}`);
 assert.ok(report.coop.impacts.some(h=>h.damage===23&&h.effective));assert.ok(report.coop.labels.some(l=>l.text==='23 \u2191'&&l.color==='#ff6a4a'));
 // No duplicate replays from repeated snapshots, and bounded sender history.
 const last=await S(g,'return s.party.lastImpact');await g.waitForTimeout(220);assert.equal(await S(g,'return s.party.lastImpact'),last);
 await S(p,`s.party.partner.astral.clear();s.party.partner.astral.element='water';s.party.partner.astral.lastShot=-Infinity;Object.assign(s.qaTarget.position,{x:1100,y:900});s.party.partner.astral.fire(s.time.now,s.party.partner.player.position,0);`);
 await g.waitForFunction(()=>window.__danteCoop.world?.impacts?.some(h=>h.color===0x83ccd8&&h.resisted));
 report.coopResisted=await S(g,`return {impacts:r.world.impacts,labels:s.children.list.filter(v=>v.type==='Text'&&v.depth===15002).map(v=>({text:v.text,color:v.style.color}))}`);
 assert.ok(report.coopResisted.impacts.some(h=>h.damage===14&&h.resisted&&!h.effective));assert.ok(report.coopResisted.labels.some(l=>l.text==='14 \u2193'&&l.color==='#83ccd8'));
 await g.screenshot({path:out+'/coop-resistance.png'});
 await S(p,`for(let i=0;i<80;i++)s.impact(s.player.position,0xff6a4a,20,0);`);assert.equal(await S(p,'return s.impactHistory.length'),24);
 await g.waitForTimeout(300);await g.screenshot({path:out+'/coop-guest.png'});
 await g.waitForTimeout(2500); // Discard startup and the deliberately artificial 80-hit burst.
 report.stability=await S(g,'return {objects:s.children.list.length,tweens:s.tweens.getTweens().length}');
 const fps=[];for(let i=0;i<6;i++){await g.waitForTimeout(500);fps.push({host:await S(p,'return s.game.loop.actualFps'),guest:await S(g,'return s.game.loop.actualFps')})}
 report.fps={samples:fps,host:fps.reduce((v,p)=>v+p.host,0)/fps.length,guest:fps.reduce((v,p)=>v+p.guest,0)/fps.length};
 assert.deepEqual(await S(g,'return {objects:s.children.list.length,tweens:s.tweens.getTweens().length}'),report.stability);
 report.checks.push('Real relay: guest sees fire weakness 23 up and water resistance 14 down; host authority, dedup, bounded history');
 assert.equal(await g.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);
 await S(g,'r.disconnect(false)');await S(p,'r.disconnect(false)');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/affinities.json',JSON.stringify(report,null,2));console.log(report);}
