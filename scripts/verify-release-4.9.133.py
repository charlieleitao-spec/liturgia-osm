"""Confere que a release conserva o conteúdo do teste 2 aprovado."""
import json
import subprocess
from pathlib import Path

APPROVED = '475c50600ab3c356785553a45fc330e92316290c'
VERSION = '4.9.133'


def approved(path):
    return subprocess.check_output(['git', 'show', f'{APPROVED}:{path}'])


paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', APPROVED, 'www'], text=True).splitlines()
current_paths = sorted(p.as_posix() for p in Path('www').rglob('*') if p.is_file())
assert current_paths == sorted(paths), 'Arquivos web adicionados/removidos após o teste aprovado'
for path in paths:
    actual = Path(path).read_bytes()
    if path == 'www/app.js':
        assert actual.count(b"const APP_VERSION = '4.9.133';") == 1
        actual = actual.replace(b"const APP_VERSION = '4.9.133';", b"const APP_VERSION = '4.9.132';")
    elif path == 'www/sw.js':
        assert actual.count(b'liturgia-osm-v4.9.133-') == 1
        actual = actual.replace(b'liturgia-osm-v4.9.133-', b'liturgia-osm-v4.9.132-')
    assert actual == approved(path), f'Conteúdo diferente do teste aprovado: {path}'

for path in ['package.json', 'package-lock.json']:
    actual = json.loads(Path(path).read_text())
    assert actual['version'] == VERSION
    actual['version'] = '4.9.132'
    if path == 'package-lock.json':
        assert actual['packages']['']['version'] == VERSION
        actual['packages']['']['version'] = '4.9.132'
    assert actual == json.loads(approved(path)), f'Dependências alteradas: {path}'

assert json.loads(Path('capacitor.config.json').read_text())['appId'] == 'com.liturgia_osm.app'
print('PASS: todos os arquivos web e PDFs idênticos ao teste 2 aprovado, exceto versão/cache; dependências e pacote preservados.')
