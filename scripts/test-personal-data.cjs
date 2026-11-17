const assert = require('node:assert/strict');
const test = require('node:test');
const D = require('../www/personal-data.js');

const recovery = 'osmPersonalRestoreRecoveryV1';
const route = {type:'prayer',key:'coroa',sub:'formula2'};
const point = {y:812,scroller:'window',details:['chapter','@2'],anchor:{index:4,text:'Oração de Maria',offset:-13}};
const position = {route,title:'Coroa',updatedAt:1,point};
const prior = {schema:1,positions:[position],last:position};
const note = {route,title:'Coroa',updatedAt:1,text:'Anotação antiga',deleted:false};

function storage(entries = []) {
  const map = new Map(entries);
  return {
    map,
    getItem: key => map.get(key) ?? null,
    setItem: (key,value) => map.set(key,String(value)),
    removeItem: key => map.delete(key)
  };
}

test('atualização apaga notas já salvas e a recuperação, preservando os demais dados', () => {
  const original = JSON.stringify({...prior,notes:[note,{...note,deleted:true}]});
  const retained = [
    ['osmFavoritesV4','["prayer:coroa"]'],
    ['osmRecentV4','[{"k":"prayer:coroa","type":"prayer","key":"coroa","title":"Coroa","ts":1}]'],
    ['osmTheme','dark'],
    ['osmReaderScale','1.24'],
    ['outraChave','intacta']
  ];
  const s = storage([[D.KEY,original],[recovery,JSON.stringify({[D.KEY]:original})],...retained]);

  D.removeLegacyNotes(s);
  assert.deepEqual(JSON.parse(s.getItem(D.KEY)),prior);
  assert.deepEqual(D.load(s),prior);
  assert.equal(s.getItem(recovery),null);
  for (const [key,value] of retained) assert.equal(s.getItem(key),value);

  const saved = new Map(s.map);
  D.removeLegacyNotes(s);
  assert.deepEqual(s.map,saved);
});

test('instalação nova não cria registros e uma atualização incompleta pode ser retomada', () => {
  const s = storage();
  D.removeLegacyNotes(s);
  assert.equal(s.map.size,0);

  const legacy = JSON.stringify({...prior,notes:[note]});
  s.setItem(D.KEY,legacy);
  s.setItem(recovery,legacy);
  const setItem = s.setItem;
  s.setItem = () => { throw Error('Armazenamento temporariamente indisponível'); };
  assert.throws(() => D.removeLegacyNotes(s));
  assert.equal(s.getItem(D.KEY),legacy);
  assert.equal(s.getItem(recovery),null);

  s.setItem = setItem;
  D.removeLegacyNotes(s);
  assert.deepEqual(D.load(s),prior);
  assert.equal(Object.hasOwn(JSON.parse(s.getItem(D.KEY)),'notes'),false);
});

test('salvar uma posição conserva a última leitura e não volta a gravar anotações', () => {
  const s = storage([[D.KEY,JSON.stringify({...prior,notes:[note]})]]);
  const next = {type:'saint',id:0};
  D.savePosition(s,next,'Celebração',point);
  const saved = JSON.parse(s.getItem(D.KEY));
  assert.equal(Object.hasOwn(saved,'notes'),false);
  assert.deepEqual(saved.last.route,next);
  assert.deepEqual(saved.positions[1],position);
});

test('rotas incompatíveis e coordenadas inválidas continuam sendo recusadas', () => {
  assert.throws(() => D.route({type:'resource',view:'javascript:alert(1)'}));
  assert.throws(() => D.route({type:'search',source:'../../arquivo',title:'x'}));
  assert.throws(() => D.point({...point,y:-1}));
  assert.throws(() => D.savePosition(storage([[D.KEY,'inválido']]),route,'Coroa',point));
});

test('a posição mais recente é única por rota e o histórico fica limitado', () => {
  const s = storage();
  for (let i=0;i<205;i++) D.savePosition(s,{type:'saint',id:i},'Santo '+i,point);
  D.savePosition(s,{type:'saint',id:204},'Santo 204',point);
  assert.equal(D.load(s).positions.length,200);
  assert.equal(D.load(s).last.route.id,204);
  assert.equal(D.load(s).positions.filter(entry=>entry.route.id===204).length,1);
});
