import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const output='validation-resource-safe-area';await fs.mkdir(output,{recursive:true});
const servers=[],results=[];
async function serve(dir,port){const s=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory',dir],{stdio:'ignore'});servers.push(s);for(let n=0;n<80;n++){try{if((await fetch('http://127.0.0.1:'+port)).ok)return 'http://127.0.0.1:'+port;}catch{}await new Promise(r=>setTimeout(r,50));}throw Error('Servidor indisponível');}
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
async function load(url,width,height,insets){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'});await context.addInitScript(()=>localStorage.setItem('osmReaderScale','2'));
 const page=await context.newPage();await page.goto(url);await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&window.OSMPersonalReader);
 await page.evaluate(insets=>{
  for(const [side,size] of Object.entries(insets)){
   document.documentElement.style.setProperty('--safe-area-inset-'+side,size+'px');
   if(!size)continue;const bar=document.createElement('div');bar.className='simulated-system-bar';bar.style.cssText='position:fixed;z-index:9999999;background:#555;pointer-events:auto;';
   if(side==='top'||side==='bottom')bar.style.cssText+=side+':0;left:0;right:0;height:'+size+'px';else bar.style.cssText+=side+':0;top:0;bottom:0;width:'+size+'px';document.body.append(bar);
  }
  openServite('regra');document.querySelectorAll('.simulated-system-bar').forEach(el=>el.inert=false);
 },insets);
 await page.waitForFunction(()=>document.getElementById('serviteFrame').contentWindow.OSMResourceContext?.ready);return {context,page,frame:page.frameLocator('#serviteFrame')};
}
async function geometry(page,frame,insets){
 const header=await page.locator('.servite-head').boundingBox(),iframe=await page.locator('#serviteFrame').boundingBox(),close=await page.getByRole('button',{name:'Fechar recurso',exact:true}).boundingBox(),back=await frame.getByRole('button',{name:'Voltar',exact:true}).boundingBox(),viewport=page.viewportSize();
 return {header,iframe,close,back,viewport,insets};
}
function check(g){
 const {header,iframe,close,back,viewport,insets}=g;
 assert.ok(header.y>=insets.top,'Cabeçalho deve ficar abaixo da barra superior');
 assert.ok(close.y>=insets.top&&close.y+close.height<=header.y+header.height,'Botão do cabeçalho inteiro');
 assert.ok(iframe.y>=header.y+header.height-1,'Documento começa abaixo do cabeçalho');
 assert.ok(iframe.y+iframe.height<=viewport.height-insets.bottom+1,'Iframe não pode ultrapassar a barra inferior');
 assert.ok(back.y>=iframe.y&&back.y+back.height<=viewport.height-insets.bottom,'Voltar inteiro na área útil');
 assert.ok(back.x>=insets.left&&back.x+back.width<=viewport.width-insets.right,'Voltar fora dos recortes laterais');
}
try{
 if(process.env.BASELINE_DIR){
  const url=await serve(path.resolve(process.env.BASELINE_DIR),18771),insets={top:32,bottom:48,left:0,right:0};const {context,page,frame}=await load(url,390,844,insets);let invalid=false;try{check(await geometry(page,frame,insets));}catch{invalid=true;}assert.equal(invalid,true,'A versão anterior precisa reproduzir a falta de espaço para as barras');
  let blocked=false;try{await frame.getByRole('button',{name:'Voltar',exact:true}).tap({timeout:1000});}catch{blocked=true;}assert.equal(blocked,true,'A barra inferior simulada deve bloquear o Voltar anterior');results.push({baseline:true,clipped:true,backBlocked:true});await context.close();
 }
 const url=await serve(path.resolve('www'),18772);
 for(const [width,height,insets] of [[320,740,{top:28,bottom:48,left:0,right:0}],[390,844,{top:32,bottom:48,left:0,right:0}],[412,915,{top:32,bottom:24,left:0,right:0}],[844,390,{top:24,bottom:24,left:32,right:24}],[320,240,{top:32,bottom:48,left:0,right:0}],[768,900,{top:0,bottom:0,left:0,right:0}]]){
  const {context,page,frame}=await load(url,width,height,insets);
  await frame.locator('.personal-reading-tools').scrollIntoViewIfNeeded();check(await geometry(page,frame,insets));await page.screenshot({animations:'disabled',path:output+'/regra-'+width+'-'+height+'.png'});
  await frame.getByText('Capítulo I',{exact:true}).tap();await frame.locator('.personal-reading-tools').scrollIntoViewIfNeeded();check(await geometry(page,frame,insets));
  await frame.getByRole('button',{name:'Voltar',exact:true}).tap();await frame.getByText('Capítulo XIII',{exact:true}).waitFor();
  await page.setViewportSize({width,height:height+100});check(await geometry(page,frame,insets));
  await frame.getByRole('button',{name:'Voltar',exact:true}).tap();await page.locator('#serviteOverlay').waitFor({state:'hidden'});
  await page.evaluate(()=>openServite('regra'));await page.waitForFunction(()=>document.getElementById('serviteFrame').contentWindow.OSMResourceContext?.ready);await page.getByRole('button',{name:'Fechar recurso',exact:true}).tap();await page.locator('#serviteOverlay').waitFor({state:'hidden'});
  results.push({width,height,insets,readingScale:'200%',headerVisible:true,backFromChapter:true,backFromIndex:true,closeByHeader:true,resize:true});await context.close();
 }
 await fs.writeFile(output+'/result.json',JSON.stringify({browser:browser.version(),results},null,2));console.log(JSON.stringify(results));
}catch(error){await fs.writeFile(output+'/failure.txt',String(error.stack||error));throw error;}
finally{await browser.close();for(const s of servers)s.kill();}
