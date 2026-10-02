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
const hourOrder = ['invitatorio','oficio_leituras','laudes','hora_media','vesperas','completas'];
const hourHeadings = {
  invitatorio: 'Invitatório', oficio_leituras: 'Ofício das Leituras', laudes: 'Laudes',
  hora_media: 'Hora Média', vesperas: 'Vésperas', completas: 'Completas'
};

// Identidade estável: id, índice e data devem continuar coerentes.
santoral.forEach((s, index) => {
  if (s.id !== index) errors.push(`Santoral: id ${s.id} não corresponde ao índice ${index} (${s.title}).`);
  const key = dateKey(s);
  const source = hoje[key];
  if (!source) {
    errors.push(`Hoje na Família Servita: data ${key} ausente para ${s.title}.`);
    return;
  }
  if (source.id !== s.id) errors.push(`ID divergente em ${key}: Santoral=${s.id}, Hoje=${source.id}.`);
  if (norm(source.bio) !== norm(s.bio)) errors.push(`Biografia divergente em ${key}: ${s.title}.`);
  if (norm(source.titulo).toLocaleLowerCase('pt-BR') !== norm(s.title).toLocaleLowerCase('pt-BR')) {
    warnings.push(`Título com forma diferente em ${key}: Santoral="${s.title}" / Hoje="${source.titulo}".`);
  }
});

// Cada chave de Ofício precisa apontar para uma celebração real e manter identidade.
for (const key of Object.keys(oficios)) {
  const index = Number(key);
  const saint = santoral[index];
  if (!Number.isInteger(index) || !saint) {
    errors.push(`Ofício órfão: chave ${key}.`);
    continue;
  }
  const source = hoje[dateKey(saint)];
  const hours = source?.material?.horas;
  if (!hours || typeof hours !== 'object') {
    errors.push(`Ofício ${key} (${saint.title}) não possui material.horas na base Hoje.`);
    continue;
  }
  const availableHours = hourOrder.filter(hour => norm(hours[hour]?.texto));
  if (!availableHours.length) errors.push(`Ofício ${key} (${saint.title}) não possui nenhuma hora com texto.`);
  const flattened = availableHours.map(hour => `${hourHeadings[hour]}\n${norm(hours[hour].texto)}`).join('\n\n');
  const legacy = norm(oficios[key]);
  // A base legada deve conter o conteúdo de cada hora estruturada; diferenças de espaçamento são toleradas.
  for (const hour of availableHours) {
    const sample = norm(hours[hour].texto).slice(0, 120);
    if (sample && !legacy.includes(sample)) errors.push(`Conteúdo da hora ${hour} não coincide com oficios-osm para ${saint.title}.`);
  }
  if (legacy.length < flattened.length * 0.8) warnings.push(`Ofício legado parece mais curto que a base estruturada: ${saint.title}.`);
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
for (const {s,i} of withoutOffice) {
  const source = hoje[dateKey(s)];
  if (source?.material?.horas && Object.keys(source.material.horas).length) errors.push(`Celebração marcada sem Ofício possui horas estruturadas: ${s.title}.`);
  warnings.push(`Sem Ofício próprio: id=${i}, ${dateKey(s)}, ${s.title}.`);
}

// Casos canônicos que já sofreram regressão anteriormente.
const monte = santoral.find(s => dateKey(s) === '09-22' && s.title === 'Dedicação da Basílica de Monte Senário');
if (!monte || !Object.hasOwn(oficios, String(monte.id))) errors.push('Monte Senário 22/09 não resolve para Ofício próprio.');
const boaventura = santoral.filter(s => s.title === 'B. Boaventura de Pistoia');
if (boaventura.length !== 1 || dateKey(boaventura[0]) !== '12-15') errors.push('Boaventura de Pistoia não está exclusivamente em 15/12.');

if (errors.length) {
  console.error(['AUDITORIA DE INTEGRAÇÃO: FALHA', ...errors, ...warnings.map(w => `AVISO: ${w}`)].join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'ok', celebrations: santoral.length, offices: Object.keys(oficios).length,
  todayEntries: Object.keys(hoje).length, warnings
}, null, 2));
