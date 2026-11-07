import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import OSMPdf from '../www/pdf-links.js';

const offices=JSON.parse(await readFile('www/data/oficios-osm.json','utf8'));
const prayers=[];
for(const file of await readdir('www/data/devocoes')){
  if(!file.endsWith('.json'))continue;
  const walk=(value,path)=>{
    if(typeof value==='string'&&value.length>80&&!/^https?:/.test(value))prayers.push({path,text:value,vigil:file==='vigilia.json'});
    else if(value&&typeof value==='object')for(const [key,item]of Object.entries(value))walk(item,path+'/'+key);
  };
  walk(JSON.parse(await readFile('www/data/devocoes/'+file,'utf8')),file);
}
const preces=[];
function inspect(value,path=''){
  if(typeof value==='string'){
    const expression=/(?:^|\n)PRECES[ \t]*\n([\s\S]*?)(?=\n(?:ORAÇÃO|PAI[- ]NOSSO|CONCLUSÃO|LAUDES|VÉSPERAS|HINO)\b|$)/gi;
    for(const match of value.matchAll(expression)){
      const text=match[1],html=OSMPdf.formatIntercessions(text);
      const explicit=(text.match(/^[-–—_]\s*\S/gm)||[]).length;
      const groups=(html.match(/class="liturgical-intercession /g)||[]).length;
      const petitions=(html.match(/liturgical-intercession-petition /g)||[]).length;
      if(explicit){assert.equal(groups,explicit,path);assert.equal(petitions,explicit,path);}
      else{assert.equal(groups,5,path);assert.equal(petitions,5,path);}
      preces.push({path,text,groups,petitions});
    }
  }else if(value&&typeof value==='object')for(const [key,item]of Object.entries(value))inspect(item,path+'/'+key);
}
inspect(offices);
assert.equal(preces.length,37);
const hours=[];
for(const [date,record]of Object.entries(offices.celebracoes))for(const [hour,item]of Object.entries(record.material?.horas||{})){
  const collect=(value,label)=>{
    if(typeof value==='string'){if(value.trim())hours.push({date,hour:label,text:value});return;}
    if(!value||typeof value!=='object')return;
    if(value.texto||value.text)hours.push({date,hour:label,text:value.texto||value.text});
    for(const [index,alternative]of (value.alternativas||[]).entries())collect(alternative,label+'/alternativa'+index);
  };
  collect(item,hour);
}
const server=spawn('python3',['-m','http.server','8786','--directory','www'],{stdio:'ignore'});
let browser;
const report={preces:preces.map(({text,...item})=>item),petitions:preces.reduce((sum,item)=>sum+item.petitions,0),layouts:[]};
try{
  await mkdir('validation-layout',{recursive:true});
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8786/');
  await page.waitForFunction(()=>typeof oficiosReady!=='undefined'&&oficiosReady&&santoralReady);
  const checked=await page.evaluate(({prayers,preces})=>{
    const compact=text=>text.replace(/\s+/g,'').toLocaleLowerCase('pt-BR').normalize('NFC');
    for(const item of prayers){
      const root=document.createElement('div');root.innerHTML=renderPrayer(item.text,{vigilia:item.vigil});
      let expected=item.vigil?normalizeVigiliaTypography(item.text):normalizeCopiedLineBreaks(item.text);
      // A composição já aprovada acrescenta a vírgula ao título da fórmula.
      if(item.vigil)expected=expected.replace(/^(Primeira fórmula|Segunda fórmula)\n[ \t]*Santa Maria,?\n[ \t]*/im,'$1\nSanta Maria, ');
      if(compact(root.textContent)!==compact(expected)){
        const a=compact(root.textContent),b=compact(expected);let i=0;while(a[i]===b[i]&&i<a.length)i++;
        throw Error('Oração alterada: '+item.path+' / '+a.slice(Math.max(0,i-30),i+100)+' <> '+b.slice(Math.max(0,i-30),i+100));
      }
    }
    for(const item of preces){
      const root=document.createElement('div');root.innerHTML=OSMPdf.formatIntercessions(item.text);
      const expected=item.text.split('\n').filter(line=>!/^\s*Copyright\b/i.test(line)).join('\n');
      if(compact(root.textContent)!==compact(expected))throw Error('Preces alteradas: '+item.path);
    }
    let masses=0;
    for(const item of MISSAS_OSM.celebrations)for(const section of item.sections||[]){
      const root=document.createElement('div');root.innerHTML=properMassTextHtml(section.heading,section.text);
      if(compact(root.textContent)!==compact(cleanMassText(section.text)))throw Error('Missa alterada: '+item.title+' / '+section.heading);
      masses++;
    }
    return {prayers:prayers.length,preces:preces.length,massSections:masses};
  },{prayers,preces});
  report.content=checked;
  await page.route('https://liturgia.up.railway.app/v2/**',route=>route.fulfill({json:{liturgia:'Conferência do leitor',leituras:{salmo:{referencia:'Sl 22',refrao:'R. O Senhor é meu pastor.',texto:'O Senhor é meu pastor, nada me falta;\nem verdes pastagens me faz repousar.'}}}}));
  await page.evaluate(()=>openDailyLiturgy());
  await page.locator('#dailyLiturgyContent .liturgical-response').waitFor();
  assert.equal(await page.locator('#dailyLiturgyContent .liturgical-response').evaluate(n=>getComputedStyle(n).fontWeight),'700');
  await page.evaluate(()=>closeDailyLiturgy());
  report.dailyRefrain=true;
  const ids=await page.evaluate(()=>({pucci:SANTORAL.find(s=>s.month===1&&s.day===12)._id,founders:SANTORAL.find(s=>s.month===2&&s.day===17)._id}));
  const embedded=await context.newPage();
  await embedded.goto(`http://127.0.0.1:8786/servite.html?view=oficio:${ids.founders}:vesperas`);
  await embedded.waitForFunction(()=>typeof renderLiturgicalHourContent==='function');
  report.hours=await embedded.evaluate(hours=>{
    const compact=text=>text.replace(/[^\p{L}\p{N}*†]/gu,'').toLocaleLowerCase('pt-BR').normalize('NFC');
    for(const item of hours){
      const root=document.createElement('div');root.innerHTML=renderLiturgicalHourContent(item.text);
      if(compact(root.textContent)!==compact(normalizeServiteLineBreaks(item.text)))throw Error('Hora alterada: '+item.date+' / '+item.hour);
    }
    return hours.length;
  },hours);
  report.embeddedPrayers=await embedded.evaluate(prayers=>{
    const compact=text=>text.replace(/\s+/g,'').normalize('NFC');
    for(const item of prayers){
      const root=document.createElement('div');root.innerHTML=renderPrayer(item.text);
      if(compact(root.textContent)!==compact(formatLiturgicalStanzas(item.text)))throw Error('Oração incorporada alterada: '+item.path);
    }
    return prayers.length;
  },prayers);
  // Ambos os caminhos reais do Ofício recebem os mesmos papéis tipográficos.
  await page.evaluate(id=>openLiturgiaDetail('horas',id),ids.pucci);
  await page.locator('.office-transcript > summary').click();
  const surfaces=[[page,'.office-transcript-text','completo'],[embedded,'.today-servita-reader','hora']];
  for(const [surface,selector,name]of surfaces)for(const width of [320,390,768])for(const light of [true,false])for(const scale of [1,2]){
    await surface.setViewportSize({width,height:844});
    await surface.evaluate(({light,scale,name})=>{
      if(name==='completo'){lightMode=light;readerScale=scale;applyPreferences();}
      else{document.documentElement.setAttribute('data-theme',light?'light':'dark');document.documentElement.style.fontSize=16*scale+'px';}
    },{light,scale,name});
    const layout=await surface.locator(selector).evaluate(root=>{
      const nodes=[...root.querySelectorAll('[class*="liturgical-intercession-"]')];
      return {nodes:nodes.length,overflow:nodes.filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent),refrains:[...root.querySelectorAll('.liturgical-intercession-refrain')].map(n=>({font:getComputedStyle(n).fontFamily,size:parseFloat(getComputedStyle(n).fontSize),weight:getComputedStyle(n).fontWeight,align:getComputedStyle(n).textAlign}))};
    });
    assert.ok(layout.nodes>10,name);assert.deepEqual(layout.overflow,[],JSON.stringify({name,width,scale}));
    assert.ok(layout.refrains.every(s=>Number(s.weight)>=700&&s.align==='left'&&s.font.includes('Georgia')&&Math.abs(s.size-20*scale)<.1),JSON.stringify({name,width,scale,layout}));
    report.layouts.push({name,width,light,scale,...layout});
    if(width===390&&scale===1){
      await surface.locator(selector+' .liturgical-intercession-refrain').first().scrollIntoViewIfNeeded();
      await surface.screenshot({path:`validation-layout/padrao-${name}-${light?'claro':'escuro'}.png`});
    }
  }
  await writeFile('validation-layout/unified-readers-report.json',JSON.stringify(report,null,2));
  console.log(`PASS: ${checked.prayers} orações, ${checked.massSections} seções de Missa, ${report.hours} Horas, ${preces.length} blocos de preces/${report.petitions} pedidos; leitores completo e por hora em 320/390/768, claro/escuro e 100/200%.`);
}finally{await browser?.close();server.kill();}
