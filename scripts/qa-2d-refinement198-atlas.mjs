import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/atlas';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720}}),report={passed:false,base,cases:[],errors:[],method:'DEV equipment/pose sampling of actual baked atlases, local/remote pixel equality, opaque margins and connected whole figures. Native controls are covered separately.'};p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const sex of ['male','female']){
  await p.goto(`${base}/character-cohesion.html?refinement=198&class=${cls}&sex=${sex}&kit=clothes&head=stellar&skin=warm&hair=black`);await p.waitForFunction(()=>window.__dante2dReview?.().ready);
  const result=await p.evaluate(async()=>{
   const scene=window.__danteGame.scene.getScene('Game');scene.scene.pause();const actor=scene.player.view.getData('completeActor'),{PartyActor}=await import('/src/network/PartyActor.ts'),{appearance}=await import('/src/config/characterPresentation.ts');
   const look=appearance({head:'stellar',skin:'warm',hair:'black'}),remote=new PartyActor(scene,{name:'Atlas QA',classId:actor.identity,sex:actor.sex,appearance:look,equipment:{}},{...scene.player.position},100),mirror=remote.player.view.getData('completeActor');mirror.setAppearance(look);
   const count=actor.identity==='warrior'?72:64,columns=8;let checked=0;const samples=document.createElement('canvas');samples.width=8*96;samples.height=4*120;const sampleContext=samples.getContext('2d');
   const connected=(data)=>{const seen=new Uint8Array(192*192),queue=new Int32Array(192*192);let biggest={count:0,minY:192,maxY:0};for(let root=0;root<seen.length;root++){if(seen[root]||data[root*4+3]<128)continue;let start=0,end=1,amount=0,minY=192,maxY=0;queue[0]=root;seen[root]=1;while(start<end){const point=queue[start++],x=point%192,y=Math.floor(point/192);amount++;minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const delta of[-193,-192,-191,-1,1,191,192,193]){const next=point+delta;if(next<0||next>=seen.length||Math.abs(next%192-x)>1||seen[next]||data[next*4+3]<128)continue;seen[next]=1;queue[end++]=next;}}if(amount>biggest.count)biggest={count:amount,minY,maxY};}return biggest;};
   for(const[tierIndex,tier]of ['none','basic','reinforced','mixed'].entries()){
    const outfit=tier==='mixed'?{helmet:'reinforced',torso:'basic',legs:'none',boots:'reinforced',gloves:'none'}:{helmet:tier,torso:tier,legs:tier,boots:tier,gloves:tier};actor.setEquipmentLook(outfit);mirror.setEquipmentLook(outfit);
    for(let f=0;f<count;f++){
     const x=f%columns*192,y=Math.floor(f/columns)*192,a=actor.body.texture.context.getImageData(x,y,192,192).data,b=mirror.body.texture.context.getImageData(x,y,192,192).data;for(let i=0;i<a.length;i++)if(a[i]!==b[i])throw Error('Local/remote atlas mismatch '+[tier,f,i]);
     const body=connected(a);if(body.count<1800||body.minY>36||body.maxY<150)throw Error('Disconnected/empty figure '+JSON.stringify({cls:actor.identity,sex:actor.sex,tier,f,body}));
     for(let i=0;i<192;i++)if(a[(191*192+i)*4+3]>128)throw Error('Opaque feet/body clipped at cell floor '+[tier,f]);checked++;
    }
    for(let row=0;row<8;row++){const f=row*4;sampleContext.drawImage(actor.body.texture.canvas,f%columns*192+48,Math.floor(f/columns)*192,96,120,row*96,tierIndex*120,96,120);}
   }
   remote.destroy();return{checked,identity:actor.identity,sex:actor.sex,contact:samples.toDataURL('image/png')};
  });
  await writeFile(`${out}/${cls}-${sex}-outfits.png`,Buffer.from(result.contact.split(',')[1],'base64'));delete result.contact;report.cases.push(result);console.log('Atlas',cls,sex,result.checked);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('2D atlas',report.passed);}
