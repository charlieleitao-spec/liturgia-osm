#!/usr/bin/env python3
"""Integra fotografia licenciada do interior da igreja de Monte Senario."""
import json
import urllib.request
from io import BytesIO
from pathlib import Path
from PIL import Image

TITLE = "Dedicação da Basílica de Monte Senário"
FILE = "Montesenario_interno.jpg"
PAGE = "https://commons.wikimedia.org/wiki/File:" + FILE
URL = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + FILE
DEST = "media/monte-senario-basilica.webp"
req = urllib.request.Request(URL, headers={"User-Agent": "LiturgiaOSM/1.0 (iconographic research)"})
with urllib.request.urlopen(req, timeout=90) as response:
    raw = response.read(15_000_001)
if len(raw) > 15_000_000:
    raise ValueError("Arquivo original acima de 15 MB")
with Image.open(BytesIO(raw)) as im:
    im.verify()
with Image.open(BytesIO(raw)) as im:
    im = im.convert("RGB")
    if min(im.size) < 1000:
        raise ValueError("Imagem original com resolução insuficiente")
    im.thumbnail((750, 1100), Image.Resampling.LANCZOS)
    path = Path("www") / DEST
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=85, method=6)
    print("WebP:", path, im.size, path.stat().st_size)

p = Path("www/data/santoral.json")
items = json.loads(p.read_text(encoding="utf-8"))
matches = [r for r in items if r.get("title") == TITLE]
if len(matches) != 1:
    raise ValueError("Celebração ausente ou duplicada")
if matches[0].get("image") and matches[0]["image"] != DEST:
    raise ValueError("Não sobrescrever imagem existente")
matches[0]["image"] = DEST
p.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
credits = [{
    "celebracao": TITLE,
    "arquivo": DEST,
    "fonte": PAGE,
    "fotografia": "Vignaccia76",
    "ano": 2008,
    "licenca": "CC BY-SA 3.0",
    "url_licenca": "https://creativecommons.org/licenses/by-sa/3.0/",
    "obra": "Interior da igreja do Santuário de Monte Senario",
    "adaptacao": "Redimensionamento e conversão da fotografia para WebP",
    "atribuicao": "Fotografia: Vignaccia76 / Wikimedia Commons — CC BY-SA 3.0; adaptada para WebP"
}]
Path("www/data/fontes-imagens-santoral-lote6.json").write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
pend = Path("www/data/fontes-imagens-santoral-pendentes.json")
data = json.loads(pend.read_text(encoding="utf-8"))
data["pendentes"] = [r for r in data["pendentes"] if r["celebracao"] != TITLE]
data["objetivo"] = "Localização e validação das 8 imagens ainda ausentes do Santoral OSM"
pend.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
readme = Path("www/data/README.md")
s = readme.read_text(encoding="utf-8")
if "Há atualmente 9 celebrações sem imagem" not in s:
    raise ValueError("Contagem do README mudou; revisar manualmente")
s = s.replace("Há atualmente 9 celebrações sem imagem", "Há atualmente 8 celebrações sem imagem")
s = s.replace("- " + TITLE + "\n", "")
readme.write_text(s, encoding="utf-8")
