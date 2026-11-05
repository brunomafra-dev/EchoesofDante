import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const version=process.env.QA_VERSION??'0.1.191';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',out=process.env.QA_OUT??'docs/frontier-3d/qa/0.1.191/entry';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome'});
const report={passed:false,base,at:new Date().toISOString(),method:'Normal main-menu navigation into 3D and return in the same tab; native mouse/keyboard/touch and mocked standard gamepad. Isolated browser profiles only. No campaign requirement or boss completion injected.',fixtures:['Valid campaign character registry and an opaque journey marker used only to check byte preservation, never loaded as campaign gameplay.'],checks:[],errors:[]};
const registry=JSON.stringify({schema:1,selected:'qa191-hero',characters:[{id:'qa191-hero',name:'Explorador QA',classId:'warrior',sex:'male',createdAt:1793836800000}]}),journey=JSON.stringify({qa191:'protected-journey-bytes'});
const keys=['echoes-of-dante.characters.v1','echoes-of-dante.journey.v1.character.qa191-hero'];
async function unchanged(p){assert.deepEqual(await p.evaluate(keys=>keys.map(key=>localStorage.getItem(key)),keys),[registry,journey]);}
async function pressPad(p,index){await p.evaluate(index=>{window.__entryPad.buttons[index]={pressed:true,value:1};},index);await p.waitForTimeout(110);await p.evaluate(index=>{if(window.__entryPad)window.__entryPad.buttons[index]={pressed:false,value:0};},index);await p.waitForTimeout(110);}
try{
 for(const [name,width,height,input]of [['mouse',1440,900,'mouse'],['keyboard',1280,720,'keyboard'],['touch-landscape',844,390,'touch'],['touch-portrait',393,852,'touch'],['gamepad',1280,720,'gamepad']]){
  const p=await browser.newPage({viewport:{width,height},isMobile:input==='touch',hasTouch:input==='touch'});p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript(({keys,registry,journey})=>{if(!localStorage.getItem('qa191-initialized')){localStorage.setItem(keys[0],registry);localStorage.setItem(keys[1],journey);localStorage.setItem('qa191-initialized','yes');}},{keys,registry,journey});
  await p.goto(base+'/?v='+version,{waitUntil:'domcontentloaded'});const link=p.locator('[data-shell="experience-3d"]');await link.waitFor();assert.equal(await link.innerText(),'Experiência 3D');
  if(input==='touch'&&width<height){await p.locator('[data-mobile="continue"]').tap();report.checks.push('Portrait: dismissed the existing orientation prompt using Continue in browser.');}
  const bounds=await link.boundingBox();assert.ok(bounds.height>=44&&bounds.width>=44);assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);await unchanged(p);await p.screenshot({path:out+'/'+name+'-menu.jpg'});
  if(input==='keyboard'){await p.locator('[data-shell="play"]').focus();await p.keyboard.press('Tab');assert.ok(await link.evaluate(e=>e===document.activeElement));await p.keyboard.press('Enter');}
  else if(input==='gamepad'){await p.evaluate(()=>{window.__entryPad={id:'QA standard gamepad',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.__entryPad]});});await p.locator('[data-shell="play"]').focus();await pressPad(p,13);assert.ok(await link.evaluate(e=>e===document.activeElement));await pressPad(p,0);}
  else if(input==='touch')await link.tap();else await link.click();
  await p.waitForURL('**/arrival-3d.html?v='+version);await p.locator('#start:enabled').waitFor({timeout:120000});await unchanged(p);await p.screenshot({path:out+'/'+name+'-creator.jpg'});
  if(input==='mouse'){
   await p.locator('#start').click();await p.locator('#menu:visible').waitFor();await p.keyboard.down('KeyW');await p.waitForTimeout(250);await p.keyboard.up('KeyW');await p.locator('#menu').click();await p.locator('#options[open]').waitFor();await unchanged(p);
   await p.locator('#options').getByRole('link',{name:'Voltar ao Echoes',exact:true}).click();
  }else{const back=p.locator('#editor').getByRole('link',{name:'Voltar ao Echoes',exact:true});if(input==='touch')await back.tap();else await back.click();}
  await p.waitForURL(url=>url.pathname==='/'&&!url.search);await p.locator('[data-shell="experience-3d"]').waitFor();await unchanged(p);
  assert.equal(p.context().pages().length,1,'Same-tab access avoids a second running game');report.checks.push({name,viewport:[width,height],campaignBytesPreserved:true,sameTab:true,returnFrom:input==='mouse'?'gameplay pause':'creator'});await p.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.stack;console.error(e);for(const p of browser.contexts().flatMap(c=>c.pages()))await p.screenshot({path:out+'/failure.jpg'}).catch(()=>{});process.exitCode=1;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(report.passed?'ENTRY191 PASS':'ENTRY191 FAIL');}
