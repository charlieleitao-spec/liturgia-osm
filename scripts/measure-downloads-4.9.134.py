import json,zipfile,hashlib
from pathlib import Path
before=Path('baseline/Liturgia-OSM-4.9.133.apk');stage1=Path('baseline/stage1/Liturgia-OSM-4.9.134.apk');after=Path('Liturgia-OSM-4.9.134.apk')
with zipfile.ZipFile(before) as old,zipfile.ZipFile(after) as new:
    names=set(new.namelist());prefix='assets/public/'
    assert not any(n.startswith(prefix+'data/pdfs/biblioteca/') and not n.endswith('/') for n in names)
    assert not any(prefix+n in names for n in ['cordova.js','cordova_plugins.js'])
    assert prefix+'media/fonts/OFL-LICENSES.txt' in names
    for n in old.namelist():
        if n.startswith(prefix+'data/') and n.endswith(('.json','.pdf')) and n not in [prefix+'data/search-index.json',prefix+'data/biblioteca-servita-catalogo.json'] and '/pdfs/biblioteca/' not in n:
            assert new.read(n)==old.read(n),n
    corpus=json.loads(new.read(prefix+'data/search-index.json'))
    assert len(corpus['documents'])==708
    result={'before_bytes':before.stat().st_size,'stage1_bytes':stage1.stat().st_size,'after_bytes':after.stat().st_size,'saved_since_base':before.stat().st_size-after.stat().st_size,'saved_since_stage1':stage1.stat().st_size-after.stat().st_size,'sha256':hashlib.sha256(after.read_bytes()).hexdigest(),'canonical_data_and_liturgical_pdfs_unchanged':True,'device_tests':'pending'}
Path('validation-results').mkdir(exist_ok=True);Path('validation-results/downloads-size.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
