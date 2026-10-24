const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const source=fs.readFileSync('www/servite-1.js','utf8'),reader=fs.readFileSync('www/servite-3.js','utf8');
const declaration=name=>source.match(new RegExp('const '+name+' = ("(?:[^"\\\\]|\\\\.)*");'))[0];
const ctx={};vm.createContext(ctx);vm.runInContext(declaration('BENEDICTUS_TEXT')+'\n'+declaration('MAGNIFICAT_TEXT')+'\nthis.canticles={BENEDICTUS_TEXT,MAGNIFICAT_TEXT};',ctx);
vm.runInContext(reader.slice(reader.indexOf('function insertCanticleAfterAntiphon'),reader.indexOf('function wrapSection')),ctx);
const manifest=JSON.parse(fs.readFileSync('docs/canticos-evangelicos-revisao.json'));
const normalized=s=>s.replace(/[\s–=]/g,'');
for(const [key,meta] of Object.entries(manifest.canticles)){
 const text=ctx.canticles[key];
 assert.equal(createHash('sha256').update(normalized(text)).digest('hex'),meta.original_text_sha256,'Redação, palavras e sinais preservados: '+key);
 assert.deepEqual(text.split('\n\n').map(s=>s.split('\n').length),meta.lines_per_strophe);
 assert.ok(text.split('\n').filter(Boolean).every(l=>!l.trim().endsWith('–')));
}
const mixed='Cântico evangélico (Benedictus)\nAnt. Primeira linha da antífona\nsegunda linha da mesma antífona.\n\nPRECES\nOuvi-nos.\n\nCântico evangélico (Magnificat)\nAnt. Antífona de Vésperas.\n\nORAÇÃO\nOremos.';
const out=ctx.insertCanticleAfterAntiphon(mixed,ctx.canticles.BENEDICTUS_TEXT);
assert.equal(out.split(ctx.canticles.BENEDICTUS_TEXT).length-1,1);
assert.equal(out.split(ctx.canticles.MAGNIFICAT_TEXT).length-1,1);
assert.ok(out.indexOf('segunda linha da mesma antífona.')<out.indexOf('– Bendito seja'));
assert.equal(ctx.insertCanticleAfterAntiphon(out,ctx.canticles.BENEDICTUS_TEXT),out,'Não duplicar cânticos já presentes');
assert.equal(ctx.insertCanticleAfterAntiphon('Uma leitura sobre o Magnificat.',ctx.canticles.MAGNIFICAT_TEXT),'Uma leitura sobre o Magnificat.');
console.log('Cânticos: Benedictus em 8 estrofes e Magnificat em 5; redação e sinais preservados; antífona multilinha, seleção pelo título e ausência de duplicação verificadas.');
