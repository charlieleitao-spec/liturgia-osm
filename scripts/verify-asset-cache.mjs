import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const base='30ad09b8998ccc7ad938a184d66e9ce136e40fe6';
let previous=true;
let phase='start';
const mark=value=>{phase=value;console.log('Cache test:',value);};
setTimeout(()=>{console.error('Cache test timeout at:',phase);process.exit(1);},90000).unref();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf'};
const server=http.createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file='www'+(pathname==='/'?'/index.html':pathname);
  if(file.includes('..')){res.writeHead(400).end();return;}
  try{
    const data=previous?execFileSync('git',['show',base+':'+file],{maxBuffer:8*1024*1024,stdio:['ignore','pipe','ignore']}):await fs.readFile(file);
    if(/(?:index\.html|app\.js|sw\.js)$/.test(file))console.log('Server resource:',previous?'baseline':'current',req.url,data.toString().match(/const (?:APP_VERSION|CACHE)[^;]+|script.src='[^']+'/)?.[0]);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox']});
try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  let page=await context.newPage();
  const session=await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.setCacheDisabled',{cacheDisabled:true});
  page.on('pageerror',error=>console.error('Page error:',error.message));
  page.on('response',async response=>{if(response.url().endsWith('/app.js'))console.log('app.js response:',response.fromServiceWorker(),(await response.text()).match(/const APP_VERSION[^;]+/)?.[0]);});
  mark('load baseline');
  await page.goto(origin);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.waitForFunction(()=>typeof APP_VERSION!=='undefined'&&APP_VERSION==='4.9.128'&&santoralReady&&oficiosReady);
  await page.evaluate(()=>{localStorage.setItem('assetUpgradeProbe','preservado');window.assetOldController=navigator.serviceWorker.controller;});
  assert.deepEqual(await page.evaluate(()=>caches.keys()),['liturgia-osm-v4.9.128-personal-v1']);
  mark('update worker');
  previous=false;
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update();});
  await page.waitForFunction(async()=>JSON.stringify(await caches.keys())==='["liturgia-osm-v4.9.129-personal-v1"]');
  await page.waitForFunction(async()=>{const reg=await navigator.serviceWorker.getRegistration();return !reg.installing&&!reg.waiting&&reg.active?.state==='activated'&&navigator.serviceWorker.controller===reg.active&&navigator.serviceWorker.controller!==window.assetOldController;});
  // Reopen the updated PWA in the same storage context, already offline.
  // A running page retains its executed JavaScript until its client is closed.
  await page.close();
  await context.setOffline(true);
  page=await context.newPage();
  await page.goto(origin);
  await page.waitForFunction(()=>typeof APP_VERSION!=='undefined'&&APP_VERSION==='4.9.129').catch(async error=>{
    console.error('Upgrade diagnostics:',await page.evaluate(async()=>{
      const cache=await caches.open('liturgia-osm-v4.9.129-personal-v1');
      const keys=(await cache.keys()).map(r=>r.url);
      const read=async url=>{const r=await cache.match(url);return r?await r.text():'MISSING';};
      return {version:typeof APP_VERSION==='undefined'?'undefined':APP_VERSION,caches:await caches.keys(),location:location.href,controller:navigator.serviceWorker.controller?.scriptURL,documentUsesVersionedCode:document.documentElement.outerHTML.includes('app.js?v=4.9.129'),scripts:[...document.scripts].map(s=>s.src),keys:keys.filter(k=>/app\.js|index\.html|fonts/.test(k)),cachedApp:(await read('./app.js?v=4.9.129')).match(/const APP_VERSION[^;]+/)?.[0],cachedRootUsesVersionedCode:(await read('./')).includes('app.js?v=4.9.129')};
    }));
    throw error;
  });
  mark('reload offline');
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&oficiosReady);
  assert.equal(await page.evaluate(()=>localStorage.getItem('assetUpgradeProbe')),'preservado');
  const core=JSON.parse((await fs.readFile('www/sw.js','utf8')).match(/const CORE = (\[[\s\S]*?\]);/)[1]);
  mark('fetch all CORE offline');
  const fetched=await page.evaluate(async files=>Promise.all(files.map(async f=>{const r=await fetch(f);return {file:f,ok:r.ok,bytes:(await r.arrayBuffer()).byteLength};})),core);
  assert(fetched.every(row=>row.ok&&row.bytes>0),'All CORE resources must load offline');
  assert.equal(fetched.filter(row=>row.file.endsWith('.pdf')).length,66);
  mark('open servite and load fonts offline');
  await page.goto(origin+'/servite.html');
  await page.waitForFunction(()=>typeof renderFinalAntifonaBlock==='function');
  assert(await page.evaluate(async()=>{await document.fonts.load('500 16px "Cinzel"','Salve Ā');return document.fonts.check('500 16px "Cinzel"','Salve Ā');}));
  await page.evaluate(()=>{document.getElementById('view').innerHTML=renderFinalAntifonaBlock();});
  await fs.mkdir('validation-results',{recursive:true});
  mark('screenshot');
  await page.screenshot({path:'validation-results/cinzel-offline.png',fullPage:true});
  await fs.writeFile('validation-results/asset-cache.json',JSON.stringify({previous:'4.9.128',current:'4.9.129',offline:true,preferencesPreserved:true,oldCacheRemoved:true,resources:fetched},null,2)+'\n');
  console.log('Cache 4.9.128 → 4.9.129: dados locais preservados; cache anterior removido; 148 recursos, 66 PDFs e Cinzel latin/latin-ext disponíveis offline.');
}finally{mark('cleanup');await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
