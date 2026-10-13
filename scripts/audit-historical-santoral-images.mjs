import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const santoral = JSON.parse(fs.readFileSync('www/data/santoral.json', 'utf8'));
const fontes = JSON.parse(fs.readFileSync('www/data/fontes-imagens-santoral-lote4.json', 'utf8'));
for (const [title, filename] of [
  ['Joaquim de Sena', 'joaquim-de-sena.webp'],
  ['Tiago Filipe de Faenza', 'tiago-filipe-de-faenza.webp'],
]) {
  const matches = santoral.filter(item => item.title === title);
  assert.equal(matches.length, 1, 'Celebração única: ' + title);
  assert.equal(matches[0].image, 'media/' + filename);
  const file = path.join('www', matches[0].image);
  const buffer = fs.readFileSync(file);
  assert.ok(buffer.length > 1000, 'Imagem não vazia: ' + file);
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', 'Cabeçalho RIFF: ' + file);
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP', 'Formato WebP: ' + file);
  const credits = fontes.filter(item => item.celebracao === title);
  assert.equal(credits.length, 1, 'Crédito único: ' + title);
  assert.equal(credits[0].arquivo, matches[0].image);
  assert.ok(credits[0].fonte?.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert.ok(credits[0].licenca?.startsWith('CC BY'));
  console.log('Imagem, referência e créditos válidos:', title);
}
