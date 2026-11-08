import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
const server=spawn('python3',['-m','http.server','8773','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext(),page=await context.newPage();
 const catalog=JSON.parse(await readFile('www/data/biblioteca-servita-catalogo.json','utf8')),doc=catalog.documents[0];
 const original=await readFile('docs/biblioteca-pdfs/'+doc.download_path.split('/').at(-1));
 let corrupt=true,requests=0;
 await page.route('https://raw.githubusercontent.com/**',async route=>{requests++;await route.fulfill({status:200,contentType:'application/pdf',body:corrupt?Buffer.from('%PDF-corrupt'):original});});
 await page.goto('http://127.0.0.1:8773/biblioteca-servita.html');
 const first=page.locator('#documents article').first();
 await first.getByRole('button',{name:'Baixar para uso offline'}).click();
 await first.getByText('Não foi possível concluir.',{exact:false}).waitFor();
 assert.equal(await page.evaluate(path=>OSMLibrary.status(path),doc.download_path),false,'Corrupt bytes must never persist as a valid download');
 corrupt=false;await first.getByRole('button',{name:'Baixar para uso offline'}).click();
 await first.getByRole('button',{name:'Abrir PDF',exact:true}).waitFor();
 assert.equal(requests,2,'One failed verification, one successful retry');
 // New page, same app storage: no network is needed to find/open the verified bytes.
 await page.reload();await first.getByRole('button',{name:'Abrir PDF',exact:true}).waitFor();
 await context.setOffline(true);
 await first.getByRole('button',{name:'Abrir PDF',exact:true}).click();
 await page.getByRole('link',{name:'Abrir PDF baixado'}).waitFor();
 assert.match(await page.getByRole('link',{name:'Abrir PDF baixado'}).getAttribute('href'),/^blob:.*#page=43$/);
 assert.equal(requests,2);
 await page.getByRole('button',{name:'Fechar',exact:true}).click();
 await first.getByRole('button',{name:'Remover download'}).click();
 await first.getByRole('button',{name:'Baixar para uso offline'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Abrir PDF',exact:true}).count(),0,'Shared volume removed from all three entries');
 await mkdir('validation-layout',{recursive:true});await page.screenshot({path:'validation-layout/biblioteca-download-removido.png',fullPage:true});
 console.log('Web real: SHA-256 rejects corrupt PDF, retry/persistence succeeds, offline Blob opens at page 43, shared removal clears all entries.');
}finally{await browser.close();server.kill();}
