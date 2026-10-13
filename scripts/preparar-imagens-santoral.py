#!/usr/bin/env python3
"""Prepara imagens licenciadas para revisão, sem alterar assets do aplicativo."""
import json
import pathlib
import urllib.parse
import urllib.request
from io import BytesIO
from PIL import Image

ROOT = pathlib.Path("santoral-imagens-revisao")
ROOT.mkdir(exist_ok=True)
entries = [
    ("joaquim-de-sena", "Gano_di_fazio,_episodi_della_vita_del_beato_gioacchino_piccolomini,_1302-1317_ca,_da_s.m._dei_servi.JPG", "Combusken", "CC BY-SA 3.0"),
    ("tiago-filipe-de-faenza", "Bartolomeo_della_gatta,_beato_giacomo_filippo_bertoni_da_faenza,_1485-86_ca.,_da_s._pier_piccolo_ad_arezzo_01.jpg", "Sailko", "CC BY 3.0"),
]
manifest = []
for slug, filename, author, license_name in entries:
    url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(filename, safe="")
    item = {"slug": slug, "source": "https://commons.wikimedia.org/wiki/File:" + filename, "photographer": author, "license": license_name}
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "LiturgiaOSM-Santoral/1.0 (iconographic review)"})
        with urllib.request.urlopen(req, timeout=45) as response:
            data = response.read(25 * 1024 * 1024 + 1)
        if len(data) > 25 * 1024 * 1024:
            raise ValueError("Arquivo excede 25 MB")
        with Image.open(BytesIO(data)) as original:
            img = original.convert("RGB")
            img.thumbnail((1200, 1600))
            img.save(ROOT / (slug + ".webp"), "WEBP", quality=84, method=6)
        item["status"] = "converted_for_review"
    except Exception as exc:
        item["status"] = "download_failed"
        item["error"] = str(exc)
    manifest.append(item)
(ROOT / "creditos.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
if any(x["status"] != "converted_for_review" for x in manifest):
    raise SystemExit("Uma ou mais imagens falharam; confira creditos.json no artefato.")
