#!/usr/bin/env python3
"""Recorta os dois afrescos documentados do altar de Santa Maria del Lavello."""
from pathlib import Path
from io import BytesIO
import json
import urllib.request
from PIL import Image, ImageEnhance

SOURCE = "Santa_Maria_del_Lavello_-_high_altar.jpg"
PAGE = "https://commons.wikimedia.org/wiki/File:" + SOURCE
URL = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + SOURCE
entries = [
    ("Boaventura de Pistoia", "boaventura-de-pistoia.webp", (0.065, 0.27, 0.245, 0.545)),
    ("Francisco de Sena", "francisco-de-sena.webp", (0.748, 0.27, 0.930, 0.545)),
]
request = urllib.request.Request(URL, headers={"User-Agent": "LiturgiaOSM/1.0 (iconographic research)"})
with urllib.request.urlopen(request, timeout=90) as response:
    raw = response.read(20_000_001)
if len(raw) > 20_000_000:
    raise ValueError("Arquivo maior que 20 MB")
with Image.open(BytesIO(raw)) as source:
    source.verify()
with Image.open(BytesIO(raw)) as source:
    source = source.convert("RGB")
    width, height = source.size
    if width < 1000 or height < 1000:
        raise ValueError("Resolução original insuficiente")
    records_path = Path("www/data/santoral.json")
    records = json.loads(records_path.read_text(encoding="utf-8"))
    credits = []
    for title, filename, box in entries:
        matches = [r for r in records if r.get("title") == title]
        if len(matches) != 1:
            raise ValueError("Celebração ausente ou duplicada: " + title)
        record = matches[0]
        target = "media/" + filename
        if record.get("image") and record["image"] != target:
            raise ValueError("Não substituir imagem existente: " + title)
        coords = tuple(round(v * (width if i % 2 == 0 else height)) for i,v in enumerate(box))
        crop = source.crop(coords)
        if min(crop.size) < 250:
            raise ValueError("Recorte pequeno: " + title)
        crop.thumbnail((650, 900), Image.Resampling.LANCZOS)
        dest = Path("www") / target
        dest.parent.mkdir(parents=True, exist_ok=True)
        crop.save(dest, "WEBP", quality=87, method=6)
        record["image"] = target
        credits.append({"celebracao": title, "arquivo": target, "fonte": PAGE,
                        "fotografia": "Kaitu", "licenca": "CC0 1.0",
                        "obra": "Afresco de Antonio Maria Caneva, Santa Maria del Lavello",
                        "adaptacao": "Recorte individual da fotografia do altar"})
        print("Integrada:", title, crop.size, dest.stat().st_size)
records_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
Path("www/data/fontes-imagens-santoral-lote5.json").write_text(
    json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
readme = Path("www/data/README.md")
text = readme.read_text(encoding="utf-8")
text = text.replace("Há atualmente 11 celebrações sem imagem", "Há atualmente 9 celebrações sem imagem")
for title in ("Francisco de Sena", "Boaventura de Pistoia"):
    text = text.replace("- " + title + "\n", "")
readme.write_text(text, encoding="utf-8")
pending_path = Path("www/data/fontes-imagens-santoral-pendentes.json")
pending = json.loads(pending_path.read_text(encoding="utf-8"))
pending["objetivo"] = "Localização e validação das 9 imagens ainda ausentes do Santoral OSM"
pending["pendentes"] = [r for r in pending["pendentes"] if r["celebracao"] not in
                        ("Francisco de Sena", "Boaventura de Pistoia")]
pending_path.write_text(json.dumps(pending, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
