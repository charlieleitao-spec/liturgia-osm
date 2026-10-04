#!/usr/bin/env node
import fs from 'node:fs';
const file=process.argv[2];
if(!file)throw new Error('Informe o caminho de servita.json gerado.');
const result=JSON.parse(fs.readFileSync(file,'utf8'));
const santoral=JSON.parse(fs.readFileSync('www/data/santoral.json','utf8'));
const memoria=JSON.parse(fs.readFileSync('www/data/memoria-liturgica.json','utf8'));
const keys=Object.keys(result);
if(keys.length!==32)throw new Error('Santoral derivado incompleto: '+keys.length);
const byDate=new Map(santoral.map(s=>[String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0'),s]));
const memoryDates=new Set(memoria.memory_dates);
const derivedMemory=Object.entries(result).filter(([,item])=>item.memoria_liturgica);
if(derivedMemory.length!==25)throw new Error('Memória Litúrgica derivada incompleta: '+derivedMemory.length);
for(const [key,item] of Object.entries(result)){
  const saint=byDate.get(key);
  if(!saint||item.id!==saint.id||!item.data||!item.titulo||!item.nome_original)throw new Error('Registro derivado incompleto: '+key);
  if(item.prayer!==(saint.prayer||''))throw new Error('Oração do Santoral divergente em '+key);
  if(Boolean(item.memoria_liturgica)!==memoryDates.has(key))throw new Error('Cobertura da Memória divergente em '+key);
  if(!item.memoria_liturgica)continue;
  const m=item.memoria_liturgica;
  if(!m.date||!m.hino||!m.antifona||!m.salmo||!m.breve_vida||!m.oracao_propria)throw new Error('Memória derivada incompleta: '+key);
  if(m.source_date!==saint.date||m.title!==saint.title)throw new Error('Data ou título da Memória derivada não veio do Santoral canônico: '+key);
  if(!m.fonte_textos_comuns||!m.fonte_breve_vida||!m.fonte_oracao)throw new Error('Fonte não identificada na Memória derivada: '+key);
  const specific=memoria.celebrations.find(entry=>entry.date===key);
  if(m.oracao_propria===(saint.prayer||'')&&m.fonte_oracao!=='Santoral da Ordem.')throw new Error('Fonte da oração derivada incorreta: '+key);
  if(specific?.oracao_propria&&m.fonte_oracao==='Santoral da Ordem.')throw new Error('Oração própria do Livro sem atribuição: '+key);
}
if(result['12-14']||!result['12-15'])throw new Error('Calendário de Boaventura inválido');
if(!result['12-15'].memoria_liturgica.nota_editorial.includes('14 de dezembro'))throw new Error('Nota editorial de Boaventura ausente');
console.log('Base derivada validada:',keys.length,'celebrações,',derivedMemory.length,'Memórias Litúrgicas.');
