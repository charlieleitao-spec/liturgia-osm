const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {createIndex,loadDocuments}=require('../www/search.js');
(async()=>{
const corpus=JSON.parse(fs.readFileSync('www/data/search-index.json'));
const sources=fs.readdirSync('www/data',{recursive:true}).filter(path=>/\.(json|pdf)$/.test(path)&&path!=='search-index.json').map(path=>'data/'+path).sort();
assert.deepEqual(Object.keys(corpus.sources).sort(),sources,'Fontes adicionadas/removidas: regerar índice');
for(const [path,hash] of Object.entries(corpus.sources)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('www/'+path)).digest('hex'),hash,'Regerar índice: '+path);
}
const documents=await loadDocuments(corpus,async source=>JSON.parse(fs.readFileSync('www/data/'+source)));
const index=createIndex(documents);
assert(index.search('coroa nossa senhora dores','Orações').some(x=>x.doc.title.includes('Coroa')));
assert.deepEqual(index.search('misericórdia').map(x=>x.id),index.search('MISERICORDIA').map(x=>x.id));
assert(index.search('2024').length>0);
assert(index.search('Regra Vida Ordem Secular','Orações').length>0);
assert(index.search('Deus','PDFs').every(x=>x.doc.page>0&&fs.existsSync('www/'+x.doc.source)));
assert(index.search('Deus','PDFs').length>0);
assert.equal(index.search('zzzxxyysemresultado').length,0);
assert.equal(index.search('   ').length,0);
assert.equal(index.search('<>').length,0);
const fixture=createIndex([{title:'Coroa',source:'a',text:'Maria consoladora',category:'Orações'},{title:'Outra',source:'b',text:'Coroa Maria',category:'PDFs'}]);
assert.equal(fixture.search('coroa')[0].id,0);
assert.equal(fixture.search('maria consol')[0].id,0);
assert.equal(fixture.search('Maria','PDFs').length,1);
console.log('Busca: acentos, prefixos, filtros, ranking, edições, PDFs e fontes atualizadas OK. '+corpus.documents.length+' entradas.');

})().catch(error=>{console.error(error);process.exitCode=1;});
