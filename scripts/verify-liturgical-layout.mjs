import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const out='validation-layout';await mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server','8766','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const report=[];
try{
  await new Promise(r=>setTimeout(r,1000));
  await page.goto('http://127.0.0.1:8766/');
  await page.waitForFunction(()=>typeof openDevo==='function');
  await page.evaluate(()=>{setTab('oracoes');openDevo('vigilia','formula1');});
  await page.waitForSelector('body.liturgical-page .prayer-stanza');
  const main=await page.evaluate(()=>{
    const block=document.querySelector('.prayer-block');
    const s=getComputedStyle(block), b=getComputedStyle(document.body);
    return {align:s.textAlign,font:s.fontFamily,color:s.color,background:b.backgroundColor,poetry:block.querySelectorAll('.liturgical-verse-line').length,rubrics:block.querySelectorAll('.rubric').length};
  });
  assert.equal(main.align,'left');assert.equal(main.color,'rgb(21, 18, 13)');assert.equal(main.background,'rgb(252, 243, 213)');assert.ok(main.poetry>10);assert.ok(main.rubrics>0);report.push({main});
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Main reader overflows at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:out+'/vigilia.png',fullPage:true});
  // Ensure decoration preserves every source word and liturgical sign.
  const preserved=await page.evaluate(()=>{
    const source='Salmo 62\n\n– 1 Bendito seja o Senhor, meu rochedo, †\nque adestrou minhas mãos para a luta, *\n\nPreces\n\nR. Ouvi-nos, Senhor!\n\nOração\nÓ Deus, que nos amais,\nconcedei-nos a paz.';
    const node=document.createElement('div');node.innerHTML=renderPrayer(source);
    return {text:node.textContent,verses:node.querySelectorAll('.liturgical-verse-line').length,response:!!node.querySelector('.liturgical-response'),sup:node.querySelector('sup')?.textContent};
  });
  assert.match(preserved.text,/Bendito seja o Senhor, meu rochedo, †/);assert.match(preserved.text,/luta, \*/);assert.match(preserved.text,/Ó Deus, que nos amais, concedei-nos a paz\./);assert.equal(preserved.sup,'1');assert.ok(preserved.response);report.push({preserved});
  const massPsalm=await page.evaluate(()=>{
    const n=document.createElement('div');n.innerHTML=properMassTextHtml('Salmo de meditação','R/ O Senhor é meu pastor.\n\nO Senhor é meu pastor, nada me falta;\nem verdes pastagens me faz repousar.');
    return {lines:n.querySelectorAll('.liturgical-verse-line').length,rubric:n.querySelector('.rubric')?.textContent,text:n.textContent};
  });
  assert.equal(massPsalm.lines,3);assert.equal(massPsalm.rubric,'R/');report.push({massPsalm});
  // Use an actual proper office and the full reader in servite.html.
  const saintId=await page.evaluate(()=>SANTORAL.find(s=>s.month===2&&s.day===17)._id);
  await page.goto(`http://127.0.0.1:8766/servite.html?view=oficio:${saintId}:vesperas`);
  await page.waitForSelector('.today-servita-reader .psalm-verse');
  await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(252, 243, 213)');
  const office=await page.evaluate(()=>{
    const root=document.querySelector('.today-servita-reader');
    const style=selector=>{const n=root.querySelector(selector);if(!n)return null;const s=getComputedStyle(n);return {color:s.color,align:s.textAlign,background:s.backgroundColor,border:s.borderTopWidth,weight:s.fontWeight};};
    return {background:getComputedStyle(document.body).backgroundColor,antiphon:style('.antiphon'),verse:style('.psalm-verse'),heading:style('.litheading'),response:style('.preces-response'),frame:getComputedStyle(root.closest('.card'),'::before').display,text:root.textContent,poetry:root.querySelectorAll('.psalm-verse').length};
  });
  assert.equal(office.frame,'none');assert.equal(office.background,'rgb(252, 243, 213)');assert.equal(office.antiphon.align,'left');assert.equal(office.antiphon.border,'0px');assert.equal(office.verse.align,'left');assert.equal(office.heading.color,'rgb(179, 34, 28)');assert.ok(office.poetry>10);assert.match(office.text,/minh.alma engrandece/);report.push({office});
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Office reader overflows at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:out+'/vesperas.png',fullPage:true});
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.today-servita-reader')).color==='rgb(245, 238, 220)');
  await page.screenshot({path:out+'/vesperas-dark.png',fullPage:true});
  // Match plain text of every actual office line before and after DOM decoration.
  const content=JSON.parse(await readFile('www/data/oficios-osm.json','utf8'));
  const texts=[];function walk(x){if(typeof x==='string'&&x.length>100)texts.push(x);else if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')Object.values(x).forEach(walk);}walk(content);
  const count=await page.evaluate(texts=>{
    let count=0;for(const text of texts)for(const line of text.split('\n')){
      if(!line.trim())continue;
      const node=document.createElement('div');node.innerHTML=liturgicalLineHtml(line,true);
      const clean=s=>s.replace(/\s+/g,'').normalize('NFC');
      if(clean(node.textContent)!==clean(line))throw new Error('Source text changed: '+line);
      count++;
    }return count;
  },texts);
  report.push({actualOfficeLinesPreserved:count});
  await writeFile(out+'/result.json',JSON.stringify({status:'PASS',report},null,2));
  console.log('PASS: liturgical layout, mobile widths, dark mode and '+count+' original office lines');
}finally{await browser.close();server.kill();}
