// Smoke test against npm run build + Vite preview (no DEV hook).
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5186/';
const out = process.argv[3] ?? 'docs/warrior-quality-reference/qa-production.json';
const browser = await chromium.launch({channel:'chrome',headless:true});
const report = [];
try {
  for (const route of ['', 'quality-reference.html', 'quality-reference.html?warrior=original', 'quality-reference.html?baseline=1', 'rendering-lab.html']) {
    const page = await browser.newPage({viewport:{width:1280,height:720}}), errors = [], requested = [];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
    page.on('request',r=>{if(r.url().includes('warrior-poses-'))requested.push(r.url());});
    await page.goto(`${base}${route}`); await page.waitForSelector('canvas'); await page.waitForTimeout(2500);
    const devHook = await page.evaluate(()=>Boolean(window.__danteGame)); assert.equal(devHook,false);
    const newArt = route === '' || route === 'quality-reference.html';
    assert.equal(requested.length,newArt?3:0); assert.deepEqual(errors,[]);
    report.push({route,devHook,newArtLoaded:newArt,assetRequests:requested.length,errors});
    await page.close();
  }
  await mkdir(out.replace(/[/\\][^/\\]+$/,''),{recursive:true});
  await writeFile(out,JSON.stringify({method:'Chrome headless production smoke; no physical playtest',passed:true,routes:report},null,2));
  console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
