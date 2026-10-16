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
  // Exercise the actual Santoral cards, not only the standalone prayer reader.
  await page.waitForFunction(()=>santoralReady&&oficiosReady&&MEMORIA_LITURGICA.memory_dates?.length);
  const memoryChecks=[];
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    for(const theme of ['light','dark']){
      const checked=await page.evaluate(theme=>{
        lightMode=theme==='light';applyPreferences();
        const compact=s=>s.replace(/\s+/g,'').normalize('NFC');
        const all=SANTORAL.map(s=>({id:s._id,date:String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0')}));
        let covered=0;
        for(const saint of all){
          state.detailId=saint.id;render();
          const root=document.querySelector('#hub-oracao');root.open=true;
          if(!MEMORIA_LITURGICA.memory_dates.includes(saint.date))continue;
          covered++;
          const block=title=>Array.from(root.querySelectorAll('.section-title')).find(n=>n.textContent===title)?.nextElementSibling;
          for(const [title,field,selector] of [['Hino','hino','.liturgical-hymn-line'],['Salmo 111','salmo','.liturgical-verse-line']]){
            const container=block(title);if(!container)throw new Error(saint.date+': missing '+title);
            const lines=Array.from(container.querySelectorAll(selector));
            const source=MEMORIA_LITURGICA.common[field].split('\n').filter(line=>line.trim());
            if(lines.length!==source.length)throw new Error(saint.date+': collapsed '+title);
            for(let i=0;i<source.length;i++){
              if(compact(lines[i].textContent)!==compact(source[i]))throw new Error(saint.date+': source altered '+title);
              if(getComputedStyle(lines[i]).display!=='block')throw new Error(saint.date+': inline verse '+title);
              if(i&&lines[i].getBoundingClientRect().top<=lines[i-1].getBoundingClientRect().top)throw new Error(saint.date+': verses share a row '+title);
            }
          }
          const prayer=block('Oração própria');
          if(prayer?.querySelector('.liturgical-verse-line,.liturgical-hymn-line'))throw new Error(saint.date+': prayer treated as poetry');
          if(document.documentElement.scrollWidth>innerWidth)throw new Error(saint.date+': overflow');
        }
        state.detailId=null;render();return {celebrations:all.length,memoryDates:covered};
      },theme);
      assert.equal(checked.celebrations,32);assert.equal(checked.memoryDates,25);memoryChecks.push({width,theme,...checked});
    }
  }
  report.push({santoralMemoryCards:memoryChecks});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{openSaintSection(SANTORAL.find(s=>MEMORIA_LITURGICA.memory_dates.includes(String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0')))._id,'oracao');});
  await page.waitForTimeout(500);
  await page.screenshot({path:out+'/santoral-memoria.png',fullPage:true,animations:'disabled'});
  await page.evaluate(()=>document.querySelector('#hub-oracao .liturgical-verse-line').scrollIntoView({behavior:'instant',block:'start'}));
  await page.waitForTimeout(250);
  report.push({memoryPsalmStyle:await page.evaluate(()=>Array.from(document.querySelectorAll('#hub-oracao .liturgical-verse-line')).map(n=>{const s=getComputedStyle(n);return {text:n.textContent,color:s.color,visibility:s.visibility,opacity:s.opacity,height:n.getBoundingClientRect().height};}))});
  await page.screenshot({path:out+'/santoral-salmo.png',animations:'disabled'});

  // Calendar navigation and filters on the actual mobile interface.
  await page.evaluate(()=>{state.detailId=null;setTab('calendario');calDate=new Date(2026,9,1);selectedCalDate=null;render();});
  const calendarChecks=[];
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    assert.equal(await page.locator('.calendar-toolbar select').count(),1);
    assert.equal(await page.locator('.calendar-filter-panel').getAttribute('open'),null);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Calendar overflow ${width}`);
    await page.getByRole('button',{name:'Próximo mês',exact:true}).click();
    assert.match(await page.locator('.calendar-toolbar select').innerText(),/Novembro 2026/);
    assert.equal(await page.locator('.calendar-toolbar select').inputValue(),'10');
    await page.getByRole('button',{name:'Mês anterior',exact:true}).click();
    assert.equal(await page.locator('.calendar-toolbar select').inputValue(),'9');
    await page.locator('.calendar-filter-panel summary').click();
    await page.locator('#calendar-category').selectOption('beato');
    await page.locator('#calendar-grade').selectOption('memoria');
    assert.match(await page.locator('.calendar-filter-panel summary').innerText(),/Filtrar \(2\)/);
    assert.notEqual(await page.locator('.calendar-filter-panel').getAttribute('open'),null);
    await page.getByRole('button',{name:'Limpar filtros'}).click();
    assert.equal(await page.locator('#calendar-category').inputValue(),'todos');
    assert.equal(await page.locator('#calendar-grade').inputValue(),'todos');
    await page.locator('.calendar-filter-panel summary').click();
    await page.locator('.today-chip').click();
    assert.equal(await page.locator('.cal-day.today.selected').count(),1);
    await page.locator('.calendar-grid').scrollIntoViewIfNeeded();
    const bounds=await page.locator('.calendar-grid').boundingBox();
    const nav=await page.locator('.tabbar').boundingBox();
    if(width<=390)assert.ok(bounds.y+bounds.height<nav.y,`Calendar covered by bottom bar ${width}`);
    calendarChecks.push({width,filters:true,navigation:true,today:true});
  }
  report.push({calendarChecks});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{scrollTo(0,0);lightMode=false;applyPreferences();});
  await page.screenshot({path:out+'/calendario-dark.png',animations:'disabled'});
  await page.evaluate(()=>{lightMode=true;applyPreferences();});
  await page.screenshot({path:out+'/calendario-light.png',animations:'disabled'});

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
