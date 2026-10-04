import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'www/index.html'),'utf8');
const version=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version;
assert.equal(version,'4.9.31','A experiência de navegação deve ter versão própria.');

const nav=html.match(/<nav class="tabbar" id="tabbar"[\s\S]*?<\/nav>/)?.[0]||'';
const tabIds=[...nav.matchAll(/data-tab="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(tabIds,['vida','liturgia','oracoes'],'O rodapé deve ter Vida, Liturgia e Oração, nessa ordem.');
for(const name of ['viewHoje','setTab','render']){
  const expression=new RegExp('(?:function\\s+'+name+'\\s*\\(|'+name+'\\s*=\\s*function\\s*\\()','g');
  assert.equal([...html.matchAll(expression)].length,1,name+' deve ter uma única implementação.');
}
for(const obsolete of ['canonicalSaintNavigation4925','canonicalPrimaryNavigation4923','canonicalUsability4923']) assert.ok(!html.includes(obsolete),'A camada antiga deve ser removida: '+obsolete);
assert.doesNotMatch(html,/const\s+SANTORAL\s*=\s*\[/,'O Santoral não pode ser embutido em uma cópia antiga no HTML.');
assert.match(html,/let SANTORAL\s*=\s*\[\]/,'A lista começa vazia e aguarda o JSON canônico.');
assert.ok(html.includes("typeof item.title!=='string'")&&html.includes("typeof item.bio!=='string'"),'O loader deve validar os campos do schema do Santoral.');
assert.ok(!/canonical\.length\s*<\s*32/.test(html),'A carga não pode usar um limite de quantidade como validação de schema.');
assert.equal([...html.matchAll(/function\s+openDevo\s*\(/g)].length,1,'openDevo deve ter uma única implementação.');
const staticIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(staticIds).size,staticIds.length,'IDs HTML devem ser únicos.');
assert.ok(!html.includes('duplicateNavigation'),'O menu não deve remover sua seção Navegação depois de montá-la.');
assert.ok(html.includes('menu-label\">Navegação</div><div class=\"menu-nav-grid\"'),'A seção Navegação do menu precisa permanecer no HTML gerado.');

const hubScript=html.match(/<script id="canonicalNavigation4926">([\s\S]*?)<\/script>/)?.[1]||'';
assert.ok(hubScript,'O controlador central de navegação deve estar presente.');
for(const route of ['renderCelebrationHub','openSaintSection','openDailyLiturgy','openSantoralOfficeHour','shareSaint','smartBack']) assert.ok(html.includes(route),'Destino sem ligação: '+route);
for(const id of ['hub-vida','hub-liturgia','hub-oracao','hub-navegacao']) assert.ok(hubScript.includes(id),'Bloco do Santo ausente: '+id);
assert.match(html,/id="floatingBack"[^>]*onclick="smartBack\(\)"/,'O botão de retorno geral deve estar ligado.');
assert.ok(html.includes('Voltar ao Santoral'),'O hub deve oferecer retorno visível.');
assert.ok(html.includes("openSaintSection('+celebration._id+"),'Hoje deve oferecer atalhos para os blocos do Santo.');
assert.ok(html.includes("setTab(\\'calendario\\')")&&html.includes("setTab(\\'santoral\\')"),'Calendário e Santoral devem continuar acessíveis pela Vida.');

const prayerView=html.slice(html.indexOf('function viewOracoesBase480()'),html.indexOf('let dailyPrayerOpen480'));
assert.ok(!prayerView.includes('Memória Litúrgica'),'Oração deve conter práticas; a Memória fica no Santo.');
for(const practice of ['Rosário','Regra OSSM','Coroa de Nossa Senhora das Dores','Via Matris']) assert.ok(html.includes(practice),'Prática devocional ausente: '+practice);

const santoral=JSON.parse(readFileSync(resolve(root,'www/data/santoral.json'),'utf8'));
const offices=JSON.parse(readFileSync(resolve(root,'www/data/oficios-osm.json'),'utf8'));
const memory=JSON.parse(readFileSync(resolve(root,'www/data/memoria-liturgica.json'),'utf8'));
const masses=JSON.parse(readFileSync(resolve(root,'www/data/missas-osm.json'),'utf8'));
assert.equal(santoral.length,32);
const santoralLoader=html.match(/<script id="canonicalSantoral495">([\s\S]*?)<\/script>/)?.[1]||'';
assert.ok(santoralLoader,'O loader do Santoral canônico deve estar presente.');
const loaderContext={SANTORAL:[],santoralReady:false,santoralLoading:true,santoralLoadError:false,window:{},render(){},console:{warn(){}},loadCanonicalOffices:async function(){this.oficiosReady=true;},fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve(santoral);}});}};
vm.runInNewContext(santoralLoader,loaderContext);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(loaderContext.santoralReady,true,'O loader deve aceitar o schema canônico.');
assert.equal(loaderContext.SANTORAL.length,32);
assert.equal(loaderContext.SANTORAL.find(item=>item.title==='B. Boaventura de Pistoia')?.date,'15 de dezembro','O loader deve usar a data corrigida do JSON canônico.');
const invalidLoaderContext={SANTORAL:[],santoralReady:false,santoralLoading:true,santoralLoadError:false,window:{},render(){},console:{warn(){}},loadCanonicalOffices:async function(){},fetch(){return Promise.resolve({ok:true,json(){return Promise.resolve({});}});}};
vm.runInNewContext(santoralLoader,invalidLoaderContext);
await new Promise(resolve=>setImmediate(resolve));
assert.equal(invalidLoaderContext.santoralReady,false,'Dados inválidos não podem marcar o Santoral como carregado.');
assert.equal(invalidLoaderContext.santoralLoadError,true,'Dados inválidos devem produzir estado de erro explícito.');
const coverage=Object.values(offices.celebracoes).reduce((result,item)=>{result[item.tipo_material]=(result[item.tipo_material]||0)+1;return result;},{});
assert.deepEqual(coverage,{oficio_proprio:11,textos_proprios:16,sem_material_proprio:5},'A classificação canônica deve refletir a cobertura efetiva dos textos.');
assert.equal(memory.memory_dates.length,25,'A cobertura da Memória Litúrgica deve permanecer em 25 celebrações.');
assert.equal(memory.celebrations.length,10,'A Memória deve guardar apenas textos próprios distintos do Santoral.');
const memoryLoader=html.match(/<script id="canonicalMemoriaLiturgica">([\s\S]*?)<\/script>/)?.[1]||'';
assert.ok(memoryLoader.includes('source.schema_version!==2')&&memoryLoader.includes('source.memory_dates.length!==25'),'O loader deve validar a cobertura compacta da Memória.');
assert.ok(!html.includes('SANTORAL_OFFICE_MAP')&&!html.includes('OFFICE_CLASSIFICATION')&&!html.includes('OFFICE_HOURS_BY_ID'),'Não deve haver mapas de Ofício embutidos.');
const officeFns=html.slice(html.indexOf('function officeDateKey'),html.indexOf('function calendarCelebrationRow'));
let openedOffice=null;
const officeContext={SANTORAL:santoral.map(x=>({...x,_id:x.id})),OFICIOS_OSM:offices,OFFICE_HOURS:[['invitatorio','Invitatório'],['oficio','Ofício das Leituras'],['laudes','Laudes'],['horaMedia','Hora Média'],['vesperas','Vésperas']],openServit