import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const data = path.join(root, 'www', 'data');
const santoral = JSON.parse(fs.readFileSync(path.join(data, 'santoral.json'), 'utf8'));
const offices = JSON.parse(fs.readFileSync(path.join(data, 'oficios-osm.json'), 'utf8'));
const today = JSON.parse(fs.readFileSync(path.join(data, 'hoje-familia-servita.json'), 'utf8'));
const norm = v => String(v ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
const dateKey = s => `${String(s.month).padStart(2,'0')}-${String(s.day).padStart(2,'0')}`;
const hourOrder = ['invitatorio','oficio_leituras','laudes','hora_media','vesperas','completas'];

const report = santoral.map((saint, id) => {
  const key = dateKey(saint);
  const master = norm(offices[String(id)]);
  const subsidiary = today[key];
  const hours = subsidiary?.material?.horas ?? {};
  const structured = hourOrder.filter(h => norm(hours[h]?.texto));
  const comparisons = structured.map(hour => {
    const text = norm(hours[hour].texto);
    const sample = text.slice(0, 160);
    return { hour, chars: text.length, sampleInMaster: sample ? master.includes(sample) : false };
  });
  return {
    id, date: key, title: saint.title,
    masterOffice: Boolean(master), masterChars: master.length,
    subsidiaryEntry: Boolean(subsidiary), structuredHours: structured,
    structuredChars: structured.reduce((n,h) => n + norm(hours[h]?.texto).length, 0),
    comparisons
  };
});

const summary = {
  sourceOfTruth: 'Liturgia OSM',
  celebrations: report.length,
  masterOffices: report.filter(r => r.masterOffice).length,
  subsidiaryStructured: report.filter(r => r.structuredHours.length).length,
  masterOnly: report.filter(r => r.masterOffice && !r.structuredHours.length).map(r => ({id:r.id,date:r.date,title:r.title})),
  candidatesForEnrichment: report.filter(r => r.masterOffice && r.comparisons.some(c => !c.sampleInMaster)).map(r => ({
    id:r.id,date:r.date,title:r.title,structuredHours:r.structuredHours,
    unmatchedHours:r.comparisons.filter(c => !c.sampleInMaster).map(c => c.hour)
  })),
  details: report
};

const out = path.join(root, 'source-comparison-4.9.21.json');
fs.writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({
  sourceOfTruth: summary.sourceOfTruth,
  celebrations: summary.celebrations,
  masterOffices: summary.masterOffices,
  subsidiaryStructured: summary.subsidiaryStructured,
  masterOnly: summary.masterOnly.length,
  candidatesForEnrichment: summary.candidatesForEnrichment.length,
  report: path.basename(out)
}, null, 2));
