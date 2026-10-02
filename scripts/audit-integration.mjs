import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const www = path.join(root, 'www');
const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
const santoral = JSON.parse(fs.readFileSync(path.join(www, 'data/santoral.json'), 'utf8'));
const oficios = JSON.parse(fs.readFileSync(path.join(www, 'data/oficios-osm.json'), 'utf8'));
const hoje = JSON.parse(fs.readFileSync(path.join(www, 'data/hoje-familia-servita.json'), 'utf8'));
const errors = [];
const warnings = [];
const dateKey = s => `${String(s.month).padStart(2,'0')}-${String(s.day).padStart(2,'0')}`;

// Identidade estável: id, índice e data devem continuar coerentes.
santoral.forEach((s, index) => {
  if (s.id !== index) errors.push(`Santoral: id ${s.id} não corresponde ao índice ${index} (${s.title}).`);
  const key = dateKey(s);
  const source = hoje[key];
  if (!source) errors.push(`Hoje na Família Servita: data ${key} ausente para ${s.title}.`);
  else if ((source.bio || '').trim() !== (s.bio || '').trim()) errors.push(`Biografia divergente em ${key}: ${s.title}.`);
});

// Cada chave de Ofício precisa apontar para uma celebração real e manter identidade.
for (const key of Object.keys(oficios)) {
  const index = Number(key);
  if (!Number.isInteger(index) || !santoral[index]) errors.push(`Ofício órfão: chave ${key}.`);
}

// A interface deve conservar os quatro pontos de entrada e a resolução de horas.
const requiredUiMarkers = [
  'Calendário OSM', 'Santoral', 'Hoje', 'Ofício próprio',
  'calendarCelebrationRow', 'OFFICE_HOURS_BY_ID', 'officeHoursForSaint(s)'
];
for (const marker of requiredUiMarkers) if (!html.includes(marker)) errors.push(`Integração UI ausente: ${marker}.`);

// Evita regressão em que a UI oferece Ofício a uma celebração sem conteúdo próprio.
const withoutOffice = santoral.map((s,i) => ({s,i})).filter(({i}) => !Object.hasOwn(oficios, String(i)));
if (withoutOffice.length !== 2) errors.push(`Esperadas 2 celebrações sem Ofício; encontradas ${withoutOffice.length}.`);
for (const {s,i} of withoutOffice) warnings.push(`Sem Ofício próprio: id=${i}, ${dateKey(s)}, ${s.title}.`);

// Casos canônicos que já sofreram regressão anteriormente.
const monte = santoral.find(s => dateKey(s) === '09-22' && s.title === 'Dedicação da Basílica de Monte Senário');
if (!monte || !Object.hasOwn(oficios, String(monte.id))) errors.push('Monte Senário 22/09 não resolve para Ofício próprio.');
const boaventura = santoral.filter(s => s.title === 'B. Boaventura de Pistoia');
if (boaventura.length !== 1 || dateKey(boaventura[0]) !== '12-15') errors.push('Boaventura de Pistoia não está exclusivamente em 15/12.');

if (errors.length) {
  console.error(['AUDITORIA DE INTEGRAÇÃO: FALHA', ...errors].join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'ok',
  celebrations: santoral.length,
  offices: Object.keys(oficios).length,
  todayEntries: Object.keys(hoje).length,
  withoutOffice: warnings
}, null, 2));
