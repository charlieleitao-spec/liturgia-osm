import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
const pkg = json('package.json');
const html = read('www/index.html');
const appJs = read('www/app.js');
const sw = read('www/sw.js');
const santoral = json('www/data/santoral.json');
const offices = json('www/data/oficios-osm.json');
const memory = json('www/data/memoria-liturgica.json');
const dataReadme = read('www/data/README.md');

assert.equal(pkg.version, '4.9.42', 'package.json deve identificar a versão 4.9.42');
assert.equal(pkg.dependencies['@capacitor/app'], '8.1.2', 'Plugin nativo do botão Voltar deve fazer parte do app.');
assert.match(appJs, /const APP_VERSION = ['"]4\.9\.42['"]/);
assert.match(sw, /liturgia-osm-v4\.9\.42-(?:ui\d+|causas1|causas2)/);
assert.match(html, /app\.js/);
assert.match(html, /app\.css/);
assert.match(appJs, /function openSantoralOfficeHour/);
assert.match(appJs, /detail-navigation/);
assert.match(appJs, /office-hour-choice/);
assert.match(appJs, /office-hours-grid/);
assert.match(read('www/app.css'), /\.detail-navigation\{/);
assert.match(read('www/app.css'), /\.office-hour-choice\{[^}]*min-height:66px/s);
assert.equal(santoral.length, 32);
assert.equal(offices.schema_version, 3);
assert.equal(Object.keys(offices.celebracoes || {}).length, 32);
assert.equal(memory.schema_version, 2);
assert.equal(memory.memory_dates?.length, 25);
assert.ok(memory.celebrations?.length > 0 && memory.celebrations.length <= memory.memory_dates.length);
assert.ok(offices.celebracoes['10-03']?.material?.horas?.textos_proprios?.oracao, 'oração deve permanecer como campo separado no esquema 3');
const devotionalFiles = ['load-devotions.js','devocoes/oracoes-diarias.json','devocoes/regra.json','devocoes/rosario.json','devocoes/vigilia.json','devocoes/coroa.json','devocoes/stabat-mater.json','devocoes/via-matris.json','devocoes/ladainhas.json','devocoes/sabado-mariano.json','devocoes/adoracao.json','devocoes/antifonas.json','devocoes/oracoes-varias.json'];
for (const file of devotionalFiles) assert.ok(fs.existsSync(path.join(root, 'www/data', file)), 'Arquivo de oração ausente: ' + file);

const core = [...sw.matchAll(/["']\.\/(.*?)["']/g)].map(match => match[1]);
assert.ok(core.length > 0, 'Service worker deve declarar recursos CORE');
for (const file of core) assert.ok(fs.existsSync(path.join(root, 'www', file)), 'Recurso CORE ausente: ' + file);
for (const item of santoral) {
  if (item.image) assert.ok(fs.existsSync(path.join(root, 'www', item.image)), 'Imagem ausente: ' + item.image);
}

assert.match(appJs, /function formatPrayerStanza/);
assert.match(appJs, /prayer-psalm-caption/);
assert.match(appJs, /class="verse-number"/);
assert.doesNotMatch(read('www/data/devocoes/adoracao.json'), /VERÇÃO/);
assert.match(read('www/data/devocoes/vigilia.json'), /Pouco abaixo de Deus o fizestes/);
assert.doesNotMatch(read('www/data/devocoes/vigilia.json'), /Pouco abaixo de um deus o fizestes/i);
assert.match(read('www/data/devocoes/vigilia.json'), /tem o seu trono/);
assert.doesNotMatch(read('www/data/devocoes/vigilia.json'), /temo seu trono/);
assert.match(read('www/data/README.md'), /edição brasileira em quatro volumes publicada pela Paulus/i);

assert.match(appJs, /function saintFallbackMonogram/);
assert.match(appJs, /class="saint-thumb saint-thumb--fallback"/);
assert.match(appJs, /function pruneDailyMassCache/);
assert.match(appJs, /pruneDailyMassCache\(\);/);
assert.match(appJs, /não há cópia local para esta data/i);
assert.equal(santoral.find(x => x.title === 'B. Tiago de "Città della Pieve"')?.name, 'B. TIAGO DE "CITTÀ DELLA PIEVE"');
assert.equal(santoral.find(x => x.title === 'São Peregrino de Forlì')?.name, 'SÃO PEREGRINO DE FORLÌ');
assert.equal(santoral.find(x => x.title === 'B. Boaventura de Forlì')?.name, 'B. BOAVENTURA DE FORLÌ');
const missingImageTitles = santoral.filter(x => !x.image).map(x => x.title);
const noImageSection = dataReadme.split('## Celebrações sem imagem própria')[1]?.split('\n## ')[0] || '';
const listedMissingImageTitles = [...noImageSection.matchAll(/^- (.+)$/gm)].map(match => match[1]);
assert.deepEqual(listedMissingImageTitles, missingImageTitles, 'README deve listar exatamente as celebrações sem imagem.');
assert.ok(!fs.existsSync(path.join(root, 'www/cordova.js')));
assert.ok(!fs.existsSync(path.join(root, 'www/cordova_plugins.js')));

console.log(JSON.stringify({ status: 'ok', version: pkg.version, santoral: santoral.length, oficios: Object.keys(offices.celebracoes).length, memoria: memory.memory_dates.length, memoriaComTexto: memory.celebrations.length, core: core.length }, null, 2));
