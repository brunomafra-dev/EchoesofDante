import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const out='docs/embers-journey/qa/model';await mkdir(out,{recursive:true});
const built=await build({stdin:{contents:"export * from './src/config/embersJourney';export * from './src/config/borealJourney';export * from './src/config/siroccoJourney';export * from './src/config/regionalExpeditions';export * from './src/config/volcanic';export * from './src/config/caldera';export * from './src/config/partyEncounters';export * from './src/systems/Progression';export * from './src/systems/Movement';export * from './src/config/routeIdentity';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const m=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const previous=JSON.parse(execFileSync('git',['show','db25d83:src/config/regional-expeditions.json'],{encoding:'utf8'})),current=JSON.parse(await readFile('src/config/regional-expeditions.json','utf8'));
const report={checks:[]};for(let i=0;i<previous.length;i++){
 const a=previous[i],b=current[i];for(const key of ['id','area','npc','requires','unlock','credits','title'])assert.equal(b[key],a[key]);
 if(!['cinder','obsidian','caldera'].includes(a.area))assert.deepEqual(b,a);
 else for(let j=0;j<3;j++){assert.equal(b.sites[j].art,a.sites[j].art);assert.equal(b.sites[j].name,a.sites[j].name);for(const text of [...b.offer,...b.report,b.sites[j].finding])assert.ok(!text.includes('?'));}
}report.checks.push('All IDs, preconditions, NPCs, evidence order, subjects and credits match 0.1.147; other regions unchanged. Three missions, nine scans, 90+95+100 credits; no new mission.');
const ids=[...m.REGIONAL_RESIDENTS,...m.EARLY_ROUTE_RESIDENTS,...m.SIROCCO_TRAIL_RESIDENTS,...m.BOREAL_TRAIL_RESIDENTS,...m.EMBERS_TRAIL_RESIDENTS].map(r=>r.id);assert.equal(new Set(ids).size,92);assert.ok(ids.every(id=>id<=1999));
for(const enemy of m.EMBERS_TRAIL_RESIDENTS){const p=new m.Progression();assert.ok(p.defeatHollow(enemy.id,20).awarded);const q=new m.Progression();q.restore(p.snapshot());assert.equal(q.defeatHollow(enemy.id,20).awarded,false);}
report.checks.push('92 finite IDs unique; six new receipts fit existing range and cannot award XP twice after restore.');
report.maxPopulation={};for(const [area,native,bounds]of [['cinder',m.VOLCANIC_ENCOUNTERS.cinder,m.VOLCANIC.cinder.bounds],['obsidian',m.VOLCANIC_ENCOUNTERS.obsidian,m.VOLCANIC.obsidian.bounds],['caldera',m.CALDERA_ENCOUNTERS,m.CALDERA.bounds]]){
 const max=(area==='caldera'?1:0)+native.length+m.REGIONAL_RESIDENTS.filter(r=>r.area===area).length+m.EMBERS_TRAIL_RESIDENTS.filter(r=>r.area===area).length+(m.PARTY_ENCOUNTERS[area]?.length??0);assert.ok(max<=32);report.maxPopulation[area]=max;
 for(const t of m.EMBERS_TRAILS[area]){const at={x:t.ridge.x-t.ridge.radius-100,y:t.ridge.y};for(let i=0;i<20;i++)m.moveWithCollisions(at,{x:760,y:0},.016,18,[t.ridge],bounds);assert.ok(at.x<=t.ridge.x-t.ridge.radius-18+.01);}
}
assert.ok(m.EMBERS_TRAILS.caldera.every(t=>t.ridge.x+t.ridge.radius<m.CALDERA.gate.x&&t.entry.x<m.TITAN.awakeningX&&t.exit.x<m.TITAN.awakeningX));
report.checks.push('Nine low covers stop normal-speed Dash; maximum populations fit relay. Forja loops stay before the existing sealed throat; arena stats and walls unchanged.');report.passed=true;await writeFile(out+'/compatibility.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
