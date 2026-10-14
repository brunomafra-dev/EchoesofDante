import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/caster-motion-audit/public',base=process.argv[3]??'https://echosofdante.vercel.app/';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),p=await browser.newPage({viewport:{width:1280,height:720}});
const report={at:new Date().toISOString(),base,method:'Production UI, actual keyboard/mouse, request/texture validation; no DEV scene hooks, no physical hardware.',errors:[],cases:[],assets:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
try{
 for(const cls of ['astral','xenobinder'])for(const sex of ['male','female']){
  await p.goto(`${base}${cls}-playtest.html?sex=${sex}&kit=initial&motion=1&v=0.1.97`,{waitUntil:'domcontentloaded',timeout:90000});
  await p.locator(cls==='astral'?'.astral-panel':'.xenobinder-panel').waitFor();
  assert.ok((await p.locator('.threat-lab summary').innerText()).includes('MOVIMENTO'));
  await p.locator('.threat-lab').evaluate(e=>e.open=false);
  await p.mouse.move(850,350);await p.keyboard.down('d');await p.waitForTimeout(180);await p.mouse.down();await p.waitForTimeout(250);await p.mouse.up();await p.keyboard.up('d');
  await p.keyboard.down('q');await p.waitForTimeout(450);await p.mouse.move(450,530);await p.waitForTimeout(100);await p.screenshot({path:`${out}/${cls}-${sex}-hold.png`});await p.keyboard.up('q');await p.waitForTimeout(350);await p.keyboard.press('Space');
  assert.equal(await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);
  report.cases.push({cls,sex,loaded:true,controlsUsed:['WASD','mouse','LMB','Q hold/aim/release','Space'],temporaryStorage:true});
 }
 for(const cls of ['astral','xenobinder'])for(const sex of ['male','female'])for(const style of ['none','basic','reinforced']){
  const src=base+`assets/visual/characters/wardrobe-${cls}-${sex}-${style}.png`;
  const size=await p.evaluate(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve({width:i.width,height:i.height});i.onerror=reject;i.src=src}),src);
  assert.deepEqual(size,{width:1280,height:768});report.assets.push({src,size});
 }
 const reg=await p.request.get(base+'assets/visual/characters/caster-arm-registration.json');assert.equal(reg.status(),200);assert.equal(Object.keys(await reg.json()).length,6);
 await p.goto(base+'test-library.html');assert.ok((await p.locator('body').innerText()).includes('0.1.97'));
 assert.deepEqual(report.errors,[]);report.soloPassed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log({base,soloPassed:report.soloPassed,cases:report.cases.length,atlases:report.assets.length,errors:report.errors});
