import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/204/library-link';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),report={passed:false,base,checks:[],errors:[],fixture:'Opens the registered library link in an isolated browser. Does not create a profile, change progress, or simulate a boss win.'};
try{
 const library=await browser.newPage({reducedMotion:'reduce'});await library.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='canonical-profile';localStorage['echoes-of-dante.journey.v1']='canonical-journey';});
 library.on('pageerror',e=>report.errors.push(e.message));library.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await library.goto(base+'/test-library.html');
 const link=library.locator('a.launch').filter({hasText:'Testar Pioneira como Manipuladora Astral'});assert.equal(await link.count(),1);
 const href=await link.getAttribute('href');assert.match(href,/refinement=204/);assert.match(href,/preset=warrior/);assert.match(href,/class=astral/);assert.match(href,/sex=female/);
 await library.goto(new URL(href,base).href);await library.waitForFunction(()=>document.querySelector('.hero-preview-host canvas')?.__previewRead?.().ready);
 const preview=await library.locator('.hero-preview-host canvas').evaluate(canvas=>canvas.__previewRead());
 assert.equal(preview.sex,'female');assert.equal(preview.visualPreset,'warrior');assert.equal(preview.identity,'astral');assert.equal(await library.locator('.hero-creation').getAttribute('data-available'),'true');
 assert.deepEqual(await library.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.journey.v1']]),['canonical-profile','canonical-journey']);
 await library.screenshot({path:out+'/pioneira-astral-link.jpg',type:'jpeg',quality:88});report.checks.push({href,preview,profileCreated:false,progressChanged:false});assert.deepEqual(report.errors,[]);report.passed=true;await library.close();
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('204 library link',report.passed);}
