import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'www/index.html'), 'utf8');
const nav = html.match(/<nav class="tabbar" id="tabbar"[\s\S]*?<\/nav>/)?.[0] || '';
const tabIds = [...nav.matchAll(/data-tab="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(tabIds, ['vida', 'liturgia', 'oracoes'], 'A barra principal deve ter exatamente Vida, Liturgia e Oração.');

const controller = html.match(/<script id="canonicalPrimaryNavigation4923">([\s\S]*?)<\/script>/)?.[1] || '';
assert.ok(controller, 'O controlador canônico de navegação deve executar depois das camadas antigas.');
for (const route of ['viewVida()', 'viewLiturgia()', 'viewOracoes()', 'viewMemoriaLiturgica()', 'viewOracoesBase480()']) {
  assert.ok(controller.includes(route), 'Rota ausente no controlador: ' + route);
}

const buttons = tabIds.map(id => ({
  dataset: { tab: id },
  active: false,
  attrs: {},
  classList: { toggle(name, value) { if (name === 'active') this.owner.active = value; }, owner: null },
  setAttribute(name, value) { this.attrs[name] = value; },
  querySelector() { return this.label || (this.label = { textContent: id }); }
}));
buttons.forEach(button => { button.classList.owner = button; });
const view = { innerHTML: '' };
const floatingBack = { classList: { toggle() {} } };
const context = {
  document: {
    getElementById(id) { return id === 'view' ? view : id === 'floatingBack' ? floatingBack : null; },
    querySelectorAll(selector) { return selector === '#tabbar .tab-btn' ? buttons : []; }
  },
  window: { scrollTo() {} },
  localStorage: { setItem() {} },
  MAIN_LANG: 'pt',
  MAIN_I18N: { pt: {} },
  state: { tab: 'vida', detailId: null, devo: null, devoSub: null, prayerSection: 'praticas' },
  memoriaSelectedDate: null,
  dailyPrayerOpen480: null,
  applyMainLanguage() {
    ['Hoje', 'Calendário', 'Santoral'].forEach((label, index) => { buttons[index].querySelector().textContent = label; });
  },
  viewVida: () => 'ROTA_VIDA',
  viewLiturgia: () => 'ROTA_LITURGIA',
  viewOracoesBase480: () => 'ROTA_PRATICAS',
  viewMemoriaLiturgica: () => 'ROTA_MEMORIA',
  viewBiblioteca: () => 'ROTA_BIBLIOTECA',
  viewSobre: () => 'ROTA_SOBRE',
  viewDailyPrayer480: () => 'ROTA_ORACAO_DIARIA',
  viewDevoDetail: () => 'ROTA_DEVocional',
  setPrayerSection() {},
  updateBackButton() {}
};
vm.runInNewContext(controller, context);
assert.equal(view.innerHTML, 'ROTA_VIDA', 'A aba Vida deve abrir sua rota.');
context.setTab('liturgia');
assert.equal(view.innerHTML, 'ROTA_LITURGIA', 'A aba Liturgia deve abrir sua rota.');
assert.equal(buttons[1].active, true, 'Liturgia deve ficar marcada como aba ativa.');
context.setTab('oracoes');
context.state.prayerSection = 'memoria';
context.render();
assert.match(view.innerHTML, /ROTA_MEMORIA/, 'Memória Litúrgica deve abrir dentro de Oração.');
assert.deepEqual(buttons.map(button => button.querySelector().textContent), ['Vida', 'Liturgia', 'Oração'], 'A tradução antiga não pode sobrescrever os rótulos aprovados.');
context.state.prayerSection = 'praticas';
context.render();
assert.match(view.innerHTML, /ROTA_PRATICAS/, 'As práticas devocionais devem permanecer em Oração.');
assert.equal(JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8' )).version, '4.9.25');
const usability = html.match(/<script id="canonicalUsability4923">([\s\S]*?)<\/script>/)?.[1] || '';
assert.ok(usability, 'A tela inicial simplificada deve estar presente.');
assert.ok(usability.includes("openLiturgiaSection"), 'Os atalhos da Liturgia devem ter destino funcional.');
assert.ok(usability.includes("duplicateNavigation?.remove()"), 'O menu não deve repetir a navegação principal.');
assert.ok(html.includes('new AbortController()') && html.includes('12000'), 'A consulta da Missa deve terminar com mensagem quando o serviço demora.');
const servite = readFileSync(resolve(root, 'www/servite.html'), 'utf8');
assert.ok(servite.includes('embedded-resource-mode .tabbar'), 'O recurso incorporado não deve abrir uma segunda barra de navegação.');
assert.ok(servite.includes('embedded-resource-mode .topbar'), 'O recurso incorporado deve usar o cabeçalho do aplicativo.');

const saintController=html.match(/<script id="canonicalSaintNavigation4925">([\s\S]*?)<\/script>/)?.[1]||'';
assert.ok(saintController,'A navegação revisada do santo deve estar instalada.');
for(const required of ['openDailyLiturgy','openSantoralOfficeHour','MEMORIA_LITURGICA','state.saintDetailSection4925','Voltar ao Santoral','smartBack=function']) assert.ok(saintController.includes(required),'Rota ou retorno ausente: '+required);
assert.ok(saintController.includes('O Livro de Oração não traz uma Memória Litúrgica cadastrada'),'Santos sem texto-fonte não podem receber conteúdo inventado.');
assert.ok(saintController.includes('base local não contém um formulário de Missa próprio individual'),'A Missa por data deve ser identificada com precisão.');
const saintButtons=['vida','liturgia','oracoes'].map(id=>({dataset:{tab:id},active:false,attrs:{},classList:{toggle(name,value){if(name==='active')this.owner.active=value;},owner:null},setAttribute(name,value){this.attrs[name]=value;}}));
saintButtons.forEach(button=>{button.classList.owner=button;});
const saintViewNode={innerHTML:''};
const massOverlay={open:false,classList:{contains(name){return name==='open'&&massOverlay.open;}}};
const saintContext={
  state:{tab:'santoral',detailId:null,devo:null,devoSub:null,prayerSection:'praticas'},
  SANTORAL:[{_id:0,id:0,title:'Santo de teste',date:'15 de janeiro',day:15,month:1,rank:'Santo',bio:'Biografia de teste',prayer:'Oração cadastrada'}],
  MEMORIA_LITURGICA:{common:{hino:'Hino da fonte',antifona:'Antífona da fonte',salmo:'Salmo da fonte'},celebrations:[{date:'01-15',title:'Santo de teste',breve_vida:'Vida da fonte',oracao_propria:'Oração da fonte'}]},
  document:{getElementById(id){return id==='view'?saintViewNode:id==='dailyLiturgyOverlay'?massOverlay:null;},querySelectorAll(){return saintButtons;},addEventListener(){}},
  window:{scrollY:120,scrollTo(){},addEventListener(){}},requestAnimationFrame(fn){fn();},
  localStorage:{setItem(){}},escapeHtml(value){return String(value);},saintImageHtml(){return '';},shareSaint(){},
  saintHasOffice(){return true;},officeClassificationForSaint(){return 'Ofício próprio';},
  officeHoursForSaint(){return [['laudes','Laudes']];},openSantoralOfficeHour(){},openDailyLiturgy(){},
  applyMainLanguage(){},updateBackButton(){},smartBack(){},closeMainMenu(){},closeLanguagePanel(){},
  closeDailyLiturgy(){massOverlay.open=false;},closeDailyPrayer480(){},closeMemoriaLiturgica(){},closeDevo(){},
  dailyPrayerOpen480:null,memoriaSelectedDate:null,
  render(){saintViewNode.innerHTML='ROOT';},setTab(tab){saintContext.state.tab=tab;saintContext.state.detailId=null;saintContext.render();},
  openDetail(id){saintContext.state.detailId=id;saintContext.render();},openSaint(id){saintContext.state.detailId=id;saintContext.render();},closeDetail(){}
};
vm.runInNewContext(saintController,saintContext);
saintContext.openDetail(0);
assert.match(saintViewNode.innerHTML,/Biografia de teste/,'O primeiro santo (id 0) deve abrir corretamente em Vida.');
assert.match(saintViewNode.innerHTML,/Voltar ao Santoral/,'A tela do santo deve mostrar retorno textual e visível.');
assert.equal(saintButtons[0].active,true,'Vida deve ficar ativa ao abrir o santo.');
saintContext.setTab('liturgia');
assert.match(saintViewNode.innerHTML,/Missa da data/,'Liturgia deve exibir o caminho de Missa da data.');
assert.equal(saintButtons[1].attrs['aria-current'],'page','Liturgia deve ficar ativa dentro do santo.');
assert.equal(saintButtons[1].active,true,'Liturgia deve receber o estado ativo.');
assert.match(saintViewNode.innerHTML,/openDailyLiturgy\('\d{4}-01-15'\)/,'A Missa deve receber a data do santo.');
assert.match(saintViewNode.innerHTML,/Laudes/,'O Ofício deve abrir apenas as horas disponíveis.');
saintContext.setTab('oracoes');
for(const text of ['Hino da fonte','Antífona da fonte','Salmo da fonte','Vida da fonte','Oração da fonte']) assert.ok(saintViewNode.innerHTML.includes(text),'Memória Litúrgica deve mostrar texto-fonte: '+text);
assert.match(saintViewNode.innerHTML,/Fonte: Livro de Oração/,'A celebração deve identificar o livro-fonte.');
assert.equal(saintButtons[2].attrs['aria-current'],'page','Oração deve ficar ativa dentro do santo.');
assert.equal(saintButtons[2].active,true,'Oração deve receber o estado ativo.');
saintContext.MEMORIA_LITURGICA.celebrations=[];
saintContext.render();
assert.match(saintViewNode.innerHTML,/O Livro de Oração não traz uma Memória Litúrgica cadastrada/,'Santos sem texto-fonte devem receber estado sem conteúdo, não um texto inventado.');
saintContext.smartBack();
assert.equal(saintContext.state.detailId,null,'O botão voltar deve sair do detalhe, inclusive para o id 0.');
assert.equal(saintContext.state.tab,'santoral','O retorno deve restaurar o Santoral de origem.');
massOverlay.open=true;
saintContext.smartBack();
assert.equal(massOverlay.open,false,'Voltar do aparelho deve fechar a sobreposição da Missa antes de sair da tela.');
console.log('Auditoria aprovada: rotas, botões de seção, Missa, Ofício, Memória e retorno do Santo/overlay.');

