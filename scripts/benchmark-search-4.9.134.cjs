const fs=require('node:fs'),{execFileSync}=require('node:child_process'),{performance}=require('node:perf_hooks'),assert=require('node:assert/strict');
const {loadDocuments,createIndex}=require('../www/search.js');
const baseline=JSON.parse(execFileSync('git',['show','3a90e17f8e4faa4055f7b01201c5df71cc727265:www/data/search-index.json'],{maxBuffer:8*1024*1024}));
const current=JSON.parse(fs.readFileSync('www/data/search-index.json'));
const terms=['misericórdia','coroa nossa senhora dores','Regra Vida Ordem Secular','2024','Deus','Paulino','Stabat Mater','Maria','ressurreição','servos'];
const read=async source=>JSON.parse(fs.readFileSync('www/data/'+source));
async function benchmark(corpus){
 const loadStart=performance.now(),docs=await loadDocuments(corpus,read,async()=>null),indexStart=performance.now(),index=createIndex(docs),ready=performance.now();
 const queries=terms.map(term=>{const times=[];for(let i=0;i<35;i++){const start=performance.now();index.search(term);times.push(performance.now()-start);}times.sort((a,b)=>a-b);return {term,results:index.search(term).length,median_ms:times[17],p95_ms:times[33]};});
 return {docs,index,report:{bytes:Buffer.byteLength(JSON.stringify(corpus)),documents:docs.length,load_ms:indexStart-loadStart,index_ms:ready-indexStart,queries}};
}
(async()=>{
 const before=await benchmark(baseline),after=await benchmark(current);
 assert.deepEqual(after.docs,before.docs);
 for(const term of terms)for(const filter of ['','Orações','Missas','Ofícios','Santoral','PDFs'])assert.deepEqual(after.index.search(term,filter),before.index.search(term,filter));
 const result={environment:{runtime:process.version,platform:process.platform,note:'Local/CI CPU; not A56. Same implementation, cold corpus without IndexedDB; times are informational.'},before:before.report,after:after.report,exact_equivalence:'10 queries × 6 filters; IDs, order, scores, full text and snippets identical',json_records_with_text:current.documents.filter(d=>['oficios-osm.json','missas-osm.json','santoral.json'].includes(d.source)&&Object.hasOwn(d,'text')).length,pdf_text_bytes:current.documents.filter(d=>d.category==='PDFs').reduce((sum,d)=>sum+Buffer.byteLength(d.text||''),0)};
 fs.mkdirSync('validation-results',{recursive:true});fs.writeFileSync('validation-results/search-4.9.134.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
