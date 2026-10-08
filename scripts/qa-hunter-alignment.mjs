import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out = process.argv[2] ?? 'docs/star-hunter/alignment-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.addInitScript(() => localStorage.setItem('echoes-of-dante.characters.v1', JSON.stringify({ schema: 1, selected: 'align', characters: [{ id: 'align', name: 'Hunter QA', classId: 'hunter', createdAt: 1 }] })));
const p = await context.newPage(), report = { errors: [], method: 'Chrome headless; real keyboard Q and movement, DEV aim angles and isolated lane; visual inspection of captures, no physical devices' };
p.on('pageerror', e => report.errors.push(e.message));
p.on('response', r => { if (r.status() >= 400) report.errors.push(r.url()); });
const state = () => p.evaluate(() => {
  const s = window.__danteGame.scene.getScene('Game'), w = s.hunterArt.weapon, r = w.rifle;
  return { aim: s.player.rotation, gun: r.rotation, barrel: { x: w.barrel.x, y: w.barrel.y },
    gunPose: { x: r.x, y: r.y }, body: s.hunterArt.body.texture.key, frame: s.hunterArt.body.frame.name,
    hud: s.hud.chargeText.text, progress: s.hud.chargeFill.width, chargeVisible: w.charge.visible,
    phase: s.charge.phase, level: s.charge.pose(window.__danteGame.loop.time - s.recordsTimeOffset).level,
    beam: s.hunter.beamPose(), beamRotation: s.hunter.beamView.view.rotation,
    beamOrigin: { x: s.hunter.beamView.view.x, y: s.hunter.beamView.view.y }, p: { ...s.player.position },
    objects: s.children.list.length, tweens: s.tweens.getTweens().length, fps: window.__danteGame.loop.actualFps };
});
try {
  await p.goto('http://localhost:5184/?qa=play');
  await p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.hunterArt?.weapon);
  await p.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game'); s.arena.obstacles.length = 0;
    for (const e of s.enemies) { e.isDead = true; e.update = () => {}; e.view?.setVisible(false); }
    Object.assign(s.player.position, { x: 700, y: 800 }); s.charge.lastReleasedAt = -Infinity;
  }); await p.waitForTimeout(800);
  assert.match((await state()).hud, /PRONTA/);
  for (let i = 0; i < 8; i++) {
    const aim = (i - 4) * Math.PI / 4;
    await p.evaluate(aim => { const s = window.__danteGame.scene.getScene('Game'); s.controls.aimFrom = () => aim; }, aim);
    await p.waitForTimeout(100);
    const pose = await state(); assert.ok(Math.abs(pose.gun - aim) < .00001);
    const dx = pose.barrel.x - pose.gunPose.x, dy = pose.barrel.y - pose.gunPose.y;
    assert.ok(Math.abs(Math.atan2(dy, dx) - aim) < .00001);
    assert.equal(pose.body, 'star-hunter-body-v2');
    const clip = await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'), c = s.cameras.main;
      return { x: Math.round(s.player.position.x - c.scrollX - 90), y: Math.round(s.player.position.y - c.scrollY - 100), width: 180, height: 155 }; });
    await p.screenshot({ path: `${out}/direction-${i}.png`, clip });
  }
  report.eightAimDirectionsMatchRifleAndMuzzle = true;
  await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.controls.aimFrom = () => 0; });
  await p.keyboard.down('q'); await p.waitForTimeout(280);
  const half = await state(); assert.equal(half.phase, 'CHARGING'); assert.ok(half.chargeVisible); assert.ok(half.progress > 0 && half.progress < 196);
  await p.screenshot({ path: `${out}/charging.png` });
  await p.waitForTimeout(650); const full = await state(); assert.match(full.hud, /100%/); assert.equal(full.progress, 196);
  await p.screenshot({ path: `${out}/fully-charged.png` });
  await p.keyboard.up('q'); await p.waitForTimeout(70); const beam = await state();
  assert.ok(beam.beam); assert.equal(beam.beamRotation, beam.aim);
  assert.ok(Math.abs(beam.beamOrigin.x - (beam.p.x + beam.barrel.x)) < .001);
  assert.ok(Math.abs(beam.beamOrigin.y - (beam.p.y + beam.barrel.y)) < .001);
  await p.screenshot({ path: `${out}/release.png` });
  await p.waitForTimeout(250); assert.match((await state()).hud, /\d\.\ds/); assert.equal((await state()).chargeVisible, false);
  await p.screenshot({ path: `${out}/cooldown.png` });
  await p.waitForTimeout(3300); assert.match((await state()).hud, /PRONTA/);
  report.readyChargePercentageCooldownAndReady = true;
  report.beamParallelToRifleStartsAtMuzzle = true;
  await p.keyboard.down('d'); await p.mouse.down(); const frames = new Set();
  for (let i = 0; i < 14; i++) { await p.waitForTimeout(55); frames.add((await state()).frame); }
  await p.keyboard.up('d'); await p.mouse.up(); assert.ok(frames.size >= 4); report.wholeBodyGaitWhileFiring = [...frames];
  await p.waitForTimeout(500); const baseline = await state();
  for (let i = 0; i < 5; i++) {
    await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.charge.lastReleasedAt = -Infinity; });
    await p.keyboard.down('q'); await p.waitForTimeout(900); await p.keyboard.up('q'); await p.waitForTimeout(450);
  }
  const final = await state(); assert.equal(final.objects, baseline.objects); assert.equal(final.tweens, baseline.tweens);
  report.stability = { before: { objects: baseline.objects, tweens: baseline.tweens }, after: { objects: final.objects, tweens: final.tweens }, fps: final.fps };
  assert.deepEqual(report.errors, []); report.passed = true;
} finally {
  await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
console.log(report);
