from pathlib import Path
import json, urllib.request
from io import BytesIO
from PIL import Image

images = {
  "Santo Agostinho": ("Botticelli,_sant'agostino_degli_uffizi.jpg", "santo-agostinho.webp"),
  "Nossa Senhora das Dores": ("Aleijadinho_-_Nossa_Senhora_das_Dores-1.jpg", "nossa-senhora-das-dores.webp"),
}
data_path = Path("www/data/santoral.json")
records = json.loads(data_path.read_text(encoding="utf-8"))
media = Path("www/media")
media.mkdir(parents=True, exist_ok=True)
for title, (commons_name, filename) in images.items():
    from urllib.parse import quote
    url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + quote(commons_name)
    req = urllib.request.Request(url, headers={"User-Agent": "LiturgiaOSM/1.0 (liturgical educational app; image import)"})
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read()
    im = Image.open(BytesIO(raw)).convert("RGB")
    im.thumbnail((760, 1100), Image.Resampling.LANCZOS)
    im.save(media / filename, "WEBP", quality=82, method=6)
    matches = [item for item in records if item.get("title") == title]
    if len(matches) != 1:
        raise ValueError(f"Expected one Santoral entry for {title}, got {len(matches)}")
    matches[0]["image"] = "media/" + filename
data_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Images inserted:", [name for _, name in images.values()])
