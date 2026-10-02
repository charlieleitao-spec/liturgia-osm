import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const html=fs.readFileSync(path.join(root,'www','index.html'),'utf8');
const offices=JSON.parse(fs.readFileSync(path.join(root,'www','data','oficios-osm.json'),'utf8'));
const santoral=JSON.parse(fs.readFileSync(path.join(root,'www','data','santoral.json'),'utf8'));
const errors=[];
const warnings=[];

const mapMatch=html.match(/const OFFICE_HOURS_BY_ID=\{([\s\S]*?)\n\};/);
if(!mapMatch){ console.error('OFFICE_HOURS_BY_ID não encontrado.'); process.exit(1); }
const entries=[...mapMatch[1].matchAll(/(\d+):\[([^\]]*)\]/g)];
const map={};
for(const [,id,raw] of entries) map[id]=[...raw.matchAll(/'([^']+)'/g)].map(x=>x[1]);

const allowed=new Set(['invitatorio','oficio','laudes','horaMedia','vesperas']);
const headingPatterns={
  invitatorio:/^Invitatório\s*$/im,
  oficio:/^Ofício das Leituras\s*$/im,
  laudes:/^Laudes\s*$/im,
  horaMedia:/^(Hora Média|Tércia|Sexta|Noa)\s*$/im,
  vesperas:/^Vésperas\s*$/im
};
const commonOnlyIds=new Set(['13','21','24','26']);
const commonInstruction=/usa-se o Comum/i;
const noOwnParts=/não se acrescentam aqui partes próprias/i;

for(const [id,textValue] of Object.entries(offices)){
  const text=String(textValue||'');
  const saint=santoral[Number(id)];
  const detected=Object.entries(headingPatterns).filter(([,rx])=>rx.test(text)).map(([key])=>key);
  const commonOnly=commonOnlyIds.has(id);

  if(commonOnly){
    if(map[id]) errors.push(`Ofício ${id} (${saint?.title}): remissão ao Comum não deve declarar horas próprias.`);
    if(!commonInstruction.test(text)) errors.push(`Ofício ${id} (${saint?.title}): remissão ao Comum sem instrução explícita.`);
    if(!noOwnParts.test(text)) errors.push(`Ofício ${id} (${saint?.title}): falta a indicação de que não há partes próprias documentadas.`);
    if(detected.length) warnings.push(`Ofício ${id} (${saint?.title}): remissão ao Comum contém cabeçalhos a revisar: ${detected.join(', ')}.`);
  } else if(!map[id]){
    errors.push(`Ofício ${id} (${saint?.title||'sem título'}): possui conteúdo próprio, mas não está definido em OFFICE_HOURS_BY_ID.`);
  } else {
    if(!map[id].length) errors.push(`Ofício ${id}: nenhuma hora definida.`);
    for(const hour of map[id]) if(!allowed.has(hour)) errors.push(`Ofício ${id}: hora desconhecida ${hour}.`);
    // Cabeçalhos variam nos textos históricos. A ausência literal é aviso, não falha,
    // porque OFFICE_HOURS_BY_ID já representa a estrutura editorial validada do app.
    for(const hour of map[id]) if(hour!=='invitatorio' && !detected.includes(hour)) warnings.push(`Ofício ${id} (${saint?.title}): ${hour} declarada sem cabeçalho literal padronizado.`);
  }
  if(!text.trim()) errors.push(`Ofício ${id}: texto vazio.`);
}
for(const id of Object.keys(map)) if(!Object.hasOwn(offices,id)) errors.push(`OFFICE_HOURS_BY_ID contém id ${id} sem Ofício correspondente.`);

for(const marker of ['officeHoursForSaint(s)','available.some(([key])=>key===hour)','openServite(\'oficio:\'+officeId+\':\'+actual)']){
  if(!html.includes(marker)) errors.push(`Proteção de navegação ausente: ${marker}`);
}

if(errors.length){ console.error(['AUDITORIA DA ESTRUTURA DOS OFÍCIOS: FALHA',...errors,...warnings.map(w=>`AVISO: ${w}`)].join('\n')); process.exit(1); }
console.log(JSON.stringify({
  status:'ok',
  offices:Object.keys(offices).length,
  ownOfficeStructures:Object.keys(map).length,
  commonOnly:[...commonOnlyIds].map(id=>({id:Number(id),title:santoral[Number(id)]?.title})),
  warnings
},null,2));
