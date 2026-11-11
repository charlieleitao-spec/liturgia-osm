// Testes adicionais de integridade das Orações Várias.
// Não modifica nem normaliza a fonte canônica. Executar: node scripts/verify-various-prayers-invariants.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const prayers = JSON.parse(readFileSync('www/data/devocoes/oracoes-varias.json', 'utf8'));
const app = readFileSync('www/app.js', 'utf8');
const servite = readFileSync('www/servite-3.js', 'utf8');
const expected = ['Bênção da refeição', 'Pelas vocações', 'Pelas missões', 'Pelos doentes', 'Pelos defuntos'];
assert.equal(new Set(prayers.map(p => p.title)).size, prayers.length, 'Títulos duplicados');
for (const title of expected) {
  const matches = prayers.filter(p => p.title === title);
  assert.equal(matches.length, 1, 'Oração ausente ou duplicada: ' + title);
  assert.ok(matches[0].text.trim(), 'Texto vazio: ' + title);
}
const text = title => prayers.find(p => p.title === title).text;
const formulas = title => [...text(title).matchAll(/^\s*(I|II|III)\.\s+\S/gm)].map(m => m[1]);
assert.deepEqual(formulas('Pelas vocações'), ['I', 'II']);
assert.deepEqual(formulas('Pelos defuntos'), ['I', 'II', 'III']);
const defuntos = text('Pelos defuntos');
for (const marker of ['Antífona', 'Salmo 129', 'Oração [reza-se uma das seguintes orações]']) {
  assert.equal(defuntos.split('\n').filter(l => l.trim() === marker).length, 1, 'Rubrica ausente ou repetida: ' + marker);
}
assert.ok(defuntos.indexOf('Antífona') < defuntos.indexOf('Salmo 129'));
assert.ok(defuntos.indexOf('Salmo 129') < defuntos.indexOf('Oração [reza-se uma das seguintes orações]'));
assert.equal((defuntos.match(/^\s*-\s/gm) || []).length, 9, 'Revisar contagem de linhas iniciadas por hífen no Salmo 129');
assert.equal((text('Bênção da refeição').match(/^(?:Comum|Nas festas marianas|Nas visitas de familiares e amigos|Nos momentos de alegria)$/gm) || []).length, 4);
for (const [name, code] of [['principal', app], ['servita', servite]]) {
  assert.match(code, /const formula\s*=\s*varias\s*&&\s*line\.match\(\/\^\(I\|II\|III\)/, 'Separação de fórmulas no leitor ' + name);
  assert.match(code, /reza-se uma das seguintes orações/, 'Rubrica das fórmulas no leitor ' + name);
}
console.log('PASS: cinco textos únicos, fórmulas, rubricas, sequência e presença de regras nos dois leitores.');
console.log('NOTA: não substitui comparação do HTML renderizado nem teste visual no Samsung A56.');
