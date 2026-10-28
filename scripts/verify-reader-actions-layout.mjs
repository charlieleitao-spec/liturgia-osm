import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';

const output='validation-reader-actions';await fs.mkdir(output,{recursive:true});
const server=spawn('python3',['-m','http.server','18770','--bind','127.0.0.1','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
const results=[];
async function check(page,frame,name){
 const bar=frame.locator('.personal-reading-tools');
 const geometry=await bar.evaluate(el=>{
  const b=el.querySelector('button'),s=getComputedStyle(b),view=el.parentElement;
  return {last:el===view.lastElementChild,position:getComputedStyle(el).position,font:s.fontSize,background:s.backgroundColor,border:s.borderWidth,height:b.getBoundingClientRect().height,width:b.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth+1};
 });
 assert.equal(geometry.last,true,'As ações precisam vir depois do conteúdo');
 assert.equal(geometry.position,'static');assert.equal(geometry.font,'14px');assert.equal(geometry.border,'0px');assert.equal(geometry.background,'rgba(0, 0, 0, 0)');assert.equal(geometry.overflow,false);assert.ok(geometry.height>=44&&geometry.height<=48);assert.ok(geometry.width<120);
 await bar.scrollIntoViewIfNeeded();
 await page.evaluate(()=>{OSMPersonalReader.saveCurrent();OSMPersonalReader.afterRender(document.getElementById('serviteOverlay').classList.contains('open'));});
 await bar.scrollIntoViewIfNeeded();
 for(const b of await bar.locator('button').all())assert.equal(await b.evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===el;}),true,'Cada comando deve estar livre de sobreposição');
 await page.screenshot({path:output+'/'+name+'.png'});return geometry;
}
try{
 for(let n=0;n<80;n++){try{if((await fetch('http://127.0.0.1:18770/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,50));}
 for(const width of [320,390,768])for(const scale of [1,2])for(const theme of ['light','dark']){
  const c=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  await c.addInitScript(({scale,theme})=>{localStorage.setItem('osmReaderScale',String(scale));localStorage.setItem('osmTheme',theme);},{scale,theme});
  const page=await c.newPage();await page.goto('http://127.0.0.1:18770/');await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&window.OSMPersonalReader);
  await page.getByRole('button',{name:'Abrir menu',exact:true}).tap();await page.getByRole('button',{name:'Ordem Secular · Regra de Vida',exact:true}).tap();await page.waitForFunction(()=>document.getElementById('serviteFrame').contentWindow.OSMResourceContext?.ready);
  const frame=page.frameLocator('#serviteFrame'),name=width+'-'+scale+'-'+theme;
  await page.screenshot({path:output+'/regra-inicio-'+name+'.png'});
  const regra=await check(page,frame,'regra-final-'+name);
  if(width===320&&scale===1&&theme==='light'){
   await frame.locator('.personal-note-action').tap();const input=page.locator('#personalNoteText');await input.tap();await page.keyboard.type('Nota pelo comando discreto.');assert.equal(await input.inputValue(),'Nota pelo comando discreto.');await page.getByRole('button',{name:'Salvar anotação',exact:true}).tap();await page.getByRole('button',{name:'Fechar dados pessoais',exact:true}).tap();assert.equal(await frame.locator('.personal-note-action').textContent(),'Editar nota');
  }
  await frame.getByText('Capítulo I',{exact:true}).tap();const chapter=await check(page,frame,'capitulo-final-'+name);
  await page.getByRole('button',{name:'Fechar recurso',exact:true}).tap();await page.evaluate(()=>openDevo('stabat'));
  await page.screenshot({path:output+'/stabat-inicio-'+name+'.png'});
  const stabat=await check(page,page.locator('#view'),'stabat-final-'+name);
  results.push({width,scale,theme,regra,chapter,stabat});await c.close();
 }
 await fs.writeFile(output+'/result.json',JSON.stringify({browser:browser.version(),results},null,2));console.log('Layout conferido em 12 combinações de largura, fonte e tema; toque e escrita pelo novo comando confirmados.');
}catch(error){await fs.writeFile(output+'/failure.txt',String(error.stack||error));throw error;}
finally{await browser.close();server.kill();}
