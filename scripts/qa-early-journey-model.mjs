import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/early-journey/qa';await mkdir(out,{recursive:true});
const built=await build({stdin:{contents:"export * from './src/config/earlyJourney';export * from './src/systems/Movement';export * from './src/systems/WalkableGround';export * from './src/systems/ExpeditionReturn';export * from './src/config/regionalExpeditions';export * from './src/systems/Progression';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const m=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const report={checks:[]};
for(const [point,bounds]of [[{x:2730,y:1220},m.FOREST_BOUNDS],[{x:1140,y:1640},m.FOREST_BOUNDS],[{x:1200,y:1350},{left:480,top:380,right:1680,bottom:1600,walkable:m.cavernContour()}],[{x:2090,y:1440},{left:480,top:380,right:6180,bottom:1600,walkable:m.cavernContour()}],[{x:3750,y:1360},{left:480,top:380,right:6180,bottom:1600,walkable:m.cavernContour()}]]){
 assert.ok(m.fitsGround(point,18,bounds.walkable,39));
 for(let i=0;i<16;i++){
  const at={...point},v={x:Math.cos(i*Math.PI/8)*5000,y:Math.sin(i*Math.PI/8)*5000};
  for(let tick=0;tick<20;tick++)m.moveWithCollisions(at,v,.05,18,[],bounds,39);
  assert.ok(m.fitsGround(at,18,bounds.walkable,39));assert.ok(at.x<=bounds.right-18+.01&&at.x>=bounds.left+18-.01);
 }
}
report.checks.push('80 swept high-speed dash/knockback trajectories stay inside contour and closed right clamp with hero foot offset');
assert.equal(m.safeExpeditionPosition({x:2700,y:300},18,[],m.FOREST_BOUNDS,39),undefined);
const safe=m.safeExpeditionPosition({x:2150,y:780},18,[],m.FOREST_BOUNDS,39);assert.ok(safe&&m.fitsGround(safe,18,m.FOREST_CONTOUR,39));
report.checks.push('Arrival rejects unreachable banks and finds a nearby valid foot position');
for(const [area,bounds]of [['forest',m.FOREST_BOUNDS],['cavern',{left:480,top:380,right:6180,bottom:1600,walkable:m.cavernContour()}]]){
 const solids=m.EARLY_LANDMARKS[area];
 assert.deepEqual(m.safeExpeditionPosition(m.EARLY_PREVIEW_ENTRY[area],18,solids,bounds,39),m.EARLY_PREVIEW_ENTRY[area]);
 for(const solid of solids){
  const p={x:solid.x-solid.radius-45,y:solid.y};
  for(let step=0;step<20;step++)m.moveWithCollisions(p,{x:5000,y:0},.01,18,[solid],bounds,39);
  assert.ok(p.x<=solid.x-solid.radius-18+.01,'Dash cannot cross landmark '+area);
 }
}
report.checks.push('Six painted water/root/conduit cores block swept Dash; both direct preview checkpoints stand on valid dry ground');
const p=new m.Progression();assert.equal(m.REGIONAL_RESIDENTS.length,72);assert.equal(m.EARLY_ROUTE_RESIDENTS.length,4);
const ids=[...m.REGIONAL_RESIDENTS,...m.EARLY_ROUTE_RESIDENTS].map(r=>r.id);assert.equal(new Set(ids).size,76);
for(const id of m.EARLY_ROUTE_RESIDENTS.map(r=>r.id)){assert.ok(id<=1999);assert.ok(p.defeatHollow(id,15).awarded);assert.equal(p.defeatHollow(id,15).awarded,false)}
const restored=new m.Progression();restored.restore(p.snapshot());assert.ok(m.EARLY_ROUTE_RESIDENTS.every(r=>restored.hasDefeated(r.id)));
report.checks.push('72 legacy resident IDs retained; four new finite IDs fit existing save schema and award XP once across restore');
report.passed=true;await writeFile(out+'/geometry-model.json',JSON.stringify(report,null,2));console.log(report);
