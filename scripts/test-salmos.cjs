const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const audit=JSON.parse(fs.readFileSync('docs/auditoria-salmos-apk.json'));
const read=file=>JSON.parse(fs.readFileSync('www/data/'+file));
const valueAt=(object,path)=>path.reduce((v,k)=>v[k],object);
const compact=s=>s.replace(/\\n/g,'\n').replace(/\s+/g,'');
for(const item of [...audit.changed_text_fields,...audit.checked_text_fields]){
 const actual=valueAt(read(item.file),item.path);
 assert.equal(createHash('sha256').update(compact(actual)).digest('hex'),item.sha256_without_whitespace,'Palavras e sinais preservados: '+item.file+'/'+item.path.join('/'));
}
for(const item of audit.pdf_originals)assert.equal(createHash('sha256').update(fs.readFileSync('www/'+item.path)).digest('hex'),item.sha256,'PDF oficial preservado: '+item.path);
const app=fs.readFileSync('www/app.js','utf8');
const ctx={escapeHtml:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
vm.createContext(ctx);
const start=app.indexOf('const PRAYER_CONTEXT_HEADINGS');
assert.ok(start>=0);
vm.runInContext(app.slice(start,app.indexOf('// ===================== calendário')),ctx);
const sample='Salmo 14 — Quem habitará na casa de Deus?\n\n“Senhor, quem morará em vossa casa *\ne em vosso monte santo habitará?”\n\n– É aquele que caminha sem pecado *\ne pratica a justiça fielmente.';
const html=ctx.renderPrayer(sample);
assert.equal((html.match(/class="liturgical-psalm-heading|class="prayer-text-heading liturgical-psalm-heading/g)||[]).length,1);
assert.equal((html.match(/class="prayer-stanza"/g)||[]).length,2);
assert.equal((html.match(/class="liturgical-verse-line"/g)||[]).length,4);
assert.ok(!html.includes('liturgical-psalm-quote'),'Verso entre aspas não é epígrafe');
let headings=0;
for(const item of audit.checked_text_fields){
 const text=valueAt(read(item.file),item.path);
 const expected=(text.match(/^[ \t]*Salmo\s+\d+\b/gim)||[]).length;
 if(!expected)continue;
 const rendered=ctx.renderPrayer(text);
 const actual=(rendered.match(/liturgical-psalm-heading/g)||[]).length;
 assert.equal(actual,expected,'Todos os títulos reconhecidos: '+item.file+'/'+item.path.join('/'));
 headings+=actual;
}
console.log(`Salmos: ${headings} títulos reconhecidos; ${audit.changed_text_fields.length} campos com palavras e sinais preservados; ${audit.pdf_originals.length} PDFs oficiais intactos; versos entre aspas e estrofes verificados.`);
