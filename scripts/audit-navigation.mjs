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
assert.equal(JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version, '4.9.23');
const usability = html.match(/<script id="canonicalUsability4923">([\s\S]*?)<\/script>/)?.[1] || '';
assert.ok(usability, 'A tela inicial simplificada deve estar presente.');
assert.ok(usability.includes("openLiturgiaSection"), 'Os atalhos da Liturgia devem ter destino funcional.');
assert.ok(usability.includes("duplicateNavigation?.remove()"), 'O menu não deve repetir a navegação principal.');
assert.ok(html.includes('new AbortController()') && html.includes('12000'), 'A consulta da Missa deve terminar com mensagem quando o serviço demora.');
const servite = readFileSync(resolve(root, 'www/servite.html'), 'utf8');
assert.ok(servite.includes('embedded-resource-mode .tabbar'), 'O recurso incorporado não deve abrir uma segunda barra de navegação.');
assert.ok(servite.includes('embedded-resource-mode .topbar'), 'O recurso incorporado deve usar o cabeçalho do aplicativo.');
console.log('Auditoria aprovada: abas, destinos, tela inicial e leitor incorporado.');
