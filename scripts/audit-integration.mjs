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
const norm = value => String(value ?? '').replace(/\r/g, '').trim();

// 4.9.21: Liturgia OSM é a fonte-mestra. Hoje na Família Servita é fonte subsidiária.
// A auditoria nunca exige que a base subsidiária seja mais completa que a fonte-mestra.
santoral.forEach((s, index) => {
  if (s.id !== index) errors.push(`Santoral: id ${s.id} não corresponde ao índice ${index} (${s.title}).`);
  const key = dateKey(s);
  const source = hoje[key];
  if (!source) {
    warnings.push(`Hoje na Família Servita não possui entrada em ${key}: ${s.title}.`);
    return;
  }
  if (source.id !== s.id) errors.push(`ID divergente em ${key}: Liturgia OSM=${s.id}, Hoje=${source.id}.`);
  if (norm(source.bio) && norm(source.bio) !== norm(s.bio)) warnings.push(`Biografia subsidiária difere da Liturgia OSM em ${key}: ${s.title}.`);
  if (norm(source.titulo).toLocaleLowerCase('pt-BR') !== norm(s.title).toLocaleLowerCase('pt-BR')) warnings.push(`Título subsidiário difere em ${key}: Liturgia OSM="${s.title}" / Hoje="${source.titulo}".`);
});

// Todo Ofício da fonte-mestra deve apontar para uma celebração real e conter conteúdo.
for (const key of Object.keys(oficios)) {
  const index = Number(key);
  const saint = santoral[index];
  if (!Number.isInteger(index) || !saint) {
    errors.push(`Ofício órfão na Liturgia OSM: chave ${key}.`);
    continue;
  }
  const masterOffice = norm(oficios[key]);
  if (!masterOffice) errors.push(`Ofício vazio na Liturgia OSM: ${saint.title}.`);

  // Se a base subsidiária possuir horas estruturadas, elas são comparadas para detectar material útil,
  // mas sua ausência não constitui falha: o conteúdo-mestre continua sendo oficios-osm.json.
  const hours = hoje[dateKey(saint)]?.material?.horas;
  if (hours && typeof hours === 'object') {
    const structuredTexts = Object.values(hours).map(h => norm(h?.texto)).filter(Boolean);
    if (!structuredTexts.length) warnings.push(`Hoje possui estrutura de horas vazia para ${saint.title}.`);
    for (const text of structuredTexts) {
      const sample = text.slice(0, 120);
      if (sample && !masterOffice.includes(sample)) warnings.push(`Hoje contém trecho não localizado literalmente no Ofício-mestre: ${saint.title}.`);
    }
  } else {
    warnings.push(`Fonte subsidiária sem horas estruturadas: ${saint.title}.`);
  }
}

// A interface deve conservar os pontos de entrada e a resolução de horas.
const requiredUiMarkers = ['Santoral','Hoje','Ofício próprio','calendarCelebrationRow','OFFICE_HOURS_BY_ID','officeHoursForSaint(s)'];
for (const marker of requiredUiMarkers) if (!html.includes(marker)) errors.push(`Integração UI ausente: ${marker}.`);

// Celebrações sem Ofício próprio são permitidas somente quando explicitamente conhecidas.
const withoutOffice = santoral.map((s,i) => ({s,i})).filter(({i}) => !Object.hasOwn(oficios, String(i)));
if (withoutOffice.length !== 2) errors.push(`Esperadas 2 celebrações sem Ofício próprio; encontradas ${withoutOffice.length}.`);
for (const {s,i} of withoutOffice) warnings.push(`Sem Ofício próprio: id=${i}, ${dateKey(s)}, ${s.title}.`);

// Casos protegidos contra regressões históricas.
const monte = santoral.find(s => dateKey(s) === '09-22' && s.title === 'Dedicação da Basílica de Monte Senário');
if (!monte || !Object.hasOwn(oficios, String(monte.id))) errors.push('Monte Senário 22/09 não resolve para Ofício próprio.');
const boaventura = santoral.filter(s => s.title === 'B. Boaventura de Pistoia');
if (boaventura.length !== 1 || dateKey(boaventura[0]) !== '12-15') errors.push('Boaventura de Pistoia não está exclusivamente em 15/12.');

if (errors.length) {
  console.error(['AUDITORIA DE INTEGRAÇÃO: FALHA', ...errors, ...warnings.map(w => `AVISO: ${w}`)].join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'ok',
  sourceOfTruth: 'Liturgia OSM',
  celebrations: santoral.length,
  offices: Object.keys(oficios).length,
  subsidiaryTodayEntries: Object.keys(hoje).length,
  warnings
}, null, 2));
