import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const server=spawn('python3',['-m','http.server','8767','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:320,height:844},serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:8767/');
  await page.waitForFunction(()=>typeof openMainMenu==='function' && !!document.querySelector('#mainMenuOverlay .main-menu-head button'));
  const menu=page.getByRole('button',{name:'Abrir menu',exact:true});
  await menu.click();
  const dialog=page.getByRole('dialog',{name:'Menu',exact:true});
  await dialog.waitFor();
  assert.equal(await page.locator('#app').evaluate(n=>n.inert),true);
  assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Fechar menu');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.locator(':focus').count(),1,'Shift+Tab must wrap focus inside the unified menu');
  await page.keyboard.press('Tab');
  assert.equal(await dialog.getByRole('button',{name:/Favoritos e recentes/}).evaluate(n=>n===document.activeElement),true,'Tab returns to first navigation action');
  for(let i=0;i<20;i++)await dialog.getByRole('button',{name:'Aumentar tamanho do texto',exact:true}).click();
  assert.equal(await dialog.locator('.reader-scale-value').textContent(),'200%');
  await page.keyboard.press('Escape');
  assert.equal(await menu.getAttribute('aria-expanded'),'false');
  assert.equal(await menu.evaluate(n=>n===document.activeElement),true);
  assert.equal(await page.locator('#app').evaluate(n=>n.inert),false);
  await page.reload();
  await page.waitForFunction(()=>typeof openMainMenu==='function' && !!document.querySelector('#mainMenuOverlay .main-menu-head button'));
  await menu.click();assert.equal(await dialog.locator('.reader-scale-value').textContent(),'200%');
  await dialog.getByRole('button',{name:'Ordem Secular · Regra de Vida'}).click();
  const resource=page.getByRole('dialog',{name:'Regra OSSM',exact:true});
  await resource.waitFor();
  assert.equal(await resource.locator('button').first().evaluate(n=>n===document.activeElement),true);
  const frame=page.frameLocator('#serviteFrame');
  await frame.locator('#view').waitFor();
  assert.doesNotMatch(await frame.locator('meta[name=viewport]').getAttribute('content'),/user-scalable=no|maximum-scale=1/);
  assert.equal(await frame.locator('html').evaluate(n=>getComputedStyle(n).fontSize),'32px');
  await frame.locator('button').first().focus();
  await page.keyboard.press('Escape');
  assert.equal(await menu.evaluate(n=>n===document.activeElement),true);
  await page.evaluate(()=>{setTab('oracoes');openDevo('vigilia','formula1');});
  await page.waitForSelector('.prayer-stanza');
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Reader overflow at 200% / ${width}px`);
    // Detect clipped reader children even when body overflow-x is hidden.
    assert.equal(await page.locator('.prayer-block').first().evaluate(n=>n.scrollWidth<=n.clientWidth+1),true,`Clipped text at ${width}px`);
  }
  await page.evaluate(()=>{document.getElementById('menuBtn').focus();openDailyLiturgy();});
  assert.equal(await page.getByRole('dialog',{name:'Missa do dia',exact:true}).count(),1);
  await page.keyboard.press('Escape');assert.equal(await menu.evaluate(n=>n===document.activeElement),true);
  console.log('PASS: 200% persistent text; named dialogs; focus entry, wrap and return; background inert; embedded zoom; reader at 320/390/768px.');
}finally{await browser.close();server.kill();}
