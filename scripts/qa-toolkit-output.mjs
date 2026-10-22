// Explicit, local RTK evaluation. No hooks, model calls, credentials or game saves.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const out = resolve('.local/toolkit-evaluation/results');
const rtk = resolve(process.env.DANTE_RTK || '.local/toolkit-evaluation/rtk/rtk.exe');
mkdirSync(out, { recursive: true });
const env = { ...process.env, NO_COLOR: '1', RTK_DB_PATH: resolve('.local/toolkit-evaluation/history.db') };
const report = {
  method: 'Paired command outputs in UTF-8 bytes, not measured model tokens or subscription usage.',
  toolkitRevision: '790a895304e0c08b70a5b215c9d334f1c86b816c',
  rtkVersion: '1.0.1 (Apache-2.0 OSS)',
  archiveSha256: '0e53e2eca471e15fbd3636e64e6bc0b182cbc278ed0339c80450a2dd03f4cd6b',
  gameCommit: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(),
  checks: [], cases: [],
};
function run(exe, args) {
  const result = spawnSync(exe, args, { cwd: root, env, encoding: 'utf8', timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  return { code: result.status, output: (result.stdout || '') + (result.stderr || '') };
}
function pair(name, exe, args, filteredArgs, expectedCode = 0) {
  const raw = run(exe, args), compact = run(rtk, filteredArgs);
  writeFileSync(resolve(out, name + '-raw.txt'), raw.output);
  writeFileSync(resolve(out, name + '-rtk.txt'), compact.output);
  assert.equal(raw.code, expectedCode, name + ' native exit code: ' + raw.output);
  assert.equal(compact.code, expectedCode, name + ' RTK exit code: ' + compact.output);
  const rawBytes = Buffer.byteLength(raw.output), compactBytes = Buffer.byteLength(compact.output);
  report.cases.push({ name, expectedCode, rawBytes, compactBytes, reductionPercent: rawBytes ? +(100 * (1 - compactBytes / rawBytes)).toFixed(1) : null });
  return { raw: raw.output, compact: compact.output };
}
const log = pair('git-log', 'git', ['log', '-12'], ['git', 'log', '-12']);
const commits = run('git', ['log', '-12', '--format=%h']).output.trim().split(/\r?\n/);
assert.ok(commits.every(hash => log.compact.includes(hash)), 'Every requested commit must survive');
report.checks.push('All 12 commit identifiers remain visible');
pair('git-status', 'git', ['status'], ['git', 'status']);
const npm = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = script => process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run ' + script] : ['run', script];
pair('typecheck', npm, npmArgs('typecheck'), ['npm', 'run', 'typecheck']);
const build = pair('build', npm, npmArgs('build'), ['npm', 'run', 'build']);
assert.ok(/500\s*kB|500 kB|chunk/i.test(build.raw));
assert.ok(/500\s*kB|500 kB|chunk/i.test(build.compact), 'Existing bundle warning must survive');
report.checks.push('Typecheck/build pass and the existing bundle-size warning remains visible');
const fixture = resolve(out, 'intentional-error.ts');
writeFileSync(fixture, 'const value: number = "toolkit-diagnostic";\n');
const fixtureArg = relative(root, fixture);
const tscArgs = ['--noEmit', '--pretty', 'false', '--skipLibCheck', fixtureArg];
const failure = pair('typescript-error', process.execPath, ['node_modules/typescript/bin/tsc', ...tscArgs], ['tsc', ...tscArgs], 2);
assert.ok(failure.compact.includes('TS2322') && failure.compact.includes('intentional-error.ts'));
report.checks.push('Real TS2322 error retains file and nonzero exit code');
const bypass = run(rtk, ['bypass', 'git', 'log', '-12']);
assert.equal(bypass.code, 0);
assert.equal(bypass.output, log.raw);
report.checks.push('Unfiltered bypass reproduces the original git output exactly');
const rawBytes = report.cases.reduce((n, c) => n + c.rawBytes, 0);
const compactBytes = report.cases.reduce((n, c) => n + c.compactBytes, 0);
report.total = { rawBytes, compactBytes, reductionPercent: +(100 * (1 - compactBytes / rawBytes)).toFixed(1) };
report.binaryBytes = readFileSync(rtk).byteLength;
writeFileSync(resolve(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
