#!/usr/bin/env python3
"""Import only confidently identified, freely licensed Wikimedia Commons images."""
import json, re, time, unicodedata, urllib.parse, urllib.request
from io import BytesIO
from pathlib import Path
from PIL import Image

CANDIDATES = {
 "Frei Paulino M. Baldassarri": ["Paolino Baldassari", "Paulino Baldassarri"],
 "Santa Clélia Barbieri": ["Clelia Barbieri"],
 "Fernando Maria Baccilieri": ["Ferdinando Maria Baccilieri"],
 "Boaventura de Forlì": ["Bonaventura da Forlì", "Bonaventura da Forli"],
 "Isabel Picenardi": ["Elisabetta Picenardi"],
 "Ubaldo de Sansepolcro": ["Ubaldo da Sansepolcro"],
 "Joaquim de Sena": ["Gioacchino da Siena"],
 "Francisco de Sena": ["Francesco da Siena servita"],
 "Tiago Filipe de Faenza": ["Giacomo Filippo Bertoni"],
 "André de Sansepolcro": ["Andrea da Sansepolcro servita"],
 "Benincasa de Montepulciano": ["Benincasa da Montepulciano"],
 "Boaventura de Pistoia": ["Bonaventura da Pistoia"],
 "João Ângelo de Milão": ["Giovannangelo Porro"],
 "Jerônimo de Sant'Angelo in Vado": ["Girolamo da Sant'Angelo in Vado"],
 "Tiago de \"Città della Pieve\"": ["Giacomo da Citta della Pieve"],
 "Frei Egídio Maria Moscini": ["Egidio Maria Moscini"],
}
LICENSES = ("public domain", "cc by", "cc-by", "cc0", "pd-", "cc-by-sa", "cc by-sa")
def norm(s):
 s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
 return re.sub(r"[^a-z0-9]+", " ", s).strip()
def api(params):
 url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"format":"json", **params})
 req=urllib.request.Request(url,headers={"User-Agent":"LiturgiaOSM-Santoral/1.0 (public liturgical project; contact via GitHub charlieleitao-spec/liturgia-osm)"})
 with urllib.request.urlopen(req,timeout=30) as f: return json.load(f)
def fetch(url):
 req=urllib.request.Request(url,headers={"User-Agent":"LiturgiaOSM-Santoral/1.0 (public liturgical project)"})
 with urllib.request.urlopen(req,timeout=45) as f: return f.read()
records=json.loads(Path("www/data/santoral.json").read_text(encoding="utf-8"))
readme=Path("www/data/README.md")
text=readme.read_text(encoding="utf-8")
media=Path("www/media"); media.mkdir(exist_ok=True)
manifest=[]
for title, searches in CANDIDATES.items():
 item=next((x for x in records if x["title"]==title),None)
 if item is None or item.get("image"): continue
 found=None
 for phrase in searches:
  try:
   data=api({"action":"query","generator":"search","gsrsearch":f'filetype:bitmap "{phrase}"',"gsrnamespace":6,"gsrlimit":12,"prop":"imageinfo","iiprop":"url|extmetadata|size"})
  except Exception as e:
   print("SEARCH ERROR",title,str(e),flush=True);continue
  for page in data.get("query",{}).get("pages",{}).values():
   fname=page["title"].removeprefix("File:")
   normalized=norm(fname)
   if norm(phrase) not in normalized: continue
   info=(page.get("imageinfo") or [{}])[0]
   meta=info.get("extmetadata",{})
   license_label=meta.get("LicenseShortName",{}).get("value","").lower()
   if not any(x in license_label for x in LICENSES):continue
   if not fname.lower().endswith((".jpg",".jpeg",".png",".webp")):continue
   if info.get("width",0)<250 or info.get("height",0)<250:continue
   found=(fname,info["url"],license_label,page["title"])
   break
  if found:break
  time.sleep(.3)
 if not found:
  print("REVIEW NEEDED",title,flush=True);continue
 fname,url,license_label,page=found
 try:
  im=Image.open(BytesIO(fetch(url))).convert("RGB")
  im.thumbnail((760,1100),Image.Resampling.LANCZOS)
  slug=norm(title).replace(" ","-")
  output=media/(slug+".webp")
  im.save(output,"WEBP",quality=82,method=6)
 except Exception as e:
  print("DOWNLOAD ERROR",title,str(e),flush=True);continue
 item["image"]="media/"+output.name
 text=text.replace("- "+title+"\n","")
 manifest.append({"celebracao":title,"arquivo":str(output),"fonte":"https://commons.wikimedia.org/wiki/"+urllib.parse.quote(page.replace(" ","_")),"licenca":license_label,"titulo_arquivo_original":fname})
 print("ADDED",title,page,flush=True)
if manifest:
 text=re.sub(r"Há atualmente \d+ celebrações sem imagem",f"Há atualmente {sum(not x.get('image') for x in records)} celebrações sem imagem",text)
 readme.write_text(text,encoding="utf-8")
 Path("www/data/santoral.json").write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 Path("www/data/fontes-imagens-santoral-lote2.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("TOTAL ADDED",len(manifest),flush=True)
