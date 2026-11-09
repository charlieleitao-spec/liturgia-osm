import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';

const output='validation-personal-notes';await fs.mkdir(output,{recursive:true});
const server=spawn('python3',['-m','http.server','18771','--bind','127.0.0.1','--directory','www'],{stdio:'ignore'});
let browser;const results=[];
try{
 for(let n=0;n<80;n++){try{if((await fetch('http://127.0.0.1:18771/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,50));}
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
 for(const width of [320,390,768])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  await context.addInitScript(theme=>localStorage.setItem('osmTheme',theme),theme);
  const page=await context.newPage();await page.goto('http://127.0.0.1:18771/');
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&window.OSMPersonalReader);
  await page.evaluate(()=>{
   OSMPersonalData.saveNote(localStorage,{type:'prayer',key:'stabat'},'Stabat Mater','Compaixão e perseverança');
   OSMPersonalData.saveNote(localStorage,{type:'prayer',key:'via_matris'},'Via Matris','Serviço e oração');
   OSMPersonalReader.open();
  });
  await context.setOffline(true);
  await page.getByLabel('Buscar por título ou conteúdo',{exact:true}).fill('compaixao');
  assert.equal(await page.locator('#personalNoteCount').textContent(),'1 de 2 anotações');
  await page.getByRole('button',{name:'Limpar busca',exact:true}).tap();
  await page.getByLabel('Ordenar anotações',{exact:true}).selectOption('title');
  assert.deepEqual(await page.locator('#personalNoteResults h4').allTextContents(),['Stabat Mater','Via Matris']);
  for(const scale of [1,2]){
   await page.evaluate(scale=>document.documentElement.style.fontSize=(16*scale)+'px',scale);
   const geometry=await page.evaluate(()=>{
    const panel=document.querySelector('.personal-panel');return {pageOverflow:document.documentElement.scrollWidth>innerWidth+1,panelOverflow:panel.scrollWidth>panel.clientWidth+1,fields:[...document.querySelectorAll('.personal-note-filters input,.personal-note-filters select')].map(el=>{const r=el.getBoundingClientRect();return {height:r.height,width:r.width};})};
   });
   assert.equal(geometry.pageOverflow,false);assert.equal(geometry.panelOverflow,false);assert.ok(geometry.fields.every(f=>f.height>=44&&f.width>0));
   await page.locator('.personal-note-filters').scrollIntoViewIfNeeded();
   await page.screenshot({path:output+'/'+width+'-'+theme+'-'+scale+'.png',animations:'disabled'});
   results.push({width,theme,scale,...geometry});
  }
  await page.getByLabel('Buscar por título ou conteúdo',{exact:true}).fill('perseveranca');
  await page.getByRole('button',{name:'Editar anotação',exact:true}).tap();
  await page.getByLabel('Sua anotação',{exact:true}).fill('Nota conferida sem internet');
  await page.getByRole('button',{name:'Salvar anotação',exact:true}).tap();
  assert.equal(await page.evaluate(()=>OSMPersonalData.load(localStorage).notes.find(n=>n.route.key==='stabat').text),'Nota conferida sem internet');
  await page.getByRole('button',{name:'Voltar às anotações',exact:true}).tap();
  await page.getByRole('button',{name:'Limpar busca',exact:true}).tap();
  await page.getByRole('button',{name:'Abrir leitura',exact:true}).first().tap();
  await page.waitForFunction(()=>!document.getElementById('personalOverlay').classList.contains('open')&&state.devo==='stabat');
  await context.close();
 }
 await fs.writeFile(output+'/result.json',JSON.stringify({browser:browser.version(),results},null,2));
 console.log('Chromium: 12 combinações de largura/tema/escala sem transbordamento; busca, ordenação, edição e abertura offline verificadas em 6 contextos.');
}catch(error){await fs.writeFile(output+'/failure.txt',String(error.stack||error));throw error;}
finally{await browser?.close();server.kill();}
