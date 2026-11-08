const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const raw=fs.readFileSync('www/data/biblioteca-servita-catalogo.json','utf8'),catalog=JSON.parse(raw);
assert.equal(raw,fs.readFileSync('data/biblioteca-servita-catalogo.json','utf8'));
assert.equal(catalog.schema_version,2);assert.equal(catalog.documents.length,5);
assert.equal(new Set(catalog.documents.map(d=>d.id)).size,5);
const sw=fs.readFileSync('www/sw.js','utf8'),core=vm.runInNewContext(sw+'; CORE;', {self:{addEventListener(){}}});
const paths=new Set();
for(const doc of catalog.documents){
 assert.match(doc.download_path,/^data\/pdfs\/biblioteca\/[a-z0-9-]+\.pdf$/);
 assert.equal(doc.offline_asset,undefined);assert(!fs.existsSync('www/'+doc.download_path));
 assert(!core.includes('./'+doc.download_path));assert(!sw.includes(doc.download_path));
 assert.match(doc.download.url,new RegExp('^https://raw\\.githubusercontent\\.com/charlieleitao-spec/liturgia-osm/[a-f0-9]{40}/www/'+doc.download_path.replaceAll('.','\\.')+'$'));
 const bytes=fs.readFileSync('docs/biblioteca-pdfs/'+doc.download_path.split('/').at(-1));
 assert.equal(bytes.length,doc.download.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),doc.download.sha256);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');paths.add(doc.download_path);
}
assert.equal(paths.size,3);
for(const [id,page] of Object.entries({'constituicoes-osm':43,'regra-santo-agostinho':25,'diretorio-geral':131}))assert.equal(catalog.documents.find(d=>d.id===id).start_page,page);
assert.equal(new Set(catalog.documents.slice(0,3).map(d=>d.download_path)).size,1);
assert(core.includes('./library-downloads.js'));
console.log('Biblioteca: 5 entradas/3 downloads, SHA-256/tamanhos/origem fixada, páginas, espelho e exclusão do APK/CORE OK.');
