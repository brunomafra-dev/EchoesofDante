import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}});
const output=process.argv[2]??'docs/modular-characters/revision-03/qa/menu.json';
const report={errors:[],method:'Chrome headless, actual selection UI and reload; no physical playtest.'};
p.on('pageerror',e=>report.errors.push(e.message));
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
try{
 await p.goto('http://localhost:5184/');await ready();
 await p.locator('[data-shell="characters"]').click();await p.locator('[data-shell="new-character"]').click();await p.locator('[data-class="warrior"]').click();await p.locator('[name="character-sex"]').selectOption('female');
 await p.locator('[name="character-name"]').pressSequentially('ALana');assert.equal(await p.locator('[name="character-name"]').inputValue(),'ALana');
 await p.locator('[data-shell="create"]').click();await p.waitForTimeout(800);await ready();
 assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.sex),'female');assert.match(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.torso.texture.key),/female/);
 await p.reload();await ready();assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.sex),'female');
 await p.locator('[data-shell="characters"]').click();await p.locator('[data-shell="new-character"]').click();await p.locator('[data-class="hunter"]').click();
 assert.equal(await p.locator('[name="character-sex"]').inputValue(),'female');await p.locator('[data-shell="change-sex"]').click();assert.equal(await p.locator('[name="character-sex"]').inputValue(),'male');
 await p.locator('[name="character-name"]').fill('Hunter AL');await p.locator('[data-shell="create"]').click();await p.waitForTimeout(800);await ready();assert.match(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').hunterArt.body.texture.key),/^dressed-hunter-male/);
 report.creationAndReload=true;report.lettersAL=true;report.legacyDefaults=true;report.sexButtonPresent=true;assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await b.close();await writeFile(output,JSON.stringify(report,null,2));}
console.log(report);
