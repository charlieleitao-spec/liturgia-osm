const fs=require('node:fs');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createIndex,loadDocuments}=require('../www/search.js');
(async()=>{
  const baseline=JSON.parse(execFileSync('git',['show','882714044967c13ec8a8b4693eb665acb9ae1f1d:www/data/search-index.json'],{maxBuffer:8*1024*1024}));
  const manifest=JSON.parse(fs.readFileSync('www/data/search-index.json'));
  const reads=[];
  const read=async source=>{reads.push(source);return JSON.parse(fs.readFileSync('www/data/'+source));};
  let stored;
  const cache=async(mode,value)=>mode==='read'?stored:(stored=value);
  const documents=await loadDocuments(manifest,read,cache);
  assert.deepEqual(documents,baseline.documents,'Todos os textos e metadados preservados');
  assert.equal(reads.length,new Set(reads).size,'Uma leitura por JSON');
  const count=reads.length;
  assert.deepEqual(await loadDocuments(manifest,read,cache),documents);
  assert.equal(reads.length,count,'Cache válido evita releitura');
  stored.revision='versão antiga';
  assert.deepEqual(await loadDocuments(manifest,read,cache),documents);
  assert.equal(reads.length,2*count,'Cache antigo é reconstruído');
  assert.deepEqual(await loadDocuments(manifest,read,async()=>null),documents,'Busca funciona sem armazenamento');
  const before=createIndex(baseline.documents),after=createIndex(documents);
  const rows=[];
  for(const term of ['misericórdia','coroa nossa senhora dores','Regra Vida Ordem Secular','2024','Deus','Paulino','Stabat Mater','Maria','ressurreição','servos']){
    for(const category of ['','Orações','Missas','Ofícios','Santoral','PDFs'])assert.deepEqual(after.search(term,category),before.search(term,category));
    rows.push({term,results:after.search(term).length,identical:true});
  }
  fs.mkdirSync('validation-results',{recursive:true});
  fs.writeFileSync('validation-results/search-equivalence.json',JSON.stringify({documents:documents.length,sourceReads:count,queries:rows},null,2)+'\n');
  console.log('456 documentos idênticos; 10 consultas × 6 filtros idênticos (IDs, ordem, pontuação, texto, trechos); cache válido/antigo/indisponível OK.');
})().catch(error=>{console.error(error);process.exitCode=1;});
