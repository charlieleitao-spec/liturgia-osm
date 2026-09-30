import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const santoralPath = 'www/data/santoral.json';
const sourcePath = 'www/data/hoje-familia-servita.json';
const auditPath = 'scripts/audit-app.mjs';
const officesPath = 'www/data/oficios-osm.json';

// Recover the last audited canonical Santoral before applying the 4.9.17 delta.
const canonicalSantoral = execFileSync('git', ['show', '48faab4:www/data/santoral.json'], { encoding: 'utf8' });
fs.writeFileSync(santoralPath, canonicalSantoral.endsWith('\n') ? canonicalSantoral : canonicalSantoral + '\n');

const santoral = JSON.parse(fs.readFileSync(santoralPath, 'utf8'));
const boaventura = santoral.filter(item => item.title === 'B. Boaventura de Pistoia');
if (boaventura.length !== 1) throw new Error(`Esperada uma entrada de Boaventura de Pistoia; encontradas ${boaventura.length}.`);
boaventura[0].day = 15;
boaventura[0].date = '15 de dezembro';
fs.writeFileSync(santoralPath, JSON.stringify(santoral, null, 2) + '\n');

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!source['12-15']) {
  if (!source['12-14']) throw new Error('Entrada-fonte de Boaventura não encontrada em 12-14 nem 12-15.');
  source['12-15'] = source['12-14'];
  delete source['12-14'];
}
source['12-15'].data = '15 de dezembro';
fs.writeFileSync(sourcePath, JSON.stringify(source, null, 2) + '\n');

let audit = fs.readFileSync(auditPath, 'utf8');
audit = audit.replace('Object.keys(oficios).length !== 26', 'Object.keys(oficios).length !== 30');
audit = audit.replace("celebrationsWithoutOffice.join(',') !== '5,13,17,21,24,26'", "celebrationsWithoutOffice.join(',') !== '5,17'");
audit = audit.replace("boaventuraPistoia[0].day !== 14", "boaventuraPistoia[0].day !== 15");
audit = audit.replace('Boaventura de Pistoia deve aparecer somente em 14 de dezembro.', 'Boaventura de Pistoia deve aparecer somente em 15 de dezembro.');
if (!audit.includes('Object.keys(oficios).length !== 30') || !audit.includes("celebrationsWithoutOffice.join(',') !== '5,17'") || !audit.includes("boaventuraPistoia[0].day !== 15")) throw new Error('Não foi possível atualizar as regras de auditoria 4.9.17.');
fs.writeFileSync(auditPath, audit);

const offices = JSON.parse(fs.readFileSync(officesPath, 'utf8'));
const additions = [
  { id: 13, heading: '1º DE JULHO\nB. FERNANDO MARIA BACCILIERI, PRESBÍTERO\nMemória facultativa', common: 'Comum dos Santos e Bem-aventurados da Ordem ou, conforme o caso, o Comum dos Pastores' },
  { id: 21, heading: '5 DE SETEMBRO\nB. MARIA MADALENA DA PAIXÃO STARACE, VIRGEM\nMemória facultativa', common: 'Comum dos Santos e Bem-aventurados da Ordem ou o Comum das Virgens' },
  { id: 24, heading: '17 DE SETEMBRO\nB. CECÍLIA EUSEPI, VIRGEM\nMemória facultativa', common: 'Comum dos Santos e Bem-aventurados da Ordem ou o Comum das Virgens' },
  { id: 26, heading: '3 DE OUTUBRO\nB. MARIA GUADALUPE RICART OLMOS, VIRGEM E MÁRTIR\nMemória', common: 'Comum dos Santos e Bem-aventurados da Ordem ou o Comum dos Mártires' }
];
for (const entry of additions) {
  const saint = santoral.find(item => item.id === entry.id);
  if (!saint?.bio || !saint?.prayer) throw new Error(`Celebração ${entry.id} sem biografia ou oração própria.`);
  offices[String(entry.id)] = `${entry.heading}\n\nNa Liturgia das Horas, usa-se o ${entry.common}. Não se acrescentam aqui partes próprias não documentadas na fonte portuguesa disponível.\n\nNOTÍCIA HAGIOGRÁFICA\n${saint.bio.trim()}\n\nORAÇÃO\n${saint.prayer.trim()}`;
}
const orderedOffices = Object.fromEntries(Object.entries(offices).sort(([a], [b]) => Number(a) - Number(b)));
if (Object.keys(orderedOffices).length !== 30) throw new Error(`Esperados 30 Ofícios; encontrados ${Object.keys(orderedOffices).length}.`);
fs.writeFileSync(officesPath, JSON.stringify(orderedOffices, null, 2) + '\n');

// Promote all technical version markers to 4.9.17.
const replaceRequired = (path, from, to) => {
  let text = fs.readFileSync(path, 'utf8');
  if (!text.includes(from) && !text.includes(to)) throw new Error(`Marcador de versão não encontrado em ${path}: ${from}`);
  text = text.split(from).join(to);
  fs.writeFileSync(path, text);
};
replaceRequired('www/index.html', "const APP_VERSION = '4.9.16';", "const APP_VERSION = '4.9.17';");
replaceRequired('package.json', '"version": "4.9.16"', '"version": "4.9.17"');
replaceRequired('package-lock.json', '"version": "4.9.16"', '"version": "4.9.17"');
let build = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
build = build.split('4.9.16').join('4.9.17').split('40916').join('40917');
if (!build.includes('Liturgia-OSM-4.9.17.apk') || !build.includes('tag_name: v4.9.17') || !build.includes('versionCode 40917')) throw new Error('Falha ao promover workflow Android para 4.9.17.');
fs.writeFileSync('.github/workflows/build-apk.yml', build);

console.log('Patch 4.9.17 aplicado: conteúdo litúrgico, Boaventura 15/12 e versão técnica 4.9.17.');
