import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/effects';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'}),report={passed:false,base,checks:[],elements:[],errors:[],method:'Native selector replay uses actual class combat. Preview read hook exists only in the isolated refinement laboratory; no damage/progression controls.'};p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
try{
 await p.goto(base+'/campaign-playtest.html?refinement=198');await p.locator('[data-shell=play]').click();await p.locator('[data-shell=new-game]').click();await p.locator('[data-shell=choose-astral]').click();
 const state=()=>p.locator('[data-class=astral] canvas').evaluate(c=>c.__previewRead());await p.waitForFunction(()=>document.querySelector('[data-class=astral] canvas')?.__previewRead?.().ready);
 for(const element of ['energy','fire','water','earth']){
  await p.locator('[data-shell=replay]').click();await p.waitForFunction(()=>document.querySelector('[data-class=astral] canvas')?.dataset.demoPhase==='release');await p.waitForTimeout(250);
  const first=await state();assert.equal(first.hollow.texture,'finish-hollow');assert.equal(first.hollow.rotation,0);assert.ok(first.effects.some(f=>f.key===`pixelfx-${element}-field`),element+' actual visible field');await p.screenshot({path:`${out}/${element}-release.jpg`,type:'jpeg',quality:90});
  await p.waitForTimeout(180);const second=await state();assert.notDeepEqual(first.effects,second.effects,'Animated effect must advance');report.elements.push({element,first,second});
  await p.waitForFunction(()=>!document.querySelector('[data-class=astral] canvas')?.__previewRead?.().running);
 }
 report.checks.push('All four elemental fields use distinct live raster animations; current complete Hollow is upright in the same native combat preview.');
 if(await p.locator('[data-class=astral] canvas').evaluate(c=>!!c.__preview)){
  report.bossVisuals=await p.locator('[data-class=astral] canvas').evaluate(async c=>{
   const scene=c.__preview,{VesperFrost}=await import('/src/visual/VesperFrost.ts'),{SoterradoImpact}=await import('/src/visual/SoterradoImpact.ts');const frost=new VesperFrost(scene),earth=new SoterradoImpact(scene),now=scene.time.now;
   frost.impact(now,{x:520,y:400},1);frost.update(now+200);earth.show(now,{x:520,y:400},1);earth.update(now+200);
   const read=images=>images.filter(i=>i.visible).map(i=>({key:i.texture.key,frame:i.frame.name}));const result={frost:read(frost.coopObjects),earth:read(earth.coopObjects)};frost.clear();earth.clear();for(const image of[...frost.coopObjects,...earth.coopObjects])image.destroy();return result;
  });
  assert.ok(report.bossVisuals.frost.some(i=>i.key==='pixelfx-frost-shatter'));assert.ok(report.bossVisuals.earth.some(i=>i.key==='pixelfx-ground-impact'));report.checks.push('Boss presentation fixture advances existing impact pools to the new ice/earth frames; no boss AI, damage or victory is simulated by this fixture.');
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:85}).catch(()=>{});throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('2D effects',report.passed);}
