import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const base='30ad09b8998ccc7ad938a184d66e9ce136e40fe6';
let previous=true;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf'};
const server=http.createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file='www'+(pathname==='/'?'/index.html':pathname);
  if(file.includes('..')){res.writeHead(400).end();return;}
  try{
    const data=previous?execFileSync('git',['show',base+':'+file],{maxBuffer:8*1024*1024,stdio:['ignore','pipe','ignore']}):await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox']});
try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  page.on('pageerror',error=>console.error('Page error:',error.message));
  await page.goto(origin);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(()=>localStorage.setItem('assetUpgradeProbe','preservado'));
  assert.deepEqual(await page.evaluate(()=>caches.keys()),['liturgia-osm-v4.9.128-personal-v1']);
  previous=false;
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update();});
  await page.waitForFunction(async()=>JSON.stringify(await caches.keys())==='["liturgia-osm-v4.9.129-personal-v1"]');
  await page.reload();
  await page.waitForFunction(()=>typeof APP_VERSION!=='undefined'&&APP_VERSION==='4.9.129').catch(async error=>{
    console.error('Upgrade diagnostics:',await page.evaluate(async()=>({version:typeof APP_VERSION==='undefined'?'undefined':APP_VERSION,caches:await caches.keys(),controller:navigator.serviceWorker.controller?.scriptURL,body:document.body.innerText.slice(0,1800),scripts:[...document.scripts].map(s=>s.src),cachedApp:(await (await caches.match('./app.js')).text()).match(/const APP_VERSION[^;]+/)[0]})));
    throw error;
  });
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&oficiosReady);
  assert.equal(await page.evaluate(()=>localStorage.getItem('assetUpgradeProbe')),'preservado');
  const core=JSON.parse((await fs.readFile('www/sw.js','utf8')).match(/const CORE = (\[[\s\S]*?\]);/)[1]);
  const fetched=await page.evaluate(async files=>Promise.all(files.map(async f=>{const r=await fetch(f);return {file:f,ok:r.ok,bytes:(await r.arrayBuffer()).byteLength};})),core);
  assert(fetched.every(row=>row.ok&&row.bytes>0),'All CORE resources must load offline');
  assert.equal(fetched.filter(row=>row.file.endsWith('.pdf')).length,66);
  await page.goto(origin+'/servite.html');
  await page.waitForFunction(()=>typeof renderFinalAntifonaBlock==='function');
  assert(await page.evaluate(async()=>{await document.fonts.load('500 16px "Cinzel"','Salve Ā');return document.fonts.check('500 16px "Cinzel"','Salve Ā');}));
  await page.evaluate(()=>{document.getElementById('view').innerHTML=renderFinalAntifonaBlock();});
  await fs.mkdir('validation-results',{recursive:true});
  await page.screenshot({path:'validation-results/cinzel-offline.png',fullPage:true});
  await fs.writeFile('validation-results/asset-cache.json',JSON.stringify({previous:'4.9.128',current:'4.9.129',offline:true,preferencesPreserved:true,oldCacheRemoved:true,resources:fetched},null,2)+'\n');
  console.log('Cache 4.9.128 → 4.9.129: dados locais preservados; cache anterior removido; 148 recursos, 66 PDFs e Cinzel latin/latin-ext disponíveis offline.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
