import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'www/index.html'), 'utf8');
const nav = html.match(/<nav class="tabbar" id="tabbar"[\s\S]*?<\/nav>/)?.[0] || '';
const tabIds = [...nav.matchAll(/data-tab="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(tabIds, ['vida', 'liturgia', 'oracoes'], 'A barra principal deve ter exatamente Vida, Liturgia e Oração.');

const controller = html.match(/<script id="canonicalPrimaryNavigation4922">([\s\S]*?)<\/script>/)?.[1] || '';
assert.ok(controller, 'O controlador canônico de navegação deve executar depois das camadas antigas.');
for (const route of ['viewVida()', 'viewLiturgia()', 'viewOracoes()', 'viewMemoriaLiturgica()', 'viewOracoesBase480()']) {
  assert.ok(controller.includes(route), 'Rota ausente no controlador: ' + route);
}
assert.match(controller, /button\.dataset\.tab===activeTab/, 'O estado ativo deve seguir o destino da aba.');
assert.match(controller, /selected\[button\.dataset\.tab\]/, 'A tradução não pode restaurar os rótulos antigos.');
assert.equal(JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version, '4.9.22');
console.log('Auditoria da navegação canônica aprovada: Vida, Liturgia e Oração.');
