import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const santoralPath = path.join(root, 'www/data/santoral.json');
const officesPath = path.join(root, 'www/data/oficios-osm.json');

const santoral = JSON.parse(fs.readFileSync(santoralPath, 'utf8'));
const offices = JSON.parse(fs.readFileSync(officesPath, 'utf8'));
const cleaned = santoral.filter(item => !(item.day === 15 && item.month === 12 && item.title === 'B. Boaventura de Pistoia'));

cleaned.forEach((item, index) => { item.id = index; });
if (offices['32']) {
  offices['31'] = offices['32'];
  delete offices['32'];
}

fs.writeFileSync(santoralPath, JSON.stringify(cleaned));
fs.writeFileSync(officesPath, JSON.stringify(offices));
