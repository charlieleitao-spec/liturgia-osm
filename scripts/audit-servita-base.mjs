import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const www = path.join(root, 'www');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const parse = p => JSON.parse(read(p));
const errors = [];
const fail = message => errors.push(message);

const html = read('www/index.html');
const servite = read('www/servite.html');
const sw = read('www/sw.js');
const app = parse('package.json');
const manifest = parse('www/manifest.webmanifest');
const santoral = parse('www/data/santoral.json');
const offices = parse('www/data/oficios-osm.json');
const memoria = parse('www/data/memoria-liturgica.json');
const workflow = read('.github/workflows/build-apk.yml');
const requiredFiles = [
  'www/index.html', 'www/servite.html', 'www/data/santoral.json',
  'www/data/oficios-osm.json', 'www/data/memoria-liturgica.json',
  'www/sw.js', 'www/manifest.webmanifest', 'www/icon-192.png', 'www/icon-512.png'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file)) || fs.statSync(path.join(root, file)).size === 0) fail('Arquivo ausente ou vazio: ' + file);
}
const version = html.match(/const APP_VERSION = '([^']+)'/)?.[1];
if (!version || app.version !== version) fail('Versão do app e package.json divergentes.');
if (!version || !sw.includes(`liturgia-osm-v${version}`)) fail('Cache offline não acompanha a versão do app.');
if (!version || !workflow.includes(`versionName "${version}"`) || !workflow.includes(`Liturgia-OSM-${version}.apk`) || !workflow.includes(`tag_name: v${version}`)) fail('Workflow Android não acompanha a versão do app.');
if (manifest.start_url !== './' || manifest.display !== 'standalone') fail('Manifesto PWA incompleto.');

if (!html.includes('data-tab="vida"') || !html.includes('data-tab="liturgia"') || !html.includes('data-tab="oracoes"')) fail('Navegação Vida | Liturgia | Oração incompleta.');
for (const marker of ['function viewLiturgia()', 'Liturgia das Horas', '>Missa<', 'function viewMemoriaLiturgica()', 'Memória Litúrgica']) {
  if (!html.includes(marker)) fail('Interface ausente: ' + marker);
}
if (!html.includes('fetch(\'./data/memoria-liturgica.json\'')) fail('A interface não carrega a fonte da Memória Litúrgica.');
if (!sw.includes('./data/memoria-liturgica.json')) fail('Memória Litúrgica não está no cache offline.');
if (sw.includes('./data/hoje-familia-servita.json')) fail('Cache referencia arquivo derivado ausente da base canônica.');

if (!Array.isArray(santoral) || santoral.length !== 32) fail('Santoral canônico inesperado.');
const byDate = new Map();
for (const [index, item] of santoral.entries()) {
  const key = String(item.month).padStart(2, '0') + '-' + String(item.day).padStart(2, '0');
  if (item.id !== index) fail(`ID incoerente no Santoral: ${key}.`);
  if (byDate.has(key)) fail('Data duplicada no Santoral: ' + key);
  byDate.set(key, item);
}
if (offices.schema_version !== 2 || !offices.celebracoes || Object.keys(offices.celebracoes).length !== 32) fail('Base de Ofícios fora do schema v2 ou incompleta.');
for (const [date, item] of Object.entries(offices.celebracoes || {})) {
  const saint = byDate.get(date);
  if (!saint) fail('Ofício sem celebração no Santoral: ' + date);
  else if (Number(item.id) !== Number(saint.id)) fail('ID de Ofício divergente em ' + date);
  if (!item.material || typeof item.material !== 'object') fail('Material de Ofício ausente em ' + date);
}
if (byDate.get('09-22')?.title !== 'Dedicação da Basílica de Monte Senário') fail('Monte Senário deve permanecer em 22/09.');
if (byDate.get('12-15')?.title !== 'B. Boaventura de Pistoia' || byDate.has('12-14')) fail('Boaventura de Pistoia deve permanecer em 15/12.');
if (byDate.get('08-23')?.title !== 'São Filipe Benizi') fail('A forma canônica do nome deve ser Benizi.');

if (memoria.schema_version !== 1 || !memoria.common || !Array.isArray(memoria.celebrations) || memoria.celebrations.length !== 25) fail('Base da Memória Litúrgica incompleta.');
for (const part of ['hino', 'antifona', 'salmo']) if (!memoria.common?.[part]?.trim()) fail('Parte comum ausente na Memória Litúrgica: ' + part);
const memoryDates = new Set();
for (const item of memoria.celebrations || []) {
  if (!byDate.has(item.date)) fail('Memória sem celebração correspondente: ' + item.date);
  if (memoryDates.has(item.date)) fail('Data duplicada na Memória Litúrgica: ' + item.date);
  memoryDates.add(item.date);
  const saint=byDate.get(item.date);
  const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
  if (!item.title?.trim()) fail(`Título ausente em ${item.date}.`);
  if (!item.breve_vida?.trim()&&!item.apresentacao?.trim()&&!saint?.bio?.trim()) fail(`Texto de vida ausente em ${item.date}.`);
  if (!item.oracao_propria?.trim()&&!saint?.prayer?.trim()) fail(`Oração ausente em ${item.date}.`);
  if (item.breve_vida?.trim()&&compact(item.breve_vida)===compact(saint?.bio)) fail(`Vida duplicada na Memória Litúrgica em ${item.date}; use o Santoral canônico.`);
  if (item.oracao_propria?.trim()&&compact(item.oracao_propria)===compact(saint?.prayer)) fail(`Oração duplicada na Memória Litúrgica em ${item.date}; use o Santoral canônico.`);
}
if (!memoria.source?.includes('Livro de Oração dos Servos de Maria')) fail('Fonte da Memória Litúrgica não identificada.');

const devotionalDataKeys = {
  vigilia: '"vigilia": {',
  coroa: '"coroa": "',
  via_matris: '"via_matris": {'
};
const devotionalRoutes = {
  vigilia: ["function viewVigilia()", "openDevo('vigilia'"],
  coroa: ["PRAYERS.devotions.coroa", "key === 'coroa'"],
  via_matris: ["function viewViaMatris()", "openDevo('via_matris'"]
};
for (const key of Object.keys(devotionalDataKeys)) {
  if (!html.includes(devotionalDataKeys[key]) || !devotionalRoutes[key].every(marker => html.includes(marker))) {
    fail('Prática devocional ou rota ausente: ' + key);
  }
}
for (const script of [html, servite].flatMap(source => [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean))) {
  try { new Function(script); } catch (error) { fail('Erro de sintaxe JavaScript: ' + error.message); }
}
if (html.includes('�') || servite.includes('�')) fail('Caractere de substituição encontrado em texto.');

if (errors.length) {
  console.error(['AUDITORIA DA BASE SERVITA: FALHA', ...errors].join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'ok',
  version,
  santoral: santoral.length,
  oficios: Object.keys(offices.celebracoes).length,
  memoriasLiturgicas: memoria.celebrations.length,
  devotions: ['vigilia', 'coroa', 'via_matris'],
  offlineMemory: true
}, null, 2));

