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
assert.match(html, /<script[^>]+src=["'][^"']*app\.js["']/);
assert.match(html, /<link[^>]+href=["'][^"']*app\.css["']/);
assert.match(app, /function officeHourButtonHtml/);
assert.match(app, /const APP_VERSION = ['"]4\.9\.36['"]/);
assert.match(app, /addListener\(['"]backButton['"]/);
assert.match(css, /text-align:\s*center/);
assert.match(serviteHtml, /servite-3\.js/);
assert.match(serviteCss, /text-align:\s*center/);
assert.match(serviteScript, /hour-tab-btn/);
console.log('Auditoria aprovada: navegação principal, recursos modulares, retorno Android, botões de Ofícios e centralização litúrgica.');
