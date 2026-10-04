#!/usr/bin/env node
// Gera a base da Família Servita a partir das fontes canônicas.
const fs=require('fs');
const path=require('path');

const santoral=JSON.parse(fs.readFileSync('www/data/santoral.json','utf8'));
const oficios=JSON.parse(fs.readFileSync('www/data/oficios-osm.json','utf8'));
const memoria=JSON.parse(fs.readFileSync('www/data/memoria-liturgica.json','utf8'));
if(memoria.schema_version!==2 || !Array.isArray(memoria.memory_dates) || !Array.isArray(memoria.celebrations))
  throw new Error('memoria-liturgica.json fora do schema canônico v2');
if(!memoria.common || !['hino','antifona','salmo'].every(key=>memoria.common[key]))
  throw new Error('Textos comuns da Memória Litúrgica incompletos');
const datasMemoria=new Set(memoria.memory_dates);
const memoriasPorData=new Map(memoria.celebrations.map(item=>[item.date,item]));
if(datasMemoria.size!==25 || memoriasPorData.size!==memoria.celebrations.length)
  throw new Error('Cobertura ou textos exclusivos da Memória Litúrgica inválidos');
const outPath=process.argv[2]||'derived/servita.json';
if(oficios.schema_version!==2 || !oficios.celebracoes) throw new Error('oficios-osm.json fora do schema canônico v2');

const result={};
const keyOf=s=>String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0');
const livroFonte=memoria.source||'Livro de Oração dos Servos de Maria, seção Memória Litúrgica.';
const santoralFonte='Santoral da Ordem.';

for(const s of santoral){
  const key=keyOf(s),lit=oficios.celebracoes[key];
  if(!lit) throw new Error('Material canônico ausente para '+key+' '+s.title);
  if(Number(lit.id)!==Number(s.id)) throw new Error('ID divergente em '+key);
  const item=memoriasPorData.get(key)||null;
  const coberta=datasMemoria.has(key);
  if(Boolean(item)&&!coberta) throw new Error('Texto da Memória fora da cobertura em '+key);
  let memoriaLiturgica=null;
  if(coberta){
    memoriaLiturgica={
      date:key,
      source_date:s.date,
      title:s.title,
      hino:memoria.common.hino,
      antifona:memoria.common.antifona,
      salmo:memoria.common.salmo,
      breve_vida:item?.breve_vida||s.bio||'',
      apresentacao:item?.apresentacao||'',
      oracao_propria:item?.oracao_propria||s.prayer||'',
      fonte_textos_comuns:livroFonte,
      fonte_breve_vida:(item?.breve_vida||item?.apresentacao)?livroFonte:santoralFonte,
      fonte_oracao:item?.oracao_propria?livroFonte:santoralFonte,
      nota_editorial:memoria.editorial_notes?.[key]||''
    };
  }
  result[key]={
    id:s.id,
    data:s.date,
    titulo:s.title,
    nome_original:s.name,
    bio:s.bio||'',
    prayer:s.prayer||'',
    prayer_source:santoralFonte,
    image:s.image||null,
    tipo_material:lit.tipo_material,
    material:lit.material||{},
    memoria_liturgica:memoriaLiturgica
  };
}
const extra=Object.keys(oficios.celebracoes).filter(k=>!result[k]);
if(extra.length) throw new Error('Datas litúrgicas sem entrada no santoral: '+extra.join(', '));
if(result['12-14']) throw new Error('Data antiga de Boaventura (14/12) detectada');
if(Object.values(result).filter(item=>item.memoria_liturgica).length!==datasMemoria.size)
  throw new Error('Memórias litúrgicas derivadas não correspondem à cobertura da fonte');
if(!result['12-15']) throw new Error('Boaventura (15/12) ausente');

fs.mkdirSync(path.dirname(outPath),{recursive:true});
fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
console.log('Base derivada gerada integralmente das fontes mestras:',Object.keys(result).length,'celebrações; Memória Litúrgica:',datasMemoria.size,'datas.');
