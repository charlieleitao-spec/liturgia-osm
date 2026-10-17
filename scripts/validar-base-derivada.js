#!/usr/bin/env node
// Confere a base derivada contra as fontes mestras, sem fixar o tamanho do santoral.
const fs = require('node:fs');
const assert = require('node:assert/strict');

function validateDerived(santoral, memoria, derived) {
  assert.ok(Array.isArray(santoral) && santoral.length > 0, 'Santoral vazio ou inválido');
  assert.ok(memoria && Array.isArray(memoria.memory_dates), 'Datas da memória ausentes');
  assert.ok(derived && typeof derived === 'object' && !Array.isArray(derived), 'Base derivada inválida');
  const dates = new Set();
  const ids = new Set();
  const memoryDates = new Set(memoria.memory_dates);
  assert.equal(memoryDates.size, memoria.memory_dates.length, 'Datas de memória duplicadas');
  const types = new Set(['oficio_proprio', 'textos_proprios', 'sem_material_proprio']);
  for (const item of santoral) {
    assert.ok(item && Number.isInteger(item.month) && Number.isInteger(item.day), 'Data incompleta no santoral');
    const date = new Date(Date.UTC(2000, item.month - 1, item.day));
    assert.ok(date.getUTCMonth() === item.month - 1 && date.getUTCDate() === item.day, 'Data inexistente no santoral');
    const key = String(item.month).padStart(2, '0') + '-' + String(item.day).padStart(2, '0');
    assert.ok(!dates.has(key), 'Data duplicada no santoral: ' + key);
    assert.ok(item.id != null && !ids.has(String(item.id)), 'ID ausente ou duplicado no santoral: ' + key);
    dates.add(key);
    ids.add(String(item.id));
    const out = derived[key];
    assert.ok(out, 'Celebração ausente na base derivada: ' + key);
    for (const [field, value] of Object.entries({
      id: item.id, data: item.date, titulo: item.title, nome_original: item.name,
      bio: item.bio || '', categoria: item.categoria || undefined, genero: item.genero || undefined,
      grau: item.grau || undefined, rank: item.rank || undefined
    })) {
      assert.deepEqual(out[field], value, 'Campo divergente em ' + key + ': ' + field);
    }
    assert.ok(types.has(out.tipo_material), 'Material inválido: ' + key);
    if (memoryDates.has(key)) {
      const m = out.memoria_liturgica;
      assert.ok(m && m.date === key && (m.breve_vida || m.apresentacao) && m.oracao_propria,
        'Memória incompleta: ' + key);
      assert.equal(m.oracao_propria, item.prayer || '', 'Oração divergente: ' + key);
    } else {
      assert.ok(!out.memoria_liturgica, 'Memória fora da fonte canônica: ' + key);
    }
  }
  assert.deepEqual(Object.keys(derived).sort(), [...dates].sort(), 'Datas derivadas não correspondem ao santoral');
  for (const key of memoryDates) assert.ok(dates.has(key), 'Memória sem entrada no santoral: ' + key);
  assert.ok(!derived['12-14'] && derived['12-15'], 'Calendário de Boaventura inválido');
  return { celebrations: dates.size, memories: memoryDates.size };
}
if (require.main === module) {
  const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = validateDerived(
    read('www/data/santoral.json'),
    read('www/data/memoria-liturgica.json'),
    read(process.argv[2] || 'derived/servita.generated.json')
  );
  console.log('Base conferida com as fontes:', result.celebrations, 'celebrações;', result.memories, 'memórias.');
}
module.exports = { validateDerived };
