import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const server=spawn('python3',['-m','http.server','8768','--directory','www'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
const report=[];
async function targets(locator,label){
  const boxes=await locator.evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({label:n.getAttribute('aria-label')||n.textContent.trim(),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
  assert.ok(boxes.length,`Missing controls: ${label}`);
  for(const b of boxes){assert.ok(b.width>=43.9&&b.height>=43.9,`${label}: ${JSON.stringify(b)}`);}
}
try{
  await mkdir('validation-layout',{recursive:true});
  const page=await browser.newPage({viewport:{width:320,height:844},serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:8768/');
  await page.waitForFunction(()=>typeof openMainMenu==='function'&&santoralReady);
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    for(const theme of ['light','dark']){
      await page.evaluate(theme=>{lightMode=theme==='light';applyPreferences();setTab('calendario');},theme);
      await targets(page.locator('#menuBtn,#tabbar button'),'Main navigation');
      await targets(page.locator('.calendar-toolbar button,.calendar-toolbar select'),'Calendar toolbar');
      const calendar=page.locator('.calendar-presented');
      assert.equal(await calendar.evaluate(n=>n.scrollWidth<=n.clientWidth+1),true,`Calendar clipped: ${width}/${theme}`);
      const cells=await page.locator('button.cal-day').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
      assert.ok(cells.length>27);assert.ok(cells.every(b=>b.width>=24&&b.height>=44),'Seven-column calendar cells');
      const month=page.locator('.calendar-month-select'),before=await month.inputValue();
      await page.getByRole('button',{name:'Mês anterior',exact:true}).click({position:{x:2,y:22}});
      assert.notEqual(await month.inputValue(),before,'Left edge of previous-month control');
      await page.getByRole('button',{name:'Próximo mês',exact:true}).click({position:{x:42,y:22}});
      assert.equal(await month.inputValue(),before,'Right edge of next-month control');
      await page.locator('.calendar-santoral-index').evaluate(n=>n.open=true);
      await targets(page.locator('.alpha-btn'),'Alphabet filters');
      await page.evaluate(()=>window.scrollTo(0,0));
      await page.locator('#menuBtn').click();
      await targets(page.locator('#mainMenuOverlay button'),'Reading menu');
      await page.getByRole('button',{name:'Regra de Vida da OSSM',exact:true}).click();
      await targets(page.locator('.servite-head button'),'Embedded reader toolbar');
      const frame=page.frameLocator('#serviteFrame');
      await frame.locator('#settingsBtn').waitFor();
      await frame.locator('#view .card').first().waitFor();
      await targets(frame.locator('.header-controls button,#tabbar button'),'Embedded navigation');
      await frame.locator('#settingsBtn').click();
      assert.equal(await frame.locator('#settingsBtn').getAttribute('aria-expanded'),'true');
      await targets(frame.locator('#settingsPanel button'),'Embedded settings');
      await frame.getByRole('button',{name:'Escuro',exact:true}).click();
      assert.equal(await frame.getByRole('button',{name:'Escuro',exact:true}).getAttribute('aria-pressed'),'true');
      await frame.getByRole('button',{name:'Claro',exact:true}).click();
      assert.equal(await frame.getByRole('button',{name:'Escuro',exact:true}).getAttribute('aria-pressed'),'false');
      await page.getByRole('button',{name:'Fechar recurso',exact:true}).click();
      await page.evaluate(()=>{openSaint(SANTORAL[0]._id);});
      await targets(page.locator('.favorite-btn'),'Favorite');
      await page.evaluate(()=>openDailyLiturgy());
      await targets(page.locator('.daily-liturgy-head button,.daily-date-nav button,.daily-date-field'),'Daily Mass navigation');
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow: ${width}/${theme}`);
      report.push({width,theme});
    }
    await page.evaluate(()=>{readerScale=2;applyPreferences();setTab('calendario');window.scrollTo(0,0);});
    assert.equal(await calendarOverflow(page),false,`Calendar at 200% / ${width}`);
    await page.screenshot({path:`validation-layout/toque-calendario-${width}.png`,fullPage:true});
  }
  console.log('PASS: touch targets >=44px for main controls; calendar cells retain seven columns; edge clicks; settings states; no overflow.',JSON.stringify(report));
}finally{await browser.close();server.kill();}
async function calendarOverflow(page){return page.locator('.calendar-presented').evaluate(n=>n.scrollWidth>n.clientWidth+1);}
