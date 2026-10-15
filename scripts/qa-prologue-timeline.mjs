import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.QA_BASE ?? 'https://echosofdante.vercel.app';
const out = process.env.QA_OUT ?? 'docs/prologue-menu/qa/public';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] });
const report = { base, method: 'Compiled browser build: New Game creates the selected profile and starts one original MP4 cinematic.', errors: [] };
const click = (page, id) => page.locator(`[data-shell="${id}"]`).evaluate(element => element.click());
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) report.errors.push(response.url()); });
  await page.goto(`${base}/campaign-playtest.html`);
  for (const id of ['play', 'new-game', 'choose-warrior']) await click(page, id);
  await page.locator('[name=character-name]').fill('AL Cinemática');
  await click(page, 'create');
  assert.deepEqual(await page.locator('[data-shell^="difficulty-"]').allTextContents(), ['Fezes puríssima', 'Marromenos', 'Chama 🔥']);
  await click(page, 'difficulty-normal'); await click(page, 'start-new-game');
  const video = page.locator('.prologue-video'); await video.waitFor();
  await page.waitForFunction(() => { const element = document.querySelector('.prologue-video'); return element?.readyState >= 2 && element.duration > 19 && element.currentTime > .75; });
  report.video = await video.evaluate(element => ({ source: new URL(element.currentSrc).pathname, duration: element.duration, currentTime: element.currentTime, paused: element.paused, captions: document.querySelectorAll('.prologue-caption').length }));
  assert.equal(report.video.source, '/assets/prologue/arrival-trailer.mp4'); assert.ok(report.video.duration > 19 && report.video.duration < 21);
  assert.equal(report.video.paused, false); assert.equal(report.video.captions, 0);
  await page.screenshot({ path: `${out}/arrival-trailer.png` });
  await video.evaluate(element => { element.currentTime = element.duration - .15; });
  await page.waitForFunction(() => document.querySelector('.application-shell') && !document.querySelector('.application-shell').open, {}, { timeout: 10000 });
  const saved = await page.evaluate(() => {
    const registry = JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1'));
    const hero = registry.characters.find(profile => profile.id === registry.selected);
    return { name: hero.name, classId: hero.classId, difficulty: hero.campaign.difficulty, introSeen: hero.campaign.introSeen,
      area: JSON.parse(localStorage.getItem(`echoes-of-dante.journey.v1.character.${hero.id}`)).area };
  });
  assert.equal(saved.name, 'AL Cinemática'); assert.equal(saved.difficulty, 'normal'); assert.equal(saved.introSeen, true); assert.equal(saved.area, 'base');
  report.saved = saved; report.passed = true;
  console.log(JSON.stringify({ passed: true, video: report.video, saved }, null, 2));
} catch (error) {
  report.failure = String(error); throw error;
} finally {
  await browser.close(); await writeFile(`${out}/timeline-report.json`, JSON.stringify(report, null, 2));
}
