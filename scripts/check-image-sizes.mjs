import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = 'www/media';
const maxBytes = 256 * 1024;
const extensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const failures = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) {
      const bytes = (await stat(file)).size;
      if (bytes > maxBytes) failures.push(`${file}: ${bytes} bytes (limit ${maxBytes})`);
    }
  }
}

await walk(root);
if (failures.length) {
  console.error('Imagens acima do limite de 256 KiB:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Tamanho das imagens dentro do limite de 256 KiB.');
