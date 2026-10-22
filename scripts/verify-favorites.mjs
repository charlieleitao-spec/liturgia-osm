import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const server=spawn('python3',['-m','http.server','8771','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:320,height:844},serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:8771/');
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&typeof homePersonalAccess==='function'&&typeof window.renderCelebrationHub==='function');
  const ready=()=>page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&typeof window.renderCelebrationHub==='function');
  await page.evaluate(()=>{localStorage.setItem('osmFavoritesV4',JSON.stringify(['prayer:coroa']));setTab('hoje');});
  assert.equal(await page.locator('.home-personal-access .personal-access-list button').count(),1,'Existing favorites are preserved');
  await page.locator('.personal-access-list button').click();
  assert.match(await page.locator('#view').innerText(),/Coroa de Nossa Senhora das Dores/);
  await page.getByRole('button',{name:'Remover dos favoritos',exact:true}).click();
  assert.equal(await page.evaluate(()=>favs().length),0);
  await page.evaluate(()=>{setTab('hoje');openDailyPrayer480('anjo');});
  await page.getByRole('button',{name:'Adicionar aos favoritos',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Remover dos favoritos',exact:true}).getAttribute('aria-pressed'),'true');
  await page.reload();await ready();
  await page.evaluate(()=>setTab('hoje'));
  await page.locator('.personal-access-list button').click();
  assert.match(await page.locator('#view').innerText(),/O Anjo do Senhor/);
  await page.evaluate(()=>openDevo('stabat'));
  assert.match(await page.locator('#view').innerText(),/Stabat Mater/,'Prayer shortcut replaces the daily prayer');
  await page.evaluate(()=>{setTab('hoje');openDetail(SANTORAL[0]._id);});
  await page.getByRole('button',{name:'Adicionar aos favoritos',exact:true}).click();
  const id=await page.evaluate(()=>SANTORAL[0]._id);
  assert.equal(await page.evaluate(()=>recents()[0].type),'saint','Home celebration opening enters history');
  await page.evaluate(()=>setTab('hoje'));
  await page.locator('.personal-access-list button').first().click();
  assert.equal(await page.evaluate(()=>state.detailId),id);
  await page.evaluate(()=>{for(const s of SANTORAL.slice(0,5))toggleFav('saint',s._id);setTab('hoje');});
  assert.equal(await page.locator('.personal-access-list button').count(),3,'Home shows at most three favorites');
  await page.getByRole('button',{name:'Ver todos os favoritos e recentes'}).click();
  assert.match(await page.locator('#view').innerText(),/Biblioteca pessoal/);
  await page.evaluate(()=>{for(const s of SANTORAL)openDetail(s._id);setTab('hoje');});
  assert.equal(await page.evaluate(()=>recents().length),12);
  assert.equal(await page.evaluate(()=>new Set(recents().map(x=>x.k)).size),12);
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    for(const dark of [false,true]){
      await page.evaluate(dark=>{lightMode=!dark;applyPreferences();setTab('hoje');},dark);
      const sizes=await page.locator('.home-personal-access button').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
      assert.ok(sizes.every(b=>b.w>=44&&b.h>=44));
      assert.equal(await page.locator('.home-personal-access').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);
    }
  }
  console.log('Favoritos: dados preservados, adicionar/remover, reinício, oração diária, celebração, histórico, atalhos e toque em 320/390/768 px OK.');
}finally{await browser.close();server.kill();}
