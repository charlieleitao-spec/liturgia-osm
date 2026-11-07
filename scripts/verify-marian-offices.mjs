import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const port=8785;
const server=spawn('python3',['-m','http.server',String(port),'--directory','www'],{stdio:'ignore'});
let browser;
const report={forms:[],layouts:[],offline:false};
try{
  await mkdir('validation-layout',{recursive:true});
  const data=JSON.parse(await readFile('www/data/oficios-osm.json','utf8'));
  const transcript=data.sabados_marianos_pdf.find(item=>item.id==='tempo-comum').pdf_transcript;
  const pdfPath='www/data/pdfs/oficios/ordinario.pdf';
  const pdfText=execFileSync('pdftotext',['-layout',pdfPath,'-'],{encoding:'utf8'});
  // A revisão recompõe espaçamento/hífens e conserva a sequência de letras
  // e números do PDF, incluindo todas as leituras alternativas.
  const letters=text=>text.replace(/Copyright[^\n]*/gi,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  assert.equal(letters(transcript),letters(pdfText),'O texto dos cinco formulários deve corresponder ao PDF oficial.');
  report.pdf={sha256:createHash('sha256').update(await readFile(pdfPath)).digest('hex'),lettersPreserved:true};
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(let attempt=0;;attempt++){
    try{await page.goto(`http://127.0.0.1:${port}/`);break;}
    catch(error){if(attempt>=30)throw error;await new Promise(resolve=>setTimeout(resolve,100));}
  }
  await page.waitForFunction(()=>typeof oficiosReady!=='undefined'&&oficiosReady&&santoralReady);
  // Every source word, punctuation mark and liturgical sign must survive rendering.
  const preservation=await page.evaluate(()=>OFICIOS_OSM.sabados_marianos_pdf.map(item=>{
    const normalized=normalizeMarianOfficeTranscript(item.pdf_transcript,'');
    const root=document.createElement('div');root.innerHTML=renderMarianOfficeTranscript(item.pdf_transcript,'');
    const compact=text=>text.replace(/\s+/g,'');
    return {id:item.id,preserved:compact(root.textContent)===compact(normalized)};
  }));
  assert.ok(preservation.every(item=>item.preserved),JSON.stringify(preservation));
  report.preservation=preservation;
  // Exercise the real Liturgia > Ofício OSM > Santa Maria entry point.
  await page.evaluate(()=>{setTab('liturgia');setLiturgiaSection('horas');});
  await page.locator('#marianSaturdayOfficeCommon > summary').click();
  assert.equal(await page.locator('[id^="marianSaturdayForm"]').count(),5);
  for(let index=1;index<=5;index++){
    const form=page.locator(`#marianSaturdayForm${index}`);
    await form.locator(':scope > summary').click();
    const checks=await form.evaluate(root=>{
      const reader=root.querySelector('.saturday-pdf-transcript');
      const headings=[...reader.querySelectorAll('h4')];
      const preces=headings.find(node=>node.textContent.toUpperCase()==='PRECES');
      const nodes=[];
      for(let n=preces?.nextElementSibling;n&&n.tagName!=='H4';n=n.nextElementSibling)nodes.push(n);
      const intercessions=nodes.filter(node=>node.matches('.marian-office-intercession'));
      const text=node=>node?.textContent||'';
      return {
        title:root.querySelector('summary').textContent.trim(),
        intros:nodes.filter(node=>node.matches('.marian-office-intro')).length,
        refrains:nodes.filter(node=>node.matches('.marian-office-refrain')).map(text),
        intercessions:intercessions.map(node=>({
          intentions:node.querySelectorAll('.marian-office-intention').length,
          petitions:node.querySelectorAll('.marian-office-petition').length,
          invocation:text(node.querySelector('.marian-office-intention')),
          petition:text(node.querySelector('.marian-office-petition'))
        })),
        conclusion:nodes.filter(node=>node.matches('.marian-office-rubric')).map(text),
        hours:headings.filter(node=>node.matches('.liturgical-hour-heading')).map(text),
        readings:headings.filter(node=>/^(SEGUNDA LEITURA|LEITURA BREVE)$/i.test(node.textContent)).length,
        hymnLines:reader.querySelectorAll('.marian-office-hymn .liturgical-hymn-line').length,
        hymnContaminated:[...reader.querySelectorAll('.marian-office-hymn')].some(node=>/SEGUNDA LEITURA|PRECES|Antífonas e salmos/.test(node.textContent)),
        orphanNumeral:[...reader.querySelectorAll('p')].some(node=>/^(I|II|III|IV|V)$/.test(node.textContent.trim()))
      };
    });
    assert.equal(checks.intros,1,checks.title);
    assert.equal(checks.refrains.length,1,checks.title);
    assert.equal(checks.intercessions.length,5,checks.title);
    for(const group of checks.intercessions){
      assert.equal(group.intentions,1,checks.title);
      assert.equal(group.petitions,1,checks.title);
      assert.ok(group.invocation.length>20);
      assert.match(group.petition,/^[-–—]\s/);
      assert.doesNotMatch(group.petition,/\[|Copyright|Pai Nosso/);
    }
    assert.equal(checks.conclusion.length,1,checks.title);
    assert.match(checks.conclusion[0],/Pai[- ]Nosso/);
    assert.ok(checks.hours.includes('Laudes'),checks.title);
    assert.equal(checks.readings,2,checks.title);
    assert.ok(checks.hymnLines>=30,checks.title);
    assert.equal(checks.hymnContaminated,false,checks.title);
    assert.equal(checks.orphanNumeral,false,checks.title);
    report.forms.push(checks);
    if(index===1||index===4){
      for(const label of ['SEGUNDA LEITURA','LEITURA BREVE']){
        await form.locator('h4').filter({hasText:new RegExp('^'+label+'$','i')}).scrollIntoViewIfNeeded();
        await page.screenshot({path:`validation-layout/mariano-leitura-${index}-${label==='SEGUNDA LEITURA'?'longa':'breve'}.png`});
      }
    }
  }
  // Phone/tablet sizes, both themes and the real A+ scale.
  for(const width of [320,390,768])for(const light of [true,false])for(const scale of [1,2]){
    await page.setViewportSize({width,height:844});
    await page.evaluate(({light,scale})=>{lightMode=light;readerScale=scale;applyPreferences();},{light,scale});
    const layout=await page.locator('#marianSaturdayOfficeCommon').evaluate(root=>({
      overflowing:[...root.querySelectorAll('.saturday-pdf-transcript p,.marian-office-intercession')].some(node=>node.scrollWidth>node.clientWidth+1),
      overflowNodes:[...root.querySelectorAll('.saturday-pdf-transcript p,.marian-office-intercession')].filter(node=>node.scrollWidth>node.clientWidth+1).map(node=>({role:node.className,text:node.textContent.slice(0,150),width:node.clientWidth,scroll:node.scrollWidth})),
      documentOverflow:document.documentElement.scrollWidth>innerWidth,
      styles:[...root.querySelectorAll('.marian-office-refrain')].map(node=>({weight:getComputedStyle(node).fontWeight,align:getComputedStyle(node).textAlign,font:getComputedStyle(node).fontFamily,size:parseFloat(getComputedStyle(node).fontSize)}))
    }));
    assert.equal(layout.overflowing,false,JSON.stringify({width,light,scale,nodes:layout.overflowNodes}));
    assert.equal(layout.documentOverflow,false);
    assert.equal(layout.styles.length,5);
    assert.ok(layout.styles.every(style=>Number(style.weight)>=700&&style.align==='left'&&style.font.includes('Georgia')&&Math.abs(style.size-20*scale)<.1),JSON.stringify(layout));
    report.layouts.push({width,light,scale,...layout});
    if(width===390&&scale===1){
      for(let index=1;index<=5;index++){
        const response=page.locator(`#marianSaturdayForm${index} .marian-office-refrain`);
        await response.scrollIntoViewIfNeeded();
        await page.screenshot({path:`validation-layout/mariano-preces-${index}-${light?'claro':'escuro'}.png`});
      }
    }
  }
  await page.evaluate(async()=>{readerScale=1;lightMode=true;applyPreferences();await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(()=>typeof oficiosReady!=='undefined'&&oficiosReady&&santoralReady);
  await page.evaluate(()=>{setTab('liturgia');setLiturgiaSection('horas');});
  await page.locator('#marianSaturdayOfficeCommon > summary').click();
  for(let index=1;index<=5;index++)await page.locator(`#marianSaturdayForm${index} > summary`).click();
  assert.equal(await page.locator('#marianSaturdayOfficeCommon .marian-office-intercession').count(),25);
  const pdf=await page.evaluate(async()=>{
    const response=await fetch('./data/pdfs/oficios/ordinario.pdf');
    return {ok:response.ok,header:new TextDecoder().decode((await response.arrayBuffer()).slice(0,5))};
  });
  assert.deepEqual(pdf,{ok:true,header:'%PDF-'});
  report.offline=true;
  assert.deepEqual(errors,[]);
  await writeFile('validation-layout/marian-offices-report.json',JSON.stringify(report,null,2));
  console.log('PASS: cinco formulários; 25 invocações e pedidos; respostas, rubricas, leituras e hinos; texto preservado; 320/390/768, claro/escuro, 100/200%; reabertura e PDF offline.');
}finally{await browser?.close();server.kill();}
