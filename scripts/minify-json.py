"""Minifica JSON sem alterar valores; depois regerar o manifesto da busca."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for path in sorted((ROOT / 'www').rglob('*.json')):
    if path.name == 'search-index.json':
        continue  # O gerador controla seu formato e hashes.
    original = path.read_bytes()
    value = json.loads(original)
    compact = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()
    assert json.loads(compact) == value, path
    if len(compact) < len(original):
        path.write_bytes(compact)
