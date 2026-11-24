"""Conditional closing of revision 0.1.205 (Erudito/Erudita in four professions).

Nothing changes unless ALL 18 painted source grids pass validation AND the
importer/verifier pass. Default is a dry run; --apply performs the work.

  python scripts/finalize-erudite.py            # dry run: gates only, no writes
  python scripts/finalize-erudite.py --apply    # import, activate, run checks

Pipeline (apply):
  A  validate-erudite-sources.py  (18/18, no errors)
  B  prepare-scout-professions.py --preset astral, then verify (rolls back its
     generated files if it fails)
  C  activation edits: emitters in CompleteActorFrames.ts, "astral" in
     visual-presets.json, revision flag '205', selection subtitle,
     test-library.html section, version 0.1.205
  D  checks: typecheck, build, relay suite, git diff --check and the four 205
     browser suites against a local dev server
  E  success -> REVISION_205.md and the roadmap are updated, the human-approval
     gate stays open. Any failure in C/D restores every file edited in C
     ("astral" stays blocked); the validated atlases are kept as inert files.

It never commits, pushes or touches LocalJourney, CharacterProfiles,
src/experiments or the 0.1.204 atlases.
"""
from pathlib import Path
import argparse, json, os, re, shutil, subprocess, sys, time, urllib.request, datetime

ROOT = Path(__file__).resolve().parents[1]
PY = sys.executable
NPM = 'npm.cmd' if os.name == 'nt' else 'npm'
NPX = 'npx.cmd' if os.name == 'nt' else 'npx'
LOGS = ROOT / 'docs/2d-refinement/qa/205/finalize'
SOURCE = ROOT / 'docs/erudite-professions/source'
CROSS = ROOT / 'public/assets/visual/complete-actors/cross'
ANCHORS = ROOT / 'src/visual/eruditeEmitterAnchors.json'
MEASURES = ROOT / 'docs/erudite-professions/measurements.json'
PRESETS = ROOT / 'src/config/visual-presets.json'
FLAG_FILES = ['src/experiments/campaign-playtest/main.ts', 'src/experiments/character-playtest/main.ts',
              'src/network/CoopInvitation.ts', 'src/scenes/GameScene.ts', 'src/ui/ApplicationShell.ts',
              'src/ui/CharacterSelection.ts', 'src/ui/CharacterShowcase.ts']
EDITED = ['src/visual/CompleteActorFrames.ts', 'src/config/visual-presets.json', 'test-library.html',
          'package.json', 'package-lock.json'] + FLAG_FILES
PORT = 5185
BASE = os.environ.get('QA_BASE', f'http://localhost:{PORT}')
ATLASES = [f'astral-{p}-{s}-{t}-v1.png' for p in ('warrior', 'hunter', 'xenobinder') for s in ('female', 'male') for t in ('none', 'basic', 'reinforced')]

steps = []


def say(message):
    print(message, flush=True)


def record(name, ok, detail=''):
    steps.append({'step': name, 'ok': ok, 'detail': detail})
    say(f'[{"ok" if ok else "FAIL"}] {name}' + (f' - {detail}' if detail else ''))
    return ok


def run(name, cmd, env=None, timeout=1500):
    LOGS.mkdir(parents=True, exist_ok=True)
    log = LOGS / (re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') + '.log')
    merged = {**os.environ, **(env or {})}
    try:
        done = subprocess.run(cmd, cwd=ROOT, env=merged, capture_output=True, text=True, timeout=timeout, encoding='utf-8', errors='replace')
        log.write_text(f'$ {" ".join(cmd)}\nexit {done.returncode}\n\n{done.stdout}\n{done.stderr}', encoding='utf8')
        return record(name, done.returncode == 0, f'log: {log.relative_to(ROOT).as_posix()}')
    except subprocess.TimeoutExpired:
        return record(name, False, f'timeout after {timeout}s')


def snapshot(paths):
    return {p: (ROOT / p).read_bytes() if (ROOT / p).exists() else None for p in paths}


def restore(snap):
    for p, data in snap.items():
        target = ROOT / p
        if data is None:
            target.unlink(missing_ok=True)
        else:
            target.write_bytes(data)


def read(p):
    return (ROOT / p).read_bytes().decode('utf-8')


def write(p, text):
    (ROOT / p).write_bytes(text.encode('utf-8'))


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise RuntimeError(f'{label}: expected exactly one anchor, found {text.count(old)}')
    return text.replace(old, new)


def activate():
    """Activation edits; raise on any unexpected anchor."""
    # 1. Emitters
    p = 'src/visual/CompleteActorFrames.ts'
    t = read(p)
    if 'eruditeEmitters' in t:
        raise RuntimeError('CompleteActorFrames.ts already references eruditeEmitters; refusing to double-apply')
    t = replace_once(t, "import pioneerEmitters from './pioneerEmitterAnchors.json';\n",
                     "import pioneerEmitters from './pioneerEmitterAnchors.json';\nimport eruditeEmitters from './eruditeEmitterAnchors.json';\n", 'emitter import')
    anchor = " if(preset==='warrior'&&classId!=='warrior'){const p=pioneerEmitters[classId][sex][style][row];return[p[0],p[1]];}\n"
    t = replace_once(t, anchor, anchor + " if(preset==='astral'&&classId!=='astral'){const p=eruditeEmitters[classId][sex][style][row];return[p[0],p[1]];}\n", 'emitter branch')
    write(p, t)
    # 2. Presets: only warrior/hunter/xenobinder gain "astral"
    presets = json.loads(read('src/config/visual-presets.json'))
    for profession in ('warrior', 'hunter', 'xenobinder'):
        if 'astral' in presets[profession]:
            raise RuntimeError(f'"astral" already allowed for {profession}')
        presets[profession].append('astral')
    write('src/config/visual-presets.json', json.dumps(presets, indent=2, ensure_ascii=False) + '\n')
    # 3. Revision flag '205' on every list that already carries '204'
    for p in FLAG_FILES:
        t = read(p)
        before = t.count("'204']")
        total = t.count("'204'")
        if before == 0 or before != total:
            raise RuntimeError(f"{p}: '204' appears {total} times but {before} as a list tail; inspect manually")
        write(p, t.replace("'204']", "'204','205']"))
    # 4. Selection subtitle
    p = 'src/ui/CharacterSelection.ts'
    t = read(p)
    write(p, replace_once(t, 'Pioneiro e Batedor, nos dois gêneros, podem exercer as quatro profissões.',
                          'Erudito, Pioneiro e Batedor, nos dois gêneros, podem exercer as quatro profissões.', 'selection subtitle'))
    # 5. Library section after the 0.1.204 one
    p = 'test-library.html'
    t = read(p)
    lines = t.split('\n')
    index = next(i for i, line in enumerate(lines) if line.startswith('<section><small>0.1.204 &middot; PIONEIRO'))
    section = ('<section><small>0.1.205 &middot; ERUDITO/ERUDITA &middot; QUATRO PROFISS&#213;ES &middot; AGUARDA PLAYTEST</small>'
               '<h2>Uma identidade, quatro profiss&#245;es</h2><p>Escolha Erudito ou Erudita e alterne entre Guerreiro Gal&#225;ctico, Ca&#231;ador Estelar, '
               'Manipulador Astral e Domador de Feras. A figura original do Manipulador Astral permanece. Personagens salvos e progresso real ficam preservados.</p>'
               '<p><a class="launch" href="campaign-playtest.html?refinement=205&amp;presets=1&amp;preset=astral&amp;class=warrior&amp;sex=female&amp;v=0.1.205">'
               'Testar Erudita como Guerreira Gal&#225;ctica</a></p><p>Este link abre o laborat&#243;rio de sele&#231;&#227;o; altere G&#234;nero, Personagem e Profiss&#227;o '
               'para revisar o restante do lote. O QA t&#233;cnico local n&#227;o substitui seu playtest. O coop p&#250;blico aguarda atualiza&#231;&#227;o do Render. '
               '<a href="https://github.com/brunomafra-dev/EchoesofDante/tree/main/docs/erudite-professions">Arte, atlas e detalhes t&#233;cnicos</a>.</p></section>')
    lines.insert(index + 1, section)
    write(p, '\n'.join(lines))
    # 6. Version
    for p, expected in (('package.json', 1), ('package-lock.json', 2)):
        t = read(p)
        if t.count('"version": "0.1.204"') != expected:
            raise RuntimeError(f'{p}: expected {expected} version anchor(s)')
        write(p, t.replace('"version": "0.1.204"', '"version": "0.1.205"'))


def wait_for(url, seconds=120):
    end = time.time() + seconds
    while time.time() < end:
        try:
            with urllib.request.urlopen(url, timeout=3) as r:
                if r.status == 200:
                    return True
        except Exception:
            time.sleep(1.5)
    return False


def stop(proc):
    if proc.poll() is None:
        if os.name == 'nt':
            subprocess.run(['taskkill', '/PID', str(proc.pid), '/T', '/F'], capture_output=True)
        else:
            proc.terminate()


def checks():
    ok = run('typecheck', [NPM, 'run', 'typecheck'])
    ok = run('build', [NPM, 'run', 'build'], timeout=1800) and ok
    ok = run('relay suite', ['node', 'scripts/qa-preset-relay.mjs'], env={'QA_REVISION': '205'}) and ok
    ok = run('git diff --check', ['git', 'diff', '--check']) and ok
    if not ok:
        return False
    proc = None
    if 'QA_BASE' not in os.environ:
        LOGS.mkdir(parents=True, exist_ok=True)
        server_log = open(LOGS / 'dev-server.log', 'w', encoding='utf8')
        proc = subprocess.Popen([NPX, 'vite', '--port', str(PORT), '--strictPort', '--host', 'localhost'], cwd=ROOT, stdout=server_log, stderr=subprocess.STDOUT)
        if not wait_for(f'{BASE}/test-library.html'):
            stop(proc)
            return record('dev server', False, 'did not answer on ' + BASE)
        record('dev server', True, BASE)
    try:
        env = {'QA_BASE': BASE, 'QA_REVISION': '205'}
        for suite in ('qa-2d-revision205-selection', 'qa-2d-revision205-input', 'qa-erudite-library-link', 'qa-erudite-coop'):
            ok = run(suite, ['node', f'scripts/{suite}.mjs'], env=env, timeout=1800) and ok
    finally:
        if proc:
            stop(proc)
    return ok


def update_docs():
    sizes = [(CROSS / n).stat().st_size for n in ATLASES]
    stamp = datetime.date.today().strftime('%d/%m/%Y')
    section = ['\n## Fechamento automático (finalize-erudite.py)\n\n', f'Executado em {stamp}. Validação das 18 grades, importação, verificação de geometria e QA abaixo passaram; nada foi commitado.\n\n']
    for s in steps:
        section.append(f'- [{"x" if s["ok"] else " "}] {s["step"]}' + (f' ({s["detail"]})' if s['detail'] else '') + '\n')
    section.append(f'\nOs 18 atlas somam {sum(sizes):,} bytes ({sum(sizes) / 1048576:.2f} MiB) comprimidos; cada um decodificado ocupa 9.437.184 bytes RGBA. Não foi medido FPS nem pico de RAM. Suítes de navegador usam touch/gamepad emulados.\n\n'.replace(',', '.'))
    section.append('**Avaliação humana — pendente.** QA automatizado não aprova aparência. Revisar pelo link do Erudito/Erudita em `test-library.html` antes de qualquer outra etapa. Coop público: depende do deploy do Render.\n')
    p = 'docs/2d-refinement/REVISION_205.md'
    t = read(p).replace('(PAUSADA)', '(PRONTA PARA TESTE HUMANO)')
    write(p, t.rstrip('\n') + '\n' + ''.join(section))
    r = 'docs/RPG_FOUNDATION_ROADMAP.md'
    t = read(r)
    entry = (f'**{stamp} · 0.1.205 pronta para teste humano:** Erudito/Erudita com quatro profissões (Guerreiro, Caçador, Astral, Domador), 18 atlas, três equipamentos e emissores por direção. '
             '[Escopo e evidências](2d-refinement/REVISION_205.md). [x] QA técnico local; [ ] publicação (commit/push não feitos); [ ] coop público no Render; [ ] playtest humano. '
             'Aguardar a avaliação antes de Vinculado/Vinculada ou de níveis, mapas e civilização.\n\n')
    marker = t.index('**24/11/2026')
    write(r, t[:marker] + entry + t[marker:])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--apply', action='store_true', help='perform import, activation and checks (default: dry run)')
    ap.add_argument('--keep-on-fail', action='store_true', help='do not restore activation edits when a check fails (debugging)')
    args = ap.parse_args()
    presets = json.loads(read('src/config/visual-presets.json'))
    if any('astral' in presets[p] for p in ('warrior', 'hunter', 'xenobinder')):
        say('"astral" is already allowed for another profession: 0.1.205 looks activated. Nothing to do.')
        return 1
    if not run('validate sources', [PY, 'scripts/validate-erudite-sources.py']):
        say('\nNOT READY: fewer than 18 valid grades in docs/erudite-professions/source. Nothing was changed. See docs/2d-refinement/qa/205/source-validation/report.json')
        return 1
    if not args.apply:
        say('\nDry run: all 18 grades validate. Re-run with --apply to import, activate and run the checks. Nothing was changed.')
        return 0
    generated = snapshot(['docs/erudite-professions/measurements.json', 'src/visual/eruditeEmitterAnchors.json'])
    if not (run('import atlases', [PY, 'scripts/prepare-scout-professions.py', '--preset', 'astral'])
            and all((CROSS / n).exists() for n in ATLASES)
            and run('verify atlases', [PY, 'scripts/verify-scout-professions.py', '--preset', 'astral', '--revision', '205'])):
        for n in ATLASES:
            (CROSS / n).unlink(missing_ok=True)
        restore(generated)
        say('\nImport or geometry verification failed. Generated atlases/anchors were removed; "astral" stays blocked.')
        return 2
    snap = snapshot(EDITED)
    try:
        activate()
        record('activation edits', True)
        passed = checks()
    except Exception as exc:  # unexpected anchors etc.
        record('activation edits', False, str(exc))
        passed = False
    if not passed:
        if not args.keep_on_fail:
            restore(snap)
            say('\nChecks failed. Activation edits were restored ("astral" is blocked again). The validated atlases remain as inert files; see logs in docs/2d-refinement/qa/205/finalize/.')
        else:
            say('\nChecks failed; edits kept (--keep-on-fail).')
        (LOGS / 'report.json').write_text(json.dumps({'passed': False, 'steps': steps}, indent=2) + '\n', encoding='utf8')
        return 3
    update_docs()
    (LOGS / 'report.json').write_text(json.dumps({'passed': True, 'steps': steps}, indent=2) + '\n', encoding='utf8')
    say('\nREADY FOR HUMAN TEST. Nothing was committed or pushed. Test link:')
    say('  campaign-playtest.html?refinement=205&presets=1&preset=astral&class=warrior&sex=female&v=0.1.205 (also listed in test-library.html)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
