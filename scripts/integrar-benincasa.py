#!/usr/bin/env python3
"""Integra afresco histórico de Benincasa (Commons CC BY-SA 4.0)."""
import json
import urllib.parse
import urllib.request
from pathlib import Path
from io import BytesIO
from PIL import Image
TITLE="Benincasa de Montepulciano"
FILE="Luigi ademollo, scene bibliche, 1828, 03 beato benincasa da montepulciano.jpg"
PAGE="https://commons.wikimedia.org/wiki/File:"+FILE.replace(" ","_")
URL="https://commons.wikimedia.org/wiki/Special:Redirect/file/"+urllib.parse.quote(FILE)
DEST="media/benincasa-montepulciano.webp"
req=urllib.request.Request(URL,headers={"User-Agent":"LiturgiaOSM/1.0 (historical iconography)"})
with urllib.request.urlopen(req,timeout=90) as response: raw=response.read(20000001)
if len(raw)>20000000: raise ValueError("Arquivo acima de 20 MB")
with Image.open(BytesIO(raw)) as im: im.verify()
with Image.open(BytesIO(raw)) as im:
    im=im.convert("RGB")
    if min(im.size)<400: raise ValueError("Resolução insuficiente")
    im.thumbnail((850,1100),Image.Resampling.LANCZOS)
    target=Path("www")/DEST
    target.parent.mkdir(parents=True,exist_ok=True)
    im.save(target,"WEBP",quality=86,method=6)
    print(target,im.size,target.stat().st_size)
p=Path("www/data/santoral.json")
data=json.loads(p.read_text(encoding="utf-8"))
matches=[x for x in data if x.get("title")==TITLE]
if len(matches)!=1: raise ValueError("Celebração ausente ou duplicada")
if matches[0].get("image") and matches[0]["image"]!=DEST: raise ValueError("Imagem já existente")
matches[0]["image"]=DEST
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
credits=[{"celebracao":TITLE,"arquivo":DEST,"fonte":PAGE,"autor_fotografia":"Francesco Bini (Sailko), Wikimedia Commons","obra":"Beato Benincasa da Montepulciano, ciclo pictórico na Capela da Assunção","artista":"Luigi Ademollo (1828)","local":"Santissima Annunziata, Florença","licenca":"CC BY-SA 4.0","url_licenca":"https://creativecommons.org/licenses/by-sa/4.0/","adaptacao":"Redimensionamento e conversão para WebP, sem recorte"}]
Path("www/data/fontes-imagens-santoral-lote11.json").write_text(json.dumps(credits,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
p=Path("www/data/fontes-imagens-santoral-pendentes.json")
pending=json.loads(p.read_text(encoding="utf-8"))
if len(pending["pendentes"])!=4: raise ValueError("Contagem inicial inesperada")
pending["pendentes"]=[x for x in pending["pendentes"] if x["celebracao"]!=TITLE]
if len(pending["pendentes"])!=3: raise ValueError("Pendente não encontrada")
pending["objetivo"]="Localização e validação das 3 imagens ainda ausentes do Santoral OSM"
p.write_text(json.dumps(pending,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
p=Path("www/data/README.md")
readme=p.read_text(encoding="utf-8")
if "Há atualmente 4 celebrações sem imagem" not in readme: raise ValueError("README inesperado")
readme=readme.replace("Há atualmente 4 celebrações sem imagem","Há atualmente 3 celebrações sem imagem")
readme=readme.replace("- "+TITLE+"\n","")
p.write_text(readme,encoding="utf-8")
