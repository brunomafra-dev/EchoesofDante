import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5184',out=process.env.QA_OUT??'docs/complete-actors/qa';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={passed:false,errors:[],warnings:[],actors:[],checks:[],humanApproval:'User approved full figures, requested Warrior/Hunter gait and distinct Hunter identity. This revision awaits playtest.'};
const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
p.setDefaultTimeout(60000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});p.on('console',m=>{if(['warning','error'].includes(m.type()))report.warnings.push(m.text());});
await p.addInitScript(()=>{localStorage.setItem('complete-save-sentinel','preserve');window.qaPad={connected:false,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.qaPad]});});
const S=(fn,arg)=>p.evaluate(({fn,arg})=>new Function('s','arg',`return (${fn})(s,arg)`)(window.__danteGame.scene.getScene('Game'),arg),{fn:fn.toString(),arg});
try{
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const sex of ['male','female']){
  await p.goto(`${base}/character-cohesion.html?class=${cls}&sex=${sex}&kit=clothes`);
  await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view?.getData('completeActor'));
  const result=await S(async s=>{
   s.scene.pause();const actor=s.player.view.getData('completeActor'),position={...s.player.position};
   const {PartyActor}=await import('/src/network/PartyActor.ts');
   const {completeStride}=await import('/src/visual/CompleteActorFrames.ts');
   const remote=new PartyActor(s,{id:'qa-visual',name:'Visual QA',classId:s.classId,sex:s.player.sex,equipment:{}},position,100);
   const mirror=remote.player.view.getData('completeActor');
   let cases=0;const frames=new Set();
   for(const tier of ['none','basic','reinforced','mixed']){
    const look=tier==='mixed'?{helmet:'reinforced',torso:'basic',legs:'none',boots:'reinforced',gloves:'none'}:{helmet:tier,torso:tier,legs:tier,boots:tier,gloves:tier};
    s.setPlaytestAppearance(look);mirror.setEquipmentLook(look);
    for(const weapon of ['starter','current','advanced']){
     s.setPlaytestWeapon(weapon);mirror.setWeaponLook(weapon);
     for(let row=0;row<8;row++)for(let action=0;action<4;action++){
      const aim=Math.PI/2-row*Math.PI/4,heavy={phase:action===3?'CHARGING':'READY',level:.7},walk=action===1||action===2;
      for(const a of [actor,mirror]){a.travel=(s.classId==='warrior'?(action===1?.10:.60):(action===1?1.1:3.1)/4)*completeStride(s.classId);a.previous={x:position.x-(walk?Math.cos(aim):0),y:position.y-(walk?Math.sin(aim):0)};a.update(position.x,position.y,aim,action===3,false,heavy,'fire');}
      const f=Number(actor.body.frame.name);if(f!==row*4+action)throw Error('Wrong frame '+[tier,weapon,row,action,f]);
      if(f!==Number(mirror.body.frame.name))throw Error('Remote frame mismatch');
      if(actor.body.rotation!==0||actor.body.scaleX!==actor.body.scaleY||actor.body.flipX||actor.body.flipY)throw Error('Deformed whole image');
      if(actor.body.y!==39||actor.body.originY!==183/192)throw Error('Ground registration');
      const a=actor.body.texture.context.getImageData(actor.body.frame.cutX,actor.body.frame.cutY,192,192).data,b=mirror.body.texture.context.getImageData(mirror.body.frame.cutX,mirror.body.frame.cutY,192,192).data;
      let ink=0;for(let i=0;i<a.length;i++){if(a[i]!==b[i])throw Error('Remote equipment mismatch');if(i%4===3&&a[i]>32)ink++;}
      const idle=actor.body.texture.context.getImageData(0,row*192,192,192).data;
      // Same equipped head in every action of a view: catches helmet flicker
      // which a nonempty-frame/scale check alone cannot detect.
      for(let y=16;y<43;y++)for(let x=76;x<116;x++)for(let c=0;c<4;c++){
       const i=(y*192+x)*4+c;if(s.classId!=='warrior'&&a[i]!==idle[i])throw Error('Helmet changed during pose '+[tier,row,action,x,y]);
      }
      if(ink<2000)throw Error('Empty/incomplete figure');frames.add(f);cases++;
     }
    }
   }
   const counts=()=>({objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,listeners:s.events.listenerCount('shutdown')});
   const before=counts();for(let i=0;i<12;i++){const t=i%2?'basic':'none';actor.setEquipmentLook({helmet:t,torso:t,legs:t,boots:t,gloves:t});actor.setWeaponLook(i%2?'current':'starter');actor.update(position.x,position.y,Math.PI/2,false);}
   const after=counts();remote.destroy();
   s.setPlaytestAppearance({helmet:'none',torso:'none',legs:'none',boots:'none',gloves:'none'});s.setPlaytestWeapon('starter');actor.update(position.x,position.y,Math.PI/2,false);
   const visible=s.player.view.list.filter(v=>v.visible).map(v=>v.type);
   const source=actor.body.texture.getSourceImage();
   window.qaAtlas=source.toDataURL();
   return{classId:s.classId,sex:s.player.sex,cases,frames:frames.size,visible,before,after,remainingActorTextures:s.textures.getTextureKeys().filter(k=>k.startsWith('complete-dressed-')).length};
  });
  assert.equal(result.cases,384);assert.equal(result.frames,32);assert.deepEqual(result.visible,['Image']);assert.deepEqual(result.after,result.before);assert.equal(result.remainingActorTextures,1);
  report.actors.push(result);
  const atlas=await p.evaluate(()=>window.qaAtlas);await writeFile(`${out}/${cls}-${sex}.png`,Buffer.from(atlas.split(',')[1],'base64'));
  await p.waitForTimeout(50);await p.screenshot({path:`${out}/${cls}-${sex}-game.png`});
  console.log('Complete',cls,sex,result.cases);
  await S(s=>s.scene.resume());
  if(sex==='female'){
   const start=await S(s=>s.player.position.x);await p.mouse.move(900,350);await p.keyboard.down('d');await p.waitForTimeout(260);await p.keyboard.up('d');assert.ok(await S(s=>s.player.position.x)>start+20);
   await p.mouse.click(900,350);await p.waitForTimeout(700);
   await p.keyboard.down('q');await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').charge.phase==='CHARGING');assert.equal(await S(s=>Number(s.player.view.getData('completeActor').body.frame.name)%4),3);await p.keyboard.up('q');
   await p.waitForTimeout(600);await p.keyboard.press('Space',{delay:40});assert.ok(await S(s=>s.player.isDashing||s.player.dashProgress<.2));
   report.checks.push(`${cls}: actual WASD/mouse/basic/Q hold-release/Dash; whole pose remains upright`);
  }
 }
 // Selection also uses these complete frames; class/sex switching is actual UI.
 await p.goto(`${base}/campaign-playtest.html`);await p.locator('[data-shell=play]').click();await p.locator('[data-shell=new-game]').click();
 await p.locator('[data-shell=choose-warrior]').click();
 for(const sex of ['male','female']){
  await p.locator('[name=character-sex]').selectOption(sex);await p.waitForFunction(()=>document.querySelectorAll('canvas[data-representation=complete]').length===4);await p.waitForTimeout(4200);
  assert.equal(await p.locator('.showcase-caption').filter({hasText:'INDISPONÍVEL'}).count(),0);
  await p.screenshot({path:`${out}/selector-${sex}.png`});
 }
 report.checks.push('Four complete-figure previews, both presentations; no anatomical parts fetched by selector');
 await p.goto(`${base}/character-cohesion.html?class=hunter&sex=female`);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.getData('completeActor'));
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:`${out}/resolution-${width}.png`});}
 await p.setViewportSize({width:1280,height:720});await p.evaluate(()=>{window.qaPad.connected=true;window.qaPad.axes=[1,0,0,1];});const before=await S(s=>s.player.position.x);await p.waitForTimeout(300);assert.ok(await S(s=>s.player.position.x)>before+20);await p.evaluate(()=>{window.qaPad.connected=false;});
 await p.touchscreen.tap(420,230);await p.locator('[data-action=attack]').tap();assert.equal(await S(s=>s.controls.inputMethod),'touch');report.checks.push('Four resolutions, real touch event and gamepad axes mock');
 await p.waitForTimeout(2000);report.performance=await S(s=>({fps:s.game.loop.actualFps,objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,actorTextures:s.textures.getTextureKeys().filter(k=>k.startsWith('complete-dressed-')).length}));
 assert.equal(await p.evaluate(()=>localStorage.getItem('complete-save-sentinel')),'preserve');assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.passed=true;
}catch(error){report.failure=String(error);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}
finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();console.log(JSON.stringify({passed:report.passed,failure:report.failure,performance:report.performance}));}
