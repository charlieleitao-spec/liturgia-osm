#!/usr/bin/env python3
"""Integra duas fotografias históricas verificadas, sem alterar outras celebrações."""
from pathlib import Path
from io import BytesIO
import json, urllib.parse, urllib.request
from PIL import Image

DATA = Path("www/data/santoral.json")
MEDIA = Path("www/media")
MEDIA.mkdir(exist_ok=True)
entries = [
 ("Joaquim de Sena", "joaquim-de-sena.webp", "Gano_di_fazio,_episodi_della_vita_del_beato_gioacchino_piccolomini,_1302-1317_ca,_da_s.m._dei_servi.JPG", "Combusken", "CC BY-SA 3.0"),
 ("Tiago Filipe de Faenza", "tiago-filipe-de-faenza.webp", "Bartolomeo_della_gatta,_beato_giacomo_filippo_bertoni_da_faenza,_1485-86_ca.,_da_s._pier_piccolo_ad_arezzo_01.jpg", "Sailko", "CC BY 3.0"),
]
records = json.loads(DATA.read_text(encoding="utf-8"))
sources = []
for title, name, source_name, photographer, license_name in entries:
 matches = [r for r in records if r.get("title") == title]
 if len(matches) != 1:
  raise ValueError(f"Esperada uma celebração para {title}; encontradas {len(matches)}")
 record = matches[0]
 expected = "media/" + name
 if record.get("image") and record["image"] != expected:
  raise ValueError(f"Imagem existente preservada para {title}: {record['image']}")
 page = "https://commons.wikimedia.org/wiki/File:" + source_name
 url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(source_name, safe="")
 if not (MEDIA/name).exists():
  request = urllib.request.Request(url, headers={"User-Agent": "LiturgiaOSM/1.0 (Servite iconographic project)"})
  with urllib.request.urlopen(request, timeout=60) as response:
   raw = response.read(25*1024*1024+1)
  if len(raw) > 25*1024*1024: raise ValueError("Imagem acima de 25 MB")
  with Image.open(BytesIO(raw)) as test: test.verify()
  with Image.open(BytesIO(raw)) as im:
   if min(im.size) < 180: raise ValueError("Resolução insuficiente")
   im = im.convert("RGB")
   im.thumbnail((760,1100), Image.Resampling.LANCZOS)
   im.save(MEDIA/name, "WEBP", quality=84, method=6)
 record["image"] = expected
 sources.append({"celebracao":title,"arquivo":expected,"fonte":page,"fotografia":photographer,"licenca":license_name})
 print("Integrada:", title, flush=True)
DATA.write_text(json.dumps(records, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
Path("www/data/fontes-imagens-santoral-lote4.json").write_text(json.dumps(sources,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
