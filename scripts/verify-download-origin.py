"""Fail closed unless each immutable source belongs to main history or a tag."""
import json,re,subprocess
from pathlib import Path
catalog=json.loads(Path('www/data/biblioteca-servita-catalogo.json').read_text())
for sha in {re.fullmatch(r'https://raw.githubusercontent.com/charlieleitao-spec/liturgia-osm/([a-f0-9]{40})/www/data/pdfs/biblioteca/[a-z0-9-]+\.pdf',d['download']['url'])[1] for d in catalog['documents']}:
    in_main=subprocess.run(['git','merge-base','--is-ancestor',sha,'origin/main'],check=False).returncode==0
    tags=subprocess.check_output(['git','tag','--contains',sha],text=True).strip()
    if not in_main and not tags:raise SystemExit('Origem de download fora da main e sem tag: '+sha)
    print('Origem imutável confirmada na main ou tag: '+sha)
