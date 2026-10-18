import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.QA_BASE??'http://localhost:5184',out=process.env.QA_OUT??'docs/cinematic-opening/completion/identity-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage(),report={passed:false,errors:[],actors:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const sex of ['female','male']){
  await p.goto(`${base}/character-cohesion.html?class=hunter&sex=${sex}&kit=clothes`);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.getData('completeActor'));
  const result=await p.evaluate(async()=>{
   const s=window.__danteGame.scene.getScene('Game');s.scene.pause();const a=s.player.view.getData('completeActor');const {completeRegistration}=await import('/src/visual/CompleteActorFrames.ts');let comparisons=0,pixels=0;const metrics=[];
   const source=s.textures.get(`complete-hunter-${s.player.sex}-basic`).getSourceImage(),oldSource=s.textures.get(`complete-hunter-${s.player.sex}-none`).getSourceImage(),ref=document.createElement('canvas');ref.width=ref.height=192;const ctx=ref.getContext('2d');
   for(const tier of ['none','basic','reinforced']){
    s.setPlaytestAppearance({helmet:'none',torso:tier,legs:tier,boots:tier,gloves:tier});
    for(let row=0;row<8;row++){
     a.update(s.player.position.x,s.player.position.y,Math.PI/2-row*Math.PI/4,false);const frame=a.body.frame;ctx.resetTransform();ctx.clearRect(0,0,192,192);const r=completeRegistration('hunter',s.player.sex,'basic',row*4);ctx.translate(r.x,r.y);ctx.scale(r.scale,r.scale);ctx.drawImage(source,0,row*192,192,192,0,0,192,192);
     const expected=ctx.getImageData(0,0,192,192).data,actual=a.body.texture.context.getImageData(frame.cutX,frame.cutY,192,192).data;
     // Measure the dense face/hair core. The authored alpha is about 253;
     // the extra tile-to-atlas draw introduces small premultiplication error.
     let samples=0,rgb=0,alpha=0,max=0;
     for(let y=16;y<43;y++)for(let x=76;x<116;x++){const k=(y*192+x)*4;if(expected[k+3]>=250){for(let c=0;c<4;c++){const d=Math.abs(expected[k+c]-actual[k+c]);if(c===3)alpha+=d;else rgb+=d;max=Math.max(max,d);}pixels++;samples++;}}
     if(samples<100)throw Error('Insufficient dense identity samples');
     const m={tier,row,samples,rgbMean:rgb/(samples*3),alphaMean:alpha/samples,maxChannelDifference:max};
     if(row===0){ctx.resetTransform();ctx.clearRect(0,0,192,192);const old=completeRegistration('hunter',s.player.sex,'none',row*4);ctx.translate(old.x,old.y);ctx.scale(old.scale,old.scale);ctx.drawImage(oldSource,0,row*192,192,192,0,0,192,192);const prior=ctx.getImageData(0,0,192,192).data;let error=0;for(let y=16;y<43;y++)for(let x=76;x<116;x++){const k=(y*192+x)*4;if(expected[k+3]>=250)for(let c=0;c<3;c++)error+=Math.abs(expected[k+c]-prior[k+c]);}m.previousFaceRgbMean=error/(samples*3);}
     metrics.push(m);
     comparisons++;
    }
   }
   return{classId:s.classId,sex:s.player.sex,canonicalSource:`hunter-${s.player.sex}-basic frame 0 of each view`,comparisons,pixels,metrics};
  });assert.equal(result.comparisons,24);assert.ok(result.pixels>5000);report.actors.push(result);for(const m of result.metrics){assert.ok(m.rgbMean<=1.5&&m.alphaMean<=1,JSON.stringify(m));if(m.row===0)assert.ok(m.previousFaceRgbMean>m.rgbMean*2+1,JSON.stringify(m));}
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,actors:report.actors.map(a=>({sex:a.sex,comparisons:a.comparisons,maxMeanRgb:Math.max(...a.metrics.map(m=>m.rgbMean)),previousFaceMean:a.metrics[0].previousFaceRgbMean}))}));}
