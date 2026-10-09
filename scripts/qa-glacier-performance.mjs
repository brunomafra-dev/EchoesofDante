import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/glacier-expansion/performance'; await mkdir(out, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', headless: true }), p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const report = { method: 'One Chrome headless page, per-region samples. DEV chapter setup and combat invulnerability only for stable runtime observation.', errors: [], regions: {} };
p.on('pageerror', e => report.errors.push(e.message));
const counts = () => p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return { fps: s.game.loop.actualFps, objects: s.children.list.length, tweens: s.tweens.getTweens().length,
  graphics: s.children.list.filter(o => o.type === 'Graphics').length, caches: s.children.list.filter(o => o.type === 'RenderTexture').length, textures: s.textures.getTextureKeys().length }; });
try {
  await p.goto('http://localhost:5184/?qa=play'); await p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  for (const area of ['frost','icecave','icenest']) {
    await p.evaluate(async area => {
      const s = window.__danteGame.scene.getScene('Game'), { JOURNEY_FLAGS } = await import('/src/systems/LocalJourney.ts');
      for (const f of JOURNEY_FLAGS) s[f] = !f.startsWith('vesper');
      s.progression.restore({ xp:1000, echoes:['northern-ruin','mineral-signal','unknown-trace'], sourceLocated:true, passageOpen:true, rewardedHollows:[], rewardedRoutes:[] });
      for (const id of ['saberArc','saberReach','chargeWidth','chargePower','dashCooldown','dashDuration']) while(s.progression.investUpgrade(id)) {}
      s.area = area; s.scene.restart();
    }, area);
    await p.waitForTimeout(2000);
    const samples = [];
    for (let i=0;i<16;i++) { samples.push(await counts()); await p.waitForTimeout(250); }
    report.regions[area] = { meanFps: samples.reduce((n,s)=>n+s.fps,0)/samples.length, before:samples[0], after:samples.at(-1) };
    assert.equal(samples[0].objects, samples.at(-1).objects);
    if (area === 'icenest') {
      report.gate = await p.evaluate(async () => {
        const s = window.__danteGame.scene.getScene('Game');
        const { moveWithCollisions } = await import('/src/systems/Movement.ts');
        const initial = s.glacier.obstacles.length;
        s.glacier.setEncounterActive(true); s.glacier.setEncounterActive(true);
        if (s.glacier.obstacles.length !== initial + 1) throw Error('Duplicate gate collider');
        const point = { x: 1100, y: 990 };
        for (let i = 0; i < 180; i++) moveWithCollisions(point, { x: -220, y: 0 }, .016, 18, s.glacier.obstacles, s.movementBounds);
        if (point.x < 912.9) throw Error('Closed gate crossed');
        s.glacier.setEncounterActive(false); s.glacier.setEncounterActive(false);
        if (s.glacier.obstacles.length !== initial) throw Error('Gate collider not removed');
        Object.assign(point, { x: 680, y: 990 });
        for (let i = 0; i < 100; i++) moveWithCollisions(point, { x: 220, y: 0 }, .016, 18, s.glacier.obstacles, s.movementBounds);
        if (point.x < 950) throw Error('Open gate route blocked');
        return { closedSolid: true, openPassable: true, duplicateFree: true };
      });
      await p.evaluate(() => { const s=window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position,{x:1120,y:1060}); s.player.invulnerableUntil=Infinity; });
      await p.waitForTimeout(3200); const before=await counts();
      const combat=[]; for(let i=0;i<40;i++){combat.push(await counts());await p.waitForTimeout(250);}
      report.combat={meanFps:combat.reduce((n,s)=>n+s.fps,0)/combat.length,before,after:await counts()};
      assert.equal(report.combat.after.objects,before.objects); assert.equal(report.combat.after.graphics,before.graphics);
      const cycles=[];
      for(let i=0;i<3;i++){
        await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=0;s.player.die();s.restart();});
        await p.waitForTimeout(1200);cycles.push(await counts());
      }
      assert.ok(new Set(cycles.map(s=>s.objects)).size===1);report.respawnCycles=cycles;
    }
  }
  report.physics = await p.evaluate(async () => {
    const { GLACIER }=await import('/src/config/glacier.ts'),{moveWithCollisions}=await import('/src/systems/Movement.ts');
    const checks=[];
    for(const area of ['icecave','icenest']){
      const c=GLACIER[area];
      if(!c.rocks.every(r=>Math.hypot(c.checkpoint.x-r.x,c.checkpoint.y-r.y)>r.radius+18))throw Error('Checkpoint overlaps');
      for(const r of c.rocks){const point={x:r.x+r.radius+25,y:r.y};for(let i=0;i<90;i++)moveWithCollisions(point,{x:-220,y:0},.016,18,c.rocks,c.bounds);
        if(Math.hypot(point.x-r.x,point.y-r.y)<r.radius+17.9)throw Error('Collider crossed');}
      checks.push({area,solidBases:c.rocks.length,checkpointSafe:true});
    }return checks;
  });
  assert.deepEqual(report.errors,[]);report.passed=true;
} finally { await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await b.close(); }
console.log(report);
