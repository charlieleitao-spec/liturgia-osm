import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const server=spawn('python3',['-m','http.server','8769','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
const results=[];
async function size(page,selector,expected){
  const actual=await page.locator(selector).first().evaluate(n=>parseFloat(getComputedStyle(n).fontSize));
  assert.ok(Math.abs(actual-expected)<.05,`${selector}: ${actual}px, expected ${expected}px`);
}
async function fits(page,selector){
  const failures=await page.locator(selector).evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&n.scrollWidth>n.clientWidth+1).map(n=>n.className));
  assert.deepEqual(failures,[],`Clipped text: ${failures}`);
}
try{
  await mkdir('validation-layout',{recursive:true});
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:8769/');
  await page.waitForFunction(()=>typeof setTab==='function'&&santoralReady&&oficiosReady);
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    for(const scale of [.76,1,2])for(const theme of ['light','dark']){
      await page.evaluate(({scale,theme})=>{readerScale=scale;lightMode=theme==='light';applyPreferences();setTab('sobre');}, {scale,theme});
      await size(page,'#app .about-text',16*scale);
      await size(page,'#app .about-text p',16*scale);
      await size(page,'#app .credit-list',16*scale);
      await size(page,'#app .credit-list>div',16*scale);
      await size(page,'#app .social-label',18*scale);
      await size(page,'#app .social-sub',13*scale);
      const leading=await page.locator('#app .about-text p').evaluate(n=>{const s=getComputedStyle(n);return parseFloat(s.lineHeight)/parseFloat(s.fontSize)});
      assert.ok(Math.abs(leading-1.55)<.01,'Paragraph line height must not multiply the scale again');
      await fits(page,'#app .about-text,#app .credit-list,#app .social-link,#app .social-label,#app .social-sub');
      if(theme==='light'&&(width===390&&scale===1||width===320&&scale===2)){
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.waitForFunction(()=>[...document.querySelectorAll('.fade-in')].every(n=>Number(getComputedStyle(n).opacity)>.999));
        await page.screenshot({path:`validation-layout/sobre-fontes-${width}-${scale}.png`,fullPage:true});
      }
      await page.evaluate(()=>setTab('vida'));
      await fits(page,'.home-hero,.home-action,.home-celebration-text');
      await page.evaluate(()=>{setTab('liturgia');setLiturgiaSection('missa');});
      await size(page,'.liturgia-celebration-row .rowtitle',18*scale);
      await size(page,'.liturgia-celebration-row .rowrank',13*scale);
      await fits(page,'.liturgia-celebration-row,.liturgia-celebration-row .rowtitle');
      await page.evaluate(()=>openSaint(SANTORAL[0]._id));
      await size(page,'.hub-life-title',22*scale);
      await size(page,'.hub-life-bio',16*scale);
      await fits(page,'.hub-life,.hub-life-bio');
      await page.evaluate(()=>openDevo('stabat'));
      await size(page,'.prayer-block',20*scale);
      await fits(page,'.prayer-block');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      results.push({width,scale,theme});
    }
  }
  // The inner reader uses root scaling. It must not apply --reader-scale a second time.
  const resource=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  await resource.addInitScript(()=>localStorage.setItem('osmReaderScale','2'));
  await resource.goto('http://127.0.0.1:8769/servite.html?view=regra');
  await resource.locator('#view .saint-row').first().waitFor();
  await resource.locator('#view .saint-row').nth(1).click();
  await size(resource,'.rule-reader',32);
  await fits(resource,'.rule-reader');
  await resource.close();
  const causes=await browser.newPage({viewport:{width:320,height:844},serviceWorkers:'block'});
  await causes.addInitScript(()=>localStorage.setItem('osmReaderScale','2'));
  await causes.goto('http://127.0.0.1:8769/causas-beatos.html');
  await causes.locator('.person').first().waitFor();
  const names=await causes.locator('.person h2').allTextContents();
  assert.ok(names.some(n=>n.includes('Paulino'))&&names.some(n=>n.includes('Egídio')),'Both causes must remain visible');
  await size(causes,'.intro',32);
  await size(causes,'.person h2',36);
  await fits(causes,'.intro,.person,.person h2');
  await causes.close();
  await writeFile('validation-layout/typography-report.json',JSON.stringify(results,null,2));
  console.log('PASS: one font scale per text; shared roles on About, Home, Missal, Santoral, prayers, Regra and Causas; 76/100/200%, 320/390/768px, both themes.');
}finally{await browser.close();server.kill();}
