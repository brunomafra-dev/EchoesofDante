// Production smoke: loaded assets and input/error handling, no DEV state assertions.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5175/';
const out=process.argv[3]??'docs/expansion-sprint-02';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],loaded=new Set();
try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const assets=['dante-skitter-motion.png','dante-spitter-motion.png','exterior-outcrop.png','ancient-approach.png','exterior-atmosphere.png','first-echo-archive.png','sealed-threshold.png','open-threshold.png','warden-motion.png','cavern-soil.png','terrain-blend.png','guardian-lintel-closed.png','guardian-lintel-open.png'];
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);if(assets.includes(r.url().split('/').at(-1))&&r.ok())loaded.add(r.url().split('/').at(-1));});
  await page.goto(base);await page.locator('canvas').waitFor({state:'visible'});await page.waitForTimeout(3000);
  await page.keyboard.down('d');await page.waitForTimeout(200);await page.keyboard.up('d');
  await page.mouse.click(960,450);await page.keyboard.press('Space');
  await page.keyboard.down('q');await page.waitForTimeout(350);await page.keyboard.up('q');await page.keyboard.press('e');await page.waitForTimeout(700);
  assert.equal(loaded.size,assets.length);assert.equal(await page.evaluate(()=>typeof window.__danteGame),'undefined');assert.equal(errors.length,0);
  await page.screenshot({path:`${out}/production-forest.png`});
  const report={method:'Chrome headless production smoke; full gameplay assertions recorded by DEV QA',canvasVisible:true,loadedAssets:[...loaded],devHookAbsent:true,inputSent:['D','LMB','Space','Q hold/release','E'],errors};
  await writeFile(`${out}/production-checks.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
