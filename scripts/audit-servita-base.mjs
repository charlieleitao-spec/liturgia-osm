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

assert.equal(pkg.version, '4.9.36', 'package.json deve identificar a versão 4.9.36');
assert.equal(pkg.dependencies['@capacitor/app'], '8.1.2', 'Plugin nativo do botão Voltar deve fazer parte do app.');
assert.match(appJs, /const APP_VERSION = ['"]4\.9\.36['"]/);
assert.match(sw, /liturgia-osm-v4.9.36-(?:ui3|causas1|identidade-horas1|identidade-horas2|identidade-horas3|identidade-horas4|identidade-horas5)/);
assert.match(html, /app\.js/);
assert.match(html, /app\.css/);
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
console.log(JSON.stringify({ status: 'ok', version: pkg.version, santoral: santoral.length, oficios: Object.keys(offices.celebracoes).length, memoria: memory.memory_dates.length, memoriaComTexto: memory.celebrations.length, core: core.length }, null, 2));
