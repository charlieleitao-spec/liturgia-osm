import fs from 'node:fs';

const santoralPath = 'www/data/santoral.json';
const sourcePath = 'www/data/hoje-familia-servita.json';
const auditPath = 'scripts/audit-app.mjs';
const officesPath = 'www/data/oficios-osm.json';

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
audit = audit.replace("boaventuraPistoia[0].day !== 14", "boaventuraPistoia[0].day !== 15");
audit = audit.replace("Boaventura de Pistoia deve aparecer somente em 14 de dezembro.", "Boaventura de Pistoia deve aparecer somente em 15 de dezembro.");
if (!audit.includes("boaventuraPistoia[0].day !== 15") || !audit.includes("somente em 15 de dezembro")) throw new Error('Não foi possível atualizar a regra de auditoria de Boaventura.');
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
  if (!saint) throw new Error(`Celebração ${entry.id} não encontrada no Santoral.`);
  if (!saint.bio || !saint.prayer) throw new Error(`Celebração ${entry.id} sem biografia ou oração própria.`);
  offices[String(entry.id)] = `${entry.heading}\n\nNa Liturgia das Horas, usa-se o ${entry.common}. Não se acrescentam aqui partes próprias não documentadas na fonte portuguesa disponível.\n\nNOTÍCIA HAGIOGRÁFICA\n${saint.bio.trim()}\n\nORAÇÃO\n${saint.prayer.trim()}`;
}

const orderedOffices = Object.fromEntries(Object.entries(offices).sort(([a], [b]) => Number(a) - Number(b)));
if (Object.keys(orderedOffices).length !== 30) throw new Error(`Esperados 30 Ofícios após o acréscimo; encontrados ${Object.keys(orderedOffices).length}.`);
for (const id of [13, 21, 24, 26]) if (!orderedOffices[String(id)]) throw new Error(`Ofício ${id} ausente após o patch.`);
fs.writeFileSync(officesPath, JSON.stringify(orderedOffices, null, 2) + '\n');

console.log('Patch 4.9.17 aplicado: Boaventura em 15 de dezembro e quatro Ofícios documentados adicionados (30 no total).');
