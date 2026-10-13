#!/usr/bin/env python3
"""Integra tres retratos fornecidos pelo usuario no Santoral OSM.

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

# Validate all inputs before writing anything.
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

names = {name.lower() for name, _ in IMAGES.values()}
pending["pendentes"] = [p for p in pending["pendentes"] if p["celebracao"].lower() not in names and not (
    "paulino" in p["celebracao"].lower() or "baccilieri" in p["celebracao"].lower() or "egídio" in p["celebracao"].lower()
)]
pending["objetivo"] = "Registro de imagens do Santoral OSM"
sources = [{
    "celebracao": name,
    "arquivo": "media/" + filename,
    "fonte": "Imagem enviada pelo usuario",
    "autorizacao": "Publicacao no Liturgia OSM e Somos Servos autorizada em 13/10/2026",
    "autor_original": "Nao informado; autorizacao do usuario nao comprova titularidade de direitos de terceiros",
} for name, filename in IMAGES.values()]
santoral_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
pendentes_path.write_text(json.dumps(pending, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "www/data/fontes-imagens-santoral-lote12.json").write_text(
    json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print("Tres imagens integradas. Execute npm test e o build do APK.")
