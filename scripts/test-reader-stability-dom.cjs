const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../www'),tick=()=>new Promise(r=>setTimeout(r,40));
function env(file){const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://charlieleitao-spec.github.io/liturgia-osm/'+file,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.TextEncoder=TextEncoder;w.scrollTo=(x,y)=>{w.scrollY=y;};w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,String(url).replace(/^\.\//,'')),'utf8'))});const ctx=dom.getInternalVMContext(),run=s=>vm.runInContext(s,ctx),load=f=>run(fs.readFileSync(path.join(root,f),'utf8'));return {dom,w,run,load};}
(async()=>{
 const a=env('index.html'),{w,run,load}=a;load('reader-scale.js');load('data/load-devotions.js');await w.loadOSMDevotionalData();for(const f of ['personal-data.js','personal-reader.js','search.js','reminders.js','widget-links.js','pdf-links.js','app.js'])load(f);w.OSMPersonalReader.init();await tick();await tick();
 // Retomada explícita que é cancelada por uma navegação posterior.
 const frames=new Map();let seq=0;w.requestAnimationFrame=cb=>{frames.set(++seq,cb);return seq;};w.cancelAnimationFrame=id=>frames.delete(id);const flush=()=>{for(let i=0;frames.size&&i<10;i++){const tasks=[...frames.values()];frames.clear();tasks.forEach(fn=>fn());}assert.equal(frames.size,0);};
 run("openDevo('stabat')");w.scrollTo(0,680);w.OSMPersonalReader.saveCurrent();run("setTab('biblioteca')");w.OSMPersonalReader.open();[...w.document.querySelectorAll('#personalBody button')].find(b=>b.textContent.startsWith('Continuar:')).click();assert.ok(frames.size>0);run("openDevo('via_matris')");flush();assert.equal(run('state.devo'),'via_matris');assert.equal(w.scrollY,0);w.scrollTo(0,210);w.OSMPersonalReader.saveCurrent();assert.equal(w.OSMPersonalData.load(w.localStorage).last.route.key,'via_matris');
 run("openDevo('stabat')");[...w.document.querySelectorAll('.personal-reading-tools button')].find(b=>b.textContent==='Retomar').click();flush();assert.equal(w.scrollY,680);
 console.log('Navegação: retomada explícita funciona, mas uma posição antiga não move a página aberta depois.');
 // Busca das notas pelo texto inteiro, sem acentos; filtros não regravam os dados.
 const D=w.OSMPersonalData,storage=w.localStorage,snapshot=storage.getItem(D.KEY),now=w.Date.now;
 w.Date.now=()=>100;D.saveNote(storage,{type:'prayer',key:'stabat'},'Stabat Mater','Compaixão '+'.'.repeat(200)+' perseverança');
 w.Date.now=()=>200;D.saveNote(storage,{type:'prayer',key:'via_matris'},'À escuta de Maria','Serviço e oração <img src=x onerror=alert(1)>');
 w.Date.now=()=>300;D.saveNote(storage,{type:'prayer',key:'deleted'},'Nota excluída','perseverança',true);w.Date.now=now;
 w.OSMPersonalReader.open();const noteSnapshot=storage.getItem(D.KEY),doc=w.document;
 const titles=()=>[...doc.querySelectorAll('#personalNoteResults h4')].map(n=>n.textContent);
 const search=q=>{const input=doc.getElementById('personalNoteSearch');input.value=q;input.dispatchEvent(new w.Event('input'));};
 const order=value=>{const select=doc.getElementById('personalNoteOrder');select.value=value;select.dispatchEvent(new w.Event('change'));};
 assert.deepEqual(titles(),['À escuta de Maria','Stabat Mater']);order('oldest');assert.deepEqual(titles(),['Stabat Mater','À escuta de Maria']);order('title');assert.deepEqual(titles(),['À escuta de Maria','Stabat Mater']);
 search('STABAT perseveranca');assert.deepEqual(titles(),['Stabat Mater']);assert.equal(doc.getElementById('personalNoteCount').textContent,'1 de 2 anotações');
 search('a ESCUTA oracao');assert.deepEqual(titles(),['À escuta de Maria']);assert.equal(doc.querySelector('#personalNoteResults img'),null);
 search('inexistente');assert.deepEqual(titles(),[]);assert.match(doc.getElementById('personalNoteResults').textContent,/Nenhuma anotação/);
 [...doc.querySelectorAll('#personalBody button')].find(b=>b.textContent==='Limpar busca').click();assert.deepEqual(titles(),['À escuta de Maria','Stabat Mater']);assert.equal(doc.activeElement.id,'personalNoteSearch');assert.equal(storage.getItem(D.KEY),noteSnapshot);
 search('perseveranca');doc.querySelector('#personalNoteResults button').click();assert.match(doc.getElementById('personalNoteText').value,/perseverança$/);
 doc.getElementById('personalNoteText').value+=' e confiança';[...doc.querySelectorAll('#personalBody button')].find(b=>b.textContent==='Voltar às anotações').click();assert.equal(doc.getElementById('personalNoteSearch').value,'perseveranca');assert.equal(doc.getElementById('personalNoteOrder').value,'title');assert.equal(D.load(storage).notes.length,3);
 [...doc.querySelectorAll('#personalNoteResults button')].find(b=>b.textContent==='Abrir leitura').click();flush();assert.equal(run('state.devo'),'stabat');assert.ok(!doc.getElementById('personalOverlay').classList.contains('open'));
 storage.setItem(D.KEY,snapshot);w.OSMPersonalReader.open();assert.equal(doc.getElementById('personalNoteSearch'),null);w.OSMPersonalReader.close();
 console.log('Anotações: busca por título/conteúdo completo sem acentos, ordenação, exclusões, segurança de texto, edição e abertura filtradas; dados preservados.');
 // O menu de fonte não herda nem recolhe a navegação enquanto está aberto.
 w.document.body.classList.add('scroll-controls-hidden');run('openMainMenu()');assert.ok(!w.document.body.classList.contains('scroll-controls-hidden'));w.document.dispatchEvent(new w.WheelEvent('wheel',{deltaY:20,bubbles:true}));assert.ok(!w.document.body.classList.contains('scroll-controls-hidden'));run('adjustFont(.08)');assert.equal(w.OSMReaderScale.read(w.localStorage),1.08);run('closeMainMenu()');
 const frame=w.document.getElementById('serviteFrame');let child;
 async function openChild(view){
  if(child)child.dom.window.close();child=env('servite.html');Object.defineProperty(child.w,'parent',{value:w});Object.defineProperty(child.w,'localStorage',{value:w.localStorage});Object.defineProperty(frame,'contentWindow',{value:child.w,configurable:true});Object.defineProperty(frame,'contentDocument',{value:child.w.document,configurable:true});run('currentServiteView='+JSON.stringify(view)+';openAccessibleDialog("serviteOverlay")');child.w.__SERVITE_VIEW__=view;child.load('reader-scale.js');child.w.document.documentElement.style.fontSize=(16*w.OSMReaderScale.read(w.localStorage))+'px';child.load('data/load-devotions.js');await child.w.loadOSMDevotionalData();
  const html=fs.readFileSync(path.join(root,'servite.html'),'utf8');for(const s of [...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.includes("addEventListener('servite-ready'")))child.run(s);for(const f of ['pdf-links.js','servite-1.js','servite-2.js','servite-3.js'])child.load(f);await tick();await tick();
 }
 await openChild('oficio:0:laudes');child.run("setOficioTab('vesperas')");child.w.document.querySelector('.personal-note-action').click();w.document.getElementById('personalNoteText').value='Nota de Vésperas por outro caminho';[...w.document.querySelectorAll('#personalBody button')].find(b=>b.textContent==='Salvar anotação').click();w.OSMPersonalReader.close();
 w.OSMPersonalReader.resourceClosed();await openChild('oficio:0:vesperas');child.w.document.querySelector('.personal-note-action').click();assert.equal(w.document.getElementById('personalNoteText').value,'Nota de Vésperas por outro caminho');w.document.getElementById('personalNoteText').value='Nota revisada';[...w.document.querySelectorAll('#personalBody button')].find(b=>b.textContent==='Salvar anotação').click();w.OSMPersonalReader.close();assert.equal(w.OSMPersonalData.load(w.localStorage).notes.length,1);assert.equal(w.OSMPersonalData.load(w.localStorage).notes[0].text,'Nota revisada');
 console.log('Anotações: Vésperas reabertas diretamente encontram e editam a nota antiga, sem duplicar nem migrar dados.');
 run('serviteAdjustFont(1)');assert.equal(w.OSMReaderScale.read(w.localStorage),1.16);assert.equal(child.w.document.documentElement.style.fontSize,'18.56px');assert.equal(run('readerScale'),1.16);child.run("setOficioTab('laudes')");assert.equal(child.w.document.documentElement.style.fontSize,'18.56px');run('serviteAdjustFont(-1)');assert.equal(w.OSMReaderScale.read(w.localStorage),1.08);
 child.w.OSMResourceContext.ready=false;run('updateServiteFontControls()');assert.ok([...w.document.querySelectorAll('[data-servite-font]')].every(b=>b.disabled));run('serviteAdjustFont(1)');assert.equal(w.OSMReaderScale.read(w.localStorage),1.08);child.w.OSMResourceContext.ready=true;run('updateServiteFontControls()');assert.ok([...w.document.querySelectorAll('[data-servite-font]')].every(b=>!b.disabled));w.OSMReaderScale.write(w.localStorage,2);run('updateServiteFontControls()');assert.equal(w.document.querySelector('[data-servite-font="1"]').disabled,true);assert.equal(w.document.querySelector('[data-servite-font="-1"]').disabled,false);
 console.log('Fonte: 108%→116%→108%, persistência ao navegar, sincronia com menu principal e controles bloqueados durante carga/no limite.');
 const celebrations = [
  {month: 11, day: 16, reference: 'Rm 15,2.5-6', readingEnd: /de nosso Senhor Jesus Cristo\.$/, petitions: 5},
  {month: 2, day: 17, reference: 'Ef 4,32; 5,2', readingEnd: /sacrifício de agradável odor\.$/, petitions: 5},
  {month: 5, day: 4, reference: '2Cor 5,14-17', readingEnd: /um mundo novo se fez\.$/, petitions: 4},
  {month: 6, day: 19, reference: 'Gl 2,19b-20', readingEnd: /a si mesmo por mim\.$/, petitions: 4, alternative: /Alegre vossa Igreja/},
  {month: 8, day: 23, reference: '2Cor 4,5-6', readingEnd: /resplandece na face de Cristo\.$/, petitions: 5},
  {month: 8, day: 28, reference: '1Cor 2,5-7.9-10', readingEnd: /as profundezas de Deus\.$/, petitions: 5},
  {month: 9, day: 15, reference: '2Tm 2,10-13', readingEnd: /pode renegar-se a si mesmo\.$/, petitions: 5, alternative: /quisestes que a Virgem Mãe participasse/},
  {month: 1, day: 12, reference: '1Ts 5,14-18', readingEnd: /em Jesus Cristo\.$/, petitions: 5},
 ];
 for (const {month, day, reference, readingEnd, petitions, alternative} of celebrations) {
  const feastId = run(`SANTORAL.find(saint => saint.month === ${month} && saint.day === ${day})._id`);
  await openChild(`oficio:${feastId}:laudes`);
  const laudes = child.w.document.querySelector('.laudes-content .today-servita-reader');
  const headings = Array.from(laudes.querySelectorAll('.litheading'), node => node.textContent);
  assert.deepEqual(headings, ['HINO', 'SALMODIA', 'LEITURA BREVE', 'RESPONSÓRIO BREVE', 'Cântico evangélico', 'PRECES', 'ORAÇÃO']);
  assert.equal(laudes.querySelector('.reading-ref').textContent, reference);
  assert.match(laudes.querySelector('.reading-body').textContent, readingEnd);
  assert.equal(laudes.querySelectorAll('.response').length, 5);
  assert.equal(laudes.querySelectorAll('.liturgical-intercession-petition').length, petitions);
  assert.match(laudes.querySelector('.liturgical-intercession-rubric').textContent, /Pai Nosso/i);
  const salmodia = laudes.querySelectorAll('.litblock')[1];
  const psalmTitles = Array.from(salmodia.querySelectorAll('.psalm-title'), node => node.textContent);
  assert.deepEqual(psalmTitles, [
   'Salmo 62,2-9 — Sede de Deus',
   'Cântico (Dn 3,57-88.56) — Louvor das criaturas ao Senhor',
   'Salmo 149 — A alegria e o louvor dos santos'
  ]);
  const antiphons = Array.from(salmodia.querySelectorAll('.antiphon'), node => node.textContent);
  assert.equal(antiphons.length, 6);
  assert.deepEqual([antiphons[0], antiphons[2], antiphons[4]], [antiphons[1], antiphons[3], antiphons[5]]);
  assert.equal(salmodia.textContent.match(/Glória ao Pai, ao Filho e ao Espírito Santo/g).length, 2);
  if(alternative)assert.match(laudes.querySelectorAll('.litblock')[6].textContent, alternative);
  const benedictus = laudes.querySelectorAll('.litblock')[4];
  assert.match(benedictus.querySelector('.psalm-stanza').textContent, /Bendito seja o Senhor Deus/);
 }
 await openChild('oficio:' + run('SANTORAL.find(saint => saint.month === 9 && saint.day === 15)._id') + ':laudes');
 const sorrowfulMotherId = run('SANTORAL.find(saint => saint.month === 9 && saint.day === 15)._id');
 assert.doesNotMatch(child.w.document.querySelector('.laudes-content').textContent, /II Vésperas|Magnificat/);
 await openChild(`oficio:${sorrowfulMotherId}:vesperas`);
 const vespers = child.w.document.querySelector('.vesperas-content .today-servita-reader');
 assert.deepEqual(Array.from(vespers.querySelectorAll('.liturgical-hour-heading'), node => node.textContent), ['I Vésperas', 'II Vésperas']);
 assert.deepEqual(Array.from(vespers.querySelectorAll('.reading-ref'), node => node.textContent), ['Hb 5,7-9', 'Ap 21,1-5a']);
 assert.equal(vespers.querySelectorAll('.liturgical-intercession-petition').length, 10);
 assert.match(vespers.textContent, /Magnificat/);
 assert.doesNotMatch(vespers.textContent, /Benedictus/);
 const deceasedId = run('SANTORAL.find(saint => saint.month === 11 && saint.day === 17)._id');
 await openChild(`oficio:${deceasedId}:laudes`);
 const deceased = child.w.document.querySelector('.laudes-content .today-servita-reader');
 const headings = Array.from(deceased.querySelectorAll('.litheading'), node => node.textContent);
 assert.deepEqual(headings, ['HINO', 'SALMODIA', 'Oração sálmica', 'Oração sobre o cântico', 'Oração sálmica', 'LEITURA BREVE', 'RESPONSÓRIO', 'Cântico evangélico', 'PRECES', 'ORAÇÃO']);
 assert.deepEqual(Array.from(deceased.querySelectorAll('.psalm-title'), node => node.textContent), [
  'Salmo 22 — Deus, bom Pastor', 'Cântico (Tb 13,2-8) — Deus castiga e salva', 'Salmo 146 — O poder e a bondade do Senhor'
 ]);
 assert.equal(deceased.querySelector('.reading-ref').textContent, 'Rm 8,8-11');
 assert.equal(deceased.querySelectorAll('.response').length, 5);
 assert.equal(deceased.querySelectorAll('.liturgical-intercession-petition').length, 5);
 const monteSenarioId = run('SANTORAL.find(saint => saint.month === 9 && saint.day === 22)._id');
 await openChild(`oficio:${monteSenarioId}:laudes`);
 const monteSenario = child.w.document.querySelector('.laudes-content .today-servita-reader');
 assert.equal(monteSenario.querySelector('.reading-ref').textContent, 'Is 56,7');
 assert.equal(monteSenario.querySelectorAll('.response').length, 5);
 assert.equal(monteSenario.querySelectorAll('.liturgical-intercession-petition').length, 5);
 assert.deepEqual(Array.from(monteSenario.querySelectorAll('.litblock > .rubric'), node => node.textContent), [
  'Do Comum da Dedicação de uma Igreja (cf. Breviário romano).',
  'Antífonas e salmos do dia da semana corrente.',
  'Benedictus',
  'Na basílica de Monte Senário',
  'Fora da basílica de Monte Senário'
 ]);
 const joaquimId = run('SANTORAL.find(saint => saint.month === 2 && saint.day === 3)._id');
 await openChild(`oficio:${joaquimId}:laudes`);
 const joaquim = child.w.document.querySelector('.laudes-content .today-servita-reader');
 assert.deepEqual(Array.from(joaquim.querySelectorAll('.litblock > .rubric'), node => node.textContent), [
  'Do Comum dos Santos e Bem-aventurados da nossa Ordem, p. 489.',
  'Salmos e antífonas do dia da semana corrente.',
  'Benedictus'
 ]);
 assert.match(joaquim.querySelector('.antiphon').textContent, /habite em mim a força de Cristo/);
 const ferialLauds = [
  [2, 19, /Do Comum das Virgens ou das Santas religiosas/, /Salmos e antífonas do dia/, /a Bem-aventurada Isabel/],
  [5, 8, /Do Comum de Nossa Senhora/, /^Salmos do dia da semana corrente\.$/, /Autor da graça/],
  [5, 12, /da nossa Ordem, p\. 489/, /Salmos e antífonas do dia/, /o vosso servo Francisco/],
  [5, 30, /da nossa Ordem, p\. 489/, /Salmos e antífonas do dia/, /Bem-aventurado Tiago Filipe/],
  [9, 6, /da nossa Ordem, p\. 489/, /^Antífonas e salmos do dia/, /Bem-aventurado Boaventura/],
  [10, 25, /da nossa Ordem, p\. 489/, /Salmos e antífonas do dia/, /João Angelo/]
 ];
 for (const [month, day, common, psalmody, prayer] of ferialLauds) {
  const id = run(`SANTORAL.find(saint => saint.month === ${month} && saint.day === ${day})._id`);
  await openChild(`oficio:${id}:laudes`);
  const lauds = child.w.document.querySelector('.laudes-content .today-servita-reader');
  const rubrics = Array.from(lauds.querySelectorAll('.litblock > .rubric'), node => node.textContent);
  assert.match(rubrics[0], common);
  assert.match(rubrics[1], psalmody);
  assert.equal(rubrics[2], 'Benedictus');
  assert.match(lauds.querySelector('.liturgical-prayer').textContent, prayer);
  assert.equal(lauds.querySelector('.psalm-title'), null);
  if (month === 5 && day === 30) assert.match(lauds.querySelector('.antiphon').textContent, /T\.P\. Aleluia/);
 }
 console.log('Laudes verificadas nos 17 formulários fixos, incluindo as remissões ao Comum e à salmodia ferial.');
 const allSaintsId = run('SANTORAL.find(saint => saint.month === 11 && saint.day === 16)._id');
 await openChild(`oficio:${allSaintsId}:vesperas`);
 const allSaintsVespers = child.w.document.querySelector('.vesperas-content .today-servita-reader');
 assert.equal(allSaintsVespers.querySelector('.reading-ref').textContent, 'Ap 7,14b-17');
 assert.deepEqual(Array.from(allSaintsVespers.querySelectorAll('.psalm-title'), node => node.textContent), [
  'Salmo 112 — Louvai o nome do Senhor', 'Salmo 115 — Ação de graças no templo', 'Cântico (Ef 1,3-10) — Ao Deus Salvador'
 ]);
 assert.equal(allSaintsVespers.querySelectorAll('.liturgical-intercession-petition').length, 5);
 assert.equal(allSaintsVespers.querySelector('.litblock > .rubric').textContent, 'Ou:');
 assert.match(allSaintsVespers.textContent, /Como cantar-vos, felizes, ó santos/);
 assert.match(allSaintsVespers.textContent, /espírito de amoroso serviço/);

 const foundersId = run('SANTORAL.find(saint => saint.month === 2 && saint.day === 17)._id');
 await openChild(`oficio:${foundersId}:vesperas`);
 const foundersVespers = child.w.document.querySelector('.vesperas-content .today-servita-reader');
 const eveningHeadings = Array.from(foundersVespers.querySelectorAll('.liturgical-hour-heading'), node => node.textContent);
 assert.deepEqual(eveningHeadings, ['I Vésperas', 'II Vésperas']);
 assert.match(foundersVespers.textContent, /da nossa Ordem, p\. 503/);
 assert.match(foundersVespers.querySelector('.reading-ref').textContent, /Cl 3,16-17/);
 assert.match(foundersVespers.textContent, /dando por ele graças a Deus Pai\./);
 assert.equal(foundersVespers.querySelectorAll('.liturgical-intercession-petition').length, 10);
 const commonVespers = [
  [1, 12, 'Rm 12,9-16', /^Dos Servos de Maria$/, /Não sejais sábios a vossos próprios olhos\./],
  [5, 4, 'Rm 8,18-21', /^Ó Peregrino, irmão nosso e amigo,$/, /liberdade gloriosa dos filhos de Deus\./]
 ];
 for (const [month, day, reference, hymn, reading] of commonVespers) {
  const id = run(`SANTORAL.find(saint => saint.month === ${month} && saint.day === ${day})._id`);
  await openChild(`oficio:${id}:vesperas`);
  const vespers = child.w.document.querySelector('.vesperas-content .today-servita-reader');
  assert.match(vespers.querySelector('.hymn-stanza-line').textContent, hymn);
  assert.match(vespers.querySelector('.litblock > .rubric').textContent, /Comum dos Santos e Bem-aventurados da nossa Ordem, p\. 503/);
  assert.equal(vespers.querySelector('.psalm-title'), null);
  assert.equal(vespers.querySelector('.reading-ref').textContent, reference);
  assert.match(vespers.querySelector('.reading-body').textContent, reading);
  assert.equal(vespers.querySelectorAll('.response').length, 5);
  assert.equal(vespers.querySelectorAll('.liturgical-intercession-petition').length, 5);
  assert.match(vespers.querySelector('.liturgical-intercession-rubric').textContent, /Pai Nosso/i);
  assert.ok(vespers.querySelector('.liturgical-prayer'));
 }
 const eveningForms = [
  [6, 19, ['Ct 8,6-7a', 'Ap 3,20-21'], /Comum das Virgens/, 10],
  [8, 23, ['Fl 4,4-7'], /Comum dos Pastores, p\. 512, ou do Comum dos Santos/, 5],
  [8, 28, ['Gl 5,13-14'], /Comum dos Pastores, p\. 512/, 4]
 ];
 for (const [month, day, references, rubric, petitions] of eveningForms) {
  const id = run(`SANTORAL.find(saint => saint.month === ${month} && saint.day === ${day})._id`);
  await openChild(`oficio:${id}:vesperas`);
  const vespers = child.w.document.querySelector('.vesperas-content .today-servita-reader');
  assert.deepEqual(Array.from(vespers.querySelectorAll('.reading-ref'), node => node.textContent), references);
  assert.match(vespers.textContent, rubric);
  assert.equal(vespers.querySelectorAll('.response').length, references.length * 5);
  assert.equal(vespers.querySelectorAll('.liturgical-intercession-petition').length, petitions);
  assert.equal(vespers.querySelectorAll('.litblock > .rubric:not(.liturgical-cue)').length >= references.length, true);
  if (day === 19) {
   assert.match(vespers.textContent, /Para os que celebram a solenidade/);
   assert.deepEqual(Array.from(vespers.querySelectorAll('.liturgical-hour-heading'), node => node.textContent), ['I Vésperas', 'Vésperas']);
  }
 }
 const ferialVespers = [
  [2, 3, /da nossa Ordem, p\. 489/, /o Bem-aventurado Joaquim/],
  [2, 19, /Do Comum das Virgens ou das Santas religiosas/, /a Bem-aventurada Isabel/],
  [5, 8, /Do Comum de Nossa Senhora/, /Autor da graça/],
  [5, 12, /da nossa Ordem, p\. 489/, /o vosso servo Francisco/],
  [5, 30, /da nossa Ordem, p\. 489/, /Bem-aventurado Tiago Filipe/],
  [9, 6, /da nossa Ordem, p\. 489/, /Bem-aventurado Boaventura/],
  [9, 22, /Do Comum da Dedicação de uma Igreja/, /no alto do Monte Senário/],
  [10, 25, /da nossa Ordem, p\. 489/, /João Angelo/]
 ];
 for (const [month, day, common, prayer] of ferialVespers) {
  const id = run(`SANTORAL.find(saint => saint.month === ${month} && saint.day === ${day})._id`);
  await openChild(`oficio:${id}:vesperas`);
  const vespers = child.w.document.querySelector('.vesperas-content .today-servita-reader');
  const rubrics = Array.from(vespers.querySelectorAll('.litblock > .rubric'), node => node.textContent);
  assert.match(rubrics[0], common);
  assert.match(rubrics[1], /dia da semana corrente/);
  assert.equal(rubrics[2], 'Magnificat');
  assert.match(vespers.querySelector('.liturgical-prayer').textContent, prayer);
  assert.equal(vespers.querySelector('.psalm-title'), null);
  if (month === 5 && day === 30) assert.match(vespers.querySelector('.antiphon').textContent, /T\.P\. Aleluia/);
  if (month === 9 && day === 22) {
   assert.deepEqual(rubrics.slice(3), ['Na basílica de Monte Senário', 'Fora da basílica de Monte Senário']);
   assert.equal(vespers.querySelectorAll('.liturgical-prayer').length, 2);
  }
 }
 await openChild(`oficio:${deceasedId}:vesperas`);
 const deceasedVespers = child.w.document.querySelector('.vesperas-content .today-servita-reader');
 assert.deepEqual(Array.from(deceasedVespers.querySelectorAll('.psalm-title'), node => node.textContent), [
  'Salmo 15 — O Senhor é a porção da minha herança',
  'Salmo 33 (2-11) — O Senhor é a salvação dos justos',
  'Cântico (1Pd 2,21-24) — Cristo, servo do Pai, entrega-se livremente à sua paixão'
 ]);
 assert.equal(deceasedVespers.querySelector('.reading-ref').textContent, 'Rm 8,14-17');
 assert.equal(deceasedVespers.querySelectorAll('.response').length, 5);
 assert.equal(deceasedVespers.querySelectorAll('.liturgical-intercession-petition').length, 5);
 assert.match(deceasedVespers.textContent, /glória dos vossos servos/);
 console.log('Vésperas verificadas nos 17 formulários fixos, incluindo as duas Horas de Nossa Senhora das Dores.');
 for (const [id, transition, alternative, hasTeDeum = true] of [
  [allSaintsId, /Amai o Senhor, vós que nele acreditais/, /Das Constituições dos frades Servos/],
  [foundersId, /Se permanecerdes fiéis à minha Palavra/, /Da "Legenda" sobre a origem da Ordem/],
  [sorrowfulMotherId, /em vossas mãos entreguei a minha vida/, /Ad Caeli Reginam/],
  [deceasedId, /Quem tem ouvidos/, /para a comemoração dos defuntos/, false]
 ]) {
  await openChild(`oficio:${id}:oficio`);
  const office = child.w.document.querySelector('.oficio-leituras-content .today-servita-reader');
  const headings = Array.from(office.querySelectorAll('.litheading'), node => node.textContent);
  assert.deepEqual(headings, ['HINO', 'SALMODIA', 'Oração sálmica', 'Oração sálmica', 'Oração sálmica', 'PRIMEIRA LEITURA', 'RESPONSÓRIO', 'SEGUNDA LEITURA', 'RESPONSÓRIO', 'Leitura alternativa', 'RESPONSÓRIO', 'ORAÇÃO']);
  assert.equal(office.querySelectorAll('.psalm-title').length, 3);
  assert.equal(office.querySelectorAll('.response').length, 11);
  assert.match(office.querySelector('.response').textContent, transition);
  assert.match(Array.from(office.querySelectorAll('.reading-ref')).at(-1).textContent, alternative);
  assert.equal(Array.from(office.querySelectorAll('.litblock > .rubric')).some(node => node.textContent === 'Hino Te Deum, p. 36.'), hasTeDeum);
  assert.ok(office.querySelector('.liturgical-prayer'));
  if (id === sorrowfulMotherId || id === deceasedId) {
   assert.equal(Array.from(office.querySelectorAll('.antiphon')).filter(node => /^[ABC]\. /.test(node.textContent)).length, 18);
  }
  if (id === allSaintsId) {
   assert.equal(Array.from(office.querySelectorAll('.antiphon')).filter(node => /^[ABC]\. /.test(node.textContent)).length, 15);
   assert.match(office.textContent, /nenhum bem eu posso achar fora de vós/);
  }
 }
 for (const [month, day, rubric, transition, alternative] of [
  [1, 12, /p\. 490, ou do Comum dos Pastores, p\. 510/, /Sê vigilante contigo/, /Totalmente voltado para Deus/],
  [5, 4, /da nossa Ordem, p\. 489/, /Convertei-vos e fazei penitência/, /Trago em meu corpo o sofrimento de Jesus/],
  [6, 19, /Comum das Virgens.*p\. 490/, /Jamais me desviei dos mandamentos do Senhor/, /Mãe e modelo das comunidades femininas dos Servos de Maria/],
  [8, 23, /Comum dos Pastores.*p\. 490/, /Dai-me a sabedoria/, /Deus olhou para a humildade do seu servo/],
  [8, 28, /Comum dos Pastores.*p\. 490/, /Cantarei eternamente vossa bondade/, /Somos pastores e servos/]
 ]) {
  const id = run(`SANTORAL.find(saint => saint.month === ${month} && saint.day === ${day})._id`);
  await openChild(`oficio:${id}:oficio`);
  const office = child.w.document.querySelector('.oficio-leituras-content .today-servita-reader');
  const headings = Array.from(office.querySelectorAll('.litheading'), node => node.textContent);
  assert.deepEqual(headings, ['HINO', 'SALMODIA', 'PRIMEIRA LEITURA', 'RESPONSÓRIO', 'SEGUNDA LEITURA', 'RESPONSÓRIO', 'Leitura alternativa', 'RESPONSÓRIO', 'ORAÇÃO']);
  assert.deepEqual(Array.from(office.querySelectorAll('.litblock > .rubric'), node => node.textContent).filter(text => text.startsWith('Série')), ['Série A', 'Série B', 'Série C']);
  assert.match(office.querySelector('.litblock > .rubric').textContent, rubric);
  assert.match(office.querySelector('.response').textContent, transition);
  assert.equal(office.querySelectorAll('.antiphon').length, 9);
  assert.equal(office.querySelectorAll('.response').length, 11);
  assert.equal(office.querySelector('.psalm-title'), null);
  assert.match(office.textContent, alternative);
  assert.ok(office.querySelector('.liturgical-prayer'));
 }
 const seriesHtml = child.run("renderLiturgicalHourContent('SALMODIA\\nSérie A\\nAnt. 1 Primeira antífona\\nSérie B (tempo pascal)\\nAnt. 1 Segunda antífona\\nSérie C\\nAnt. 1 Terceira antífona')");
 const seriesRoot = child.w.document.createElement('div');
 seriesRoot.innerHTML = seriesHtml;
 assert.deepEqual(Array.from(seriesRoot.querySelectorAll('.litblock > .rubric'), node => node.textContent), ['Série A', 'Série B (tempo pascal)', 'Série C']);
 assert.equal(seriesRoot.querySelectorAll('.antiphon').length, 3);
 assert.equal(seriesRoot.querySelectorAll('.psalm-verse').length, 0);
 const offices = JSON.parse(fs.readFileSync(path.join(root,'data/oficios-osm.json'),'utf8')).celebracoes;
 for (const date of ['01-12','05-04','06-19']) {
  const source = offices[date].material.horas.oficio_leituras.texto;
  const expected = [...source.matchAll(/^Série [ABC](?:\s*\([^\n)]*\))?\s*$/gmi)].map(match => match[0].trim());
  const rendered = child.run('renderLiturgicalHourContent('+JSON.stringify(source)+')');
  const rootNode = child.w.document.createElement('div');rootNode.innerHTML=rendered;
  const rubrics = Array.from(rootNode.querySelectorAll('.litblock > .rubric'), node => node.textContent);
  for (const label of expected) assert.ok(rubrics.includes(label), date+': rubrica ausente '+label);
  assert.equal(expected.length, 3, date+': número inesperado de séries alternativas');
 }
 console.log('Rubricas de séries alternativas conferidas também nos formulários reais de Pucci, Peregrino e Juliana.');
 console.log('Séries alternativas da salmodia reconhecidas como rubricas, sem modificar antífonas.');
 console.log('Ofício das Leituras verificado em nove celebrações.');
 child.dom.window.close();a.dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
