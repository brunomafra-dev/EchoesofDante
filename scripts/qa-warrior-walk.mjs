import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/warrior-walk/qa';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),report={base,checks:[],errors:[],actors:[]};
const p=await b.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(120000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
await p.addInitScript(()=>{localStorage.setItem('warrior-walk-save-sentinel','preserve');window.qaPad={connected:false,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.qaPad]})});
const S=(fn,arg)=>p.evaluate(({fn,arg})=>new Function('s','arg',`return (${fn})(s,arg)`)(window.__danteGame.scene.getScene('Game'),arg),{fn:fn.toString(),arg});
try{
 for(const sex of ['male','female']){
  await p.goto(`${base}/character-cohesion.html?class=warrior&sex=${sex}&kit=clothes`);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.getData('completeActor'));
  const result=await S(async s=>{
   s.scene.pause();const actor=s.player.view.getData('completeActor'),player=s.player;
   const {PartyActor}=await import('/src/network/PartyActor.ts');
   const {stableCompleteDirection}=await import('/src/visual/CompleteActorFrames.ts');
   const remote=new PartyActor(s,{id:'walk-qa',name:'Companheiro QA',classId:'warrior',sex:player.sex,equipment:{}},{...player.position},100),mirror=remote.player.view.getData('completeActor');
   const ready={phase:'READY',relativeAngle:-.42,worldAngle:0,swingProgress:0},heavy={phase:'READY',level:0,swingProgress:0};
   let frames=0;const cases=[],counts=()=>({objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length});
   for(const tier of ['none','basic','reinforced','mixed']){
    const look=tier==='mixed'?{helmet:'reinforced',torso:'basic',legs:'none',boots:'reinforced',gloves:'none'}:{helmet:tier,torso:tier,legs:tier,boots:tier,gloves:tier};
    actor.setEquipmentLook(look);mirror.setEquipmentLook(look);const baked=actor.bakeCount;
    for(let row=0;row<8;row++){
     const aim=Math.PI/2-row*Math.PI/4,seen=new Set();
     Object.assign(player.position,{x:700,y:800});
     actor.travel=0;mirror.travel=0;actor.previous={...player.position};mirror.previous={...player.position};
     Object.assign(remote.player.position,player.position);
     for(let i=0;i<48;i++){
      // Same simulation coordinates feed the local and remote complete actor.
      player.update(s.time.now+i*16,1/60,{x:1,y:0},aim,[],ready,heavy);
      remote.player.renderRemote({...player.position},aim,ready,heavy,false,false);
      const f=Number(actor.body.frame.name),other=Number(mirror.body.frame.name),travel=actor.travel;
      if(![row*4+1,row*4+2,32+row].includes(f))throw Error('Walking used idle or wrong view '+[tier,row,f]);
      if(f!==other)throw Error('Local/remote gait differs '+[f,other]);
      // This is the exact extra redraw performed by beginStrike/input events.
      for(let n=0;n<3;n++)player.renderWeapon(aim,ready,heavy);
      if(Number(actor.body.frame.name)!==f||actor.travel!==travel)throw Error('Extra render reset or advanced gait');
      if(actor.body.rotation!==0||actor.body.scaleX!==actor.body.scaleY||actor.body.y!==39)throw Error('Body deformed or floated');
      seen.add(f);frames++;
     }
     if(seen.size!==3)throw Error('Missing passing/contact pose '+[tier,row,...seen]);
    }
    if(actor.bakeCount!==baked)throw Error('Atlas rebaked during walking');
    // A stable bounding box alone missed the old pasted/disconnected head.
    // Flood from the skull: it must remain connected down through the torso.
    for(let row=0;row<8;row++)for(const f of [row*4+1,row*4+2,32+row]){
     const a=actor.body.texture.context.getImageData(f%4*192,Math.floor(f/4)*192,192,192).data;
     let seed=-1,best=Infinity;for(let y=24;y<48;y++)for(let x=76;x<116;x++)if(a[(y*192+x)*4+3]>128){const d=(x-96)**2+(y-36)**2;if(d<best){best=d;seed=y*192+x}}
     if(seed<0)throw Error('Head disappeared '+[tier,row,f]);
     const seen=new Uint8Array(192*192),queue=[seed];seen[seed]=1;let bottom=0;
     for(let q=0;q<queue.length;q++){const i=queue[q],x=i%192,y=Math.floor(i/192);bottom=Math.max(bottom,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,j=ny*192+nx;if(nx>=0&&nx<192&&ny>=0&&ny<192&&!seen[j]&&a[j*4+3]>80){seen[j]=1;queue.push(j)}}}
     if(bottom<150)throw Error('Head/neck disconnected from the complete figure '+[tier,row,f,bottom]);
    }
    cases.push({tier,views:8,walkingFrames:48*8});
   }
   // Rotating aim must never reverse physical step progression.
   let prior=actor.travel;for(let i=0;i<160;i++){
    const aim=i/160*Math.PI*4;player.update(s.time.now+i*16,1/60,{x:-1,y:0},aim,[],ready,heavy);
    if(actor.travel<=prior)throw Error('Aim reversed the walk phase');prior=actor.travel;
   }
   let row=0;for(let i=0;i<80;i++){row=stableCompleteDirection(Math.PI/2-Math.PI/8+(i%2?.02:-.02),row);if(row!==0)throw Error('Aim seam flickered')}
   if(stableCompleteDirection(Math.PI/2-Math.PI/8-.12,row)!==1)throw Error('Intentional turn delayed');
   player.update(s.time.now,1/60,{x:0,y:0},Math.PI/2,[],ready,heavy);if(Number(actor.body.frame.name)!==0)throw Error('Did not settle to idle');
   const none={helmet:'none',torso:'none',legs:'none',boots:'none',gloves:'none'},basic={helmet:'basic',torso:'basic',legs:'basic',boots:'basic',gloves:'basic'};
   actor.setEquipmentLook(none);const before=actor.body.texture.context.getImageData(0,0,768,1920).data.slice(),beforeCounts=counts();
   for(let i=0;i<12;i++)actor.setEquipmentLook(i%2?none:basic);
   const after=actor.body.texture.context.getImageData(0,0,768,1920).data;
   if(before.some((v,i)=>v!==after[i]))throw Error('Old equipment pixels remained in the passing frames');
   if(JSON.stringify(beforeCounts)!==JSON.stringify(counts()))throw Error('Objects/textures grew on equip');
   window.qaAtlas=actor.body.texture.getSourceImage().toDataURL();remote.player.view.setVisible(false);remote.destroy();
   return{sex:player.sex,cases,frames,atlasFrames:actor.body.texture.frameTotal-1,counts:counts()};
  });
  assert.equal(result.atlasFrames,40);report.actors.push(result);await writeFile(`${out}/${sex}-clothes-atlas.png`,Buffer.from((await p.evaluate(()=>window.qaAtlas)).split(',')[1],'base64'));
  console.log(sex+': gait sampling, all 8 directions, clothes/armor/mixed, aim orbit, remote parity and cache passed');
 }
 report.checks.push('3072 simulation frames across both presentations and four outfits; full passing/contact cycle, one-image actors and equal remote presentation');
 report.checks.push('Extra attack redraw does not idle/reset gait; mouse turns do not reverse distance; aim seam hysteresis and real turns; stop settles to idle');
 report.checks.push('Repeated equipment swaps preserve object/texture counts and clear all 40 atlas frames without ghost pixels');
 report.checks.push('All walking poses keep an opaque head connected through the neck/torso into the lower body, including mixed helmets');
 await p.goto(base+'/character-cohesion.html?class=warrior&sex=male&kit=clothes');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.getData('completeActor'));
 const start=await S(s=>({...s.player.position}));
 for(const [keys,x,y]of [[['d'],900,350],[['s'],450,100],[['a'],900,600],[['w'],450,600]]){
  await p.mouse.move(x,y);for(const k of keys)await p.keyboard.down(k);await p.waitForTimeout(220);for(const k of keys)await p.keyboard.up(k);
  await p.mouse.click(x,y);await p.waitForTimeout(180);
 }
 const end=await S(s=>({...s.player.position}));assert.ok(Number.isFinite(end.x)&&Number.isFinite(end.y));
 await p.keyboard.down('d');await p.waitForTimeout(220);await p.keyboard.up('d');assert.ok(await S(s=>s.player.position.x)>end.x+10);
 await p.keyboard.down('q');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').charge.phase==='CHARGING');await p.keyboard.up('q');await p.waitForTimeout(600);
 await p.keyboard.press('Space',{delay:40});assert.ok(await S(s=>s.player.isDashing||s.player.dashProgress<.25));
 await p.waitForTimeout(350);await p.screenshot({path:out+'/male-clothes-game.png'});
 report.checks.push('Primary reproduction: male initial clothes, real WASD/mouse orbit/basic attacks, Q and Dash');report.inputPositions={start,end};
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
 await p.setViewportSize({width:1280,height:720});const x=await S(s=>s.player.position.x);await p.evaluate(()=>{window.qaPad.connected=true;window.qaPad.axes=[1,0,0,1]});await p.waitForTimeout(250);assert.ok(await S(s=>s.player.position.x)>x+10);await p.evaluate(()=>window.qaPad.connected=false);
 await p.touchscreen.tap(420,230);await p.locator('[data-action=attack]').tap();assert.equal(await S(s=>s.controls.inputMethod),'touch');
 report.checks.push('Four resolutions, gamepad axes mock and real touch attack');
 await p.waitForTimeout(2000);report.performance=await S(s=>({fps:s.game.loop.actualFps,objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,actorTextures:s.textures.getTextureKeys().filter(k=>k.startsWith('complete-dressed-')).length}));
 assert.equal(await p.evaluate(()=>localStorage.getItem('warrior-walk-save-sentinel')),'preserve');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await b.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n')}
