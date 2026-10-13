#!/usr/bin/env python3
"""Integra três retratos fornecidos pelo usuário no Santoral OSM.

Uso: python scripts/integrar-tres-retratos-santoral.py /caminho/para/pasta-com-webp
"""
from pathlib import Path
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "imagens-santoral"
IMAGES = {
    5: ("FREI PAULINO M. BALDASSARRI", "frei-paulino-baldassarri.webp"),
    13: ("FERNANDO MARIA BACCILIERI", "fernando-maria-baccilieri.webp"),
    17: ("FREI EGÍDIO MARIA MOSCINI", "frei-egidio-moscini.webp"),
}
santoral_path = ROOT / "www/data/santoral.json"
pendentes_path = ROOT / "www/data/fontes-imagens-santoral-pendentes.json"
entries = json.loads(santoral_path.read_text(encoding="utf-8"))
pending = json.loads(pendentes_path.read_text(encoding="utf-8"))
by_id = {entry["id"]: entry for entry in entries}

# Validar todos os arquivos e correspondências antes de alterar o repositório.
for ident, (name, filename) in IMAGES.items():
    if ident not in by_id or by_id[ident]["name"] != name:
        raise SystemExit(f"Celebracao incorreta: {ident} {name}")
    path = SOURCE / filename
    if not path.is_file():
        raise SystemExit(f"Imagem ausente: {path}")
    data = path.read_bytes()
    if len(data) < 1000 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise SystemExit(f"Imagem nao e WebP valido: {path}")

for ident, (name, filename) in IMAGES.items():
    by_id[ident]["image"] = "media/" + filename
    target = ROOT / "www/media" / filename
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE / filename, target)

labels = {
    "paulino": ("FREI PAULINO M. BALDASSARRI", "frei-paulino-baldassarri.webp"),
    "baccilieri": ("FERNANDO MARIA BACCILIERI", "fernando-maria-baccilieri.webp"),
    "egídio": ("FREI EGÍDIO MARIA MOSCINI", "frei-egidio-moscini.webp"),
}
for item in pending.get("pendentes", []):
    lower = item.get("celebracao", "").lower()
    match = next((value for key, value in labels.items() if key in lower), None)
    if match:
        name, filename = match
        item["status"] = "imagem integrada; autoria e licença original não informadas; pendente de verificação"
        item["arquivo"] = "media/" + filename
        item["origem"] = "imagem fornecida pelo usuário"

pending["objetivo"] = "Rastrear autoria e licença das imagens integradas ao Santoral OSM"
sources = [{
    "celebracao": name,
    "arquivo": "media/" + filename,
    "fonte": "Imagem fornecida pelo usuário",
    "autorizacao": "Publicação no Liturgia OSM e Somos Servos autorizada em 13/10/2026",
    "autor_original": "Não informado; autoria e licença original pendentes de verificação"
} for name, filename in IMAGES.values()]
santoral_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
pendentes_path.write_text(json.dumps(pending, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "www/data/fontes-imagens-santoral-lote12.json").write_text(
    json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print("Tres imagens integradas; autoria e licença original permanecem pendentes de verificação.")
