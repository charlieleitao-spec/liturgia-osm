#!/usr/bin/env node
const fs=require('fs');

const santoral=JSON.parse(fs.readFileSync('www/data/santoral.json','utf8'));
const currentPath=process.argv[2]||'derived/servita.json';
const outPath=process.argv[3]||currentPath;
const current=fs.existsSync(currentPath)?JSON.parse(fs.readFileSync(currentPath,'utf8')):{};

function keyOf(s){return String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0');}
function materialOf(s,key){
  const old=current[key];
  if(old && old.material) return old.material;
  return {};
}
function typeOf(s,key){
  const old=current[key];
  if(old && old.tipo_material) return old.tipo_material;
  return Object.keys(materialOf(s,key)).length?'textos_proprios':'sem_material_proprio';
}

const result={};
for(const s of santoral){
  const key=keyOf(s);
  result[key]={
    id:s.id,
    data:s.date,
    titulo:s.title,
    nome_original:s.name,
    bio:s.bio||'',
    tipo_material:typeOf(s,key),
    material:materialOf(s,key)
  };
}
if(result['12-14']) throw new Error('Data antiga de Boaventura (14/12) detectada');
if(!result['12-15']) throw new Error('Boaventura (15/12) ausente');
if(Object.keys(result).length!==santoral.length) throw new Error('Contagem divergente');
fs.mkdirSync(require('path').dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
console.log('Base derivada gerada:',Object.keys(result).length,'celebrações');
