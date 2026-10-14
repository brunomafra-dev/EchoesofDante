import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/caster-motion-audit/revision-02/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),report={method:'Chrome; paused DEV fixtures for joint PAINT alpha, uniform scaling, forearm/muzzle alignment, bones and wardrobe, then actual WASD/mouse/Space/Q gameplay and menu. No physical or human approval.',errors:[],cases:[],walking:[]};
const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
const S=(code,arg)=>p.evaluate(({code,arg})=>new Function('s','arg',code)(window.__danteGame.scene.getScene('Game'),arg),{code,arg});
async function open(cls,sex){await p.goto(`http://localhost:5184/${cls==='astral'?'astral':'xenobinder'}-playtest.html?sex=${sex}&kit=initial&motion=1`);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);await p.locator('.threat-lab').evaluate(e=>e.open=false);await S('s.enemies.forEach(e=>e.update=()=>{});s.player.invulnerableUntil=0;s.player.view.setAlpha(1)');}
async function capture(name){const clip=await S('const c=s.cameras.main,b=document.querySelector("canvas").getBoundingClientRect(),k=b.width/1280;return {x:b.x+(s.player.position.x-c.scrollX-95)*k,y:b.y+(s.player.position.y-c.scrollY-110)*k,width:190*k,height:180*k}');await p.screenshot({path:`${out}/${name}.png`,clip});}
try{
 report.continuity=await p.goto('http://localhost:5184/astral-playtest.html?kit=initial').then(()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active)).then(()=>p.evaluate(async()=>{const {casterTargets}=await import('/src/visual/CasterPose.ts');const make=()=>({shoulder:{x:0,y:0},elbow:{x:0,y:0},wrist:{x:0,y:0}});const main=make(),other=make();let max=0,previous;for(let i=0;i<=360;i++){casterTargets(-15,-39,15,-39,i*Math.PI/180,false,false,0,main,other);if(previous)max=Math.max(max,Math.hypot(main.wrist.x-previous.x,main.wrist.y-previous.y));previous={...main.wrist}}return {maxWristStepPerDegree:max}}));assert.ok(report.continuity.maxWristStepPerDegree<2,JSON.stringify(report.continuity));
 for(const cls of['astral','xenobinder'])for(const sex of['male','female']){
  await open(cls,sex);
  const matrix=await p.evaluate(async()=>{
   const s=window.__danteGame.scene.getScene('Game'),a=s.astralArt??s.xenoArt,{CASTER_INSTRUMENTS}=await import('/src/visual/CasterPose.ts');s.scene.pause();
   const angles=[0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI,-Math.PI*3/4,-Math.PI/2,-Math.PI/4],records=[];
   const pixelSources=new Map();
   const alpha=(sprite,point)=>{const source=sprite.texture.getSourceImage();let ctx=pixelSources.get(source);if(!ctx){const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);pixelSources.set(source,ctx)}const dx=point.x-sprite.x,dy=point.y-sprite.y,c=Math.cos(sprite.rotation),sin=Math.sin(sprite.rotation);let x=(dx*c+dy*sin)/sprite.scaleX+sprite.originX*sprite.frame.width,y=(-dx*sin+dy*c)/sprite.scaleY+sprite.originY*sprite.frame.height;if(sprite.flipX)x=sprite.frame.width-x;if(sprite.flipY)y=sprite.frame.height-y;return ctx.getImageData(sprite.frame.cutX+Math.round(x),sprite.frame.cutY+Math.round(y),1,1).data[3]};
   const checks=()=>{
    const body=a.body,ctx=body.texture.context,root=(l)=>{const x=Math.round((l.x-body.x)/body.scaleX*(body.flipX?-1:1)+128),y=Math.round((l.y-body.y)/body.scaleY+128);return ctx.getImageData(body.frame.cutX+x,body.frame.cutY+y,1,1).data[3]};
    const lengths=[a.main,a.other].flatMap(v=>[Math.hypot(v.elbow.x-v.shoulder.x,v.elbow.y-v.shoulder.y),Math.hypot(v.wrist.x-v.elbow.x,v.wrist.y-v.elbow.y)]);
    const p=CASTER_INSTRUMENTS[s.classId][a.style],left=a.gauntlet.flipY,dx=(p.muzzle.x-p.wrist.x)*a.gauntlet.scaleX,dy=(p.muzzle.y-p.wrist.y)*a.gauntlet.scaleY*(left?-1:1),angle=Math.atan2(dy,dx)+a.gauntlet.rotation;
    const join=Math.hypot(a.limbs[1].x-a.main.elbow.x,a.limbs[1].y-a.main.elbow.y)+Math.hypot(a.limbs[3].x-a.other.elbow.x,a.limbs[3].y-a.other.elbow.y)+Math.hypot(a.freeHand.x-a.other.wrist.x,a.freeHand.y-a.other.wrist.y)+Math.hypot(a.gauntlet.x-a.main.wrist.x,a.gauntlet.y-a.main.wrist.y);
    const aiming=Math.atan2(Math.sin(angle-window.qaAngle),Math.cos(angle-window.qaAngle));
    const hash=(frame)=>{const data=ctx.getImageData(frame%5*256,Math.floor(frame/5)*256,256,132).data;let n=0;for(let i=0;i<data.length;i++)n=(n*31+data[i])|0;return n};
    const uniform=[...a.limbs,a.freeHand,a.gauntlet].every(p=>Math.abs(p.scaleX-p.scaleY)<.00001);
    const fa=Math.atan2(a.main.wrist.y-a.main.elbow.y,a.main.wrist.x-a.main.elbow.x)-window.qaAngle;
    const painted=[alpha(a.limbs[0],a.main.shoulder),alpha(a.limbs[0],a.main.elbow),alpha(a.limbs[1],a.main.elbow),alpha(a.limbs[1],a.main.wrist),alpha(a.limbs[2],a.other.shoulder),alpha(a.limbs[2],a.other.elbow),alpha(a.limbs[3],a.other.elbow),alpha(a.limbs[3],a.other.wrist),alpha(a.freeHand,a.other.wrist),alpha(a.gauntlet,a.main.wrist)];
    const foreAim=Math.abs(Math.atan2(Math.sin(fa),Math.cos(fa)));
    const row=Math.floor(Number(body.frame.name)/5);return {uniform,foreAim,painted,roots:[root(a.limbs[0]),root(a.limbs[2])],lengths,join,aimError:Math.abs(aiming),upperStable:hash(Number(body.frame.name))===hash(row*5),frame:Number(body.frame.name),bodyRotation:s.player.view.rotation,freeHand:a.freeHand.frame.name,behind:s.player.view.list.indexOf(a.limbs[0])<s.player.view.list.indexOf(body),weapon:a.gauntlet.texture.key};
   };
   for(const tier of['none','basic','reinforced'])for(const weapon of['starter','current','advanced']){
    a.setEquipmentLook({helmet:tier,torso:tier,legs:tier,boots:tier,gloves:tier});a.setWeaponLook(weapon);
    for(const aim of angles){window.qaAngle=aim;
     for(const mode of['idle','fire','hold','release']){a.update(0,0,aim,mode==='fire',false,{phase:mode==='hold'?'CHARGING':mode==='release'?'RELEASE':'READY',level:.7},'water');records.push({tier,weapon,aim,mode,...checks()});}
     for(let f=0;f<4;f++){a.travel=f*26+5;a.previous.x=a.previous.y=0;a.update(Math.cos(aim),Math.sin(aim),aim,false,false,{phase:'READY',level:0},'water');records.push({tier,weapon,aim,mode:'walk',...checks()});}
    }
   }
   a.setEquipmentLook({helmet:'reinforced',torso:'basic',legs:'none',boots:'reinforced',gloves:'none'});a.update(0,0,0,false,false,{phase:'READY',level:0},'water');window.qaAngle=0;const mixed=checks();
   s.scene.resume();return{classId:s.classId,sex:s.player.sex,records,mixed};
  });
  for(const c of [...matrix.records,matrix.mixed]){assert.ok(c.roots.every(v=>v>140),JSON.stringify(c));assert.ok(c.lengths.every((v,i)=>Math.abs(v-(i%2?15:18))<.01),JSON.stringify(c));assert.ok(c.join<.01);assert.equal(c.uniform,true,JSON.stringify(c));assert.ok(c.foreAim<.001,JSON.stringify(c));assert.ok(c.painted.every(v=>v>140),JSON.stringify(c));assert.ok(c.aimError<.001);assert.equal(c.upperStable,true,JSON.stringify(c));assert.equal(c.bodyRotation,0);}
  assert.ok(matrix.records.filter(c=>c.mode==='walk').every(c=>c.frame%5>0));
  report.cases.push({classId:cls,sex,checks:matrix.records.length,mixed:matrix.mixed,minRootAlpha:Math.min(...matrix.records.flatMap(c=>c.roots)),maxAimError:Math.max(...matrix.records.map(c=>c.aimError)),maxJointError:Math.max(...matrix.records.map(c=>c.join)),minPaintedJointAlpha:Math.min(...matrix.records.flatMap(c=>c.painted)),noStretchedParts:matrix.records.every(c=>c.uniform),maxForearmAimError:Math.max(...matrix.records.map(c=>c.foreAim))});
  await S('const a=s.astralArt??s.xenoArt;a.setEquipmentLook({helmet:"none",torso:"none",legs:"none",boots:"none",gloves:"none"});a.setWeaponLook("starter");s.controls.aimFrom=()=>Math.PI/2');await p.waitForTimeout(150);await capture(`${cls}-${sex}-front`);
  await S('s.controls.aimFrom=()=>-Math.PI/2');await p.waitForTimeout(100);await capture(`${cls}-${sex}-back`);
  await S('s.controls.aimFrom=()=>0');await p.waitForTimeout(100);await capture(`${cls}-${sex}-side`);
  // Keep the real environment; locate an open 280-unit segment for the input audit.
  await S('const b=s.movementBounds??{left:56,right:2544,top:56,bottom:1644};let point;for(let y=b.top+150;y<b.bottom-150&&!point;y+=100)for(let x=b.left+150;x<b.right-500&&!point;x+=100){const clear=s.arena.obstacles.every(o=>{const t=Math.max(0,Math.min(1,(o.x-x)/300));return Math.hypot(o.x-x-t*300,o.y-y)>o.radius+s.player.radius+10});if(clear)point={x,y}}if(!point)throw Error("No clear walk segment");Object.assign(s.player.position,point);');await p.waitForTimeout(150);
  const frames=[];await p.keyboard.down('d');for(let i=0;i<18;i++){await p.waitForTimeout(40);frames.push(await S('return Number((s.astralArt??s.xenoArt).body.frame.name)%5'));}await p.keyboard.up('d');await p.waitForTimeout(120);assert.equal(await S('return Number((s.astralArt??s.xenoArt).body.frame.name)%5'),0);assert.deepEqual([...new Set(frames)].sort(),[1,2,3,4]);
  await p.keyboard.down('a');await p.waitForTimeout(200);await p.keyboard.up('a');await p.keyboard.press('Space');await p.waitForTimeout(400);
  await p.keyboard.down('q');await p.waitForTimeout(450);assert.equal(await S('return s.charge.phase'),'CHARGING');assert.equal(await S('return Number((s.astralArt??s.xenoArt).body.frame.name)%5'),0);await p.keyboard.down('d');const hold=await S('return {...s.player.position}');await p.waitForTimeout(200);await p.keyboard.up('d');assert.ok(await S('return Math.hypot(s.player.position.x-arg.x,s.player.position.y-arg.y)<1',hold));await capture(`${cls}-${sex}-hold`);await p.keyboard.up('q');await p.waitForTimeout(500);
  report.walking.push({classId:cls,sex,frames:[...new Set(frames)],stopIdle:true,holdStationary:true});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log(report);
