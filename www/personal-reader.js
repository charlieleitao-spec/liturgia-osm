/* Retomada de leitura. Os textos canônicos permanecem somente para leitura. */
(function(){
 'use strict';
 const D=window.OSMPersonalData;
 let ready=false,active=null,resourceActive=null,pending=null,restoring=false,timer=null,restoreTask=null;
 const $=id=>document.getElementById(id);
 const key=r=>D.routeKey(r);
 const text=node=>(node?.textContent||'').replace(/\s+/g,' ').trim();
 function data(){return D.load(localStorage);}
 function warn(message){
  const warning=$('personalStorageWarning');
  warning.textContent=message;
  warning.hidden=false;
 }
 function safe(action){try{return action();}catch(error){warn('Não foi possível acessar os dados de leitura.');return null;}}
 function element(tag,content){const el=document.createElement(tag);if(content!==undefined)el.textContent=content;return el;}
 function button(label,action){const b=element('button',label);b.type='button';b.className='action-btn';b.addEventListener('click',action);return b;}
 function titleFor(doc=document){return (text(doc.querySelector('#view .detail-title,#view h1,#view h2'))||'Leitura OSM').slice(0,240);}
 function descriptor(){
  if(!ready||!santoralReady)return null;
  let r=null;
  if(state.detailId!=null)r={type:'saint',id:Number(state.detailId)};
  else if(state.tab==='busca'&&globalSearchDocument!==null){const d=globalSearchIndex?.documents[globalSearchDocument];if(d)r={type:'search',source:d.source,title:d.title,page:d.page??null};}
  else if(state.tab==='liturgia'&&state.liturgiaDetail){const l=state.liturgiaDetail;r=l.tipo==='missa'?{type:'mass',id:window.MISSAS_OSM?.celebrations[l.reference]?.date}:{type:'saint',id:l.reference};}
  else if(state.tab==='oracoes'){
   if(dailyPrayerOpen480)r={type:'prayer',key:'daily-'+dailyPrayerOpen480};
   else if(memoriaSelectedDate)r={type:'prayer',key:'memoria',sub:memoriaSelectedDate};
   else if(state.devo)r={type:'prayer',key:state.devo,sub:state.devoSub};
  }
  if(!r)return null;
  try{return {route:D.route(r),title:titleFor()};}catch{return null;}
 }
 function resourceDescriptor(){
  const frame=$('serviteFrame');if(!ready||!$('serviteOverlay').classList.contains('open')||!frame.contentWindow?.OSMResourceContext?.ready)return null;
  try{const r=D.route({type:'resource',view:currentServiteView,state:frame.contentWindow.OSMResourceContext.snapshot()});
   const hour={invitatorio:'Invitatório',oficio:'Ofício das Leituras',laudes:'Laudes',horaMedia:'Hora Média',vesperas:'Vésperas'}[r.state.oficioTab];
   return {route:r,title:(titleFor(frame.contentDocument)+(r.state.showOficio&&hour?' — '+hour:'')).slice(0,240)};
  }catch{return null;}
 }
 function scroller(win){const view=win.document.getElementById('view');return view&&view.scrollHeight>view.clientHeight+10&&/auto|scroll/.test(win.getComputedStyle(view).overflowY)?view:null;}
 const blocks=doc=>[...doc.querySelectorAll('#view p,#view .prayer-block,#view .psalm-stanza,#view h2,#view h3')].filter(el=>!el.closest('.personal-reading-tools'));
 function capture(win){
  const view=win.document.getElementById('view'),s=scroller(win),top=s?s.getBoundingClientRect().top:0;
  const p={y:Math.max(0,Math.round(s?s.scrollTop:win.scrollY)),scroller:s?'view':'window',details:[]};
  [...view.querySelectorAll('details')].forEach((d,i)=>{if(d.open)p.details.push(d.id&&/^[a-zA-Z][\w-]{0,90}$/.test(d.id)?d.id:'@'+i);});
  const list=blocks(win.document),i=list.findIndex(el=>el.getBoundingClientRect().bottom>top+2&&el.getClientRects().length);
  if(i>=0)p.anchor={index:i,text:text(list[i]).slice(0,160),offset:list[i].getBoundingClientRect().top-top};
  return D.point(p);
 }
 function position(win,p){
  const view=win.document.getElementById('view');
  [...view.querySelectorAll('details')].forEach((d,i)=>{d.open=p.details.includes(d.id)||p.details.includes('@'+i);});
  const s=p.scroller==='view'?view:null;
  let y=p.y;
  if(p.anchor){const list=blocks(win.document);let el=list[p.anchor.index];if(text(el).slice(0,160)!==p.anchor.text)el=list.find(e=>text(e).slice(0,160)===p.anchor.text);if(el)y=(s?s.scrollTop:win.scrollY)+el.getBoundingClientRect().top-(s?s.getBoundingClientRect().top:0)-p.anchor.offset;}
  if(s)s.scrollTop=Math.max(0,y);else win.scrollTo(0,Math.max(0,y));
 }
 function saveOne(item,win){if(item&&!restoring)D.savePosition(localStorage,item.route,item.title,capture(win));}
 function saveCurrent(){if(!ready||restoring)return;try{if(resourceActive)saveOne(resourceActive,$('serviteFrame').contentWindow);else saveOne(active,window);}catch{warn('Não foi possível guardar a posição de leitura.');}}
 function scheduleSave(){clearTimeout(timer);timer=setTimeout(saveCurrent,450);}
 function cancelPosition(){if(!restoreTask)return false;cancelAnimationFrame(restoreTask.first);cancelAnimationFrame(restoreTask.second);restoreTask=null;restoring=false;return true;}
 function schedulePosition(win,p){
  cancelPosition();const item=win===window?descriptor():resourceDescriptor();if(!item)return;
  const task={win,doc:win.document,routeKey:key(item.route),first:null,second:null};restoreTask=task;restoring=true;
  task.first=requestAnimationFrame(()=>{task.second=requestAnimationFrame(()=>{
   if(restoreTask!==task)return;
   try{const current=win===window?descriptor():resourceDescriptor();if(win.document===task.doc&&current&&key(current.route)===task.routeKey)position(win,p);}
   finally{if(restoreTask===task){restoreTask=null;restoring=false;}}
  });});
 }
 function beforeRender(resource=false){
  if(!ready)return;
  if(restoreTask){const win=resource?$('serviteFrame').contentWindow:window;if(restoreTask.win===win){const next=resource?resourceDescriptor():descriptor();if(!next||key(next.route)!==restoreTask.routeKey)cancelPosition();}return;}
  if(restoring||!resource&&$('serviteOverlay').classList.contains('open'))return;
  try{saveOne(resource?resourceActive:active,resource?$('serviteFrame').contentWindow:window);}catch{}
 }
 function readingTools(doc,item,win){
  const view=doc?.getElementById('view');if(!view)return;
  view.querySelectorAll('.personal-reading-tools').forEach(node=>node.remove());
  if(!item)return;
  const saved=safe(()=>data().positions.find(x=>key(x.route)===key(item.route)));
  if(!saved||saved.point.y<=0)return;
  const bar=doc.createElement('footer');bar.className='personal-reading-tools';bar.setAttribute('role','group');bar.setAttribute('aria-label','Ações de leitura pessoal');
  bar.append(button('Retomar',()=>schedulePosition(win,saved.point)));
  view.append(bar);
 }
 function afterRender(resource=false){
  if(!ready)return;
  if(resource){
   resourceActive=resourceDescriptor();
   readingTools($('serviteFrame').contentDocument,resourceActive,$('serviteFrame').contentWindow);
   if(pending&&resourceActive){const item=pending;pending=null;restoring=true;try{$('serviteFrame').contentWindow.OSMResourceContext.restore(item.route.state);resourceActive=resourceDescriptor();}catch(error){restoring=false;warn(error.message||'Não foi possível retomar este recurso.');return;}finally{restoring=false;}schedulePosition($('serviteFrame').contentWindow,item.point);}
   return;
  }
  active=descriptor();
  readingTools(document,active,window);
  const home=document.querySelector('.home-personal-access');
  if(home){const p=safe(()=>data().last);if(p){home.querySelector('.personal-access-recent')?.nextElementSibling?.remove();home.querySelector('.personal-access-recent')?.remove();const shortcut=button(p.title,()=>resume(p));shortcut.className='personal-access-item';home.append(element('h3','Continuar de onde parei'),shortcut);}}
 }
 async function resume(item){
  try{
   const r=D.route(item.route);saveCurrent();
   if(r.type==='resource'){
    if($('serviteOverlay').classList.contains('open')&&currentServiteView===r.view&&$('serviteFrame').contentWindow.OSMResourceContext?.ready){restoring=true;try{$('serviteFrame').contentWindow.OSMResourceContext.restore(r.state);resourceActive=resourceDescriptor();}finally{restoring=false;}schedulePosition($('serviteFrame').contentWindow,item.point);}
    else{pending=item;openServite(r.view);}return;
   }
   if($('serviteOverlay').classList.contains('open'))closeServite();
   restoring=true;
   try{
    if(r.type==='saint'){if(!SANTORAL.some(s=>Number(s._id)===r.id))throw Error('Esta celebração não está disponível nesta edição.');openSaint(r.id);}
    else if(r.type==='prayer'){
     if(r.key==='daily-anjo'||r.key==='daily-rainha'){setTab('oracoes');openDailyPrayer480(r.key.slice(6));}
     else if(r.key==='memoria'){setTab('oracoes');openMemoriaLiturgica(r.sub);}
     else{if(!allPrayerEntries().some(p=>p.key===r.key))throw Error('Esta oração não está disponível nesta edição.');setTab('oracoes');openDevo(r.key,r.sub);}
    }else if(r.type==='mass'){const i=(window.MISSAS_OSM?.celebrations||[]).findIndex(x=>x.date===r.id);if(i<0)throw Error('Esta missa não está disponível nesta edição.');setTab('liturgia');openLiturgiaDetail('missa',i);}
    else if(r.type==='search'){loadGlobalSearch();if(globalSearchLoading)await globalSearchLoading;const i=globalSearchIndex?.documents.findIndex(x=>x.source===r.source&&x.title===r.title&&(x.page??null)===r.page);if(!(i>=0))throw Error('Este documento não está disponível nesta edição.');setTab('busca');openSearchDocument(i);}
   }finally{restoring=false;}
   schedulePosition(window,D.point(item.point));
  }catch(error){pending=null;restoring=false;warn(error.message||'Não foi possível retomar esta leitura.');}
 }
 function init(){
  if(ready)return;ready=true;
  const warning=element('p');warning.id='personalStorageWarning';warning.className='personal-storage-warning';warning.setAttribute('role','alert');warning.hidden=true;document.body.append(warning);
  try{D.removeLegacyNotes(localStorage);}catch{warn('Não foi possível concluir a remoção dos dados antigos.');}
  window.addEventListener('scroll',scheduleSave,true);window.addEventListener('pagehide',saveCurrent);document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrent();});
  $('serviteFrame').addEventListener('load',()=>{try{const win=$('serviteFrame').contentWindow;win.addEventListener('scroll',scheduleSave,true);win.addEventListener('servite-ready',()=>afterRender(true));if(win.OSMResourceContext?.ready)afterRender(true);}catch{}});
  afterRender();
 }
 window.OSMPersonalReader={init,beforeRender,afterRender,saveCurrent,cancelPosition,resourceClosed(){if(!cancelPosition())saveCurrent();resourceActive=null;},resourceOpening(){if(!cancelPosition())saveCurrent();resourceActive=null;}};
})();
