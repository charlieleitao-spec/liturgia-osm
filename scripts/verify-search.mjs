import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
const expectedDocuments=JSON.parse(await readFile('www/data/search-index.json','utf8')).documents.length;
const server=spawn('python3',['-m','http.server','8772','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
try {
  await mkdir('validation-layout',{recursive:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  let indexRequests=0;page.on('request',request=>{if(new URL(request.url()).pathname.endsWith('/data/search-index.json'))indexRequests++;});
  await page.goto('http://127.0.0.1:8772/');
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  assert.equal(indexRequests,0,'Índice não é solicitado na abertura nem no precache');
  await page.evaluate(()=>openGlobalSearch());
  await page.waitForFunction(()=>!!globalSearchIndex);
  assert.ok(indexRequests>0,'Índice solicitado ao abrir a busca');
  await page.locator('#globalSearchInput').fill('coroa nossa senhora dores');
  await page.locator('#globalSearchCategory').selectOption('Orações');
  assert.ok(await page.locator('.search-result').count()>0);
  await page.screenshot({path:'validation-layout/busca-resultados.png',fullPage:true});
  await page.locator('.search-result').first().click();
  assert.ok((await page.locator('.search-document').innerText()).length>100);
  await page.screenshot({path:'validation-layout/busca-leitura.png',fullPage:true});
  await page.getByRole('button',{name:'← Voltar aos resultados'}).click();
  assert.equal(await page.locator('#globalSearchInput').inputValue(),'coroa nossa senhora dores');
  assert.equal(await page.locator('#globalSearchCategory').inputValue(),'Orações');
  await page.locator('#globalSearchCategory').selectOption('PDFs');
  await page.locator('#globalSearchInput').fill('Deus');
  await page.evaluate(()=>openSearchDocument(globalSearchIndex.documents.findIndex(d=>d.source==='data/pdfs/missal/antonio.pdf')));
  assert.match(await page.locator('#view a[href*=".pdf"]').getAttribute('href'),/\.pdf#page=\d+$/);
  for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady);
  await page.evaluate(()=>openGlobalSearch());
  await page.waitForFunction(()=>!!globalSearchIndex);
  await page.locator('#globalSearchInput').fill('misericordia');
  assert.ok(await page.locator('.search-result').count()>0,'Search works after offline reload');
  await page.evaluate(()=>new Promise((resolve,reject)=>{
    const request=indexedDB.deleteDatabase('osm-search-v2');
    request.onsuccess=resolve;request.onerror=reject;
  }));
  await page.reload();
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady);
  await page.evaluate(()=>openGlobalSearch());
  await page.waitForFunction(()=>!!globalSearchIndex);
  await page.locator('#globalSearchInput').fill('misericordia');
  assert.ok(await page.locator('.search-result').count()>0,'First search without IndexedDB cache works offline');
  await page.evaluate(()=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('osm-search-v2');
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction('corpus','readwrite');
      tx.objectStore('corpus').put({revision:'old',documents:[]},'current');
      tx.oncomplete=()=>{db.close();resolve();};tx.onerror=reject;
    };request.onerror=reject;
  }));
  await page.reload();
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady);
  await page.evaluate(()=>openGlobalSearch());
  await page.waitForFunction(()=>!!globalSearchIndex);
  assert.equal(await page.evaluate(()=>globalSearchIndex.documents.length),expectedDocuments,'Stale corpus cache rebuilt offline');
  // A book result remains searchable before its PDF is downloaded.
  await context.setOffline(false);
  await page.evaluate(()=>{
    const id=globalSearchIndex.documents.findIndex(d=>d.source==='data/pdfs/biblioteca/constituicoes-regra-diretorio-osm-2015.pdf'&&d.page===43);
    openSearchDocument(id);
  });
  await page.getByRole('button',{name:'Baixar para uso offline'}).waitFor();
  await page.screenshot({path:'validation-layout/busca-livro-nao-baixado.png',fullPage:true});
  await page.goto('http://127.0.0.1:8772/biblioteca-servita.html');
  await page.waitForFunction(()=>document.querySelectorAll('#documents article').length===5);
  await page.evaluate(()=>{
    window.libraryOpened=[];window.libraryReady=false;
    window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',Plugins:{LocalPdf:{
      status:async()=>({downloaded:libraryReady}),download:async()=>{libraryReady=true;},remove:async()=>{libraryReady=false;},open:async options=>{libraryOpened.push(options);}
    }}};
    return OSMLibrary.controls(document.querySelector('#documents article div'),'data/pdfs/biblioteca/constituicoes-regra-diretorio-osm-2015.pdf',43,'Constituições');
  });
  await page.getByRole('button',{name:'Baixar para uso offline'}).first().click();
  await page.getByRole('button',{name:'Abrir PDF',exact:true}).first().waitFor();
  await context.setOffline(true);
  for(const [index,expected] of [43,25,131].entries()){
    await page.locator('#documents article').nth(index).getByRole('button',{name:'Abrir PDF',exact:true}).click();
    await page.waitForFunction(count=>libraryOpened.length===count,index+1);
  }
  assert.deepEqual(await page.evaluate(()=>libraryOpened.map(item=>item.page)),[43,25,131]);
  await page.getByRole('button',{name:'Remover download'}).first().click();
  await page.getByRole('button',{name:'Baixar para uso offline'}).first().waitFor();
  console.log('Biblioteca/busca: livro não baixado oferece download; ponte Android simulada abre offline páginas 43/25/131 e remove download compartilhado.');
  console.log('Busca: filtros, leitura, retorno, PDF, 320/390/768 px e recarga offline OK.');
} finally {await browser.close();server.kill();}
