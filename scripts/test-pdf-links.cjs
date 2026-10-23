const assert=require('node:assert/strict');
const fs=require('node:fs');
const {resolve,formatOfficeText}=require('../www/pdf-links.js');
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
const offices=JSON.parse(fs.readFileSync('www/data/oficios-osm.json'));
const records=[...Object.values(offices.celebracoes),...offices.celebracoes_moveis,...offices.sabados_marianos_pdf].filter(item=>item.pdf_transcript);
const plain=html=>html.replace(/<[^>]+>/g,'').replace(/&(amp|lt|gt|quot|#39);/g,(_,entity)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[entity]));
const compact=value=>value.replace(/\s+/g,' ').trim();
assert.equal(records.length,31);
for(const item of records)assert.equal(compact(plain(formatOfficeText(item.pdf_transcript))),compact(item.pdf_transcript),'O texto integral deve ser preservado: '+item.pdf_file);
const pucci=formatOfficeText(offices.celebracoes['01-12'].pdf_transcript);
assert.match(pucci,/<h3 class="office-hour-heading">Ofício das Leituras<\/h3>/);
assert.ok((pucci.match(/office-hymn-stanza/g)||[]).length>=6,'Preservar as estrofes do hino de Pucci');
assert.match(pucci,/<p class="office-prose">Antônio Maria Pucci nasceu em Poggiole, pequeno povoado da diocese de Pistóia, Itália, em 1819\. Aos 18 anos/);
assert.match(formatOfficeText('<img src=x onerror=alert(1)>'),/&lt;img/);
console.log('Leitura completa: 31 transcrições preservadas integralmente; títulos, parágrafos corridos e estrofes do hino conferidos.');
