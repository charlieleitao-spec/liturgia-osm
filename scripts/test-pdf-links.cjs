const assert=require('node:assert/strict');
const fs=require('node:fs');
const {resolve}=require('../www/pdf-links.js');
const base='https://localhost/index.html';
for(const [input,path,page] of [
 ['./data/pdfs/missal/antonio.pdf','data/pdfs/missal/antonio.pdf',1],
 ['./data/pdfs/oficios/piecruz.pdf#page=3','data/pdfs/oficios/piecruz.pdf',3],
 ['http://servidimaria.net/sitoosm/po/textos-osm/livros-liturgicos-osm/missa/dolorosa.pdf','data/pdfs/missal/dolorosa.pdf',1],
 ['http://servidimaria.net/sitoosm/po/textos-osm/livros-liturgicos-osm/lhoras/ordinario.pdf#page=2','data/pdfs/oficios/ordinario.pdf',2],
 ['./data/pdfs/missal/antonio.pdf#page=-1','data/pdfs/missal/antonio.pdf',1],
])assert.deepEqual(resolve(input,base),{path,page});
for(const input of ['https://outro.example/document.pdf','file:///data/pdfs/missal/antonio.pdf','/data/pdfs/../secret.pdf','javascript:alert(1)','/data/pdfs/missal/../secret.pdf'])assert.equal(resolve(input,base),null,input);
let count=0;
function inspect(value){
 if(Array.isArray(value))value.forEach(inspect);
 else if(value&&typeof value==='object'){
  if(value.pdf_url&&value.local_pdf_url){
   const remote=resolve(value.pdf_url,base),local=resolve(value.local_pdf_url,base);
   assert.deepEqual(remote,local);assert(fs.existsSync('www/'+local.path));count++;
  }
  Object.values(value).forEach(inspect);
 }
}
for(const file of ['missas-osm.json','oficios-osm.json'])inspect(JSON.parse(fs.readFileSync('www/data/'+file)));
assert.equal(count,63);
console.log('PDFs: 63 links oficiais correspondem aos arquivos locais; páginas da busca preservadas; endereços externos não confundidos com assets.');
