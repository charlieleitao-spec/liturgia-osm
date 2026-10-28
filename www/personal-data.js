/* Dados pessoais locais. Não contém nem modifica textos litúrgicos. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.OSMPersonalData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='osmPersonalDataV1',RECOVERY='osmPersonalRestoreRecoveryV1';
 const LEGACY=['osmFavoritesV4','osmRecentV4','osmTheme','osmReaderScale'];
 const MAX_BYTES=2*1024*1024,MAX_ENTRIES=500,MAX_NOTE=12000;
 const scalar=x=>typeof x==='string'&&x.length<=180&&/^[a-zA-Z0-9_.:-]+$/.test(x);
 const str=(x,n=240)=>{if(typeof x!=='string'||x.length>n)throw Error('Texto inválido no arquivo.');return x;};
 const integer=(x,max=10000000)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 function route(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Referência de leitura inválida.');
  const r={type:value.type};
  if(r.type==='saint'){if(!integer(value.id,100000))throw Error('Celebração inválida.');r.id=value.id;}
  else if(r.type==='prayer'){if(!scalar(value.key))throw Error('Oração inválida.');r.key=value.key;r.sub=value.sub??null;if(!(r.sub===null||integer(r.sub,999)||scalar(r.sub)))throw Error('Parte da oração inválida.');}
  else if(r.type==='mass'){if(!scalar(value.id))throw Error('Missa inválida.');r.id=value.id;}
  else if(r.type==='search'){r.source=str(value.source,240);r.title=str(value.title);r.page=value.page??null;if(!/^[a-zA-Z0-9_./-]+$/.test(r.source)||r.source.includes('..')||!(r.page===null||integer(r.page,10000)))throw Error('Documento inválido.');}
  else if(r.type==='resource'){
   if(!/^(regra|rosario|coroa|oficio|sabado|completo|oficio:\d{1,6}:(invitatorio|oficio|laudes|horaMedia|vesperas))$/.test(value.view||''))throw Error('Recurso inválido.');r.view=value.view;
   const allowed={tab:['hoje','santoral','oracoes','regra','sobre'],oficioTab:['invitatorio','oficio','laudes','horaMedia','vesperas'],coroaFormula:['formula1','formula2'],rosarioSet:['gozosos','luminosos','dolorosos','gloriosos'],finalAntifona:['salve','alma','ave','sub']};r.state={};
   for(const [k,list]of Object.entries(allowed))if(value.state?.[k]!=null){if(!list.includes(value.state[k]))throw Error('Parte do recurso inválida.');r.state[k]=value.state[k];}
   for(const k of ['detailId','devoSub','regraChapter','coroaGuidedStep','rosarioGuidedStep'])if(value.state?.[k]!=null){const v=value.state[k];if(!(integer(v,100000)||k==='regraChapter'&&v==='intro'||k==='devoSub'&&scalar(v)))throw Error('Página do recurso inválida.');r.state[k]=v;}
   if(value.state?.devo!=null){if(!scalar(value.state.devo))throw Error('Recurso inválido.');r.state.devo=value.state.devo;}
   if(value.state?.showOficio!=null){if(typeof value.state.showOficio!=='boolean')throw Error('Recurso inválido.');r.state.showOficio=value.state.showOficio;}
  }else throw Error('Tipo de leitura desconhecido.');
  return r;
 }
 const routeKey=r=>JSON.stringify(route(r));
 function point(p={}){
  if(!p||!integer(p.y)||!['window','view'].includes(p.scroller))throw Error('Posição de leitura inválida.');
  const details=p.details??[];if(!Array.isArray(details)||details.length>150||details.some(x=>typeof x!=='string'||!/^([a-zA-Z][\w-]{0,90}|@\d{1,4})$/.test(x)))throw Error('Seções inválidas.');
  const out={y:p.y,scroller:p.scroller,details:[...details]};
  if(p.anchor){const a=p.anchor;if(!integer(a.index,100000)||typeof a.offset!=='number'||!Number.isFinite(a.offset)||Math.abs(a.offset)>20000)throw Error('Marcador inválido.');out.anchor={index:a.index,text:str(a.text,160),offset:a.offset};}
  return out;
 }
 function entry(v,note=false){
  if(!v||typeof v!=='object'||!integer(v.updatedAt,8640000000000000))throw Error('Registro pessoal inválido.');
  const e={route:route(v.route),title:str(v.title),updatedAt:v.updatedAt};
  if(note){e.text=str(v.text,MAX_NOTE);e.deleted=v.deleted===true;}else e.point=point(v.point);
  return e;
 }
 function list(v,note){if(!Array.isArray(v)||v.length>MAX_ENTRIES)throw Error('Quantidade de registros inválida.');const seen=new Set();return v.map(x=>{const e=entry(x,note),k=routeKey(e.route);if(seen.has(k))throw Error('Registros pessoais duplicados.');seen.add(k);return e;});}
 const empty=()=>({schema:1,notes:[],positions:[],last:null});
 function personal(v){if(!v||v.schema!==1)throw Error('Formato de dados pessoais incompatível.');const p={schema:1,notes:list(v.notes,true),positions:list(v.positions,false),last:v.last===null?null:entry(v.last)};return p;}
 function load(storage){const raw=storage.getItem(KEY);return raw?personal(JSON.parse(raw)):empty();}
 function save(storage,p){storage.setItem(KEY,JSON.stringify(personal(p)));}
 function upsert(list,value){const k=routeKey(value.route),out=[value,...list.filter(x=>routeKey(x.route)!==k)];if(out.length>MAX_ENTRIES)throw Error('Limite de registros pessoais atingido. Exporte uma cópia antes de continuar.');return out;}
 function saveNote(storage,r,title,text,deleted=false){const p=load(storage);const e=entry({route:r,title,text,deleted,updatedAt:Date.now()},true);p.notes=upsert(p.notes,e);save(storage,p);return e;}
 function savePosition(storage,r,title,value){const p=load(storage),e=entry({route:r,title,point:value,updatedAt:Date.now()});p.positions=upsert(p.positions,e).slice(0,200);p.last=e;save(storage,p);return e;}
 function favorite(k){if(typeof k!=='string'||! /^(saint:\d{1,6}|prayer:[a-zA-Z0-9_.-]{1,100})$/.test(k))throw Error('Favorito inválido.');return k;}
 function legacy(storage){
  const read=(k,d)=>{const s=storage.getItem(k);return s===null?d:JSON.parse(s)};
  const favorites=read('osmFavoritesV4',[]);if(!Array.isArray(favorites)||favorites.length>MAX_ENTRIES)throw Error('Favoritos inválidos.');favorites.forEach(favorite);
  const recents=read('osmRecentV4',[]);if(!Array.isArray(recents)||recents.length>12)throw Error('Recentes inválidos.');
  const recent=recents.map(v=>{if(!v||!['saint','prayer'].includes(v.type)||v.k!==v.type+':'+v.key||!integer(v.ts,8640000000000000))throw Error('Recente inválido.');favorite(v.k);return {k:v.k,type:v.type,key:v.key,title:str(v.title),sub:str(v.sub||''),ts:v.ts};});
  const theme=storage.getItem('osmTheme')||'light',scale=Number(storage.getItem('osmReaderScale')||1);
  if(!['light','dark'].includes(theme)||!Number.isFinite(scale)||scale<.76||scale>2)throw Error('Preferências de leitura inválidas.');
  return {favorites:[...new Set(favorites)],recents:recent,preferences:{theme,scale}};
 }
 function normalizeBackup(b){
  if(!b||b.app!=='liturgia-osm-personal'||b.schema!==1||!date(b.createdDate))throw Error('Este arquivo não é uma cópia pessoal compatível do Liturgia OSM.');
  const p=personal(b.personal),m=new Map();for(const k of LEGACY)m.set(k,null);
  const l=b.library;if(!l||!l.preferences||!Array.isArray(l.favorites)||!Array.isArray(l.recents)||!['light','dark'].includes(l.preferences.theme)||typeof l.preferences.scale!=='number')throw Error('Biblioteca pessoal ausente ou inválida.');
  m.set('osmFavoritesV4',JSON.stringify(l.favorites));m.set('osmRecentV4',JSON.stringify(l.recents));m.set('osmTheme',l.preferences.theme);m.set('osmReaderScale',String(l.preferences.scale));
  return {app:b.app,schema:1,createdDate:b.createdDate,personal:p,library:legacy({getItem:k=>m.get(k)})};
 }
 function exportBackup(storage){const now=new Date();const b={app:'liturgia-osm-personal',schema:1,createdDate:now.toISOString().slice(0,10),personal:load(storage),library:legacy(storage)};const text=JSON.stringify(normalizeBackup(b),null,2);if(new TextEncoder().encode(text).length>MAX_BYTES)throw Error('A cópia excede o tamanho permitido.');return text;}
 function parseBackup(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)throw Error('Arquivo muito grande. Limite de 2 MB.');let b;try{b=JSON.parse(text)}catch{throw Error('O arquivo não contém JSON válido.');}return normalizeBackup(b);}
 function mergeByKey(local,incoming){const map=new Map(local.map(x=>[routeKey(x.route),x]));for(const x of incoming)if(!map.has(routeKey(x.route)))map.set(routeKey(x.route),x);if(map.size>MAX_ENTRIES)throw Error('A soma dos registros excede o limite permitido.');return [...map.values()];}
 function planRestore(storage,b,preferences=true){
  const incoming=normalizeBackup(b),local=load(storage),old=legacy(storage),p={schema:1,notes:mergeByKey(local.notes,incoming.personal.notes),positions:mergeByKey(local.positions,incoming.personal.positions).slice(0,200),last:local.last||incoming.personal.last};
  const existing=new Map(local.notes.map(x=>[routeKey(x.route),x]));
  const conflicts=incoming.personal.notes.filter(x=>{const y=existing.get(routeKey(x.route));return y&&(x.text!==y.text||x.deleted!==y.deleted)}).length;
  const favorites=[...new Set([...old.favorites,...incoming.library.favorites])];if(favorites.length>MAX_ENTRIES)throw Error('A soma dos favoritos excede o limite permitido.');
  const recent=new Map();for(const x of [...old.recents,...incoming.library.recents]){const y=recent.get(x.k);if(!y||x.ts>y.ts)recent.set(x.k,x);}
  const prefs=preferences?incoming.library.preferences:old.preferences;
  const values={[KEY]:JSON.stringify(personal(p)),osmFavoritesV4:JSON.stringify(favorites),osmRecentV4:JSON.stringify([...recent.values()].sort((a,b)=>b.ts-a.ts).slice(0,12)),osmTheme:prefs.theme,osmReaderScale:String(prefs.scale)};
  return {values,summary:{notesAdded:p.notes.length-local.notes.length,conflicts,favoritesAdded:favorites.length-old.favorites.length,positionsAdded:p.positions.length-local.positions.length}};
 }
 function snapshot(storage){const s={};for(const k of [KEY,...LEGACY])s[k]=storage.getItem(k);return s;}
 function applyValues(storage,values){for(const[k,v]of Object.entries(values))v===null?storage.removeItem(k):storage.setItem(k,v);}
 function restore(storage,b,preferences=true){
  const plan=planRestore(storage,b,preferences),before=snapshot(storage);storage.setItem(RECOVERY,JSON.stringify(before));
  try{applyValues(storage,plan.values)}catch(error){try{applyValues(storage,before)}catch{throw Error('Armazenamento indisponível durante a recuperação. A cópia anterior está preservada para desfazer.');}throw Error('Não foi possível restaurar. Os dados anteriores foram mantidos.');}return plan.summary;
 }
 function undoRestore(storage){const raw=storage.getItem(RECOVERY);if(!raw)throw Error('Não há restauração para desfazer.');const data=JSON.parse(raw),keys=[KEY,...LEGACY];if(keys.some(k=>!Object.hasOwn(data,k)||!(data[k]===null||typeof data[k]==='string')))throw Error('Cópia de recuperação inválida.');const before=snapshot(storage);try{applyValues(storage,Object.fromEntries(keys.map(k=>[k,data[k]])))}catch(error){applyValues(storage,before);throw Error('Não foi possível desfazer; os dados atuais foram mantidos.');}storage.removeItem(RECOVERY);}
 return {KEY,RECOVERY,MAX_BYTES,MAX_NOTE,route,routeKey,point,empty,load,saveNote,savePosition,exportBackup,parseBackup,planRestore,restore,undoRestore};
});
