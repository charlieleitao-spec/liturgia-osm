import fs from 'node:fs';

const indexPath = 'www/index.html';
let html = fs.readFileSync(indexPath, 'utf8');

const oldOpen = `function openServite(view){
  currentServiteView=view||'completo';
  const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');
  document.getElementById('serviteTitle').textContent=serviteNames[currentServiteView]||'Recursos OSM';
  fr.src=serviteUrl(currentServiteView);
  ov.classList.add('open');ov.setAttribute('aria-hidden','false');document.body.classList.add('servite-open');
}`;
const newOpen = `function openServite(view){
  currentServiteView=view||'completo';
  const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');
  document.getElementById('serviteTitle').textContent=serviteNames[currentServiteView]||'Recursos OSM';
  fr.src=serviteUrl(currentServiteView);
  ov.classList.add('open');ov.setAttribute('aria-hidden','false');document.body.classList.add('servite-open');
  if(!history.state?.serviteOverlay) history.pushState({...history.state,serviteOverlay:true},'');
}`;
if (!html.includes(oldOpen)) throw new Error('openServite esperado não encontrado; patch abortado.');
html = html.replace(oldOpen, newOpen);

const oldClose = `function closeServite(){const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');ov.classList.remove('open');ov.setAttribute('aria-hidden','true');document.body.classList.remove('servite-open');fr.src='about:blank';}`;
const newClose = `function closeServite(fromHistory=false){const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');const wasOpen=ov?.classList.contains('open');ov.classList.remove('open');ov.setAttribute('aria-hidden','true');document.body.classList.remove('servite-open');fr.src='about:blank';if(wasOpen&&!fromHistory&&history.state?.serviteOverlay)history.back();}`;
if (!html.includes(oldClose)) throw new Error('closeServite esperado não encontrado; patch abortado.');
html = html.replace(oldClose, newClose);

const oldPop = `window.addEventListener('popstate',()=>{if(document.getElementById('serviteOverlay')?.classList.contains('open'))closeServite();});`;
const newPop = `window.addEventListener('popstate',()=>{if(document.getElementById('serviteOverlay')?.classList.contains('open'))closeServite(true);});`;
if (!html.includes(oldPop)) throw new Error('listener popstate esperado não encontrado; patch abortado.');
html = html.replace(oldPop, newPop);

fs.writeFileSync(indexPath, html);
console.log('Patch 4.9.18 de navegação preparado: overlay ganha estado próprio no histórico e Voltar fecha somente o overlay.');
