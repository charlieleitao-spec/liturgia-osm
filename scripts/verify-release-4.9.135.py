"""Preserva o código do APK 41053 aceito por Frei Charlie no A56."""
import json
import subprocess
from pathlib import Path

APPROVED = '03f72ae112fef871f9e0780018862b4d495859bb'
VERSION = '4.9.135'

def paths(ref, *roots):
    return subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', ref, *roots], text=True).splitlines()

def approved(name):
    return subprocess.check_output(['git', 'show', f'{APPROVED}:{name}'])

roots = ['www', 'scripts', 'data', 'docs/biblioteca-pdfs', 'capacitor.config.json', 'icone-android-liturgia-osm.zip']
expected = set(paths(APPROVED, *roots))
for name in expected:
    old = approved(name)
    if name == 'www/app.js':
        old = old.replace(b"const APP_VERSION = '4.9.134';", b"const APP_VERSION = '4.9.135';", 1)
    elif name == 'www/sw.js':
        old = old.replace(b'liturgia-osm-v4.9.134-', b'liturgia-osm-v4.9.135-', 1)
    assert Path(name).read_bytes() == old, f'Alteração além da versão no código aprovado: {name}'
actual = set()
for root in roots:
    p = Path(root)
    if p.is_file():
        actual.add(p.as_posix())
    else:
        actual.update(f.as_posix() for f in p.rglob('*') if f.is_file())
assert actual == expected | {'scripts/verify-release-4.9.135.py'}, 'Arquivos de execução adicionados ou removidos'
for name in ['package.json', 'package-lock.json']:
    old = json.loads(approved(name))
    old['version'] = VERSION
    if name == 'package-lock.json':
        old['packages']['']['version'] = VERSION
    assert json.loads(Path(name).read_text()) == old, f'Dependências alteradas: {name}'
assert json.loads(Path('capacitor.config.json').read_text())['appId'] == 'com.liturgia_osm.app'
print('PASS: código aprovado, dados, PDFs, fontes, geradores nativos e dependências preservados. Mudanças permitidas: versão 4.9.135 e cache.')
