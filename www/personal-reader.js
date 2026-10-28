/* Retomada, notas e cópias pessoais. Os textos canônicos permanecem somente para leitura. */
(function(){
 'use strict';
 const D=window.OSMPersonalData;
 let ready=false,active=null,resourceActive=null,pending=null,restoring=false,timer=null,draft=null,backup=null,noteOrigin=null,noteContext=null,restoreTask=null;
 const $=id=>document.getElementById(id);
 const key=r=>D.routeKey(r);
 const text=node=>(node?.textContent||'').replace(/\s+/g,' ').trim();
 function data(){return D.load(localStorage);}
 function notice(message,error=false){const el=$('personalStatus');el.textContent=message;el.setAttribute('role',error?'alert':'status');}
 function safe(action){try{return action();}catch(error){notice(error.message||'Não foi possível acessar os dados pessoais.',true);return null;}}
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
 function saveCurrent(){if(!ready||restoring)return;try{if(resourceActive)saveOne(resourceActive,$('serviteFrame').contentWindow);else saveOne(active,window);}catch(error){$('personalStorageWarning').hidden=false;$('personalStorageWarning').textContent='Não foi possível guardar a leitura. Abra “Anotações e cópia de segurança” para conferir o armazenamento.';}}
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
 function storedNote(item){
  const notes=data().notes;
  if(typeof item.text==='string')return notes.find(n=>key(n.route)===key(item.route));
  return notes.filter(n=>D.noteKey(n.route)===D.noteKey(item.route)).sort((a,b)=>b.updatedAt-a.updatedAt)[0];
 }
 function readingTools(doc,item,win){
  const view=doc?.getElementById('view');if(!view)return;
  view.querySelectorAll('.personal-reading-tools').forEach(node=>node.remove());
  if(!item)return;
  const bar=doc.createElement('footer');bar.className='personal-reading-tools';bar.setAttribute('role','group');bar.setAttribute('aria-label','Ações de leitura pessoal');
  const existing=safe(()=>storedNote(item));const note=button(existing&&!existing.deleted?'Editar nota':'Anotar',event=>openNote(item,event.currentTarget));note.classList.add('personal-note-action');note.setAttribute('aria-label',existing&&!existing.deleted?'Editar nota desta leitura':'Anotar nesta leitura');bar.append(note);
  const saved=safe(()=>data().positions.find(x=>key(x.route)===key(item.route)));
  if(saved&&saved.point.y>0)bar.append(button('Retomar',()=>schedulePosition(win,saved.point)));
  view.append(bar);
 }
 function afterRender(resource=false){
  if(!ready)return;
  if(resource){
   resourceActive=resourceDescriptor();
   readingTools($('serviteFrame').contentDocument,resourceActive,$('serviteFrame').contentWindow);
   if(pending&&resourceActive){const item=pending;pending=null;restoring=true;try{$('serviteFrame').contentWindow.OSMResourceContext.restore(item.route.state);resourceActive=resourceDescriptor();}catch(error){restoring=false;open();notice(error.message||'Não foi possível retomar este recurso.',true);return;}finally{restoring=false;}schedulePosition($('serviteFrame').contentWindow,item.point);}
   return;
  }
  active=descriptor();
  readingTools(document,active,window);
  if(state.tab==='biblioteca'){
   const section=element('section');section.className='personal-library';section.append(element('h2','Anotações e cópia de segurança'),element('p','Suas anotações ficam separadas dos textos e são guardadas neste aparelho.'),button('Abrir meus dados pessoais',open));$('view').append(section);
  }
  const home=document.querySelector('.home-personal-access');
  if(home){const p=safe(()=>data().last);if(p){home.querySelector('.personal-access-recent')?.nextElementSibling?.remove();home.querySelector('.personal-access-recent')?.remove();home.append(element('h3','Continuar de onde parei'),button(p.title,()=>resume(p)));}}
 }
 function refreshPreferences(){readerScale=Number(localStorage.getItem('osmReaderScale')||1);lightMode=localStorage.getItem('osmTheme')!=='dark';localStorage.setItem('santoral-osm-theme',lightMode?'light':'dark');localStorage.setItem('santoral-osm-fontsize',String(readerScale*16));applyPreferences();try{const doc=$('serviteFrame').contentDocument;doc.documentElement.style.fontSize=(readerScale*16)+'px';doc.documentElement.setAttribute('data-theme',lightMode?'light':'dark');}catch{}}
 function open(){if(!cancelPosition())saveCurrent();closeMainMenu();noteOrigin=null;noteContext=null;draft=null;backup=null;$('personalBody').replaceChildren();notice('');renderLibrary();openAccessibleDialog('personalOverlay');updateBackButton();}
 function close(){if(draft&&$('personalNoteText')?.value!==draft.original){if(!saveDraft())return;}closeAccessibleDialog('personalOverlay');backup=null;if(noteOrigin?.isConnected){if(noteOrigin.classList.contains('personal-note-action')){const note=safe(()=>storedNote(noteContext));if(note){noteOrigin.textContent=note.deleted?'Anotar':'Editar nota';noteOrigin.setAttribute('aria-label',note.deleted?'Anotar nesta leitura':'Editar nota desta leitura');}}noteOrigin.focus({preventScroll:true});}noteOrigin=null;noteContext=null;draft=null;updateBackButton();}
 function renderLibrary(){
  const body=$('personalBody');body.replaceChildren();draft=null;backup=null;
  const p=safe(data);if(!p)return;
  body.append(element('p','Dados guardados somente neste aparelho. Exporte uma cópia para levá-los a outro aparelho ou recuperá-los após uma reinstalação.'));
  if(p.last)body.append(button('Continuar: '+p.last.title,()=>resume(p.last)));
  body.append(element('h3','Minhas anotações'));
  const notes=p.notes.filter(n=>!n.deleted);
  if(!notes.length)body.append(element('p','Abra uma oração e toque em “Anotar”, ao final da leitura, para escrever.'));
  notes.sort((a,b)=>b.updatedAt-a.updatedAt).forEach(n=>{const row=element('article');row.className='personal-note-item';row.append(element('h4',n.title),element('p',n.text.slice(0,180)),button('Editar anotação',()=>openNote(n)),button('Abrir leitura',()=>resume({route:n.route,title:n.title,point:p.positions.find(x=>key(x.route)===key(n.route))?.point||{y:0,scroller:'window',details:[]}})));body.append(row);});
  body.append(element('h3','Cópia de segurança'),element('p','Inclui favoritos, recentes, anotações, posições de leitura, tema e tamanho do texto. Guarde o arquivo em um local de sua confiança.'),button('Exportar cópia',exportFile),button('Escolher cópia para restaurar',importFile));
  if(localStorage.getItem(D.RECOVERY))body.append(button('Desfazer última restauração',()=>{body.replaceChildren(element('h3','Conferir recuperação'),element('p','Esta ação recupera os dados anteriores à última restauração e substitui as alterações feitas depois dela. Exporte uma cópia dos dados atuais se quiser preservá-los.'),button('Exportar dados atuais',exportFile),button('Recuperar dados anteriores',()=>{if(safe(()=>{D.undoRestore(localStorage);refreshPreferences();return true;})){renderLibrary();notice('Restauração desfeita. Os dados anteriores foram recuperados.');}}),button('Cancelar',renderLibrary));}));
 }
 function openNote(item,origin=null){
  if(!item)return;noteOrigin=origin;noteContext=item;if(!cancelPosition())saveCurrent();let found;try{found=storedNote(item);}catch(error){notice(error.message,true);return;}
  if(!$('personalOverlay').classList.contains('open'))openAccessibleDialog('personalOverlay');
  const original=found&&!found.deleted?found.text:'';draft={route:found?.route||item.route,title:item.title,original};
  const body=$('personalBody');body.replaceChildren();notice('');body.append(element('h3',item.title),element('p','Anotação pessoal. O texto original da oração permanece preservado.'));
  const label=element('label','Sua anotação');label.htmlFor='personalNoteText';const input=element('textarea');input.id='personalNoteText';input.rows=9;input.maxLength=D.MAX_NOTE;input.value=original;
  body.append(label,input,button('Salvar anotação',()=>{if(saveDraft())notice('Anotação salva neste aparelho.');}),button('Voltar às anotações',()=>{if(saveDraft())renderLibrary();}));
  if(found&&!found.deleted)body.append(button('Excluir anotação',()=>{const previous=input.value;if(safe(()=>D.saveNote(localStorage,found.route,item.title,previous,true))){draft=null;renderLibrary();notice('Anotação excluída.');body.append(button('Desfazer exclusão',()=>{if(safe(()=>D.saveNote(localStorage,found.route,item.title,previous))){renderLibrary();notice('Anotação recuperada.');}}));}}));
  input.focus();updateBackButton();
 }
 function saveDraft(){if(!draft)return true;const value=$('personalNoteText').value;if(value===draft.original)return true;if(!value.trim()){notice('Para remover uma anotação existente, use “Excluir anotação”.',true);return false;}const saved=safe(()=>D.saveNote(localStorage,draft.route,draft.title,value));if(!saved)return false;draft.original=value;return true;}
 function nativeBackup(){return window.Capacitor?.isNativePlatform?.()?getCapacitorPlugin('PersonalBackup'):null;}
 async function exportFile(){
  try{saveCurrent();const content=D.exportBackup(localStorage),filename='liturgia-osm-pessoal-'+new Date().toISOString().slice(0,10)+'.json',plugin=nativeBackup();
   if(window.Capacitor?.isNativePlatform?.()){if(!plugin)throw Error('Exportação indisponível nesta versão do aplicativo.');const result=await plugin.save({content,filename});notice(result.cancelled?'Exportação cancelada.': 'Cópia salva no local escolhido.');}
   else{const url=URL.createObjectURL(new Blob([content],{type:'application/json'})),a=element('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);notice('Arquivo preparado para download. Confira se foi salvo.');}
  }catch(error){notice(error.message||'Não foi possível exportar a cópia.',true);}
 }
 async function importFile(){
  try{const plugin=nativeBackup();if(window.Capacitor?.isNativePlatform?.()){if(!plugin)throw Error('Importação indisponível nesta versão do aplicativo.');const result=await plugin.read();if(result.cancelled){notice('Importação cancelada.');return;}preview(result.content);}
   else{const input=element('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',async()=>{try{const file=input.files[0];if(!file)return;if(file.size>D.MAX_BYTES)throw Error('Arquivo muito grande. Limite de 2 MB.');preview(await file.text());}catch(error){notice(error.message,true);}finally{input.remove();}});input.hidden=true;document.body.append(input);input.click();}
  }catch(error){notice(error.message||'Não foi possível abrir a cópia.',true);}
 }
 function preview(content){
  backup=D.parseBackup(content);const plan=D.planRestore(localStorage,backup),body=$('personalBody');body.replaceChildren();draft=null;notice('Confira os dados antes de restaurar.');
  body.append(element('h3','Conferir restauração'),element('p','Cópia de '+backup.createdDate+'. Novos registros: '+plan.summary.notesAdded+' anotações, '+plan.summary.favoritesAdded+' favoritos e '+plan.summary.positionsAdded+' posições.'),element('p',plan.summary.conflicts+' anotações diferentes. As versões já existentes neste aparelho serão mantidas. A última leitura local também será preservada.'));
  const label=element('label'),check=element('input');check.type='checkbox';check.checked=true;label.append(check,document.createTextNode(' Restaurar também tema e tamanho do texto'));body.append(label,button('Restaurar esta cópia',()=>{if(safe(()=>{D.restore(localStorage,backup,check.checked);refreshPreferences();return true;})){renderLibrary();notice('Cópia restaurada. Os dados existentes foram preservados. Você pode desfazer a restauração abaixo.');}}),button('Cancelar',renderLibrary));
 }
 async function resume(item){
  try{
   const r=D.route(item.route);if(!$('personalOverlay').classList.contains('open'))saveCurrent();else{if(draft&&!saveDraft())return;close();}
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
  }catch(error){pending=null;restoring=false;open();notice(error.message||'Não foi possível retomar esta leitura.',true);}
 }
 function init(){
  if(ready)return;ready=true;
  const overlay=element('div');overlay.id='personalOverlay';overlay.className='main-menu-overlay personal-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','personalTitle');overlay.setAttribute('aria-hidden','true');overlay.tabIndex=-1;
  const panel=element('section');panel.className='personal-panel';const head=element('div');head.className='personal-head';const h=element('h2','Anotações e cópia de segurança');h.id='personalTitle';const c=button('Fechar',close);c.setAttribute('aria-label','Fechar dados pessoais');head.append(h,c);const status=element('p');status.id='personalStatus';status.setAttribute('role','status');const body=element('div');body.id='personalBody';panel.append(head,status,body);overlay.append(panel);document.body.append(overlay);
  const warning=element('p');warning.id='personalStorageWarning';warning.className='personal-storage-warning';warning.setAttribute('role','alert');warning.hidden=true;document.body.append(warning);
  const menu=document.querySelector('.main-menu .menu-section');menu?.append(button('Anotações e cópia de segurança',open));
  window.addEventListener('scroll',scheduleSave,true);window.addEventListener('pagehide',()=>{if(draft)saveDraft();saveCurrent();});document.addEventListener('visibilitychange',()=>{if(document.hidden){if(draft)saveDraft();saveCurrent();}});
  $('serviteFrame').addEventListener('load',()=>{try{const win=$('serviteFrame').contentWindow;win.addEventListener('scroll',scheduleSave,true);win.addEventListener('servite-ready',()=>afterRender(true));if(win.OSMResourceContext?.ready)afterRender(true);}catch{}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();close();}},true);
  afterRender();
 }
 window.OSMPersonalReader={init,beforeRender,afterRender,open,close,saveCurrent,cancelPosition,resourceClosed(){if(!cancelPosition())saveCurrent();resourceActive=null;},resourceOpening(){if(!cancelPosition())saveCurrent();resourceActive=null;}};
})();
