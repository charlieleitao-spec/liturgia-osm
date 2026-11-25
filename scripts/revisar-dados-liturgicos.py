#!/usr/bin/env python3
"""Audita as fontes do APK. --write aplica somente ajustes de transcrição definidos."""
import argparse
from collections import Counter
from datetime import date
import json
from pathlib import Path
import re

DATA = Path(__file__).resolve().parents[1] / 'www/data'
MONTHS = 'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'.split()
TEXT_FIELDS = {'bio', 'prayer', 'texto', 'text', 'pdf_transcript', 'breve_vida',
               'apresentacao', 'hino', 'antifona', 'salmo', 'oracao', 'refrain'}
SPELLING = re.compile(r'\b(?:géneros?|factos?|acções?|baptiz\w*|baptism\w*|objectiv\w*|'
                      r'project\w*|directamente|connosco|óptim\w*)\b', re.I)
PROTECTED = {
    'chamou-o': r'chamou-[ \t]*\n[ \t]*o',
    'louvar-te-ei': r'louvar-(?:[ \t]*\n[ \t]*)?te-(?:[ \t]*\n[ \t]*)?ei',
}


def read_source(path, findings):
    def pairs(items):
        for key, count in Counter(key for key, _ in items).items():
            if count > 1:
                findings.append(f'{path.name}: chave JSON duplicada {key!r} ({count} ocorrências)')
        return dict(items)

    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=pairs)


def audit_calendar(saints, offices, memory, findings):
    def rows(label, keys):
        counts = Counter(keys)
        for key, count in counts.items():
            try:
                if not re.fullmatch(r'\d{2}-\d{2}', key):
                    raise ValueError(key)
                date.fromisoformat(f'2000-{key}')
            except (TypeError, ValueError):
                findings.append(f'{label}: chave inválida {key!r}')
            if count > 1:
                findings.append(f'{label}: {key} duplicada ({count} ocorrências)')
        return set(counts)

    saint_keys = [f"{item['month']:02d}-{item['day']:02d}" for item in saints]
    saint_dates = rows('Santoral', saint_keys)
    office_dates = rows('Ofícios', offices.keys())
    memory_dates = rows('Memória', memory['memory_dates'])
    specific_dates = rows('Textos próprios da Memória', (item['date'] for item in memory['celebrations']))
    for label, keys in [
        ('Santoral sem entrada de Ofício', saint_dates - office_dates),
        ('Ofício sem Santoral', office_dates - saint_dates),
        ('Memória sem Santoral', memory_dates - saint_dates),
        ('Memória sem entrada de Ofício', memory_dates - office_dates),
        ('Texto de Memória fora de memory_dates', specific_dates - memory_dates),
    ]:
        findings.extend(f'{key}: {label}' for key in sorted(keys))
    for key, saint in zip(saint_keys, saints):
        label = re.fullmatch(r'(\d{1,2})º? de (\w+)', saint['date'])
        if (not label or label[2] not in MONTHS or
                (int(label[1]), MONTHS.index(label[2]) + 1) != (saint['day'], saint['month'])):
            findings.append(f'{key}: data por extenso divergente: {saint["date"]}')
        if key in offices and offices[key].get('id') != saint['id']:
            findings.append(f'{key}: ID divergente ({saint["id"]!r} / {offices[key].get("id")!r})')
    print(f'Santoral: {len(saint_dates)} | Ofícios: {len(office_dates)} | Memória: {len(memory_dates)}')
    print('Datas do Santoral fora da seleção da Memória:', ', '.join(sorted(saint_dates - memory_dates)))
    print('Datas da Memória sem texto individual cadastrado:', ', '.join(sorted(memory_dates - specific_dates)))
    for key, note in memory['editorial_notes'].items():
        print(f'Nota editorial {key}: {note}')


def normalize_text(text):
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    for word, pattern in PROTECTED.items():
        def keep_case(match):
            return word[0].upper() + word[1:] if match[0][0].isupper() else word

        text = re.sub(pattern, keep_case, text, flags=re.I)
    # Ellipses, versicle markers, indentation and stanza breaks retain their meaning.
    return re.sub(r'(?<=[\w)\]])[ \t]+([,;!?]|\.(?![.\w]))', r'\1', text)


def revise_fields(value, path, changes, review, field=None):
    if isinstance(value, dict):
        return {key: revise_fields(item, f'{path}/{key}', changes, review, key)
                for key, item in value.items()}
    if isinstance(value, list):
        return [revise_fields(item, f'{path}/{index}', changes, review, field)
                for index, item in enumerate(value)]
    if not isinstance(value, str):
        return value
    if field in TEXT_FIELDS or '\n' in value:
        corrected = normalize_text(value)
        if path in ('oficios-osm.json/celebracoes/08-28/material/horas/oficio_leituras/texto',
                    'oficios-osm.json/celebracoes/08-28/pdf_transcript'):
            corrected = corrected.replace('aos outros. * .Nisto conhecerão', 'aos outros. * Nisto conhecerão')
        if corrected != value:
            changes.append(path)
        for label, pattern in [('Hífen/quebra a conferir', r'(?<=\w)-[ \t]*\n[ \t]*(?=\w)'),
                               ('Pontuação a conferir', r'(?<=\*)[ \t]+\.\w'),
                               ('Grafia a cotejar', SPELLING)]:
            matches = [m.group().replace('\n', '\\n').strip() for m in re.finditer(pattern, corrected)]
            if matches:
                review.append(f'{label} · {path} · {", ".join(matches)}')
        return corrected
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true', help='Falha se houver ajustes de transcrição pendentes.')
    args = parser.parse_args()
    files = [DATA / name for name in ('santoral.json', 'oficios-osm.json', 'memoria-liturgica.json', 'missas-osm.json')]
    files += sorted((DATA / 'devocoes').glob('*.json'))
    findings, changes, review = [], [], []
    sources = {file: read_source(file, findings) for file in files}
    saints, offices, memory = (sources[file] for file in files[:3])
    audit_calendar(saints, offices['celebracoes'], memory, findings)
    if findings:
        print('\n'.join(findings))
        return 1
    print('Divergências estruturais de MM-DD: nenhuma.')
    for file, original in sources.items():
        revised = revise_fields(original, file.relative_to(DATA).as_posix(), changes, review)
        if args.write and revised != original:
            raw = file.read_text(encoding='utf-8')
            compact = len(raw.splitlines()) == 1
            encoded = json.dumps(revised, ensure_ascii=False, indent=None if compact else 2,
                                 separators=(',', ':') if compact else None)
            file.write_text(encoded + ('\n' if raw.endswith('\n') else ''), encoding='utf-8')
    for line in changes:
        print('Ajuste de transcrição ·', line)
    print('\n'.join(review))
    print(f'{len(changes)} campos com ajustes de transcrição; {len(review)} apontamentos editoriais.')
    return int(args.check and bool(changes))


if __name__ == '__main__':
    raise SystemExit(main())
