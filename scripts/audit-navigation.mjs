import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = path => readFileSync(path, 'utf8');
const html = read('www/index.html');
const app = read('www/app.js');
const css = read('www/app.css');
const serviteHtml = read('www/servite.html');
const serviteCss = read('www/servite.css');
const serviteScript = read('www/servite-3.js');
const pkg = JSON.parse(read('package.json'));
const workflow = read('.github/workflows/build-apk.yml');
const loader = read('www/data/load-devotions.js');

for (const file of ['www/app.js', 'www/servite-1.js', 'www/servite-2.js', 'www/servite-3.js']) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || 'Erro de sintaxe em ' + file);
}
for (const tab of ['vida', 'liturgia', 'oracoes']) assert.ok(html.includes('data-tab="' + tab + '"'), 'Aba ausente: ' + tab);
assert.match(html, /app\.js/);
assert.match(html, /href=["'][^"']*app\.css["']/);
assert.match(app, /function officeHourButtonHtml/);
assert.match(app, /const APP_VERSION = ['"]4\.9\.36['"]/);
assert.match(app, /addListener\(['"]backButton['"]/);
assert.match(app, /function saintRankSubtitle/);
assert.match(css, /text-align:\s*center/);
assert.match(serviteHtml, /servite-3\.js/);
assert.match(serviteCss, /text-align:\s*center/);
assert.match(serviteScript, /hour-tab-btn/);
const navStart = app.indexOf('function navigationBlock(s){');
const navEnd = app.indexOf('window.renderCelebrationHub=function(id){', navStart);
const navigation = app.slice(navStart, navEnd);
assert.match(navigation, /‹ Anterior/);
assert.match(navigation, /Próxima ›/);
assert.doesNotMatch(navigation, /previous\.title|next\.title|hub-action-title/);
const ruleStart = serviteScript.indexOf('function renderRuleArticles(text){');
const ruleEnd = serviteScript.indexOf('function viewRegra(){', ruleStart);
const ruleRenderer = serviteScript.slice(ruleStart, ruleEnd);
assert.ok(ruleRenderer.includes('source.matchAll') && ruleRenderer.includes('class="rule-article"'), 'Artigos numerados devem ser renderizados separadamente');
const renderRuleArticles = new Function('escapeHtml', ruleRenderer + '; return renderRuleArticles;')(value => value);
const sampleRule = ['Introdução.', '1. Primeiro artigo.', '2. Segundo artigo.'].join('\\n');\nconst renderedRule = renderRuleArticles(sampleRule);
assert.equal((renderedRule.match(/class="rule-article"/g) || []).length, 2, 'Cada número da Regra deve iniciar um artigo separado');
assert.equal(pkg.dependencies['@capacitor/app'], '8.1.2');
assert.match(loader, /window\.OSM_PRAYERS/);
assert.match(workflow, /assembleRelease/);
assert.match(workflow, /minifyEnabled true/);
assert.match(workflow, /\('shrinkResources', 'true'\)/);
console.log('Auditoria aprovada: abas, módulos, botão Android, rótulos dos santos, orações JSON, Horas centralizadas e release R8.');
