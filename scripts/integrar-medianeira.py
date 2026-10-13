#!/usr/bin/env python3
"""Incorpora imagem CC0 de Nossa Senhora Medianeira de Todas as Graças."""
import json
import urllib.parse
import urllib.request
from pathlib import Path
from io import BytesIO
from PIL import Image
TITLE="Virgem Maria, Mãe e Medianeira"
FILE="Nossa Senhora Medianeira de Todas as Graças — Rainha do Povo Gaúcho.jpg"
PAGE="https://commons.wikimedia.org/wiki/File:"+FILE.replace(" ","_")
URL="https://commons.wikimedia.org/wiki/Special:Redirect/file/"+urllib.parse.quote(FILE)
DEST="media/maria-mae-medianeira.webp"
req=urllib.request.Request(URL,headers={"User-Agent":"LiturgiaOSM/1.0 (iconographic research)"})
with urllib.request.urlopen(req,timeout=90) as response:
    raw=response.read(20000001)
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
credits=[{"celebracao":TITLE,"arquivo":DEST,"fonte":PAGE,"autor_fotografia":"Ihavearidiculousname (Wikimedia Commons)","representacao":"Ícone de Nossa Senhora Medianeira de Todas as Graças, venerado no Santuário Basílica de Santa Maria (RS)","licenca":"CC0 1.0","url_licenca":"https://creativecommons.org/publicdomain/zero/1.0/","adaptacao":"Redimensionamento e conversão para WebP","nota":"Imagem devocional ilustrativa da invocação mariana; não representa obra específica da Ordem dos Servos de Maria."}]
Path("www/data/fontes-imagens-santoral-lote9.json").write_text(json.dumps(credits,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
p=Path("www/data/fontes-imagens-santoral-pendentes.json")
pending=json.loads(p.read_text(encoding="utf-8"))
if len(pending["pendentes"])!=6: raise ValueError("Contagem inicial inesperada")
pending["pendentes"]=[x for x in pending["pendentes"] if x["celebracao"]!=TITLE]
if len(pending["pendentes"])!=5: raise ValueError("Pendente não encontrada")
pending["objetivo"]="Localização e validação das 5 imagens ainda ausentes do Santoral OSM"
p.write_text(json.dumps(pending,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
p=Path("www/data/README.md")
readme=p.read_text(encoding="utf-8")
if "Há atualmente 6 celebrações sem imagem" not in readme: raise ValueError("README inesperado")
readme=readme.replace("Há atualmente 6 celebrações sem imagem","Há atualmente 5 celebrações sem imagem")
readme=readme.replace("- "+TITLE+"\n","")
p.write_text(readme,encoding="utf-8")
