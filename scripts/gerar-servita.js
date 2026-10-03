#!/usr/bin/env node
const fs=require('fs');
const path=require('path');

const santoral=JSON.parse(fs.readFileSync('www/data/santoral.json','utf8'));
const oficios=JSON.parse(fs.readFileSync('www/data/oficios-osm.json','utf8'));
const outPath=process.argv[2]||'derived/servita.json';
if(oficios.schema_version!==2 || !oficios.celebracoes) throw new Error('oficios-osm.json fora do schema canônico v2');

const result={};
const keyOf=s=>String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0');

for(const s of santoral){
  const key=keyOf(s);
  const lit=oficios.celebracoes[key];
  if(!lit) throw new Error('Material canônico ausente para '+key+' '+s.title);
  if(Number(lit.id)!==Number(s.id)) throw new Error('ID divergente em '+key);
  result[key]={
    id:s.id,
    data:s.date,
    titulo:s.title,
    nome_original:s.name,
    bio:s.bio||'',
    tipo_material:lit.tipo_material,
    material:lit.material||{}
  };
}
const extra=Object.keys(oficios.celebracoes).filter(k=>!result[k]);
if(extra.length) throw new Error('Datas litúrgicas sem entrada no santoral: '+extra.join(', '));
if(result['12-14']) throw new Error('Data antiga de Boaventura (14/12) detectada');
if(!result['12-15']) throw new Error('Boaventura (15/12) ausente');

fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
console.log('Base derivada gerada integralmente das fontes mestras:',Object.keys(result).length,'celebrações');
