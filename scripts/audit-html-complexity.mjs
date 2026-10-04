#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync('www/index.html','utf8');
const css=readFileSync('www/app.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');
assert.equal([...html.matchAll(/<style\b/gi)].length,0,'O HTML principal não deve voltar a receber CSS inline.');
assert.equal([...html.matchAll(/<link\b[^>]*href=["']\.\/app\.css["']/gi)].length,1,'O CSS consolidado precisa ser carregado uma vez.');
assert.equal([...html.matchAll(/<script\b[^>]*src=["']\.\/app\.js["'][^>]*><\/script>/gi)].length,1,'O JS consolidado precisa ser carregado uma vez.');

const selectorCounts=new Map();
for(const match of css.matchAll(/([^{}]+)\{[^{}]*\}/g)){
  const selector=match[1].trim();
  if(!selector||selector.startsWith('@'))continue;
  for(const item of selector.split(',').map(value=>value.trim()).filter(Boolean)){
    selectorCounts.set(item,(selectorCounts.get(item)||0)+1);
  }
}
const repeated=[...selectorCounts.values()].filter(count=>count>1).length;
assert.ok(repeated<=50,`Seletores CSS repetidos aumentaram: ${repeated} (limite atual: 50).`);

const inlineScripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter(match=>match[1].trim()).length;
assert.equal(inlineScripts,0,`O HTML principal não deve conter JS inline: ${inlineScripts}.`);
console.log(JSON.stringify({status:'ok',inlineStyles:0,repeatedCssSelectors:repeated,inlineScripts,externalAppJs:true},null,2));
