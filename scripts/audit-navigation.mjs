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
assert.equal(JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8' )).version, '4.9.24');
const usability = html.match(/<script id="canonicalUsability4923">([\s\S]*?)<\/script>/)?.[1] || '';
assert.ok(usability, 'A tela inicial simplificada deve estar presente.');
assert.ok(usability.includes("openLiturgiaSection"), 'Os atalhos da Liturgia devem ter destino funcional.');
assert.ok(usability.includes("duplicateNavigation?.remove()"), 'O menu não deve repetir a navegação principal.');
assert.ok(html.includes('new AbortController()') && html.includes('12000'), 'A consulta da Missa deve terminar com mensagem quando o serviço demora.');
const servite = readFileSync(resolve(root, 'www/servite.html'), 'utf8');
assert.ok(servite.includes('embedded-resource-mode .tabbar'), 'O recurso incorporado não deve abrir uma segunda barra de navegação.');
assert.ok(servite.includes('embedded-resource-mode .topbar'), 'O recurso incorporado deve usar o cabeçalho do aplicativo.');

const saintController=html.match(/<script id="canonicalSaintContext4924">([\\s\\S]*?)<\\/script>/)?.[1]||'';
assert.ok(saintController,'A navegação contextual do santo deve estar instalada.');
for(const required of ['openDailyLiturgy','openSantoralOfficeHour','MEMORIA_LITURGICA','state.saintDetailSection4924']) assert.ok(saintController.includes(required),'Rota contextual ausente: '+required);
assert.ok(saintController.includes('O Livro de Oração não traz uma Memória Litúrgica cadastrada'),'Santos sem texto-fonte não podem receber conteúdo inventado.');
assert.ok(saintController.includes('base local não contém um formulário de Missa próprio individual'),'A Missa por data deve ser identificada com precisão.');
const saintButtons=['vida','liturgia','oracoes'].map(id=>({dataset:{tab:id},classList:{toggle(){}},setAttribute(){}}));
const saintViewNode={innerHTML:''};
const saintContext={
  state:{tab:'santoral',detailId:null,devo:null,devoSub:null,prayerSection:'praticas'},
  SANTORAL:[{_id:10,id:10,title:'Santo de teste',date:'15 de janeiro',day:15,month:1,rank:'Santo',bio:'Biografia de teste',prayer:'Oração cadastrada'}],
  MEMORIA_LITURGICA:{common:{hino:'Hino da fonte',antifona:'Antífona da fonte',salmo:'Salmo da fonte'},celebrations:[{date:'01-15',title:'Santo de teste',breve_vida:'Vida da fonte',oracao_propria:'Oração da fonte'}]},
  document:{getElementById(id){return id==='view'?saintViewNode:null;},querySelectorAll(){return saintButtons;}},
  window:{scrollY:120,scrollTo(){}},requestAnimationFrame(fn){fn();},
  localStorage:{setItem(){}},escapeHtml(value){return String(value);},saintImageHtml(){return '';},shareSaint(){},
  saintHasOffice(){return true;},officeClassificationForSaint(){return 'Ofício próprio';},
  officeHoursForSaint(){return [['laudes','Laudes']];},openSantoralOfficeHour(){},openDailyLiturgy(){},
  applyMainLanguage(){},updateBackButton(){},
  render(){saintViewNode.innerHTML='ROOT';},setTab(tab){this.state.tab=tab;this.state.detailId=null;this.render();},
  openDetail(id){this.state.detailId=id;this.render();},openSaint(id){this.state.detailId=id;this.render();},closeDetail(){}
};
vm.runInNewContext(saintController,saintContext);
saintContext.openDetail(10);
assert.match(saintViewNode.innerHTML,/Biografia de teste/,'Abrir um santo deve iniciar em Vida.');
saintContext.setTab('liturgia');
assert.match(saintViewNode.innerHTML,/Missa da data/,'Liturgia deve exibir o caminho de Missa da data.');
assert.match(saintViewNode.innerHTML,/openDailyLiturgy\\(\\'\\d{4}-01-15\\'\\)/,'A Missa deve receber a data do santo.');
assert.match(saintViewNode.innerHTML,/Laudes/,'O Ofício deve abrir apenas as horas disponíveis.');
saintContext.setTab('oracoes');
for(const text of ['Hino da fonte','Antífona da fonte','Salmo da fonte','Vida da fonte','Oração da fonte']) assert.ok(saintViewNode.innerHTML.includes(text),'Memória Litúrgica deve mostrar texto-fonte: '+text);
assert.match(saintViewNode.innerHTML,/Fonte: Livro de Oração/,'A celebração deve identificar o livro-fonte.');
assert.match(saintViewNode.innerHTML,/aria-current="page"/,'A navegação do santo deve indicar a aba atual.');

console.log('Auditoria aprovada: navegação geral, detalhe do santo, conteúdo-fonte e leitor incorporado.');
