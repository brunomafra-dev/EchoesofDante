import assert from'node:assert/strict';import{chromium}from'playwright';import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',out=process.env.QA_OUT??'docs/frontier-3d/qa/0.1.187/creatures';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}}),report={passed:false,at:new Date().toISOString(),base,method:'Native isolated workshop selectors; real imported skinned poses sampled across idle/walk/attack/death. No campaign requirements, characters, or victories simulated.',creatures:[],layouts:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.stack));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))report.errors.push(m.text());});
const state=()=>p.evaluate(()=>window.__arrivalWorkshop());const ready=()=>p.waitForFunction(()=>window.__arrivalWorkshop?.().ready,{},{timeout:120000});
try{
 await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='protected-characters';sessionStorage['dante.arrival3d.v1']='protected-trial';});
 await p.goto(base+'/arrival-workshop.html?inspect=1&subject=hollow');await ready();assert.equal((await state()).selection,'hollow');
 for(const id of['hollow','pet']){
  await p.locator('#subject').selectOption(id);await ready();const motions=[];
  for(const motion of['idle','walk','attack','death']){
   if((await state()).action)await p.locator('#motion').click();
   if(motion!=='idle'){await p.locator('#creature-motion').selectOption(motion);await p.locator('#motion').click();}
   const samples=[];for(let i=0;i<18;i++){await p.waitForTimeout(85);const s=await state();assert.deepEqual(s.failures,[]);const a=s.creatures[0];assert.equal(a.meshes,1);assert.ok(a.bones>=18);assert.ok([...a.bounds.min,...a.bounds.max,a.pose].every(Number.isFinite));assert.ok(a.bounds.max.every((v,k)=>v-a.bounds.min[k]<4),'Bounded imported skin');assert.ok(a.bounds.min[1]>-.8,'No broken underground pose');samples.push(a);}
   const poses=new Set(samples.map(s=>s.pose.toFixed(3)));if(motion==='idle'||motion==='walk')assert.ok(poses.size>3,'Animated full rig '+id+' '+motion);
   if(motion==='walk')assert.ok(samples.some(s=>s.state==='Walk'));if(motion==='attack')assert.ok(samples.some(s=>s.state==='Attack'));if(motion==='death'){assert.ok(samples.every(s=>s.state==='Death'));assert.ok(Math.abs(samples.at(-1).time-samples.at(-2).time)<.001,'Corpse holds final pose');}
   await p.screenshot({path:out+'/'+id+'-'+motion+'.jpg',quality:90});motions.push({motion,poses:poses.size,samples});
  }
  report.creatures.push({id,motions});
 }
 for(const[w,h]of[[844,390],[393,852],[568,320]]){
  await p.setViewportSize({width:w,height:h});await p.locator('#subject').selectOption('hollow');await ready();const layout=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('select,button')].filter(e=>e.getBoundingClientRect().height).map(e=>({id:e.id,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))}));assert.equal(layout.scroll,w);for(const c of layout.controls){assert.ok(c.h>=44);assert.ok(c.x>=0&&c.x+c.w<=w+1);assert.ok(c.y>=0&&c.y+c.h<=h+1);}await p.screenshot({path:out+'/layout-'+w+'x'+h+'.jpg',quality:88});report.layouts.push(layout);
 }
 assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],sessionStorage['dante.arrival3d.v1']]),['protected-characters','protected-trial']);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e);await p.screenshot({path:out+'/failure.jpg'}).catch(()=>{});}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await b.close();console.log(report.passed?'CREATURES PASS':'CREATURES FAIL');}
