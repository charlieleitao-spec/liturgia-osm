const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const catalog=JSON.parse(fs.readFileSync('www/data/biblioteca-servita-catalogo.json'));
const path=catalog.documents[0].download_path;
const tick=()=>new Promise(r=>setTimeout(r,10));
(async()=>{
 const dom=new JSDOM('<div id="test" data-library-path="'+path+'" data-page="43"></div>',{url:'https://localhost/index.html',runScripts:'outside-only'}),w=dom.window;
 let ready=false,downloads=0,opened,removed=0,offline=false;
 const plugin={status:async()=>({downloaded:ready}),download:async()=>{downloads++;if(offline)throw Error('offline');await tick();ready=true;return {downloaded:true};},open:async info=>{opened=info;},remove:async()=>{ready=false;removed++;return {downloaded:false};}};
 w.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',Plugins:{LocalPdf:plugin}};
 w.fetch=async()=>({ok:true,json:async()=>catalog});
 w.eval(fs.readFileSync('www/library-downloads.js','utf8'));
 await tick();let box=w.document.getElementById('test');
 assert.match(box.textContent,/preciso conexão/);assert.match(box.textContent,/Baixar para uso offline/);assert(!box.textContent.includes('Abrir PDF'));
 // This same component is rendered for a search result in a non-downloaded book.
 assert.match(fs.readFileSync('www/app.js','utf8'),/OSMLibrary\?\.valid\(doc.source\)[\s\S]*data-library-path/);
 box.querySelector('button').click();await tick();await tick();assert.equal(downloads,1);assert.match(box.textContent,/Disponível para uso offline/);
 offline=true;box.querySelector('button').click();await tick();assert.equal(opened.path,path);assert.equal(opened.page,43);
 [...box.querySelectorAll('button')].find(b=>b.textContent==='Remover download').click();await tick();assert.equal(removed,1);assert.match(box.textContent,/Baixar para uso offline/);
 box.querySelector('button').click();await tick();assert.match(box.textContent,/Não foi possível concluir/);assert(!ready);assert(!box.querySelector('button').disabled);
 assert(!w.OSMLibrary.valid('data/pdfs/biblioteca/../../secret.pdf'));
 offline=false;await Promise.all([w.OSMLibrary.download(path),w.OSMLibrary.download(path)]);assert.equal(downloads,3,'One download for concurrent requests');
 dom.window.close();console.log('Biblioteca/resultado de busca: baixar, abrir offline/página, remover, falha de conexão e deduplicação OK (ponte nativa simulada).');
})().catch(e=>{console.error(e);process.exitCode=1;});
