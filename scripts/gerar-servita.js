#!/usr/bin/env node
// Fontes canônicas: santoral.json, oficios-osm.json e memoria-liturgica.json (schema v2).
const fs = require('fs');
const path = require('path');

const santoral = JSON.parse(fs.readFileSync('www/data/santoral.json', 'utf8'));
const oficios = JSON.parse(fs.readFileSync('www/data/oficios-osm.json', 'utf8'));
const memoria = JSON.parse(fs.readFileSync('www/data/memoria-liturgica.json', 'utf8'));

if (memoria.schema_version !== 2 ||
    !memoria.common || typeof memoria.common !== 'object' ||
    !Array.isArray(memoria.celebrations) ||
    !Array.isArray(memoria.memory_dates) ||
    !memoria.editorial_notes || typeof memoria.editorial_notes !== 'object') {
  throw new Error('memoria-liturgica.json fora do schema canônico v2');
}
for (const campo of ['hino', 'antifona', 'salmo']) {
  if (typeof memoria.common[campo] !== 'string' || !memoria.common[campo].trim()) {
    throw new Error('Campo comum ausente em memoria-liturgica.json: ' + campo);
  }
}

const memoriasPorData = new Map(memoria.celebrations.map(item => [item.date, item]));
const datasMemoria = new Set(memoria.memory_dates);
if (datasMemoria.size !== memoria.memory_dates.length) {
  throw new Error('memory_dates contém datas duplicadas');
}
if ([...memoriasPorData.keys()].some(date => !datasMemoria.has(date))) {
  throw new Error('Celebração específica ausente em memory_dates');
}
if (oficios.schema_version !== 3 || !oficios.celebracoes) {
  throw new Error('oficios-osm.json fora do schema canônico v3');
}

const outPath = process.argv[2] || 'derived/servita.json';
const result = {};
const keyOf = s => String(s.month).padStart(2, '0') + '-' + String(s.day).padStart(2, '0');
const santoralPorData = new Map(santoral.map(item => [keyOf(item), item]));

for (const date of datasMemoria) {
  if (!santoralPorData.has(date)) throw new Error('Data de memória sem entrada no santoral: ' + date);
}

for (const s of santoral) {
  const key = keyOf(s);
  const lit = oficios.celebracoes[key];
  if (!lit) throw new Error('Material canônico ausente para ' + key + ' ' + s.title);
  if (Number(lit.id) !== Number(s.id)) throw new Error('ID divergente em ' + key);

  const detalheMemoria = memoriasPorData.get(key) || {};
  const breveVida = detalheMemoria.breve_vida || s.bio || '';
  const apresentacao = detalheMemoria.apresentacao || '';
  const memoriaLiturgica = datasMemoria.has(key) ? {
    date: key,
    source_date: s.date,
    title: s.name,
    breve_vida: breveVida,
    ...(apresentacao ? { apresentacao } : {}),
    oracao_propria: s.prayer || '',
    source: memoria.source || '',
    fontes: {
      biografia: detalheMemoria.breve_vida
        ? 'Livro de Oração dos Servos de Maria, 3ª edição revisada, seção Memória Litúrgica'
        : 'Santoral do app Liturgia OSM (santoral.json)',
      ...(apresentacao ? {
        apresentacao: 'Livro de Oração dos Servos de Maria, 3ª edição revisada, seção Memória Litúrgica'
      } : {}),
      oracao: 'Santoral do app Liturgia OSM (santoral.json)'
    },
    common: memoria.common,
    editorial_note: memoria.editorial_notes[key] || null
  } : null;

  result[key] = {
    id: s.id,
    data: s.date,
    titulo: s.title,
    nome_original: s.name,
    bio: s.bio || '',
    ...(/^Servo de Deus\b/i.test(s.title || '') && s.prayer ? { oracao_causa: s.prayer } : {}),
    tipo_material: lit.tipo_material,
    material: lit.material || {},
    memoria_liturgica: memoriaLiturgica
  };
}

const extra = Object.keys(oficios.celebracoes).filter(k => !result[k]);
if (extra.length) throw new Error('Datas litúrgicas sem entrada no santoral: ' + extra.join(', '));
if (result['12-14']) throw new Error('Data antiga de Boaventura (14/12) detectada');
if (Object.values(result).filter(item => item.memoria_liturgica).length !== datasMemoria.size) {
  throw new Error('Memórias litúrgicas derivadas não correspondem a memory_dates');
}
for (const date of datasMemoria) {
  const item = result[date]?.memoria_liturgica;
  if (!item || !item.date || (!item.breve_vida && !item.apresentacao) || !item.oracao_propria) {
    throw new Error('Memória litúrgica incompleta em ' + date);
  }
}
if (!result['12-15']) throw new Error('Boaventura (15/12) ausente');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
console.log('Base derivada gerada integralmente das fontes mestras:', Object.keys(result).length, 'celebrações; memórias:', datasMemoria.size);
