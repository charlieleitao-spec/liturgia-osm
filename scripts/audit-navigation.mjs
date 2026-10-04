import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'www/index.html'),'utf8');
const version=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version;
assert.equal(version,'4.9.29','A experiência de navegação deve ter versão própria.');

const nav=html.match(/<nav class="tabbar" id="tabbar"[\s\S]*?<\/nav>/)?.[0]||'';
const tabIds=[...nav.matchAll(/data-tab="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(tabIds,['vida','liturgia','oracoes'],'O rodapé deve ter Vida, Liturgia e Oração, nessa ordem.');
for(const name of ['viewHoje','setTab','render']){
  const expression=new RegExp('(?:function\\s+'+name+'\\s*\\(|'+name+'\\s*=\\s*function\\s*\\()','g');
  assert.equal([...html.matchAll(expression)].length,1,name+' deve ter uma única implementação.');
}
for(const obsolete of ['canonicalSaintNavigation4925','canonicalPrimaryNavigation4923','canonicalUsability4923']) assert.ok(!html.includes(obsolete),'A camada antiga deve ser removida: '+obsolete);
assert.doesNotMatch(html,/const\s+SANTORAL\s*=\s*\[/,'O Santoral não pode ser embutido em uma cópia antiga no HTML.');
assert.match(html,/let SANTORAL\s*=\s*\[\]/,'A lista começa vazia e aguarda o JSON canônico.');
assert.ok(html.includes("typeof item.title!=='string'")&&html.includes("typeof item.bio!=='string'"),'O loader deve validar os campos do schema do Santoral.');
assert.ok(!/canonical\.length\s*<\s*32/.test(html),'A carga não pode usar um limite de quantidade como validação de schema.');
assert.equal([...html.matchAll(/function\s+openDevo\s*\(/g)].length,1,'openDevo deve ter uma única implementação.');
const staticIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(staticIds).size,staticIds.length,'IDs HTML devem ser únicos.');
assert.ok(!html.includes('duplicateNavigation'),'O menu não deve remover sua seção Navegação depois de montá-la.');
assert.ok(html.includes('menu-label\">Navegação</div><div class=\"menu-nav-grid\"'),'A seção Navegação do menu precisa permanecer no HTML gerado.');

const hubScript=html.match(/<script id="canonicalNavigation4926">([\s\S]*?)<\/script>/)?.[1]||'';
assert.ok(hubScript,'O controlador central de navegação deve estar presente.');
for(const route of ['renderCelebrationHub','openSaintSection','openDailyLiturgy','openSantoralOfficeHour','shareSaint','smartBack']) assert.ok(html.includes(route),'Destino sem ligação: '+route);
for(const id of ['hub-vida','hub-liturgia','hub-oracao','hub-navegacao']) assert.ok(hubScript.includes(id),'Bloco do Santo ausente: '+id);
assert.match(html,/id="floatingBack"[^>]*onclick="smartBack\(\)"/,'O botão de retorno geral deve estar ligado.');
assert.ok(html.includes('Voltar ao Santoral'),'O hub deve oferecer retorno visível.');
assert.ok(html.includes("openSaintSection('+celebration._id+"),'Hoje deve oferecer atalhos para os blocos do Santo.');
assert.ok(html.includes("setTab(\\'calendario\\')")&&html.includes("setTab(\\'santoral\\')"),'Calendário e Santoral devem continuar acessíveis pela Vida.');

const prayerView=html.slice(html.indexOf('function viewOracoesBase480()'),html.indexOf('let dailyPrayerOpen480'));
assert.ok(!prayerView.includes('Memória Litúrgica'),'Oração deve conter práticas; a Memória fica no Santo.');
for(const practice of ['Rosário','Regra OSSM','Coroa de Nossa Senhora das Dores','Via Matris']) assert.ok(html.includes(practice),'Prática devocional ausente: '+practice);

const santoral=JSON.parse(readFileSync(resolve(root,'www/data/santoral.json'),'utf8'));
const offices=JSON.parse(readFileSync(resolve(root,'www/data/oficios-osm.json'),'utf8'));
const memory=JSON.parse(readFileSync(resolve(root,'www/data/memoria-liturgica.json'),'utf8'));
const masses=JSON.parse(readFileSync(resolve(root,'www/data/missas-osm.json'),'utf8'));
assert.equal(santoral.length,32);
const santoralLoader=html.match(/<script id="canonicalSantoral495">([\s\S]*?)<\/script>/)?.[1]||'';
assert.ok(santoralLoader,'O loader do Santoral canônico deve estar presente.');
const loaderContext={SANTORAL:[],santoralReady:false,santoralLoading:true,santoralLoadError:false,window:{},render(){},console:{warn(){}},fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve(santoral);}});}};
vm.runInNewContext(santoralLoader,loaderContext);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(loaderContext.santoralReady,true,'O loader deve aceitar o schema canônico.');
assert.equal(loaderContext.SANTORAL.length,32);
assert.equal(loaderContext.SANTORAL.find(item=>item.title==='B. Boaventura de Pistoia')?.date,'15 de dezembro','O loader deve usar a data corrigida do JSON canônico.');
const invalidLoaderContext={SANTORAL:[],santoralReady:false,santoralLoading:true,santoralLoadError:false,window:{},render(){},console:{warn(){}},fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve({});}});}};
vm.runInNewContext(santoralLoader,invalidLoaderContext);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(invalidLoaderContext.santoralReady,false,'Dados inválidos não podem marcar o Santoral como carregado.');
assert.equal(invalidLoaderContext.santoralLoadError,true,'Dados inválidos devem produzir estado de erro explícito.');
const coverage=Object.values(offices.celebracoes).reduce((result,item)=>{result[item.tipo_material]=(result[item.tipo_material]||0)+1;return result;},{});
assert.deepEqual(coverage,{oficio_proprio:18,textos_proprios:9,sem_material_proprio:5},'A classificação das 32 celebrações deve permanecer íntegra.');
assert.equal(memory.celebrations.length,25,'A cobertura da Memória Litúrgica deve permanecer em 25 celebrações.');
for(const date of ['08-28','09-15','11-17']) assert.ok(!memory.celebrations.some(item=>item.date===date),'A ausência de fonte deve ser explícita para '+date);
assert.equal(masses.schema_version,1);
assert.deepEqual(masses.celebrations,[],'Nenhum texto de Missa pode ser criado sem fonte conferida.');

const saintButtons=['vida','liturgia','oracoes'].map(id=>({dataset:{tab:id},active:false,attrs:{},classList:{toggle(){}} ,setAttribute(name,value){this.attrs[name]=value;}}));
const scrollTargets={};
const testSaints=[
  {_id:0,id:0,title:'Santo de teste',date:'15 de janeiro',day:15,month:1,rank:'Santo',bio:'Vida do Santoral',prayer:'Oração\ncom linha\nbem-\naventurada.\n\nNova frase.',hasOffice:true},
  {_id:1,id:1,title:'Celebração sem material',date:'16 de janeiro',day:16,month:1,rank:'Memória',bio:'Biografia',prayer:'Oração\ndo Santoral.\n\nNova frase.',hasOffice:false},
  {_id:2,id:2,title:'Celebração com textos parciais',date:'17 de janeiro',day:17,month:1,rank:'Memória',bio:'Biografia parcial',hasOffice:true,partial:true},
  {_id:3,id:3,title:'Celebração sem oração',date:'18 de janeiro',day:18,month:1,rank:'Memória',bio:'Biografia sem oração',hasOffice:false}
];
const memoryData={common:{hino:'Hino de fonte',antifona:'Antífona de fonte',salmo:'Salmo de fonte'},celebrations:[{date:'01-15',title:'Santo de teste',breve_vida:'Vida do\nSantoral'}]};
let openedId=null,scrolledId=null,selectedTab=null;
const context={
  state:{tab:'hoje',detailId:null,detailOriginTab:'hoje',liturgiaSection:'missa',devo:null,devoSub:null},
  SANTORAL:testSaints,MEMORIA_LITURGICA:memoryData,
  window:{MISSAS_OSM:{schema_version:1,celebrations:[]},addEventListener(){},scrollTo(){}},
  document:{addEventListener(){},querySelectorAll(){return [];},getElementById(id){return scrollTargets[id]||null;}},
  fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve({schema_version:1,celebrations:[]});}});},
  requestAnimationFrame(fn){fn();},
  render(){},setTab(tab){selectedTab=tab;},openDetail(id){openedId=id;},smartBack(){},
  escapeHtml(value){return String(value??'');},saintImageHtml(){return '<span class="photo"></span>';},
  saintHasOffice(s){return s.hasOffice;},officeHoursForSaint(s){return s.hasOffice?[['laudes','Laudes']]:[];},
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
assert.equal((hub.match(/Vida do Santoral/g)||[]).length,1,'A vida idêntica do Livro de Oração não deve ser repetida no bloco Oração.');
assert.ok(html.includes('CACHE_MAX_AGE=30*24*60*60*1000'),'O cache da Missa precisa de validade explícita.');
assert.ok(html.includes('offline por até 30 dias'),'A cópia da Missa precisa informar seu prazo local.');
assert.ok(!html.includes('startupMetric493')&&!html.includes('osmStartupMetric'),'A métrica de inicialização persistente foi removida.');
assert.match(hub,/Anterior/);
assert.match(hub,/Próxima/);
assert.match(hub,/shareSaint\(0\)/);
const emptyHub=context.window.renderCelebrationHub(1);
assert.match(emptyHub,/Sem Ofício próprio: usar o Comum/,'A falta de Ofício deve ter estado vazio e caminho para o Comum.');
assert.match(emptyHub,/O Livro de Oração não traz Memória Litúrgica cadastrada/,'A falta de Memória deve ser explícita.');
const noPrayerHub=context.window.renderCelebrationHub(3);
assert.match(noPrayerHub,/O Santoral não traz oração própria cadastrada/,'A ausência de oração do Santoral deve ser explícita.');
const partialHub=context.window.renderCelebrationHub(2);
assert.match(partialHub,/Textos próprios do Ofício/,'Material incompleto não deve ser apresentado como Liturgia das Horas completa.');
assert.match(partialHub,/<div class="hub-actions">/,'O HTML dos botões do Ofício deve permanecer válido.');
assert.doesNotMatch(partialHub,/class="hub-actions>/,'A marcação do container de ações não pode ficar aberta.');
context.window.openSaintSection(0,'liturgia');
assert.equal(openedId,0,'Atalho deve abrir o Santo, inclusive id 0.');
assert.equal(scrolledId,'hub-liturgia','Atalho deve ir ao bloco selecionado.');
context.window.openLiturgiaSection('horas');
assert.equal(selectedTab,'liturgia','Atalho da Liturgia de hoje deve abrir a aba global Liturgia.');


const viewNode={innerHTML:''};
const mainButtons=tabIds.map(id=>({dataset:{tab:id},active:false,attrs:{},classList:{toggle(name,value){if(name==='active')this.owner.active=value;},owner:null},setAttribute(name,value){this.attrs[name]=value;}}));
mainButtons.forEach(button=>{button.classList.owner=button;});
const routingContext={
  state:{tab:'hoje',detailId:null,devo:null,devoSub:null,prayerSection:'memoria',liturgiaSection:'missa'},santoralReady:true,santoralLoadError:false,
  document:{getElementById(id){return id==='view'?viewNode:null;},querySelectorAll(){return mainButtons;}},
  window:{scrollTo(){}},localStorage:{setItem(){}},pendingSharePrayer:null,
  viewVida(){return 'VIDA_HOME';},viewLiturgia(){return 'LITURGIA_HOME';},viewOracoes(){return 'PRATICAS_HOME';},viewBiblioteca(){return 'BIBLIOTECA';},viewSobre(){return 'SOBRE';},
  applyMainLanguage(){},updateBackButton(){}
};
const rootFunctions=[html.match(/function setTab\(tab\)\{[\s\S]*?\n\}/)?.[0],html.match(/function render\(\)\{[\s\S]*?\n\}/)?.[0]];
assert.ok(rootFunctions.every(Boolean),'O roteador principal deve ter as funções canônicas.');
vm.runInNewContext(rootFunctions.join('\n'),routingContext);
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
const smartBackFunction=html.match(/function smartBack\(\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(smartBackFunction,'Retorno global deve existir.');
vm.runInNewContext(smartBackFunction,backContext);
backContext.smartBack();
assert.equal(detailClosed,true,'Voltar deve fechar o detalhe mesmo para o santo id 0.');
backContext.state.detailId=null;massNode.open=true;backContext.smartBack();
assert.equal(massClosed,true,'Voltar deve fechar a Missa aberta antes de trocar de tela.');

const homeFunction=html.match(/function viewHoje\(\)\{[\s\S]*?\n\}/)?.[0];
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


const liturgiaFunction=html.match(/function viewLiturgia\(\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(liturgiaFunction,'A aba Liturgia precisa de um único destino.');
const liturgiaContext={
  state:{liturgiaSection:'horas'},SANTORAL:[{_id:0,id:0,day:15,title:'Santo de teste',date:'15 de janeiro'}],
  saintHasOffice(){return true;},officeHoursForSaint(){return [['laudes','Laudes']];},formatLiturgicalDate(){return 'hoje';},
  escapeHtml(value){return String(value);},setLiturgiaSection(){},openServite(){},openDailyLiturgy(){}
};
vm.runInNewContext(liturgiaFunction,liturgiaContext);
const hoursPage=liturgiaContext.viewLiturgia();
assert.match(hoursPage,/Liturgia das Horas de hoje/);
assert.match(hoursPage,/openServite\('oficio'\)/,'A Hora diária precisa de destino funcional.');
assert.match(hoursPage,/openSantoralOfficeHour\(0,'laudes'\)/,'A lista de Horas próprias também precisa abrir o conteúdo.');
liturgiaContext.state.liturgiaSection='missa';
assert.match(liturgiaContext.viewLiturgia(),/openDailyLiturgy\('/,'A Missa do dia deve abrir a consulta da data.');

console.log(JSON.stringify({status:'ok',version,santoral:santoral.length,oficioProprio:coverage.oficio_proprio,textosProprios:coverage.textos_proprios,semMaterial:coverage.sem_material_proprio,memorias:memory.celebrations.length,missaPropriaConferida:masses.celebrations.length,hubBlocks:4},null,2));

