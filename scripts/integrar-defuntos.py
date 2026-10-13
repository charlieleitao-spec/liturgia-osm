#!/usr/bin/env python3
"""Integra gravura servita de Antonio Tempesta (1591), CC0, à comemoração dos defuntos."""
import json
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path
from PIL import Image

TITLE = "Comemoração dos Defuntos da Ordem"
FILE = "De_heilige_Philippus_bidt_voor_de_zielen_van_twee_broeders_Het_Leven_van_Philippus_Benitius_(serietitel)_Vita_B._Philippi_Benicii_Florent._ord._servor_B._Mariae_virginis_(serietitel),_RP-P-OB-37.539.jpg"
PAGE = "https://commons.wikimedia.org/wiki/File:" + FILE
URL = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(FILE)
DEST = "media/defuntos-da-ordem.webp"
req = urllib.request.Request(URL, headers={"User-Agent": "LiturgiaOSM/1.0 (iconographic research)"})
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

credits = [{"celebracao": TITLE, "arquivo": DEST, "fonte": PAGE, "acervo": "Rijksmuseum, RP-P-OB-37.539", "autor": "Antonio Tempesta", "ano": 1591, "obra": "São Filipe Benício reza a Maria pelas almas de dois irmãos falecidos", "licenca": "CC0 1.0", "url_licenca": "https://creativecommons.org/publicdomain/zero/1.0/", "adaptacao": "Redimensionamento e conversão para WebP", "atribuicao": "Antonio Tempesta (1591) / Rijksmuseum / Wikimedia Commons — CC0 1.0"}]
Path("www/data/fontes-imagens-santoral-lote8.json").write_text(json.dumps(credits, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
pending_path = Path("www/data/fontes-imagens-santoral-pendentes.json")
pending = json.loads(pending_path.read_text(encoding="utf-8"))
if len(pending["pendentes"]) != 7:
    raise ValueError("Contagem inicial de pendentes inesperada")
pending["pendentes"] = [x for x in pending["pendentes"] if x["celebracao"] != TITLE]
if len(pending["pendentes"]) != 6:
    raise ValueError("Celebração pendente ausente ou duplicada")
pending["objetivo"] = "Localização e validação das 6 imagens ainda ausentes do Santoral OSM"
pending_path.write_text(json.dumps(pending, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
readme = Path("www/data/README.md")
s = readme.read_text(encoding="utf-8")
if "Há atualmente 7 celebrações sem imagem" not in s:
    raise ValueError("Contagem do README inesperada")
s = s.replace("Há atualmente 7 celebrações sem imagem", "Há atualmente 6 celebrações sem imagem")
s = s.replace("- " + TITLE + "\n", "")
readme.write_text(s, encoding="utf-8")
