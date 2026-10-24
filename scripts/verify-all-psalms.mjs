import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const audit=JSON.parse(await readFile('docs/auditoria-salmos-apk.json','utf8'));
const server=spawn('python3',['-m','http.server','8781','--directory','www'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:8781/');
 await page.waitForFunction(()=>typeof properMassTextHtml==='function'&&santoralReady&&oficiosReady&&MEMORIA_LITURGICA.common&&MISSAS_OSM.celebrations.length===32);
 const all=await page.evaluate(async fields=>{
  const files={};
  const compact=s=>s.replace(/\s+/g,'');
  const results=[];
  for(const item of fields){
   files[item.file]??=await (await fetch('./data/'+item.file)).json();
   const source=item.path.reduce((v,k)=>v[k],files[item.file]);
   const node=document.createElement('div');node.innerHTML=renderPrayer(source);
   const expected=(source.match(/^[ \t]*Salmo\s+\d+\b/gim)||[]).length;
   if(node.querySelectorAll('.liturgical-psalm-heading').length!==expected)throw Error('Título não reconhecido: '+item.file+'/'+item.path.join('/'));
   const references=(source.match(/^[ \t]*Salmo 94, como no Ordinário[^\n]*/gim)||[]).length;
   if(expected>references&&/[*†]/.test(source)&&!node.querySelector('.liturgical-verse-line'))throw Error('Salmo apresentado como prosa: '+item.path.join('/'));
   results.push({file:item.file,path:item.path,headings:expected,verses:node.querySelectorAll('.liturgical-verse-line').length});
  }
  let masses=0;
  for(const item of MISSAS_OSM.celebrations){
   for(const s of item.sections||item.readings||[]){
    const title=s.heading||s.title||'';if(!/^Salmo/i.test(title))continue;
    const n=document.createElement('div');n.innerHTML=properMassTextHtml(title,s.text);
    const clean=cleanMassText(s.text);
    if(compact(n.textContent)!==compact(clean))throw Error('Texto do salmo da Missa alterado: '+item.title);
    const expected=clean.split(/\n[ \t]*\n/).length;
    if(n.querySelectorAll('.mass-psalm-stanza').length!==expected)throw Error('Estrofes da Missa perdidas: '+item.title);
    if(n.querySelectorAll('.liturgical-verse-line').length!==clean.split('\n').filter(l=>l.trim()).length)throw Error('Versos da Missa unidos: '+item.title);
    masses++;
   }
  }
  return {fields:results,masses};
 },audit.checked_text_fields);
 assert.equal(all.masses,38);
 // Inspect the real shared CSS at phone/tablet sizes and both reading scales.
 const layouts=[];
 for(const width of [320,390,768])for(const scale of [1,2]){
  await page.setViewportSize({width,height:844});
  const r=await page.evaluate(({scale})=>{
   readerScale=scale;applyPreferences();document.body.classList.add('liturgical-page');
   document.querySelector('#view').innerHTML='<div class="liturgical-reading prayer-block">'+renderPrayer('Salmo 111\n\n'+MEMORIA_LITURGICA.common.salmo)+'</div>';
   const stanzas=[...document.querySelectorAll('.prayer-stanza')];
   return {strophes:stanzas.length,lines:document.querySelectorAll('.liturgical-verse-line').length,block:[...document.querySelectorAll('.liturgical-verse-line')].every(n=>getComputedStyle(n).display==='block'),spacing:stanzas.every((n,i)=>!i||n.getBoundingClientRect().top>stanzas[i-1].getBoundingClientRect().bottom),overflow:document.documentElement.scrollWidth>innerWidth};
  },{scale});
  assert.equal(r.strophes,6);assert.equal(r.lines,22);assert.equal(r.block,true);assert.equal(r.spacing,true);assert.equal(r.overflow,false);
  layouts.push({width,scale,...r});
 }
 await mkdir('validation-layout',{recursive:true});
 await page.setViewportSize({width:390,height:844});
 for(const [name,kind] of [['salmo-memoria','memory'],['salmo-missa','mass'],['salmo-oficio','office']]){
  await page.evaluate(kind=>{
   readerScale=1;applyPreferences();document.body.classList.add('liturgical-page');
   let html;
   if(kind==='memory')html='<div class="liturgical-reading prayer-block">'+renderPrayer('Salmo 111\n\n'+MEMORIA_LITURGICA.common.salmo)+'</div>';
   else if(kind==='mass'){
    const c=MISSAS_OSM.celebrations.find(x=>x.pdf_file==='villa.pdf');const s=c.sections.find(x=>/^Salmo/.test(x.heading));html=properMassTextHtml(s.heading,s.text);
   }else html='<div class="office-transcript-text">'+OSMPdf.formatOfficeText(OFICIOS_OSM.celebracoes['09-15'].pdf_transcript)+'</div>';
   document.querySelector('#view').innerHTML=html;
  },kind);
  if(kind==='office')await page.locator('.office-psalm-stanza').first().scrollIntoViewIfNeeded();else await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'validation-layout/'+name+'.png'});
 }
 // Individual-hour screen, using the real standalone resource page.
 const standalone=await context.newPage();
 await standalone.goto('http://127.0.0.1:8781/servite.html?view=oficio:0:hora_media');
 await standalone.locator('.hour-tab-content').waitFor();
 assert.equal(await standalone.locator('.psalm-title').count(),9);
 assert.ok(await standalone.locator('.psalm-stanza').count()>=25);
 await standalone.screenshot({path:'validation-layout/salmos-hora-media.png'});
 await writeFile('validation-layout/all-psalms-report.json',JSON.stringify({all,layouts,standalone:true},null,2));
 console.log('PASS: all local Psalm headings and 38 responsorial Psalms; six memory strophes; 320/390/768px at 100/200%; real standalone hour.');
}finally{await browser?.close();server.kill();}
