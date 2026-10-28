import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';

const output=path.resolve('validation-annotation-input');await fs.mkdir(output,{recursive:true});
const servers=[];const results=[];
async function serve(directory,port){
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',directory],{stdio:'ignore'});servers.push(server);
 const url='http://127.0.0.1:'+port+'/';for(let n=0;n<80;n++){try{const response=await fetch(url);if(response.ok)return url;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error('Servidor de teste indisponível');
}
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
async function context(width){const c=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});await c.addInitScript(()=>localStorage.setItem('osmReaderScale','2'));return c;}
async function ready(page,url){await page.goto(url);await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&window.OSMPersonalReader);}
async function regra(page){await page.getByRole('button',{name:'Abrir menu',exact:true}).tap();await page.getByRole('button',{name:'Ordem Secular · Regra de Vida',exact:true}).tap();await page.waitForFunction(()=>document.getElementById('serviteFrame').contentWindow.OSMResourceContext?.ready);return page.frameLocator('#serviteFrame');}
async function saveAndReopen(page,noteButton,text){
 await noteButton.tap();const overlay=page.locator('#personalOverlay'),field=page.locator('#personalNoteText');await overlay.waitFor({state:'visible'});
 assert.equal(await overlay.evaluate(el=>el.inert),false,'Janela ativa não pode permanecer inert');
 const closeBox=await page.getByRole('button',{name:'Fechar dados pessoais',exact:true}).boundingBox();assert.ok(closeBox.height<=48&&closeBox.width>=64,'Fechar precisa permanecer compacto em uma linha');
 await field.tap();assert.equal(await field.evaluate(el=>document.activeElement===el),true,'O toque precisa focar o campo');
 await page.keyboard.type(text);assert.equal(await field.inputValue(),text,'Digitação real precisa entrar no campo');
 await page.getByRole('button',{name:'Salvar anotação',exact:true}).tap();assert.match(await page.locator('#personalStatus').textContent(),/salva/);
 await page.getByRole('button',{name:'Fechar dados pessoais',exact:true}).tap();await overlay.waitFor({state:'hidden'});
 await noteButton.tap();assert.equal(await field.inputValue(),text,'A nota salva precisa reaparecer');
 await field.tap();await page.keyboard.press('End');await page.keyboard.type(' Revisada.');assert.equal(await field.inputValue(),text+' Revisada.');
 await page.getByRole('button',{name:'Salvar anotação',exact:true}).tap();await page.getByRole('button',{name:'Fechar dados pessoais',exact:true}).tap();
}
try{
 if(process.env.BASELINE_DIR){
  const url=await serve(path.resolve(process.env.BASELINE_DIR),18769),c=await context(390),page=await c.newPage();await ready(page,url);const frame=await regra(page);await frame.locator('.personal-note-action').tap();const field=page.locator('#personalNoteText');await field.waitFor({state:'visible'});assert.equal(await page.locator('#personalOverlay').evaluate(el=>el.inert),true,'A base deve reproduzir o bloqueio relatado');let blocked=false;try{await field.tap({timeout:1500});}catch{blocked=true;}assert.equal(blocked,true,'O navegador deve impedir o toque no campo inert');await page.keyboard.type('Texto que nao pode entrar');assert.equal(await field.inputValue(),'');results.push({case:'base anterior',inert:true,pointerBlocked:true,typingBlocked:true});await c.close();
 }
 const url=await serve(path.resolve('www'),18770);
 for(const width of [320,390,768]){
  const c=await context(width),page=await c.newPage();await ready(page,url);const frame=await regra(page);const note=frame.locator('.personal-note-action');const box=await note.boundingBox();const ui=await note.evaluate(el=>({font:getComputedStyle(el).fontSize,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));assert.equal(ui.font,'15px');assert.ok(ui.height>=44&&ui.height<=48);assert.ok(ui.width<160,'Botão de anotação deve ser compacto mesmo com leitura a 200%');
  await saveAndReopen(page,note,'Nota da Regra em '+width+'.');assert.equal(await page.locator('#serviteOverlay').evaluate(el=>el.inert),false);assert.equal(await page.locator('#personalOverlay').evaluate(el=>el.inert),true,'Ao fechar a nota, o diálogo oculto volta ao estado do recurso');
  await frame.getByText('Capítulo I',{exact:true}).tap();await saveAndReopen(page,frame.locator('.personal-note-action'),'Nota do capitulo em '+width+'.');
  await page.getByRole('button',{name:'Fechar recurso',exact:true}).tap();await page.locator('#serviteOverlay').waitFor({state:'hidden'});assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);
  await page.evaluate(()=>openDevo('stabat'));await saveAndReopen(page,page.locator('#view .personal-note-action'),'Nota do Stabat em '+width+'.');
  await page.locator('#view .personal-note-action').tap();await page.screenshot({path:path.join(output,'editor-'+width+'.png'),fullPage:false});await page.getByRole('button',{name:'Fechar dados pessoais',exact:true}).tap();assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);
  results.push({width,readingScale:'200%',noteButton:ui,touchFocus:true,keyboardTyping:true,saveReopenEdit:true,regraAndChapterAndStabat:true,backgroundRestored:true});await c.close();
 }
 await fs.writeFile(path.join(output,'result.json'),JSON.stringify({browser:browser.version(),results},null,2));console.log(JSON.stringify({browser:browser.version(),results},null,2));
}catch(error){await fs.writeFile(path.join(output,'failure.txt'),String(error.stack||error));throw error;}
finally{await browser.close();for(const server of servers)server.kill();}
