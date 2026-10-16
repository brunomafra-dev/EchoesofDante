import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5184',out='docs/character-cohesion/qa';
await mkdir(out+'/after',{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={method:'Chrome; actual menu/input and paused visual fixtures, opaque attachment/scale checks and screenshots. No human approval or physical-device claim.',checks:[],errors:[],rigs:[],inputs:[]};
const check=t=>{report.checks.push(t);console.log(t)};
const button=(p,id)=>p.locator(`[data-shell="${id}"]`);
const scene=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','arg',code)(window.__danteGame.scene.getScene('Game'),arg),{code,arg});
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const watch=p=>{p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});};
try{
 const menu=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});watch(menu);
 await menu.addInitScript(()=>{localStorage.setItem('echoes-of-dante.characters.v1','REAL-SAVE-SENTINEL');});
 await menu.goto(base+'/campaign-playtest.html');await ready(menu);await button(menu,'play').click();await button(menu,'new-game').click();
 await button(menu,'choose-astral').click();await menu.locator('[name=character-sex]').selectOption('female');
 await menu.locator('[name=character-name]').pressSequentially('AL Gabi');
 await button(menu,'settings').click();await button(menu,'back').click();assert.equal(await menu.locator('[name=character-name]').inputValue(),'AL Gabi');assert.equal(await menu.locator('[name=character-sex]').inputValue(),'female');
 assert.equal(await button(menu,'choose-astral').getAttribute('aria-pressed'),'true');
 await button(menu,'create').click();assert.deepEqual(await menu.locator('.difficulty-choice').allTextContents(),['Fezes puríssima','Marromenos','Chama 🔥']);assert.equal(await button(menu,'start-new-game').count(),0);assert.equal(await menu.locator('[name=party-size]').count(),0);
 await button(menu,'back').click();assert.equal(await menu.locator('[name=character-name]').inputValue(),'AL Gabi');assert.equal(await menu.locator('[name=character-sex]').inputValue(),'female');
 await menu.waitForFunction(()=>[...document.querySelectorAll('.showcase-caption')].every(e=>!e.textContent.includes('INDISPONÍVEL')&&!e.textContent.includes('PREPARADO')));await menu.waitForTimeout(4000);
 await menu.screenshot({path:out+'/after/selection-female.png'});
 await button(menu,'create').click();await menu.screenshot({path:out+'/after/difficulty.png'});
 await button(menu,'difficulty-hard').evaluate(b=>{b.click();b.click();});await menu.locator('.prologue-video').waitFor();
 const registry=await menu.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')));assert.equal(registry.characters.length,1);assert.equal(registry.characters[0].campaign.difficulty,'hard');assert.equal(registry.characters[0].name,'AL Gabi');assert.equal(registry.characters[0].sex,'female');
 await button(menu,'prologue-skip').click();await menu.waitForFunction(()=>!document.querySelector('.application-shell').open);check('One difficulty click starts once; name/sex/class survive Back/Settings; A/L typing works; no extra confirm or party size on solo difficulty');
 await menu.goto(base+'/test-library.html');assert.equal(await menu.evaluate(()=>localStorage.getItem('echoes-of-dante.characters.v1')),'REAL-SAVE-SENTINEL');check('Reserved campaign test preserves real saves');
 const coop=await browser.newPage({viewport:{width:1280,height:720}});watch(coop);await coop.goto(base+'/campaign-playtest.html');await ready(coop);
 for(const id of ['play','coop','coop-new','choose-warrior'])await button(coop,id).click();await coop.locator('[name=character-name]').fill('Guilherme');await button(coop,'create').click();
 assert.equal(await button(coop,'difficulty-normal').count(),0);await coop.locator('[name=party-size]').selectOption('4');await button(coop,'choose-difficulty').click();assert.equal(await coop.locator('[name=party-size]').count(),0);
 await button(coop,'back').click();assert.equal(await coop.locator('[name=party-size]').inputValue(),'4');await button(coop,'back').click();assert.equal(await coop.locator('[name=character-name]').inputValue(),'Guilherme');
 await button(coop,'create').click();await button(coop,'choose-difficulty').click();await button(coop,'difficulty-normal').click();await coop.locator('.prologue-video').waitFor();await button(coop,'prologue-skip').click();await coop.locator('[name=coop-invite]').waitFor();
 const party=await coop.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters[0].campaign);assert.equal(party.size,4);assert.equal(party.mode,'coop');assert.equal(party.introSeen,true);check('Coop chooses size before difficulty, starts opening and opens real local lobby for four');await coop.close();
 const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});watch(p);
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const sex of ['male','female']){
  await p.goto(`${base}/character-cohesion.html?class=${cls}&sex=${sex}&weapon=starter`);await ready(p);await p.waitForTimeout(150);
  const result=await p.evaluate(async()=>{
   const s=window.__danteGame.scene.getScene('Game'),cls=s.classId,a=s.hunterArt??s.astralArt??s.xenoArt;
   s.scene.pause();const rows=[],sources=new Map(),anchor={...s.player.position};
   const context=source=>{let ctx=sources.get(source);if(!ctx){const c=document.createElement('canvas');c.width=source.width;c.height=source.height;ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);sources.set(source,ctx)}return ctx;};
   const limbs=()=>cls==='warrior'?[s.player.paintedArms.mainUpper,s.player.saberArm,s.player.supportUpperArm,s.player.supportArm]:cls==='hunter'?a.weapon.sleeves:a.limbs;
   const body=()=>cls==='warrior'?s.player.torso:a.body;
   const rootAlpha=(image)=>{const b=body(),x=(image.x-b.x)/b.scaleX*(b.flipX?-1:1)+128,y=(image.y-b.y)/b.scaleY+128;return (b.texture.context??context(b.texture.getSourceImage())).getImageData(b.frame.cutX+Math.round(x),b.frame.cutY+Math.round(y),1,1).data[3];};
   const render=(aim,mode)=>{const heavy={phase:mode==='hold'?'CHARGING':mode==='release'?'RELEASE':'READY',level:.75,swingProgress:.6},pose={phase:mode==='strike'?'SWING':'READY',relativeAngle:mode==='strike'?.4:-.42,worldAngle:aim+.4,swingProgress:.6};
    const walk=mode.startsWith('walk'),f=walk?Number(mode.slice(-1)):0,target={x:anchor.x+(walk?Math.cos(aim)*(f+1)*2:0),y:anchor.y+(walk?Math.sin(aim)*(f+1)*2:0)};
    if(walk)s.player.stepPhase=(f+.1)*Math.PI/2;
    s.player.renderRemote(target,aim,pose,heavy,mode==='dash',false);
    if(a&&walk){a.travel=(f+.1)*26;a.previous.x=target.x-Math.cos(aim);a.previous.y=target.y-Math.sin(aim);}
    a?.update(target.x,target.y,aim,mode==='strike',mode==='dash',heavy,'energy');
   };
   for(const tier of ['none','basic','reinforced','mixed']){
    const look=tier==='mixed'?{helmet:'reinforced',torso:'basic',legs:'none',boots:'reinforced',gloves:'none'}:{helmet:tier,torso:tier,legs:tier,boots:tier,gloves:tier};s.setPlaytestAppearance(look);
    for(const weapon of ['starter','current','advanced']){s.setPlaytestWeapon(weapon);
     for(let n=0;n<8;n++){const aim=n*Math.PI/4;
      for(const mode of ['idle','strike','hold','release','dash','walk0','walk1','walk2','walk3']){render(aim,mode);const parts=limbs();
       const atlas=s.cache.json.get(cls==='astral'||cls==='xenobinder'?'caster-arm-registration':'character-arm-registration');
       const opaque=parts.flatMap(l=>{const part=atlas[l.texture.key][Number(l.frame.name.slice(-1))],ctx=context(l.texture.getSourceImage());return[part.root,part.tip].map(p=>ctx.getImageData(l.frame.cutX+Math.round(p.x),l.frame.cutY+Math.round(p.y),1,1).data[3])});
       const hands=cls==='warrior'?[s.player.paintedArms.mainGlove,s.player.supportGlove]:cls==='hunter'?a.weapon.gloves:[a.freeHand,a.gauntlet];
       rows.push({tier,weapon,n,mode,roots:[rootAlpha(parts[0]),rootAlpha(parts[2])],paint:Math.min(...opaque),uniform:[...parts,...hands].every(l=>Math.abs(l.scaleX-l.scaleY)<1e-6),finite:parts.every(l=>[l.x,l.y,l.rotation,l.scaleX].every(Number.isFinite))});
      }
     }
    }
   }
   s.setPlaytestAppearance({helmet:'none',torso:'none',legs:'none',boots:'none',gloves:'none'});s.setPlaytestWeapon('starter');render(Math.PI/2,'idle');
   window.qaRigRender=render;
   return{classId:cls,cases:rows.length,minRoot:Math.min(...rows.flatMap(r=>r.roots)),minPaint:Math.min(...rows.map(r=>r.paint)),uniform:rows.every(r=>r.uniform),finite:rows.every(r=>r.finite),failures:rows.filter(r=>r.roots.some(v=>v<140)||r.paint<140||!r.uniform||!r.finite).slice(0,8)};
  });
  report.rigs.push({sex,...result});assert.equal(result.uniform,true,JSON.stringify(result));assert.equal(result.finite,true);assert.ok(result.minRoot>140,JSON.stringify(result));assert.ok(result.minPaint>140,JSON.stringify(result));
  for(const [label,aim]of [['front',Math.PI/2],['back',-Math.PI/2],['side',0],['hold',Math.PI/4]]){
   await p.evaluate(({aim,label})=>window.qaRigRender(aim,label==='hold'?'hold':'idle'),{aim,label});await p.waitForTimeout(50);
   const clip=await scene(p,'const c=s.cameras.main,b=s.game.canvas.getBoundingClientRect(),k=b.width/s.game.scale.width;return{x:b.x+(s.player.position.x-c.scrollX-95)*k,y:b.y+(s.player.position.y-c.scrollY-115)*k,width:190*k,height:195*k}');await p.screenshot({path:`${out}/after/${cls}-${sex}-${label}.png`,clip});
  }
  await scene(p,'s.scene.resume();s.player.invulnerableUntil=Infinity;s.controls.aimFrom=()=>0');
  await p.bringToFront();await p.keyboard.down('d');await p.waitForTimeout(250);await p.keyboard.up('d');await p.keyboard.press('Space');await p.waitForTimeout(400);await p.mouse.move(800,360);await p.mouse.click(800,360);await p.waitForTimeout(350);
  await p.keyboard.down('q');await p.waitForTimeout(350);assert.equal(await scene(p,'return s.charge.phase'),'CHARGING');await p.keyboard.up('q');await p.waitForTimeout(500);
  report.inputs.push({cls,sex,basic:true,holdRelease:true,dash:true});
 }
 check('Eight presentations: 3 weapons × 4 clothing/mixed kits × 8 aim directions × 9 action/walking poses; opaque sleeve/body joints and uniformly scaled arms/hands');
 for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080},{width:844,height:390}]){
  await menu.setViewportSize(viewport);await menu.goto(base+'/campaign-playtest.html');await ready(menu);await button(menu,'play').click();await button(menu,'new-game').click();await button(menu,'choose-xenobinder').click();await menu.locator('[name=character-name]').fill('Teste');await button(menu,'create').click();
  const easy=button(menu,'difficulty-easy');assert.ok(await easy.isVisible());await easy.tap();await menu.locator('.prologue-video').waitFor();await button(menu,'prologue-skip').tap();await menu.waitForFunction(()=>!document.querySelector('.application-shell').open);
 }
 check('Four target resolutions, touch starts from difficulty without extra confirmation');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error);throw error;}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
