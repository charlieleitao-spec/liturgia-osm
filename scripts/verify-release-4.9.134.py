"""Conserva o código do APK 41051 aprovado no Samsung A56."""
import json
import subprocess
from pathlib import Path

APPROVED = 'c8bf2c31d7622578ce196d68137fc9b3676ff4ee'

def tree(ref, *paths):
    return subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', ref, *paths], text=True).splitlines()

def approved(path):
    return subprocess.check_output(['git', 'show', f'{APPROVED}:{path}'])

# Conferir toda a aplicação e os geradores nativos, não apenas o número da versão.
paths = tree(APPROVED, 'www', 'scripts', 'data', 'docs/biblioteca-pdfs', 'package.json', 'package-lock.json', 'capacitor.config.json', 'icone-android-liturgia-osm.zip')
for name in paths:
    assert Path(name).read_bytes() == approved(name), f'Código diferente do candidato aprovado: {name}'
expected_web = set(tree(APPROVED, 'www'))
actual_web = {p.as_posix() for p in Path('www').rglob('*') if p.is_file()}
assert actual_web == expected_web, 'Arquivos web adicionados ou removidos após o aceite'
assert json.loads(Path('package.json').read_text())['version'] == '4.9.134'
assert json.loads(Path('capacitor.config.json').read_text())['appId'] == 'com.liturgia_osm.app'
assert "const APP_VERSION = '4.9.134';" in Path('www/app.js').read_text()
print('PASS: aplicação web, PDFs, geradores nativos, fontes, dependências e pacote idênticos ao candidato 41051 aprovado. A release altera somente o versionCode Android para 41052.')
