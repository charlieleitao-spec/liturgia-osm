import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const removed = ['cordova.js', 'cordova_plugins.js', 'ALTERACOES-SIMPLIFICACAO.md',
  'data/pdfs/biblioteca/README.md', 'media/EMBLEMA-FONTE.txt', 'media/benincasa-montepulciano-CREDITOS.md'];
const roots = ['www'];
if (process.argv.includes('--android')) roots.push('android/app/src/main/assets/public');
for (const root of roots) {
  assert.ok(fs.existsSync(root), 'Missing assets: '+root);
  for (const name of removed) assert.ok(!fs.existsSync(path.join(root, name)), 'Removed asset returned: '+root+'/'+name);
  assert.ok(fs.existsSync(path.join(root, 'media/fonts/OFL-LICENSES.txt')), 'Font license missing');
  for (const entry of fs.readdirSync(root, {recursive:true})) {
    if (!/\.(html|js|json|css)$/.test(entry)) continue;
    const content = fs.readFileSync(path.join(root, entry), 'utf8');
    for (const name of removed) assert.ok(!content.includes(name), 'Reference to removed asset: '+entry+' → '+name);
  }
}
console.log('Cleanup gate: removed assets/references absent; font license preserved: '+roots.join(', '));
