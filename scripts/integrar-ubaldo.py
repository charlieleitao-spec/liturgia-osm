#!/usr/bin/env python3
"""Incorpora imagem histórica licenciada do beato Ubaldo."""
import json
import urllib.request
import urllib.parse
from pathlib import Path
from io import BytesIO
from PIL import Image

TITLE = "Ubaldo de Sansepolcro"
FILE = "Matteo_bonechi,_storie_dell'ordine_servita,_1722,_beato_ubaldo_adimari_raccoglie_l'acqua_col_suo_saio,_02.jpg"
PAGE = "https://commons.wikimedia.org/wiki/File:" + FILE.replace(" ", "_")
URL = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(FILE)
DEST = "media/ubaldo-de-sansepolcro.webp"
req = urllib.request.Request(URL, headers={"User-Agent":"LiturgiaOSM/1.0 (iconographic research)"})
with urllib.request.urlopen(req, timeout=90) as response:
    raw = response.read(20_000_001)
if len(raw) > 20_000_000:
    raise ValueError("Imagem original acima de 20 MB")
with Image.open(BytesIO(raw)) as im:
    im.verify()
with Image.open(BytesIO(raw)) as im:
    im = im.convert("RGB")
    if min(im.size) < 700:
        raise ValueError("Resolução insuficiente")
    im.thumbnail((850, 1100), Image.Resampling.LANCZOS)
    target = Path("www") / DEST
    target.parent.mkdir(parents=True, exist_ok=True)
    im.save(target, "WEBP", quality=86, method=6)
    print("Imagem:", target, im.size, target.stat().st_size)
path = Path("www/data/santoral.json")
data = json.loads(path.read_text(encoding="utf-8"))
matches = [item for item in data if item.get("title") == TITLE]
if len(matches) != 1:
    raise ValueError("Celebração ausente ou duplicada: " + TITLE)
if matches[0].get("image") and matches[0]["image"] != DEST:
    raise ValueError("Imagem anterior existente; não substituir")
matches[0]["image"] = DEST
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
credits = [{"celebracao":TITLE,"arquivo":DEST,"fonte":PAGE,"fotografia":"Francesco Bini (Sailko)","obra":"Matteo Bonechi, 1722 — Beato Ubaldo Adimari recolhe água com seu hábito","local":"Santissima Annunziata, Florença","licenca":"CC BY-SA 4.0","url_licenca":"https://creativecommons.org/licenses/by-sa/4.0/","adaptacao":"Redimensionamento e conversão para WebP","atribuicao":"Francesco Bini (Sailko) / Wikimedia Commons — CC BY-SA 4.0; imagem adaptada"}]
Path("www/data/fontes-imagens-santoral-lote7.json").write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
pending_path = Path("www/data/fontes-imagens-santoral-pendentes.json")
pending = json.loads(pending_path.read_text(encoding="utf-8"))
pending["pendentes"] = [x for x in pending["pendentes"] if x["celebracao"] != TITLE]
pending["objetivo"] = "Localização e validação das 7 imagens ainda ausentes do Santoral OSM"
pending_path.write_text(json.dumps(pending, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
readme = Path("www/data/README.md")
s = readme.read_text(encoding="utf-8")
if "Há atualmente 8 celebrações sem imagem" not in s:
    raise ValueError("Contagem do README inesperada")
s = s.replace("Há atualmente 8 celebrações sem imagem", "Há atualmente 7 celebrações sem imagem")
s = s.replace("- " + TITLE + "\n", "")
readme.write_text(s, encoding="utf-8")
