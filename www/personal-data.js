/* Dados pessoais locais. Não contém nem modifica textos litúrgicos. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.OSMPersonalData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const KEY='osmPersonalDataV1',RECOVERY='osmPersonalRestoreRecoveryV1';
 const MAX_ENTRIES=500;
 const scalar=x=>typeof x==='string'&&x.length<=180&&/^[a-zA-Z0-9_.:-]+$/.test(x);
 const str=(x,n=240)=>{if(typeof x!=='string'||x.length>n)throw Error('Texto inválido no arquivo.');return x;};
 const integer=(x,max=10000000)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
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
 function entry(v){
  if(!v||typeof v!=='object'||!integer(v.updatedAt,8640000000000000))throw Error('Registro pessoal inválido.');
  return {route:route(v.route),title:str(v.title),updatedAt:v.updatedAt,point:point(v.point)};
 }
 function list(v){if(!Array.isArray(v)||v.length>MAX_ENTRIES)throw Error('Quantidade de registros inválida.');const seen=new Set();return v.map(x=>{const e=entry(x),k=routeKey(e.route);if(seen.has(k))throw Error('Registros pessoais duplicados.');seen.add(k);return e;});}
 const empty=()=>({schema:1,positions:[],last:null});
 function personal(v){if(!v||v.schema!==1)throw Error('Formato de dados pessoais incompatível.');const p={schema:1,positions:list(v.positions),last:v.last===null?null:entry(v.last)};return p;}
 function load(storage){const raw=storage.getItem(KEY);return raw?personal(JSON.parse(raw)):empty();}
 function save(storage,p){storage.setItem(KEY,JSON.stringify(personal(p)));}
 function upsert(list,value){const k=routeKey(value.route),out=[value,...list.filter(x=>routeKey(x.route)!==k)];if(out.length>MAX_ENTRIES)throw Error('Limite de registros de leitura atingido.');return out;}
 function savePosition(storage,r,title,value){const p=load(storage),e=entry({route:r,title,point:value,updatedAt:Date.now()});p.positions=upsert(p.positions,e).slice(0,200);p.last=e;save(storage,p);return e;}
 // Retira apenas as anotações do registro ativo e descarta a antiga cópia de recuperação.
 function removeLegacyNotes(storage){
  if(storage.getItem(RECOVERY)!==null)storage.removeItem(RECOVERY);
  const raw=storage.getItem(KEY);
  if(!raw)return;
  const previous=JSON.parse(raw);
  if(previous?.schema!==1||!Object.hasOwn(previous,'notes'))return;
  delete previous.notes;
  storage.setItem(KEY,JSON.stringify(previous));
 }
 return {KEY,route,routeKey,point,load,savePosition,removeLegacyNotes};
});
