import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';

const server=spawn('python3',['-m','http.server','8774','--directory','www'],{stdio:'ignore'});
let browser;
const results=[];
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await mkdir('validation-layout',{recursive:true});
  await page.goto('http://127.0.0.1:8774/');
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&oficiosReady&&typeof OSMPdf?.officeResources==='function');
  const offices=await page.evaluate(()=>SANTORAL.filter(s=>officeRecordForSaint(s)?.pdf_transcript).map(s=>({id:s._id,month:s.month,day:s.day,transcript:officeRecordForSaint(s).pdf_transcript,url:officeRecordForSaint(s).local_pdf_url})));
  assert.equal(offices.length,26);
  // The real entry point must retain every complete office exactly once.
  for(const office of offices){
    await page.evaluate(id=>openLiturgiaDetail('horas',id),office.id);
    assert.equal(await page.locator('.office-complete-resources').count(),1);
    assert.equal(await page.getByRole('link',{name:'Abrir PDF completo',exact:true}).count(),1);
    assert.equal(await page.locator('.office-pdf-link').getAttribute('href'),office.url);
    assert.equal(await page.locator('.office-transcript-text').textContent(),office.transcript);
  }
  const chosen=offices.find(s=>s.month===10&&s.day===25);
  assert.ok(chosen);
  for(const width of [320,390,768])for(const theme of ['light','dark'])for(const scale of [1,2]){
    await page.setViewportSize({width,height:844});
    await page.evaluate(({id,theme,scale})=>{lightMode=theme==='light';readerScale=scale;applyPreferences();openLiturgiaDetail('horas',id);},{id:chosen.id,theme,scale});
    const controls=page.locator('.office-complete-resources a,.office-complete-resources summary');
    const boxes=await controls.evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
    assert.equal(boxes.length,2);
    assert.ok(boxes.every(b=>b.width>=44&&b.height>=44),JSON.stringify({width,theme,scale,boxes}));
    await page.getByText('Ler texto completo do Ofício',{exact:true}).click();
    assert.equal(await page.locator('.office-transcript').getAttribute('open'),'');
    assert.equal(await page.locator('.office-transcript-text').textContent(),chosen.transcript);
    const textStyle=await page.locator('.office-transcript-text').evaluate(n=>({align:getComputedStyle(n).textAlign,size:parseFloat(getComputedStyle(n).fontSize),overflow:n.scrollWidth>n.clientWidth+1}));
    assert.equal(textStyle.align,'left');assert.ok(Math.abs(textStyle.size-20*scale)<.1);assert.equal(textStyle.overflow,false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    if(scale===1){
      await page.getByText('Ler texto completo do Ofício',{exact:true}).click();
      await page.locator('.office-complete-resources').screenshot({path:`validation-layout/oficio-recursos-${width}-${theme}.png`});
    }
    results.push({width,theme,scale});
  }
  // Santoral and Liturgia must offer the same PDF and full text.
  await page.evaluate(id=>openSaintSection(id,'liturgia'),chosen.id);
  assert.equal(await page.locator('#hub-liturgia .office-complete-resources').count(),1);
  assert.equal(await page.locator('#hub-liturgia .office-transcript-text').textContent(),chosen.transcript);
  await page.evaluate(()=>{readerScale=1;applyPreferences();});
  const hours=await page.evaluate(id=>officeHoursForSaint(SANTORAL.find(s=>s._id===id)),chosen.id);
  // Every individual hour stays focused on its own text; closing returns to resources.
  for(const [hour] of hours){
    await page.evaluate(({id,hour})=>openSantoralOfficeHour(id,hour),{id:chosen.id,hour});
    const frame=page.frameLocator('#serviteFrame');
    await frame.locator('.hour-tab-content').waitFor();
    assert.equal(await frame.locator('.office-complete-resources,a[href*=".pdf"],.office-transcript').count(),0);
    assert.ok((await frame.locator('.hour-tab-content').textContent()).trim().length>20);
    await page.getByRole('button',{name:'Fechar recurso',exact:true}).click();
    await page.waitForFunction(()=>!document.getElementById('serviteOverlay').classList.contains('open'));
    await page.waitForFunction(()=>!history.state?.serviteOverlay);
    assert.equal(await page.locator('#hub-liturgia .office-pdf-link').count(),1);
  }
  await page.evaluate(({id,hour})=>openSantoralOfficeHour(id,hour),{id:chosen.id,hour:hours[0][0]});
  await page.frameLocator('#serviteFrame').locator('.hour-tab-content').waitFor();
  await page.goBack();
  await page.waitForFunction(()=>!document.getElementById('serviteOverlay').classList.contains('open'));
  assert.equal(await page.locator('#hub-liturgia .office-pdf-link').count(),1);
  // Standalone resource pages retain the complete text and a single PDF action.
  const standalone=await context.newPage();
  await standalone.goto(`http://127.0.0.1:8774/servite.html?view=oficio:${chosen.id}:laudes`);
  await standalone.locator('.hour-tab-content').waitFor();
  assert.equal(await standalone.locator('.office-pdf-link').count(),1);
  assert.equal(await standalone.locator('.office-transcript-text').textContent(),chosen.transcript);
  await standalone.close();
  // Reopen after an offline reload, then test the native dispatch of the actual new link.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload();
  await page.waitForFunction(()=>typeof santoralReady!=='undefined'&&santoralReady&&oficiosReady);
  await page.evaluate(id=>openLiturgiaDetail('horas',id),chosen.id);
  await page.getByText('Ler texto completo do Ofício',{exact:true}).click();
  assert.equal(await page.locator('.office-transcript-text').textContent(),chosen.transcript);
  await page.evaluate(()=>{window.pdfCalls=[];window.Capacitor={isNativePlatform:()=>true,getPlatform:()=> 'android',Plugins:{LocalPdf:{open:async value=>window.pdfCalls.push(value)}}};});
  await page.getByRole('link',{name:'Abrir PDF completo',exact:true}).click();
  await page.waitForFunction(()=>pdfCalls.length===1);
  const call=await page.evaluate(()=>pdfCalls[0]);
  assert.equal(call.path,chosen.url.replace(/^\.\//,''));assert.equal(call.page,1);
  assert.deepEqual(errors,[]);
  await writeFile('validation-layout/office-resources-report.json',JSON.stringify({offices:offices.length,hours:hours.length,results,offline:true,nativeDispatch:'simulated bridge',errors},null,2));
  console.log('PASS: 26 complete office texts preserved; one PDF action; 320/390/768px, light/dark, 100/200%; Santoral, individual hours, standalone access, offline reload and native PDF dispatch.');
}finally{await browser?.close();server.kill();}
