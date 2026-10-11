#!/usr/bin/env python3
"""Import four identified images from institutional Servite sites."""
from pathlib import Path
from io import BytesIO
import json, urllib.request
from PIL import Image

IMAGES = [
 ("Jerônimo de Sant'Angelo in Vado", "jeronimo-sant-angelo-in-vado.webp", "https://www.stperegrineparish.org/wp-content/uploads/2017/09/girolamo.jpg", "https://servantsofmary.ph/december-10-blessed-jerome-of-sant-angelo-in-vado/"),
 ("João Ângelo de Milão", "joao-angelo-porro.webp", "https://www.stperegrineparish.org/wp-content/uploads/2017/09/10-25-porro.jpg", "https://servantsofmary.ph/october-25-blessed-john-angelo-porro/"),
 ("Boaventura de Forlì", "boaventura-forli.webp", "https://www.stperegrineparish.org/wp-content/uploads/2017/09/bonafor-279.jpg", "https://servantsofmary.ph/september-6-blessed-bonaventura-of-forli/"),
 ("André de Sansepolcro", "andre-sansepolcro.webp", "https://www.stperegrineparish.org/wp-content/uploads/2017/08/andrea-1.jpg", "https://servantsofmary.ph/august-31-blessed-andrew-of-borgo-san-sepolcro/"),
]
p=Path("www/data/santoral.json")
records=json.loads(p.read_text(encoding="utf-8"))
media=Path("www/media");media.mkdir(exist_ok=True)
sources=[]
for title,filename,url,article in IMAGES:
 matches=[x for x in records if x.get("title")==title]
 if len(matches)!=1:raise ValueError(f"Expected exactly one celebration: {title}; got {len(matches)}")
 if matches[0].get("image"):
  print("Already imported",title,flush=True)
  continue
 req=urllib.request.Request(url,headers={"User-Agent":"LiturgiaOSM/1.0 (Servite liturgical project)"})
 with urllib.request.urlopen(req,timeout=45) as f:raw=f.read()
 im=Image.open(BytesIO(raw))
 im.verify()
 im=Image.open(BytesIO(raw)).convert("RGB")
 if min(im.size)<180:raise ValueError(f"Image too small: {title}: {im.size}")
 im.thumbnail((760,1100),Image.Resampling.LANCZOS)
 im.save(media/filename,"WEBP",quality=84,method=6)
 matches[0]["image"]="media/"+filename
 sources.append({"celebracao":title,"arquivo":"media/"+filename,"imagem_original":url,"pagina_institucional":article,"credito":"Acervo iconográfico dos Servos de Maria (Vicariato das Filipinas / St. Peregrine Parish)","observacao":"Representação iconográfica; não é fotografia histórica."})
 print("Imported",title,flush=True)
p.write_text(json.dumps(records,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
Path("www/data/fontes-imagens-santoral-lote3.json").write_text(json.dumps(sources,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
readme=Path("www/data/README.md")
txt=readme.read_text(encoding="utf-8")
import re
txt=re.sub(r"Há atualmente \d+ celebrações sem imagem",f"Há atualmente {sum(not x.get('image') for x in records)} celebrações sem imagem",txt)
readme.write_text(txt,encoding="utf-8")
