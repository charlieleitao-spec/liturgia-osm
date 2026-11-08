"""Compare actual signed APKs and enforce the stage 1 asset-only scope."""
import hashlib
import json
from pathlib import Path
import zipfile

removed = ['cordova.js', 'cordova_plugins.js', 'ALTERACOES-SIMPLIFICACAO.md',
           'data/pdfs/biblioteca/README.md', 'media/EMBLEMA-FONTE.txt',
           'media/benincasa-montepulciano-CREDITOS.md']
before = Path('baseline/Liturgia-OSM-4.9.133.apk')
after = Path('Liturgia-OSM-4.9.134.apk')
prefix = 'assets/public/'
with zipfile.ZipFile(before) as old, zipfile.ZipFile(after) as new:
    a = {n[len(prefix):] for n in old.namelist() if n.startswith(prefix) and not n.endswith('/')}
    b = {n[len(prefix):] for n in new.namelist() if n.startswith(prefix) and not n.endswith('/')}
    assert a-b == set(removed), sorted(a-b)
    assert not b-a, sorted(b-a)
    for name in b:
        left, right = old.read(prefix+name), new.read(prefix+name)
        if name in ['app.js', 'sw.js']:
            right = right.replace(b'4.9.134', b'4.9.133')
        assert left == right, 'Asset changed beyond stage 1: '+name
    assert 'media/fonts/OFL-LICENSES.txt' in b
    for name in b:
        if name.endswith(('.js', '.html', '.json', '.css')):
            value = new.read(prefix+name).decode('utf-8')
            for path in removed:
                assert path not in value, f'{name} references {path}'
    result = {
        'stage': 1,
        'before_bytes': before.stat().st_size,
        'after_bytes': after.stat().st_size,
        'saved_apk_bytes': before.stat().st_size-after.stat().st_size,
        'removed_raw_bytes': sum(old.getinfo(prefix+n).file_size for n in removed),
        'removed_compressed_bytes': sum(old.getinfo(prefix+n).compress_size for n in removed),
        'sha256_before': hashlib.sha256(before.read_bytes()).hexdigest(),
        'sha256_after': hashlib.sha256(after.read_bytes()).hexdigest(),
        'all_other_assets_identical_except_version': True,
        'device_tests': 'pending: installation over existing app, library online/offline, search, reminders, widgets',
    }
Path('validation-results').mkdir(exist_ok=True)
Path('validation-results/cleanup-size.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result, indent=2))
