import fs from 'node:fs';

const santoralPath = 'www/data/santoral.json';
const auditPath = 'scripts/audit-app.mjs';

const santoral = JSON.parse(fs.readFileSync(santoralPath, 'utf8'));
const boaventura = santoral.filter(item => item.title === 'B. Boaventura de Pistoia');
if (boaventura.length !== 1) throw new Error(`Esperada uma entrada de Boaventura de Pistoia; encontradas ${boaventura.length}.`);
boaventura[0].day = 15;
boaventura[0].date = '15 de dezembro';
fs.writeFileSync(santoralPath, JSON.stringify(santoral, null, 2) + '\n');

let audit = fs.readFileSync(auditPath, 'utf8');
audit = audit.replace("boaventuraPistoia[0].day !== 14", "boaventuraPistoia[0].day !== 15");
audit = audit.replace("Boaventura de Pistoia deve aparecer somente em 14 de dezembro.", "Boaventura de Pistoia deve aparecer somente em 15 de dezembro.");
if (!audit.includes("boaventuraPistoia[0].day !== 15") || !audit.includes("somente em 15 de dezembro")) throw new Error('Não foi possível atualizar a regra de auditoria de Boaventura.');
fs.writeFileSync(auditPath, audit);

console.log('Patch 4.9.17 aplicado: B. Boaventura de Pistoia em 15 de dezembro.');
