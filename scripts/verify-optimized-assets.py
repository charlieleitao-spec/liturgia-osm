"""Compare optimized PDFs and the entire search manifest to the 4.9.128 baseline."""
import csv
import hashlib
import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '30ad09b8998ccc7ad938a184d66e9ce136e40fe6'
spec = importlib.util.spec_from_file_location('pdfs', ROOT/'scripts/recompress-pdfs.py')
pdfs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdfs)
def original(path):
    return subprocess.check_output(['git','show',BASE+':'+str(path)])

def sha(data):
    return hashlib.sha256(data).hexdigest()

rows = list(csv.DictReader((ROOT/'docs/size-optimization/4.9.129/pdf-bytes.csv').open()))
assert len(rows) == 66
assert {r['file'] for r in rows} == {p.relative_to(ROOT).as_posix() for p in (ROOT/'www/data/pdfs').rglob('*.pdf')}
for row in rows:
    file = ROOT/row['file']
    old, new = original(row['file']), file.read_bytes()
    assert len(new) <= len(old), file
    assert (sha(old),sha(new)) == (row['before_sha256'],row['after_sha256']), file
    assert (len(old),len(new)) == (int(row['before_bytes']),int(row['after_bytes'])), file
    with tempfile.NamedTemporaryFile(suffix='.pdf') as temporary:
        temporary.write(old); temporary.flush()
        assert pdfs.verify(temporary.name,file) == int(row['pages'])
print('66 PDFs / 594 páginas: qpdf, pdftotext simples e layout, pixels 144 dpi, geometria, links, marcadores e rótulos idênticos.')
manifest = json.loads((ROOT/'www/data/search-index.json').read_text())
before = json.loads(original('www/data/search-index.json'))
assert manifest['documents'] == before['documents']
assert manifest['schema'] == before['schema']
assert manifest['sources'].keys() == before['sources'].keys()
for path,digest in manifest['sources'].items():
    assert digest == sha((ROOT/'www'/path).read_bytes()), path
    if not path.endswith('.pdf'):
        assert digest == before['sources'][path], path
for doc in manifest['documents']:
    if doc['category']=='PDFs':
        assert doc['url'] == './'+doc['source']+'#page='+str(doc['page'])
print('708 entradas da busca, textos por página, URLs e âncoras preservados; hashes de fontes atualizados.')
fonts = ROOT/'www/media/fonts'
assert {p.name for p in fonts.glob('*.woff2')} == {'cinzel-normal-latin.woff2','cinzel-normal-latin-ext.woff2'}
assert (fonts/'OFL-LICENSES.txt').read_bytes() == original('www/media/fonts/OFL-LICENSES.txt')
css = (fonts/'fonts.css').read_text()
sw = (ROOT/'www/sw.js').read_text()
for row in json.loads((ROOT/'docs/size-optimization/4.9.129/removed-fonts.json').read_text()):
    assert Path(row[0]).name not in css+sw
for name in ['cordova.js','cordova_plugins.js']:
    assert (ROOT/'www'/name).read_bytes() == b''
assert "const APP_VERSION = '4.9.129';" in (ROOT/'www/app.js').read_text()
assert "liturgia-osm-v4.9.129-personal-v1" in sw
print('Fontes, licença, cache, versão e placeholders Capacitor conferidos.')
