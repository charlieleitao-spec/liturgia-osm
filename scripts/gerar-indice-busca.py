"""Gera corpus offline; requer Poppler (pdftotext). Não altera as fontes."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'www/data'
records = []
ignored = {'image', 'id', 'santoral_id', 'schema_version', 'description', 'categoria',
           'genero', 'grau_confirmado', 'tipo_material', 'editorial_notes'}


def text(value):
    if isinstance(value, str):
        return '' if re.match(r'^(?:https?://|(?:\./)?(?:data|media)/)', value) else value
    if isinstance(value, list):
        return '\n\n'.join(filter(None, (text(v) for v in value)))
    if isinstance(value, dict):
        return '\n\n'.join(filter(None, (text(v) for k, v in value.items()
            if k not in ignored and not k.endswith(('_url', '_pdf')))))
    return ''


def add(title, category, value, source, ref=None, **extra):
    body = text(value).strip()
    if body:
        record = dict(title=title, category=category, source=source, **extra)
        if ref is None:
            record['text'] = body
        else:
            record['ref'] = ref
        records.append(record)


def read(name):
    return json.loads((DATA / name).read_text())


saints = read('santoral.json')
for index, item in enumerate(saints):
    add(item['title'], 'Santoral', item, 'santoral.json', ref=[index])
for index, item in enumerate(read('missas-osm.json')['celebrations']):
    add(item['title'] + ' · Missa', 'Missas', item, 'missas-osm.json', ref=['celebrations', index])
offices = read('oficios-osm.json')
for date, item in offices['celebracoes'].items():
    saint = next((s for s in saints if s['id'] == item.get('id')), {})
    add(saint.get('title', date) + ' · Ofício', 'Ofícios', item, 'oficios-osm.json', ref=['celebracoes', date])
for key in ['celebracoes_moveis', 'sabados_marianos_pdf']:
    for index, item in enumerate(offices[key]):
        add(item.get('title') or item.get('titulo') or 'Ofício mariano', 'Ofícios', item, 'oficios-osm.json', ref=[key, index])
add('Memória Litúrgica · Livro de Oração · 3ª edição revisada, 2024', 'Orações', read('memoria-liturgica.json'), 'memoria-liturgica.json', ref=[])
names = {'coroa':'Coroa de Nossa Senhora das Dores', 'stabat-mater':'Stabat Mater',
         'via-matris':'Via Matris', 'regra':'Regra de Vida da Ordem Secular dos Servos de Maria',
         'oracoes-diarias':'Orações diárias', 'oracoes-varias':'Orações diversas',
         'vigilia':'Vigília de Nossa Senhora', 'rosario':'Rosário',
         'adoracao':'Adoração', 'antifonas':'Antífonas marianas', 'ladainhas':'Ladainhas marianas'}
for path in sorted((DATA / 'devocoes').glob('*.json')):
    value = json.loads(path.read_text())
    title = names.get(path.stem, path.stem)
    if isinstance(value, list):
        for index, item in enumerate(value):
            add(item.get('title', title) if isinstance(item, dict) else title, 'Orações', item, str(path.relative_to(DATA)), ref=[index])
    else:
        add(title, 'Orações', value, str(path.relative_to(DATA)), ref=[])

# Uma entrada por página mantém a referência exata, inclusive entre edições.
for path in sorted((DATA / 'pdfs').rglob('*.pdf')):
    output = subprocess.run(['pdftotext', '-layout', str(path), '-'], check=True, capture_output=True).stdout.decode('utf-8')
    for page, body in enumerate(output.split('\f'), 1):
        if not body.strip():
            continue
        heading = ' '.join(body.strip().splitlines()[0].split())
        relative = path.relative_to(ROOT / 'www').as_posix()
        add(f'{heading} · {path.stem}', 'PDFs', body, relative, page=page, url=f'./{relative}#page={page}')

inputs = sorted(p for p in DATA.rglob('*') if p.suffix in ('.json', '.pdf') and p.name != 'search-index.json')
sources = {p.relative_to(ROOT / 'www').as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs}
result = dict(schema=2, sources=sources, documents=records)
(DATA / 'search-index.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')))
print(f'{len(records)} entradas; {len(sources)} fontes; {(DATA / "search-index.json").stat().st_size} bytes')
