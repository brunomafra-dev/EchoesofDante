import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/astral/elemental-v2/qa/public';await mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),version:'0.1.91',method:'Published Vercel build in Chrome headless; real basic/charge controls and four resolutions. No physical devices.',errors:[],elements:[]},assets=new Set();
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(45000);
 p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());if(r.url().includes('/astral/')&&r.url().includes('-v2.png'))assets.add(r.url())});
 for(const element of ['fire','water','earth','energy']){
  await p.goto(`https://echosofdante.vercel.app/astral-playtest.html?element=${element}&kit=basic&v=0.1.91`,{waitUntil:'domcontentloaded',timeout:90000});
  await p.locator(`.astral-panel[data-element="${element}"]`).waitFor();await p.locator('.threat-lab').evaluate(e=>e.open=false);await p.waitForTimeout(350);
  await p.mouse.move(900,350);await p.mouse.click(900,350);await p.keyboard.down('q');await p.waitForTimeout(400);
  if(!await p.locator('.astral-panel').isDisabled())throw Error('Hold failed');await p.keyboard.up('q');await p.waitForTimeout(220);
  const energy=Number(await p.locator('.astral-panel meter').getAttribute('value'));if(energy>=75)throw Error('Release failed');
  report.elements.push({element,energy,label:await p.locator('.astral-panel span').textContent()});await p.screenshot({path:out+`/${element}.png`});
 }
 for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(150);if(await p.locator('canvas').count()!==1||await p.locator('.astral-panel').count()!==1)throw Error('Duplicated UI')}
 if(await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length)!==0)throw Error('Real save writes');if(report.errors.length)throw Error('JS/assets errors');if(assets.size!==12)throw Error('Missing V2 asset requests');report.loadedAtlases=assets.size;report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/solo.json',JSON.stringify(report,null,2));console.log(report);}
