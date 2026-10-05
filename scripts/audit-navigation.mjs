import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'www/index.html'),'utf8');
const appJs=readFileSync(resolve(root,'www/app.js'),'utf8');
const source=html+'\n'+appJs;
const version=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version;
assert.equal(version,'4.9.36','A experiência de navegação deve ter versão própria.');
const css=readFileSync(resolve(root,'www/app.css'),'utf8');
const embeddedCss=readFileSync(resolve(root,'www/servite.css'),'utf8');
const pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
assert.equal(pkg.dependencies['@capacitor/app'],'8.1.2','O plugin Android oficial deve estar instalado.');
assert.match(css,/width:min\(calc\(100% - 28px\), 380px\)/,'O rodapé deve ficar centralizado e compacto.');
assert.match(css,/body\.light-mode\{[\s\S]*?--bg-deep:#f7f4ed/,'O tema claro deve seguir a paleta do Hoje na Família Servita.');
assert.match(css,/--bg-deep:#0c1827/,'O tema escuro deve manter a identidade azul-marinho.');
assert.match(css,/\.office-hour-btn\{[^}]*min-height:50px/,'Os botões de Horas devem ter área de toque confortável.');
assert.match(embeddedCss,/\.hour-tab-btn\{[\s\S]*?min-height:42px/,'Os botões do leitor de Ofício devem ser legíveis e fáceis de tocar.');
assert.match(appJs,/localStorage\.getItem\('osmTheme'\) !== 'dark'/,'A primeira abertura usa o tema claro; a escolha escura salva permanece.');
assert.match(appJs,/installAndroidBackHandler\(\)/,'O app deve registrar o botão Voltar nativo.');
assert.match(appJs,/capacitor\.registerPlugin\(name\)/,'Plugins nativos precisam registrar seu proxy JavaScript no runtime Capacitor.');
assert.match(appJs,/getCapacitorPlugin\('Browser'\)/,'Links externos devem registrar e usar o plugin Browser.');

const nav=html.match(/<nav class="tabbar" id="tabbar"[\s\S]*?<\/nav>/)?.[0]||'';
const tabIds=[...nav.matchAll(/data-tab="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(tabIds,['vida','liturgia','oracoes'],'O rodapé deve ter Vida, Liturgia e Oração, nessa ordem.');
for(const name of ['viewHoje','setTab','render']){
  const expression=new RegExp('(?:function\\s+'+name+'\\s*\\(|'+name+'\\s*=\\s*function\\s*\\()','g');
  assert.equal([...source.matchAll(expression)].length,1,name+' deve ter uma única implementação.');
}
for(const obsolete of ['canonicalSaintNavigation4925','canonicalPrimaryNavigation4923','canonicalUsability4923']) assert.ok(!source.includes(obsolete),'A camada antiga deve ser removida: '+obsolete);
assert.doesNotMatch(html,/const\s+SANTORAL\s*=\s*\[/,'O Santoral não pode ser embutido em uma cópia antiga no HTML.');
assert.match(source,/let SANTORAL\s*=\s*\[\]/,'A lista começa vazia e aguarda o JSON canônico.');
assert.ok(source.includes("typeof item.title!=='string'")&&source.includes("typeof item.bio!=='string'"),'O loader deve validar os campos do schema do Santoral.');
assert.ok(!/canonical\.length\s*<\s*32/.test(source),'A carga não pode usar um limite de quantidade como validação de schema.');
assert.equal([...source.matchAll(/function\s+openDevo\s*\(/g)].length,1,'openDevo deve ter uma única implementação.');
const staticIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(staticIds).size,staticIds.length,'IDs HTML devem ser únicos.');
assert.ok(!source.includes('duplicateNavigation'),'O menu não deve remover sua seção Navegação depois de montá-la.');
assert.ok(source.includes('menu-label\">Navegação</div><div class=\"menu-nav-grid\"'),'A seção Navegação do menu precisa permanecer no HTML gerado.');

const hubScript=appJs.match(/\/\* BEGIN SCRIPT BLOCK: canonicalNavigation4926 \*\/([\s\S]*?)\/\* END SCRIPT BLOCK: canonicalNavigation4926 \*\//)?.[1]||'';
assert.ok(hubScript,'O controlador central de navegação deve estar presente.');
for(const route of ['renderCelebrationHub','openSaintSection','openDailyLiturgy','openSantoralOfficeHour','shareSaint','smartBack']) assert.ok(source.includes(route),'Destino sem ligação: '+route);
for(const id of ['hub-vida','hub-liturgia','hub-oracao','hub-navegacao']) assert.ok(hubScript.includes(id),'Bloco do Santo ausente: '+id);
assert.match(html,/id="floatingBack"[^>]*onclick="smartBack\(\)"/,'O botão de retorno geral deve estar ligado.');
assert.ok(source.includes('Voltar ao Santoral'),'O hub deve oferecer retorno visível.');
assert.ok(source.includes("openSaintSection('+celebration._id+"),'Hoje deve oferecer atalhos para os blocos do Santo.');
assert.ok(source.includes("setTab(\\'calendario\\')")&&source.includes("setTab(\\'santoral\\')"),'Calendário e Santoral devem continuar acessíveis pela Vida.');

const prayerView=source.slice(source.indexOf('function viewOracoesBase480()'),source.indexOf('let dailyPrayerOpen480'));
assert.ok(!prayerView.includes('Memória Litúrgica'),'Oração deve conter práticas; a Memória fica no Santo.');
for(const practice of ['Rosário','Regra OSSM','Coroa de Nossa Senhora das Dores','Via Matris']) assert.ok(source.includes(practice),'Prática devocional ausente: '+practice);

const santoral=JSON.parse(readFileSync(resolve(root,'www/data/santoral.json'),'utf8'));
const offices=JSON.parse(readFileSync(resolve(root,'www/data/oficios-osm.json'),'utf8'));
const memory=JSON.parse(readFileSync(resolve(root,'www/data/memoria-liturgica.json'),'utf8'));
const masses=JSON.parse(readFileSync(resolve(root,'www/data/missas-osm.json'),'utf8'));
assert.equal(santoral.length,32);
const santoralLoader=appJs.match(/\/\* BEGIN SCRIPT BLOCK: canonicalSantoral495 \*\/([\s\S]*?)\/\* END SCRIPT BLOCK: canonicalSantoral495 \*\//)?.[1]||'';
assert.ok(santoralLoader,'O loader do Santoral canônico deve estar presente.');
const loaderContext={SANTORAL:[],santoralReady:false,santoralLoading:true,santoralLoadError:false,window:{},render(){},console:{warn(){}},loadCanonicalOffices:async function(){this.oficiosReady=true;},fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve(santoral);}});}};
vm.runInNewContext(santoralLoader,loaderContext);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(loaderContext.santoralReady,true,'O loader deve aceitar o schema canônico.');
assert.equal(loaderContext.SANTORAL.length,32);
assert.equal(loaderContext.SANTORAL.find(item=>item.title==='B. Boaventura de Pistoia')?.date,'15 de dezembro','O loader deve usar a data corrigida do JSON canônico.');
const invalidLoaderContext={SANTORAL:[],santoralReady:false,santoralLoading:true,santoralLoadError:false,window:{},render(){},console:{warn(){}},loadCanonicalOffices:async function(){},fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve({});}});}};
vm.runInNewContext(santoralLoader,invalidLoaderContext);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(invalidLoaderContext.santoralReady,false,'Dados inválidos não podem marcar o Santoral como carregado.');
assert.equal(invalidLoaderContext.santoralLoadError,true,'Dados inválidos devem produzir estado de erro explícito.');
const coverage=Object.values(offices.celebracoes).reduce((result,item)=>{result[item.tipo_material]=(result[item.tipo_material]||0)+1;return result;},{});
assert.deepEqual(coverage,{oficio_proprio:11,textos_proprios:16,sem_material_proprio:5},'A classificação canônica deve refletir a cobertura efetiva dos textos.');
assert.equal(memory.memory_dates.length,25,'A cobertura da Memória Litúrgica deve permanecer em 25 celebrações.');
assert.equal(memory.celebrations.length,10,'A Memória deve guardar apenas textos próprios distintos do Santoral.');
const memoryLoader=appJs.match(/\/\* BEGIN SCRIPT BLOCK: canonicalMemoriaLiturgica \*\/([\s\S]*?)\/\* END SCRIPT BLOCK: canonicalMemoriaLiturgica \*\//)?.[1]||'';
assert.ok(memoryLoader.includes('source.schema_version!==2')&&memoryLoader.includes('source.memory_dates.length!==25'),'O loader deve validar a cobertura compacta da Memória.');
assert.ok(!source.includes('SANTORAL_OFFICE_MAP')&&!source.includes('OFFICE_CLASSIFICATION')&&!source.includes('OFFICE_HOURS_BY_ID'),'Não deve haver mapas de Ofício embutidos.');
const officeFns=source.slice(source.indexOf('function officeDateKey'),source.indexOf('function calendarCelebrationRow'));
let openedOffice=null;
const officeContext={SANTORAL:santoral.map(x=>({...x,_id:x.id})),OFICIOS_OSM:offices,OFFICE_HOURS:[['invitatorio','Invitatório'],['oficio','Ofício das Leituras'],['laudes','Laudes'],['horaMedia','Hora Média'],['vesperas','Vésperas']],openServite(value){openedOffice=value;},document:{getElementById(){return null;}}};
vm.runInNewContext(officeFns,officeContext);
const officeSaint=officeContext.SANTORAL.find(x=>x.id===4);
assert.equal(officeContext.officeClassificationForSaint(officeSaint),'Laudes e Vésperas próprias + Comum','O rótulo deve descrever as horas existentes no JSON canônico.');
const bonaventure=officeContext.SANTORAL.find(x=>x.id===31);
assert.equal(officeContext.officeClassificationForSaint(bonaventure),'Ofício das Leituras próprio','O rótulo deve distinguir as Leituras próprias das Laudes e Vésperas.');
const nonHourSaint=officeContext.SANTORAL.find(x=>x.id===26);
assert.deepEqual(Array.from(officeContext.officeHoursForSaint(nonHourSaint),x=>Array.from(x)),[['oficio','Textos próprios']],'Seções próprias sem bloco de horas também devem abrir.');
assert.ok(source.includes('Fonte da oração: Santoral da Ordem.'),'A oração alternativa deve identificar sua fonte real.');
assert.ok(source.includes('editorial_notes')&&source.includes('Nota da fonte:'),'Divergências editoriais de data devem permanecer visíveis.')
assert.deepEqual(Array.from(officeContext.officeHoursForSaint(officeSaint),x=>Array.from(x)),[['laudes','Laudes'],['vesperas','Vésperas']]);
officeContext.openSantoralOfficeHour(officeSaint._id,'laudes');
assert.equal(openedOffice,'oficio:4:laudes','A hora deve abrir o registro correspondente do JSON.');
assert.ok(!officeContext.saintHasOffice(officeContext.SANTORAL.find(x=>x.id===13)),'Celebração sem material não deve receber Ofício próprio.');
assert.equal((santoral.filter(x=>x.prayer&&x.prayer.includes('\n')).length),0,'Orações do Santoral devem estar normalizadas no arquivo de dados.');
assert.ok(!source.includes('flowPrayerText'),'Não deve haver normalização duplicada no runtime.');
for(const date of ['08-28','09-15','11-17']) assert.ok(!memory.celebrations.some(item=>item.date===date),'A ausência de fonte deve ser explícita para '+date);
assert.equal(masses.schema_version,1);
assert.deepEqual(masses.celebrations,[],'Nenhum texto de Missa pode ser criado sem fonte conferida.');

const saintButtons=['vida','liturgia','oracoes'].map(id=>({dataset:{tab:id},active:false,attrs:{},classList:{toggle(){}} ,setAttribute(name,value){this.attrs[name]=value;}}));
const scrollTargets={};
const testSaints=[
  {_id:0,id:0,title:'Santo de teste',date:'15 de janeiro',day:15,month:1,rank:'Santo',bio:'Vida do Santoral',prayer:'Oração com linha bem-aventurada.\n\nNova frase.',hasOffice:true},
  {_id:1,id:1,title:'Celebração sem material',date:'16 de janeiro',day:16,month:1,rank:'Memória',bio:'Biografia',prayer:'Oração\ndo Santoral.\n\nNova frase.',hasOffice:false},
  {_id:2,id:2,title:'Celebração com textos parciais',date:'17 de janeiro',day:17,month:1,rank:'Memória',bio:'Biografia parcial',hasOffice:true,partial:true},
  {_id:3,id:3,title:'Celebração sem oração',date:'18 de janeiro',day:18,month:1,rank:'Memória',bio:'Biografia sem oração',hasOffice:false}
];
const memoryData={source:'Livro de Oração dos Servos de Maria',memory_dates:['01-15'],common:{hino:'Hino de fonte',antifona:'Antífona de fonte',salmo:'Salmo de fonte'},celebrations:[{date:'01-15',title:'Santo de teste',breve_vida:'Vida própria distinta'}]};
let openedId=null,scrolledId=null,selectedTab=null;
const context={
  state:{tab:'hoje',detailId:null,detailOriginTab:'hoje',liturgiaSection:'missa',devo:null,devoSub:null},
  SANTORAL:testSaints,MEMORIA_LITURGICA:memoryData,oficiosReady:true,
  window:{MISSAS_OSM:{schema_version:1,celebrations:[]},addEventListener(){},scrollTo(){}},
  document:{addEventListener(){},querySelectorAll(){return [];},getElementById(id){return scrollTargets[id]||null;}},
  fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve({schema_version:1,celebrations:[]});}});},
  requestAnimationFrame(fn){fn();},
  render(){},setTab(tab){selectedTab=tab;},openDetail(id){openedId=id;},smartBack(){},installAndroidBackHandler(){},
  escapeHtml(value){return String(value??'');},saintImageHtml(){return '<span class="photo"></span>';},
  saintHasOffice(s){return s.hasOffice;},officeHoursForSaint(s){return s.hasOffice?[['laudes','Laudes']]:[];},officeRecordForSaint(s){return s.hasOffice?{tipo_material:s.partial?'textos_proprios':'oficio_proprio'}:{tipo_material:'sem_material_proprio'};},
  officeClassificationForSaint(s){return s.partial?'Elementos próprios + Comum':'Ofício próprio';}
};
scrollTargets['hub-liturgia']={scrollIntoView(){scrolledId='hub-liturgia';}};
vm.runInNewContext(hubScript,context);
const hub=context.window.renderCelebrationHub(0);
const order=['id="hub-vida"','id="hub-liturgia"','id="hub-oracao"','id="hub-navegacao"'].map(id=>hub.indexOf(id));
assert.ok(order.every((value,index)=>value>=0&&(index===0||value>order[index-1])),'Os quatro blocos devem aparecer na ordem proposta.');
assert.match(hub,/openDailyLiturgy\('\d{4}-01-15'\)/,'Sem Missa própria, a ação deve abrir a Missa da data.');
assert.match(hub,/openSantoralOfficeHour\(0,'laudes'\)/,'A hora disponível deve abrir o Ofício do Santo.');
for(const text of ['Hino de fonte','Antífona de fonte','Salmo de fonte','Oração com linha bem-aventurada.\n\nNova frase.']) assert.ok(hub.includes(text),'Texto-fonte ausente: '+text);
assert.ok(hub.includes('Fonte da oração: Santoral da Ordem.'),'A oração fallback deve apontar para o Santoral.');
assert.ok(hub.includes('Fonte dos textos comuns: Livro de Oração'),'Os textos comuns devem manter a fonte do Livro de Oração.');
assert.ok(!source.includes('flowPrayerText'),'A fonte normalizada não deve ser reformatada no runtime.');
assert.ok(source.includes('CACHE_MAX_AGE=30*24*60*60*1000'),'O cache da Missa precisa de validade explícita.');
assert.ok(source.includes('offline por até 30 dias'),'A cópia da Missa precisa informar seu prazo local.');
assert.ok(!source.includes('startupMetric493')&&!source.includes('osmStartupMetric'),'A métrica de inicialização persistente foi removida.');
assert.match(hub,/Anterior/);
assert.match(hub,/Próxima/);
assert.match(hub,/shareSaint\(0\)/);
const emptyHub=context.window.renderCelebrationHub(1);
assert.match(emptyHub,/Sem material próprio: usar o Comum/,'A falta de Ofício deve ter estado vazio e caminho para o Comum.');
assert.match(emptyHub,/O Livro de Oração não traz Memória Litúrgica cadastrada/,'A falta de Memória deve ser explícita.');
const noPrayerHub=context.window.renderCelebrationHub(3);
assert.match(noPrayerHub,/O Santoral não traz oração própria cadastrada/,'A ausência de oração do Santoral deve ser explícita.');
const partialHub=context.window.renderCelebrationHub(2);
assert.match(partialHub,/Textos próprios do Ofício/,'Material incompleto não deve ser apresentado como Liturgia das Horas completa.');
assert.match(partialHub,/<div class=\"hub-actions\">/,'O HTML dos botões do Ofício deve permanecer válido.');
assert.doesNotMatch(partialHub,/class=\"hub-actions>/,'A marcação do container de ações não pode ficar aberta.')
context.oficiosReady=false;
const officeFailureHub=context.window.renderCelebrationHub(0);
assert.match(officeFailureHub,/id="hub-vida"[\s\S]*Vida do Santoral[\s\S]*id="hub-liturgia"[\s\S]*Ofício indisponível[\s\S]*id="hub-oracao"[\s\S]*Oração com linha bem-aventurada/,'Falha do JSON de Ofícios deve preservar Vida e Oração no hub.');
assert.match(officeFailureHub,/onclick="loadCanonicalOffices\(\)"/,'O card de falha do Ofício precisa oferecer nova tentativa.');
context.oficiosReady=true;
context.window.openSaintSection(0,'liturgia');
assert.equal(openedId,0,'Atalho deve abrir o Santo, inclusive id 0.');
assert.equal(scrolledId,'hub-liturgia','Atalho deve ir ao bloco selecionado.');
context.window.openLiturgiaSection('horas');
assert.equal(selectedTab,'liturgia','Atalho da Liturgia de hoje deve abrir a aba global Liturgia.');


const viewNode={innerHTML:''};
const mainButtons=tabIds.map(id=>({dataset:{tab:id},active:false,attrs:{},classList:{toggle(name,value){if(name==='active')this.owner.active=value;},owner:null},setAttribute(name,value){this.attrs[name]=value;}}));
mainButtons.forEach(button=>{button.classList.owner=button;});
const routingContext={
  state:{tab:'hoje',detailId:null,devo:null,devoSub:null,prayerSection:'memoria',liturgiaSection:'missa'},santoralReady:true,oficiosReady:true,santoralLoadError:false,
  document:{getElementById(id){return id==='view'?viewNode:null;},querySelectorAll(){return mainButtons;}},
  window:{scrollTo(){}},localStorage:{setItem(){}},pendingSharePrayer:null,
  viewVida(){return 'VIDA_HOME';},viewLiturgia(){return 'LITURGIA_HOME';},viewOracoes(){return 'PRATICAS_HOME';},viewBiblioteca(){return 'BIBLIOTECA';},viewSobre(){return 'SOBRE';},
  applyMainLanguage(){},updateBackButton(){}
};
const rootFunctions=[source.match(/function setTab\(tab\)\{[\s\S]*?\n\}/)?.[0],source.match(/function render\(\)\{[\s\S]*?\n\}/)?.[0]];
assert.ok(rootFunctions.every(Boolean),'O roteador principal deve ter as funções canônicas.');
vm.runInNewContext(rootFunctions.join('\n'),routingContext);
routingContext.oficiosReady=false;
routingContext.render();
assert.equal(viewNode.innerHTML,'VIDA_HOME','Falha na carga de Ofícios não deve bloquear o Santoral e o hub.');
routingContext.oficiosReady=true;
routingContext.setTab('vida');
assert.equal(routingContext.state.tab,'hoje','Vida deve abrir Hoje.');
assert.equal(viewNode.innerHTML,'VIDA_HOME','Hoje deve ter destino ativo.');
routingContext.setTab('liturgia');
assert.equal(viewNode.innerHTML,'LITURGIA_HOME','A aba Liturgia deve abrir sua rota diária.');
routingContext.setTab('oracoes');
assert.equal(viewNode.innerHTML,'PRATICAS_HOME','A aba Oração deve abrir as práticas.');
assert.equal(routingContext.state.prayerSection,'praticas','Oração não deve ficar presa na Memória Litúrgica.');

let detailClosed=false,massClosed=false;
const massNode={open:false,classList:{contains(name){return name==='open'&&massNode.open;}}};
const backContext={
  state:{detailId:0,devo:null,devoSub:null,tab:'santoral',liturgiaSection:'missa'},
  document:{getElementById(id){return id==='dailyLiturgyOverlay'?massNode:null;}},
  window:{closeDailyLiturgy(){massClosed=true;massNode.open=false;}},
  closeMainMenu(){},closeLanguagePanel(){},closeServite(){},closeDailyPrayer480(){},closeMemoriaLiturgica(){},closeDevo(){},closeDetail(){detailClosed=true;},setLiturgiaSection(){},setTab(){},
  dailyPrayerOpen480:null,memoriaSelectedDate:null,updateBackButton(){}
};
const smartBackFunction=source.match(/function smartBack\(\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(smartBackFunction,'Retorno global deve existir.');
vm.runInNewContext(smartBackFunction,backContext);
backContext.smartBack();
assert.equal(detailClosed,true,'Voltar deve fechar o detalhe mesmo para o santo id 0.');
assert.equal(backContext.smartBack(),true,'Retornar de uma tela interna deve informar que o evento foi tratado.');
backContext.state.detailId=null;massNode.open=true;backContext.smartBack();
assert.equal(massClosed,true,'Voltar deve fechar a Missa aberta antes de trocar de tela.');
assert.equal(backContext.smartBack(),true,'Fechar a Missa deve consumir o evento de retorno.');
backContext.state={detailId:null,devo:null,devoSub:null,tab:'hoje',liturgiaSection:'missa'};
assert.equal(backContext.smartBack(),false,'Na raiz, o retorno deve permitir sair ou voltar no histórico.');
const nativeBack=source.match(/function handleAndroidBack\(event\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(nativeBack,'O retorno Android precisa tratar telas internas e saída do app.');
let exited=false,historyReturned=false;
const appProxy={exitApp(){exited=true;}};
const nativeBackContext={smartBack(){return false;},getCapacitorPlugin(){return appProxy;},window:{history:{back(){historyReturned=true;}},Capacitor:{Plugins:{App:appProxy}}}};
vm.runInNewContext(nativeBack,nativeBackContext);
assert.equal(nativeBackContext.handleAndroidBack({canGoBack:true}),true);
assert.equal(historyReturned,true,'Se houver histórico WebView, o voltar deve navegar nele.');
assert.equal(nativeBackContext.handleAndroidBack({canGoBack:false}),true);
assert.equal(exited,true,'Na raiz do app, o voltar Android deve sair pelo plugin nativo.');

const homeFunction=source.match(/function viewHoje\(\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(homeFunction,'Hoje deve ter uma única tela de entrada.');
const homeContext={
  state:{angelus:'anjo'},navigator:{onLine:true},MONTHS:['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
  todayInfo(){return {day:3,month:10,weekday:'sábado'};},findSaintForToday(){return null;},findNextSaint(){return {_id:0,id:0,title:'Santo de teste',date:'3 de outubro',day:3,month:10,rank:'Santo'};},
  escapeHtml(value){return String(value);},saintImageHtml(){return '<span></span>';},dailyPrayerSuggestion(){return {label:'Prática',note:'Texto cadastrado'};},
  openDailyPrayer480(){},recentCard(){return '';},setTab(){},openLiturgiaSection(){}
};
vm.runInNewContext(homeFunction,homeContext);
const home=homeContext.viewHoje();
for(const action of ['Vida','Liturgia','Oração','Calendário','Santoral'])assert.ok(home.includes(action),'Atalho ausente na tela Hoje: '+action);


const liturgiaFunction=source.match(/function viewLiturgia\(\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(liturgiaFunction,'A aba Liturgia precisa de um único destino.');
const liturgiaContext={
  state:{liturgiaSection:'horas'},oficiosReady:true,SANTORAL:[{_id:0,id:0,day:15,title:'Santo de teste',date:'15 de janeiro'}],
  saintHasOffice(){return true;},officeHoursForSaint(){return [['laudes','Laudes']];},formatLiturgicalDate(){return 'hoje';},
  escapeHtml(value){return String(value);},officeHourButtonHtml(s,pair){return `<button class="office-hour-btn office-hour-choice" onclick="openSantoralOfficeHour(${s._id},'${pair[0]}')">${pair[1]}</button>`;},setLiturgiaSection(){},openServite(){},openDailyLiturgy(){}
};
vm.runInNewContext(liturgiaFunction,liturgiaContext);
const hoursPage=liturgiaContext.viewLiturgia();
assert.match(hoursPage,/Liturgia das Horas de hoje/);
assert.match(hoursPage,/openServite\('oficio'\)/,'A Hora diária precisa de destino funcional.');
assert.match(hoursPage,/openSantoralOfficeHour\(0,'laudes'\)/,'A lista de Horas próprias também precisa abrir o conteúdo.');
assert.match(hoursPage,/office-hour-choice[\s\S]*saint-row-hours/,'As Horas próprias devem aparecer em cartões responsivos separados do nome do santo.');
liturgiaContext.oficiosReady=false;
assert.match(liturgiaContext.viewLiturgia(),/cadastro local dos Ofícios está indisponível[\s\S]*loadCanonicalOffices\(\)/,'A aba Liturgia deve explicar a falha do Ofício e permitir nova tentativa.');
liturgiaContext.oficiosReady=true;
liturgiaContext.state.liturgiaSection='missa';
assert.match(liturgiaContext.viewLiturgia(),/openDailyLiturgy\('/,'A Missa do dia deve abrir a consulta da data.');

console.log(JSON.stringify({status:'ok',version,santoral:santoral.length,oficioProprio:coverage.oficio_proprio,textosProprios:coverage.textos_proprios,semMaterial:coverage.sem_material_proprio,memorias:memory.memory_dates.length,textosMemoriaExclusivos:memory.celebrations.length,missaPropriaConferida:masses.celebrations.length,hubBlocks:4},null,2));
