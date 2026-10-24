import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const server=spawn('python3',['-m','http.server','8782','--directory','www'],{stdio:'ignore'});
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();
 await mkdir('validation-layout',{recursive:true});
 const results=[];
 for(const [hour,name,expected] of [['laudes','Benedictus',[4,4,4,3,3,4,4,2]],['vesperas','Magnificat',[4,4,6,4,2]]]){
  await page.goto('http://127.0.0.1:8782/servite.html?view=oficio:0:'+hour);
  await page.locator('.hour-tab-content').waitFor();
  const block=page.locator('.litblock').filter({has:page.locator('.litheading', {hasText:'Cântico evangélico'})}).first();
  await block.waitFor();
  assert.deepEqual(await block.locator('.psalm-stanza').evaluateAll(ns=>ns.map(n=>n.querySelectorAll('.psalm-verse').length)),expected,name);
  assert.ok(await block.locator('.antiphon').count()>0,'Antífona própria presente');
  for(const width of [320,390,768])for(const scale of [1,2]){
   await page.setViewportSize({width,height:844});
   await page.evaluate(scale=>document.documentElement.style.setProperty('font-size',16*scale+'px'),scale);
   const r=await block.evaluate(n=>{
    const stanzas=[...n.querySelectorAll('.psalm-stanza')];
    return {block:[...n.querySelectorAll('.psalm-verse')].every(v=>getComputedStyle(v).display==='block'),spacing:stanzas.every((s,i)=>!i||s.getBoundingClientRect().top>stanzas[i-1].getBoundingClientRect().bottom),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.equal(r.block,true);assert.equal(r.spacing,true);assert.equal(r.overflow,false);
   results.push({name,width,scale,...r});
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));
  await block.scrollIntoViewIfNeeded();
  await page.screenshot({path:'validation-layout/'+name.toLowerCase()+'.png'});
 }
 await writeFile('validation-layout/canticles-report.json',JSON.stringify(results,null,2));
 console.log('PASS: Benedictus e Magnificat nos Ofícios reais; estrofes, antífonas, versos e espaçamento; 320/390/768px a 100/200%.');
}finally{await browser?.close();server.kill();}
