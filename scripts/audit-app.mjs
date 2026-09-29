import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const www = path.join(root, 'www');
const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(www, 'sw.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(www, 'manifest.webmanifest'), 'utf8'));
const required = ['index.html', 'servite.html', 'data/santoral.json', 'data/oficios-osm.json', 'data/hoje-familia-servita.json', 'sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const errors = [];

for (const marker of ['OFFICE_HOURS_BY_ID', 'officeHoursForSaint(s)', 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis']) {
  if (!html.includes(marker)) errors.push(`Correção de coerência entre hora e conteúdo ausente: ${marker}`);
}
for (const file of required) {
  if (!fs.existsSync(path.join(www, file)) || fs.statSync(path.join(www, file)).size === 0) errors.push(`Arquivo ausente ou vazio: ${file}`);
}
for (const marker of ['Calendário OSM', 'Santoral', 'Orações', 'Modo celebração', 'conteúdo disponível offline', 'Missa do dia', 'Fonte online com cópia offline', 'servite.html', 'calendarCelebrationRow', 'Ofício próprio', 'Sem Ofício próprio', 'canonicalSantoral495', "fetch('./data/santoral.json'"]) {
  if (!html.includes(marker)) errors.push(`Recurso não encontrado: ${marker}`);
}
for (const file of required) {
  if (file !== 'sw.js' && !sw.includes(`./${file}`) && file !== 'index.html') errors.push(`Arquivo não incluído no cache: ${file}`);
}
if (!sw.includes('./index.html')) errors.push('index.html não incluído no cache offline.');
if (manifest.start_url !== './' || manifest.display !== 'standalone') errors.push('Manifesto PWA incompleto.');
if (html.includes('�')) errors.push('Foi encontrado caractere de substituição no conteúdo.');

const serviteHtml = fs.readFileSync(path.join(www, 'servite.html'), 'utf8');
for (const forbidden of ['hymnLines % 4', 'isPsalmVerse', 'psalmMarked']) {
  if (serviteHtml.includes(forbidden)) errors.push(`Reconstrução artificial de estrofes detectada: ${forbidden}`);
}
if (!serviteHtml.includes('id="leitorServitaCanonico4912"')) errors.push('Leitor canônico do Hoje na Família Servita ausente.');
for (const marker of ['renderLiturgicalHourContent', 'today-servita-reader', "add(line,'antiphon')", "add(line,'psalm-title')", "'preces-intention'"]) {
  if (!serviteHtml.includes(marker)) errors.push(`Renderização semântica incompleta: ${marker}`);
}
if (!serviteHtml.includes('renderLiturgicalHourContent(txt)')) errors.push('Os ofícios ainda não usam o renderizador semântico.');
if (!serviteHtml.includes('return root.outerHTML;')) errors.push('O invólucro visual do leitor está sendo descartado.');
if (!serviteHtml.includes('function addPrecesLine(line)')) errors.push('Separação semântica das intenções das preces ausente.');
if (serviteHtml.includes('|Como no|')) errors.push('Versos iniciados por “como no” ainda podem ser classificados como rubrica.');
if (!serviteHtml.includes("if(!splitReadingLine(rest)) add(rest, 'reading-body')")) errors.push('Leitura breve ainda não separa referência e corpo.');
for (const marker of ['[data-theme="dark"] .today-servita-reader .antiphon', 'overflow-x:clip!important', 'touch-action:pan-y', 'contain:inline-size', 'white-space:normal!important']) {
  if (!serviteHtml.includes(marker)) errors.push(`Ajuste visual 4.9.12 ausente: ${marker}`);
}
for (const legacyStyle of ['invitatorioEvidente475', 'invitatorioRefinado476', 'oficioLeituras477', 'laudes480', 'horaMedia482', 'vesperas483']) {
  if (!serviteHtml.includes(`id="${legacyStyle}" media="not all"`)) errors.push(`Estilo legado ainda ativo: ${legacyStyle}`);
}
if (!serviteHtml.includes('*, †, hífens e outros sinais litúrgicos nunca são usados')) errors.push('Garantia de preservação das quebras do texto-fonte ausente.');
const scripts = [html, serviteHtml].flatMap(source => [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean));
scripts.forEach((script, index) => {
  try { new Function(script); } catch (error) { errors.push(`Erro de sintaxe no script ${index + 1}: ${error.message}`); }
});

const santoral = JSON.parse(fs.readFileSync(path.join(www, 'data/santoral.json'), 'utf8'));
const oficios = JSON.parse(fs.readFileSync(path.join(www, 'data/oficios-osm.json'), 'utf8'));
const hojeFamiliaServita = JSON.parse(fs.readFileSync(path.join(www, 'data/hoje-familia-servita.json'), 'utf8'));
const sourceOffices = Object.values(hojeFamiliaServita).filter(item => item?.material?.horas);
if (sourceOffices.length !== 18) errors.push(`Base Hoje na Família Servita inesperada: ${sourceOffices.length} ofícios completos.`);
for (const saint of santoral) {
  const dateKey = `${String(saint.month).padStart(2, '0')}-${String(saint.day).padStart(2, '0')}`;
  const sourceBio = hojeFamiliaServita[dateKey]?.bio?.trim();
  if (!sourceBio || saint.bio !== sourceBio) errors.push(`Introdução divergente da base Hoje na Família Servita: ${dateKey}.`);
}
for (const key of Object.keys(oficios)) if (!santoral[Number(key)]) errors.push(`Ofício sem celebração correspondente: ${key}`);
const celebrationsWithoutOffice = santoral.map((_, index) => index).filter(index => !Object.hasOwn(oficios, String(index)));
if (santoral.length !== 32 || Object.keys(oficios).length !== 26) errors.push(`Contagem inesperada: ${santoral.length} celebrações e ${Object.keys(oficios).length} ofícios.`);
if (celebrationsWithoutOffice.join(',') !== '5,13,17,21,24,26') errors.push(`Relação Santoral/Ofícios alterada: índices sem ofício ${celebrationsWithoutOffice.join(',')}.`);
const monteSenario = santoral.find(item => item.day === 22 && item.month === 9 && item.title === 'Dedicação da Basílica de Monte Senário');
if (!monteSenario || !Object.hasOwn(oficios, String(santoral.indexOf(monteSenario)))) errors.push('A celebração e o Ofício de Monte Senário não estão associados a 22 de setembro.');
const boaventuraPistoia = santoral.filter(item => item.title === 'B. Boaventura de Pistoia');
if (boaventuraPistoia.length !== 1 || boaventuraPistoia[0].day !== 14 || boaventuraPistoia[0].month !== 12) errors.push('Boaventura de Pistoia deve aparecer somente em 14 de dezembro.');
const generated = fs.readdirSync(www, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile()).map(entry => path.join(entry.parentPath || entry.path, entry.name));
for (const file of generated) {
  const size = fs.statSync(file).size;
  if (size > 2 * 1024 * 1024) errors.push(`Arquivo excede 2 MB: ${path.relative(www, file)} (${size} bytes)`);
  if (/\.(?:html|js|css)$/i.test(file)) {
    const text = fs.readFileSync(file, 'utf8');
    if (/base64,[A-Za-z0-9+/=]{65536,}/.test(text) || /[A-Za-z0-9+/=]{65536,}/.test(text)) errors.push(`Base64 grande incorporado em ${path.relative(www, file)}`);
  }
}
if (html.includes('SERVITE_DOC_B64') || html.includes('srcdoc=')) errors.push('Documento Servita voltou a ser incorporado no index.html.');

const external = [...new Set([...html.matchAll(/https?:\/\/[^"'\s<]+/g)].map(match => match[0]))];
const allowedExternal = external.filter(url => /youtube\.com|instagram\.com|liturgia\.up\.railway\.app/.test(url));
if (external.length !== allowedExternal.length) errors.push(`Dependências externas inesperadas: ${external.filter(url => !allowedExternal.includes(url)).join(', ')}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'ok', version: '4.9.15', cachedFiles: required.length, externalLinks: allowedExternal.length, scripts: scripts.length, indexBytes: fs.statSync(path.join(www, 'index.html')).size, serviteBytes: fs.statSync(path.join(www, 'servite.html')).size, santoralEntries: santoral.length, officeEntries: Object.keys(oficios).length }, null, 2));
