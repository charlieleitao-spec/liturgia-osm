// Verificação estrutural sem modificar os textos litúrgicos.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const prayers=JSON.parse(readFileSync('www/data/devocoes/oracoes-varias.json','utf8'));
const app=readFileSync('www/app.js','utf8');
const servite=readFileSync('www/servite-3.js','utf8');
const byTitle=Object.fromEntries(prayers.map(p=>[p.title,p.text]));
for(const title of ['Bênção da refeição','Pelas vocações','Pelas missões','Pelos doentes','Pelos defuntos']){
  assert.equal(typeof byTitle[title],'string',title);
  assert.ok(byTitle[title].trim().length>0,title);
}
const defuntos=byTitle['Pelos defuntos'];
assert.match(defuntos,/^Antífona$/m);
assert.match(defuntos,/^Salmo 129$/m);
assert.match(defuntos,/^Oração \[reza-se uma das seguintes orações\]$/m);
for(const numeral of ['I','II','III']) assert.match(defuntos,new RegExp('^\\s*'+numeral+'\\.\\s+','m'));
for(const numeral of ['I','II']) assert.match(byTitle['Pelas vocações'],new RegExp('^\\s*'+numeral+'\\.\\s+','m'));
assert.match(app,/const varias = options\.varias === true/);
assert.match(app,/const formula = varias && line\.match/);
assert.match(servite,/const varias=\/\^varias/);
assert.match(servite,/ANTÍFONA\|HINO/);
assert.match(servite,/const formula=varias && line\.match/);
console.log('PASS: cinco orações, fórmulas, antífona, salmo e reconhecimento nos dois leitores.');
