import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const out='docs/sirocco-journey/qa/model';await mkdir(out,{recursive:true});
const built=await build({stdin:{contents:"export * from './src/config/siroccoJourney';export * from './src/config/regionalExpeditions';export * from './src/config/valley';export * from './src/config/sirocco';export * from './src/config/dunes';export * from './src/config/partyEncounters';export * from './src/systems/Progression';export * from './src/systems/Movement';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const m=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const previous=JSON.parse(execFileSync('git',['show','bc3d4d3:src/config/regional-expeditions.json'],{encoding:'utf8'})),current=JSON.parse(await readFile('src/config/regional-expeditions.json','utf8'));
const report={checks:[]};for(let i=0;i<previous.length;i++){
 const a=previous[i],b=current[i];for(const key of ['id','area','npc','requires','unlock','credits','title'])assert.equal(b[key],a[key]);
 if(!['valley','arid','dunes'].includes(a.area))assert.deepEqual(b,a);
 else for(let j=0;j<3;j++){assert.equal(b.sites[j].art,a.sites[j].art);assert.equal(b.sites[j].name,a.sites[j].name);assert.ok(!b.offer.join('').includes('?'));}
}report.checks.push('All old mission IDs, preconditions, NPCs, evidence order, prop subjects and credit values match 0.1.145; other regions unchanged.');
const ids=[...m.REGIONAL_RESIDENTS,...m.EARLY_ROUTE_RESIDENTS,...m.SIROCCO_TRAIL_RESIDENTS].map(r=>r.id);assert.equal(new Set(ids).size,82);assert.ok(ids.every(id=>id<=1999));
for(const enemy of m.SIROCCO_TRAIL_RESIDENTS){const p=new m.Progression();assert.ok(p.defeatHollow(enemy.id,20).awarded);const q=new m.Progression();q.restore(p.snapshot());assert.equal(q.defeatHollow(enemy.id,20).awarded,false);}
report.checks.push('82 finite IDs unique; six new IDs fit the existing save range and cannot award XP twice after restore.');
report.maxPopulation={};for(const [area,native,bounds]of [['valley',m.VALLEY_ENCOUNTERS,m.VALLEY.bounds],['arid',m.SIROCCO_ENCOUNTERS,m.SIROCCO.bounds],['dunes',m.DUNES_ENCOUNTERS,m.DUNES.bounds]]){
 const max=native.length+m.REGIONAL_RESIDENTS.filter(r=>r.area===area).length+m.SIROCCO_TRAIL_RESIDENTS.filter(r=>r.area===area).length+m.PARTY_ENCOUNTERS[area].length;assert.ok(max<=32);report.maxPopulation[area]=max;
 for(const t of m.SIROCCO_TRAILS[area]){const at={x:t.ridge.x-t.ridge.radius-100,y:t.ridge.y};for(let i=0;i<20;i++)m.moveWithCollisions(at,{x:760,y:0},.016,18,[t.ridge],bounds);assert.ok(at.x<=t.ridge.x-t.ridge.radius-18+.01);}
}
report.checks.push('All nine cover footprints stop a normal-speed Dash; worst-case four-player region populations stay below relay capacity.');report.passed=true;await writeFile(out+'/compatibility.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
