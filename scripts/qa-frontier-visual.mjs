import {chromium}from'playwright';
import {mkdir,writeFile}from'node:fs/promises';
import assert from'node:assert/strict';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',out=process.env.QA_OUT??'docs/frontier-3d/qa/0.1.184/visual';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1440,height:900}}),r={base,at:new Date().toISOString(),errors:[],quality:[],method:'Native options controls, read-only runtime counters. Stationary trial scene; not a physical phone benchmark or a human visual approval.'};p.on('pageerror',e=>r.errors.push(e.message));
try{
 await p.goto(base+'/frontier-3d.html?inspect=1&v=0.1.184');await p.locator('#start:enabled').waitFor({timeout:90000});await p.locator('#start').click();
 r.device=await p.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),debug=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio};});
 for(const quality of['balanced','low','high']){await p.locator('#menu').click();await p.locator('#quality').selectOption(quality);await p.locator('#resume').click();await p.waitForTimeout(1000);const samples=[];for(let i=0;i<5;i++){await p.waitForTimeout(600);samples.push(await p.evaluate(()=>{const s=window.__frontier3d();return{fps:s.fps,drawCalls:s.drawCalls,triangles:s.triangles,textures:s.textures,geometries:s.geometries};}));}r.quality.push({quality,samples});await p.screenshot({path:out+'/'+quality+'.jpg'});}
 assert.ok(r.quality[1].samples[0].drawCalls<r.quality[0].samples[0].drawCalls,'Low quality disables shadow rendering');assert.deepEqual(r.errors,[]);r.passed=true;
}finally{await writeFile(out+'/report.json',JSON.stringify(r,null,2)+'\n');await browser.close();}
