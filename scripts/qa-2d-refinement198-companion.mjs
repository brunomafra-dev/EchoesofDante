import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/companion';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'}),report={passed:false,base,checks:[],errors:[],fixture:'Explicit native lab button simulates recon/survival research completed. Signal remains pending; no boss victory simulated.'};p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const click=id=>p.locator(`[data-shell="${id}"]`).click();
const review=()=>p.evaluate(()=>window.__dante2dReview());
async function home(){await p.keyboard.press('Escape');await click('home');await click('play');await click('continue');await click('edit-appearance');}
async function journey(){return p.evaluate(()=>{const state=window.__dante2dReview(),id=state.profile.id;return localStorage.getItem('echoes-of-dante.journey.v1.character.'+id);});}
try{
 await p.addInitScript(()=>{for(const k of ['echoes-of-dante.characters.v1','echoes-of-dante.journey.v1'])if(!localStorage[k])localStorage[k]='protected-companion-save';});
 await p.goto(base+'/campaign-playtest.html?refinement=198');await click('play');await click('new-game');await click('choose-xenobinder');await p.locator('[name=character-name]').fill('Vinculo QA');await click('create');await click('difficulty-normal');await click('prologue-skip');await p.waitForFunction(()=>window.__dante2dReview?.().companion);
 assert.equal((await review()).companion.species,'symbiont');await home();
 assert.equal(await p.locator('[name=companion-species] option[value=hollow]').evaluate(el=>el.disabled),true);await click('cancel-appearance');await click('play-character');await p.waitForFunction(()=>window.__dante2dReview?.().companion);
 await p.locator('.campaign-lab-help').evaluate(el=>el.open=true);await p.locator('[data-refinement=bond]').click();await p.locator('.campaign-lab-help').evaluate(el=>el.open=false);await p.waitForTimeout(350);await home();
 assert.equal(await p.locator('[name=companion-species] option[value=hollow]').evaluate(el=>el.disabled),false);const before=await journey();
 await p.locator('[name=companion-species]').selectOption('hollow');await p.locator('[name=appearance-head]').selectOption('stellar');await p.locator('[name=appearance-hair]').selectOption('copper');await p.waitForFunction(()=>document.querySelector('.character-appearance-dialog canvas')?.dataset.demoPhase==='idle');await p.screenshot({path:out+'/editor-hollow.jpg',type:'jpeg',quality:90});await click('cancel-appearance');
 assert.equal((await review()).profile.companion,'symbiont');assert.equal(await journey(),before);report.checks.push('Second species is locked before research; explicit isolated research unlocks it. Cancelling changes neither profile nor journey.');
 await click('edit-appearance');await p.locator('[name=companion-species]').selectOption('hollow');await p.locator('[name=appearance-skin]').selectOption('warm');await click('save-appearance');assert.equal((await review()).profile.companion,'hollow');assert.equal(await journey(),before);
 await click('play-character');await p.waitForFunction(()=>window.__dante2dReview?.().companion?.species==='hollow');await p.keyboard.down('d');await p.waitForTimeout(600);await p.keyboard.up('d');await p.screenshot({path:out+'/world-hollow.jpg',type:'jpeg',quality:90});
 await p.reload();await click('play');await click('continue');await click('play-character');await p.waitForFunction(()=>window.__dante2dReview?.().companion?.species==='hollow');report.checks.push('Save changes only presentation; world and reload show one active Hollow companion, with its own source poses.');
 if(await p.evaluate(()=>!!window.__danteGame)){
  report.combat=await p.evaluate(async()=>{
   const{XenobinderCombat}=await import('/src/combat/XenobinderCombat.ts'),{Health}=await import('/src/combat/Health.ts'),scene=window.__danteGame.scene.getScene('Game'),results=[];
   for(const species of ['symbiont','hollow']){
    const x=new XenobinderCombat(scene,()=>0,{x:0,y:0});x.setSpecies(species);const target={position:{x:150,y:0},radius:18,health:new Health(500),isDead:false},owner={x:0,y:0},bounds={left:-1000,right:2000,top:-1000,bottom:2000};const hit=(e,damage)=>e.health.damage(damage);
    x.fire(0,owner,0);for(let i=0;i<70;i++)x.update(i*20,.02,owner,0,false,[target],[],bounds,hit,[]);
    const assist={hp:target.health.current,bond:x.bond};x.clear();x.bond=100;Object.assign(x.position,{x:0,y:0});const commandTarget={position:{x:210,y:0},radius:18,health:new Health(500),isDead:false},ally={position:{x:380,y:0},health:{current:50,max:100},isDead:false};x.command(2000,owner,0,1,[],bounds);const frames=new Set();for(let i=0;i<55;i++){x.update(2000+i*20,.02,owner,0,false,[commandTarget],[],bounds,hit,[ally]);frames.add(Number(x.body.frame.name));}
    const record={species,assist,commandHp:commandTarget.health.current,heal:ally.health.current,texture:x.body.texture.key,frames:[...frames]};x.destroy();results.push(record);
   }return results;
  });
  const[a,b]=report.combat;assert.deepEqual(a.assist,b.assist);assert.equal(a.commandHp,b.commandHp);assert.equal(a.heal,b.heal);assert.equal(b.texture,'finish-hollow');assert.ok(b.frames.every(f=>f>=0&&f<=5));assert.ok(b.commandHp<500&&b.heal>50);report.checks.push('Both species preserve actual assist/command damage and bounded recovery; Hollow maps only the six existing poses. DEV targets/ticks are explicit combat fixtures.');
 }
 assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.journey.v1']]),['protected-companion-save','protected-companion-save']);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:90}).catch(()=>{});throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('2D companion',report.passed,report.checks);}
