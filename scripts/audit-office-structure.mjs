import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const html=fs.readFileSync(path.join(root,'www','index.html'),'utf8');
const offices=JSON.parse(fs.readFileSync(path.join(root,'www','data','oficios-osm.json'),'utf8'));
const santoral=JSON.parse(fs.readFileSync(path.join(root,'www','data','santoral.json'),'utf8'));
const errors=[];
const diagnostics=[];

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

for(const [id,textValue] of Object.entries(offices)){
  const text=String(textValue||'');
  const detected=Object.entries(headingPatterns).filter(([,rx])=>rx.test(text)).map(([key])=>key);
  if(!map[id]){
    const saint=santoral[Number(id)];
    diagnostics.push({id:Number(id),title:saint?.title||'(sem título)',detectedHours:detected,opening:text.slice(0,220).replace(/\s+/g,' ')});
    errors.push(`Ofício ${id}: sem definição em OFFICE_HOURS_BY_ID; horas detectadas: ${detected.join(', ')||'nenhuma'}.`);
  } else {
    if(!map[id].length) errors.push(`Ofício ${id}: nenhuma hora definida.`);
    for(const hour of map[id]) if(!allowed.has(hour)) errors.push(`Ofício ${id}: hora desconhecida ${hour}.`);
    // Uma hora declarada deve ter um cabeçalho correspondente no texto-fonte, salvo Invitatório legado.
    for(const hour of map[id]) if(hour!=='invitatorio' && !detected.includes(hour)) errors.push(`Ofício ${id}: ${hour} declarada, mas cabeçalho não detectado no texto-fonte.`);
  }
  if(!text.trim()) errors.push(`Ofício ${id}: texto vazio.`);
}
for(const id of Object.keys(map)) if(!Object.hasOwn(offices,id)) errors.push(`OFFICE_HOURS_BY_ID contém id ${id} sem Ofício correspondente.`);

for(const marker of ['officeHoursForSaint(s)','available.some(([key])=>key===hour)','openServite(\'oficio:\'+officeId+\':\'+actual)']){
  if(!html.includes(marker)) errors.push(`Proteção de navegação ausente: ${marker}`);
}

if(diagnostics.length) console.error('DIAGNÓSTICO DOS OFÍCIOS NÃO MAPEADOS\n'+JSON.stringify(diagnostics,null,2));
if(errors.length){ console.error(['AUDITORIA DA ESTRUTURA DOS OFÍCIOS: FALHA',...errors].join('\n')); process.exit(1); }
console.log(JSON.stringify({status:'ok',offices:Object.keys(offices).length,structured:Object.keys(map).length,hours:[...allowed]},null,2));
