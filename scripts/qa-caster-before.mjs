import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/caster-motion-audit/before';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),p=await browser.newPage({viewport:{width:1280,height:720}}),report={cases:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));
try{for(const cls of['astral','xenobinder'])for(const sex of['male','female']){
 await p.goto(`http://localhost:5184/${cls==='astral'?'astral':'xenobinder'}-playtest.html?kit=initial&sex=${sex}`);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);await p.locator('.threat-lab').evaluate(e=>e.open=false);
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});s.player.invulnerableUntil=Infinity;s.controls.aimFrom=()=>0;});
 for(const [name,angle]of[['right',0],['back',-Math.PI/2],['front',Math.PI/2]]){await p.evaluate(a=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>a,angle);await p.waitForTimeout(100);const clip=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),c=s.cameras.main,b=document.querySelector('canvas').getBoundingClientRect(),k=b.width/1280;return{x:b.x+(s.player.position.x-c.scrollX-90)*k,y:b.y+(s.player.position.y-c.scrollY-105)*k,width:180*k,height:175*k};});await p.screenshot({path:`${out}/${cls}-${sex}-${name}.png`,clip});}
 await p.keyboard.down('d');await p.waitForTimeout(250);report.cases.push(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),a=s.astralArt??s.xenoArt;return{classId:s.classId,sex:s.player.sex,limbs:a.limbs.map(l=>({x:l.x,y:l.y,rotation:l.rotation,width:l.displayWidth,height:l.displayHeight})),bodyFrame:a.body.frame.name}}));await p.keyboard.up('d');
}}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
