"""Audita os bytes reais do APK assinado e sua base 4.9.113; sem rede."""
import json
import re
import zipfile
from pathlib import Path

before_path = Path('baseline/Liturgia-OSM-4.9.113.apk')
after_path = Path('Liturgia-OSM-4.9.114.apk')
before, after = zipfile.ZipFile(before_path), zipfile.ZipFile(after_path)
prefix = 'assets/public/'
old = {n.removeprefix(prefix): n for n in before.namelist() if n.startswith(prefix) and not n.endswith('/')}
new = {n.removeprefix(prefix): n for n in after.namelist() if n.startswith(prefix) and not n.endswith('/')}
assert old.keys() | {'pdf-links.js'} == new.keys(), 'Arquivos offline adicionados/removidos sem auditoria'
for name in old:
    if name.endswith('.json') and name != 'data/search-index.json':
        assert json.loads(before.read(old[name])) == json.loads(after.read(new[name])), name
for name in ['app.css', 'servite-3.js']:
    assert before.read(old[name]) == after.read(new[name]), name
for name in old:
    if name.startswith('data/pdfs/') or name == 'data/search-index.json':
        assert before.read(old[name]) == after.read(new[name]), name
assert len([n for n in new if n.startswith('data/pdfs/')]) == 63
assert len(json.loads(after.read(new['data/santoral.json']))) == 32
assert len(json.loads(after.read(new['data/oficios-osm.json']))['celebracoes']) == 32
assert len(json.loads(after.read(new['data/search-index.json']))['documents']) == 456
sw = after.read(new['sw.js']).decode()
assert 'liturgia-osm-v4.9.114-otimizacao-pdf-offline' in sw
core = set(re.findall(r'"\./([^"\n]+)"', sw))
changed = [n for n in old if before.read(old[n]) != after.read(new[n])]
changed += sorted(new.keys()-old.keys())
assert all(n in core for n in changed if n != 'sw.js'), 'Arquivo alterado fora do cache CORE'
groups = {
    'pdfs': [n for n in old if n.startswith('data/pdfs/')],
    'search_index': ['data/search-index.json'],
    'json': [n for n in old if n.endswith('.json') and n != 'data/search-index.json'],
    'other_web': [n for n in changed if not n.startswith('data/pdfs/') and not n.endswith('.json')],
}
rows = []
for group, names in groups.items():
    row = {'group': group, 'files': len(names)}
    for label, archive, mapping in [('before', before, old), ('after', after, new)]:
        row[label+'_raw_bytes'] = sum(archive.getinfo(mapping[n]).file_size for n in names if n in mapping)
        row[label+'_compressed_bytes'] = sum(archive.getinfo(mapping[n]).compress_size for n in names if n in mapping)
    row['saved_raw_bytes'] = row['before_raw_bytes'] - row['after_raw_bytes']
    row['saved_compressed_bytes'] = row['before_compressed_bytes'] - row['after_compressed_bytes']
    rows.append(row)
result = {'before_bytes': before_path.stat().st_size, 'after_bytes': after_path.stat().st_size,
          'saved_bytes': before_path.stat().st_size-after_path.stat().st_size,
          'celebrations': 32, 'offices': 32, 'pdfs': 63, 'search_documents': 456,
          'all_changed_files_precached': True, 'groups': rows}
Path('validation-results').mkdir(exist_ok=True)
Path('validation-results/size-report.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
