/* BEGIN SCRIPT BLOCK: legacy-block-2 */
let SANTORAL = [];
let OFICIOS_OSM = null;
let santoralReady = false;
let oficiosReady = false;
let oficiosLoadError = false;
let santoralLoading = true;
let santoralLoadError = false;
function saintImageHtml(s, detail=false){
  const src=s.image;
  if(!src) return '';
  return detail ? `<div class="saint-image-detail fade-in"><img src="${src}" alt="Imagem de ${escapeHtml(s.title)}"></div>` : `<div class="saint-thumb"><img src="${src}" alt="Imagem de ${escapeHtml(s.title)}"></div>`;
}
function saintRankSubtitle(s){
  const rank=String(s?.rank||'').trim();
  const title=String(s?.title||'').trim();
  if(!rank||!title)return rank;
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const r=normalize(rank),t=normalize(title);
  const prefixes={santo:['santo','sao'],sao:['sao','santo'],santa:['santa']};
  if((prefixes[r]||[r]).some(prefix=>new RegExp('^'+prefix+'\\s+').test(t)))return '';
  return rank;
}
const PRAYERS = window.OSM_PRAYERS;

/* Listas de devoções da aba Oração (4.9.34): reconstruídas a partir de PRAYERS.devotions e dos títulos já usados nas telas de detalhe. */
const DEVO_LIST = [
  {key:'vigilia',title:'Vigília de Nossa Senhora',sub:'Uma das homenagens mais antigas dos Servos'},
  {key:'coroa',title:'Coroa de Nossa Senhora das Dores',sub:'Sete dores de Maria'},
  {key:'stabat',title:'Stabat Mater',sub:'Hino da Mãe dolorosa'},
  {key:'via_matris',title:'Via Matris',sub:'Novena das Dores'},
  {key:'ladainhas',title:'Ladainhas Marianas',sub:'Três ladainhas'}
];
const VARIAS_LIST = PRAYERS.devotions.variasHome.map((x,i)=>({key:'varias'+i,title:x.title,sub:'Orações diversas'}));
function devoRowHtml(x){
  return `<div class="saint-row" onclick="openDevo('${x.key}')"><div class="rowtext"><div class="rowtitle">${escapeHtml(x.title)}</div><div class="rowrank">${escapeHtml(x.sub||'')}</div></div><div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div></div>`;
}
/* END SCRIPT BLOCK: legacy-block-2 */

/* BEGIN SCRIPT BLOCK: legacy-block-3 */
// ===================== helpers =====================
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const WEEKDAYS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

function todayInfo(){
  const d = new Date();
  return { day:d.getDate(), month:d.getMonth()+1, weekday:WEEKDAYS[d.getDay()], monthName:MONTHS[d.getMonth()] };
}

function findSaintForToday(){
  const t = todayInfo();
  return SANTORAL.find(s => s.day === t.day && s.month === t.month) || null;
}

function findNextSaint(){
  const t = todayInfo();
  const withKey = SANTORAL.map(s => ({...s, key: s.month*100+s.day}));
  const todayKey = t.month*100+t.day;
  const future = withKey.filter(s=>s.key > todayKey).sort((a,b)=>a.key-b.key);
  if(future.length) return future[0];
  return withKey.sort((a,b)=>a.key-b.key)[0];
}

function escapeHtml(str){
  return (str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function showToast(message){
  const old=document.getElementById('osmToast'); if(old) old.remove();
  const el=document.createElement('div'); el.id='osmToast'; el.className='toast'; el.textContent=message;
  document.body.appendChild(el); setTimeout(()=>el.remove(),2200);
}
async function shareText(title,text){
  const payload={title:title,text:text};
  try{
    if(navigator.share){ await navigator.share(payload); return; }
    if(navigator.clipboard){ await navigator.clipboard.writeText(text); showToast('Texto copiado para a área de transferência.'); return; }
  }catch(e){ if(e && e.name==='AbortError') return; }
  try{
    const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); showToast('Texto copiado para a área de transferência.');
  }catch(e){ showToast('Não foi possível partilhar neste dispositivo.'); }
}
function shareSaint(id){
  const x=SANTORAL.find(v=>v._id===id); if(!x) return;
  let text=`${x.title}\n${x.date}\n\n${x.bio}`;
  if(x.prayer) text+=`\n\nOração\n${x.prayer}`;
  text+='\n\nLiturgia OSM';
  shareText(x.title,text);
}
function sharePrayer(title,text){ shareText(title,`${title}\n\n${text}\n\nLiturgia OSM`); }

// render a prayer block, coloring "D." / "T." rubrics
function renderPrayer(text){
  const esc = escapeHtml(text);
  return esc.replace(/^(D\.|T\.|C\.|L\.\d?|L\.)/gm, '<span class="rubric">$1</span>');
}

// ===================== calendário litúrgico básico =====================
function easterSunday(year){
  const a=year%19, b=Math.floor(year/100), c=year%100, d=Math.floor(b/4), e=b%4;
  const f=Math.floor((b+8)/25), g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30, i=Math.floor(c/4), k=c%4;
  const l=(32+2*e+2*i-h-k)%7, m=Math.floor((a+11*h+22*l)/451);
  const month=Math.floor((h+l-7*m+114)/31)-1;
  const day=((h+l-7*m+114)%31)+1;
  return new Date(year,month,day,12,0,0);
}
function isPaschalSeason(date=new Date()){
  const easter=easterSunday(date.getFullYear());
  const pentecost=new Date(easter); pentecost.setDate(easter.getDate()+49); pentecost.setHours(23,59,59,999);
  return date>=easter && date<=pentecost;
}
function dailyPrayerSuggestion(date=new Date()){
  return isPaschalSeason(date)
    ? {key:'rainha', label:'Tempo Pascal', note:'No Tempo Pascal, a tradição reza o Rainha do Céu (Regina Caeli).'}
    : {key:'anjo', label:'Tempo do ano', note:'Fora do Tempo Pascal, a tradição reza o Anjo do Senhor (Angelus).'};
}

// ===================== state =====================
const APP_VERSION = '4.9.36';
const storedTab = localStorage.getItem('osmLastTab');
const validTabs = ['hoje','calendario','santoral','oracoes','biblioteca','sobre'];
const dailySuggestion = dailyPrayerSuggestion();
let pendingSharePrayer = null;
let state = { tab: 'hoje', angelus:dailySuggestion.key, detailId:null, search:'', devo:null, devoSub:null };
let readerScale = parseFloat(localStorage.getItem('osmReaderScale') || '1');
let lightMode = localStorage.getItem('osmTheme') !== 'dark';
function applyPreferences(){
  readerScale = Math.max(.76, Math.min(1.56, readerScale));
  document.documentElement.style.setProperty('--reader-scale', readerScale.toFixed(2));
  document.body.classList.toggle('light-mode', lightMode);
  document.documentElement.style.colorScheme = lightMode ? 'light' : 'dark';
  const themeMeta=document.querySelector('meta[name=theme-color]'); if(themeMeta) themeMeta.content=lightMode?'#f7f4ed':'#0c1827';
  const b=document.getElementById('themeBtn'); if(b) b.textContent = lightMode ? '☾' : '☼'; document.querySelectorAll('.reader-scale-value').forEach(rv=>rv.textContent=Math.round(readerScale*100)+'%');
}
function adjustFont(delta){
  readerScale=Math.max(.76,Math.min(1.56,readerScale+delta));
  localStorage.setItem('osmReaderScale',readerScale);
  applyPreferences();
}
function resetFont(){readerScale=1;localStorage.setItem('osmReaderScale',readerScale);applyPreferences();}
function openMainMenu(){const o=document.getElementById('mainMenuOverlay');if(o){o.classList.add('open');o.setAttribute('aria-hidden','false');applyPreferences();if(typeof updateBackButton==='function')updateBackButton();}}
function closeMainMenu(){const o=document.getElementById('mainMenuOverlay');if(o){o.classList.remove('open');o.setAttribute('aria-hidden','true');if(typeof updateBackButton==='function')updateBackButton();}}
function toggleTheme(){ lightMode=!lightMode; localStorage.setItem('osmTheme', lightMode?'light':'dark'); applyPreferences(); const frame=document.getElementById('serviteFrame'); try{frame?.contentDocument?.documentElement?.setAttribute('data-theme',lightMode?'light':'dark');}catch(e){} }
function getCapacitorPlugin(name){
  const capacitor=window.Capacitor;
  if(!capacitor)return null;
  if(capacitor.Plugins?.[name])return capacitor.Plugins[name];
  if(typeof capacitor.registerPlugin==='function'){try{return capacitor.registerPlugin(name);}catch(error){console.warn('[Liturgia OSM] Plugin indisponível: '+name,error);}}
  return null;
}


function setTab(tab){
  if(tab==='vida') tab='hoje';
  const allowed=['hoje','calendario','santoral','liturgia','oracoes','biblioteca','sobre'];
  if(!allowed.includes(tab)) return;
  state.tab=tab;
  localStorage.setItem('osmLastTab',tab);
  state.detailId=null;state.devo=null;state.devoSub=null;
  state.prayerSection='praticas';state.prayerCategory=null;memoriaSelectedDate=null;
  render();window.scrollTo(0,0);
}

function openDetail(id){
  const saint=SANTORAL.find(x=>x._id===id||x.id===id);
  if(!saint) return;
  if(state.detailId===null||state.detailId===undefined){
    state.detailOriginTab=state.tab==='vida'?'hoje':(state.tab||'hoje');
    state.detailOriginScroll=window.scrollY||0;
  }
  state.detailId=saint._id;state.devo=null;state.devoSub=null;
  render();window.scrollTo(0,0);
}

function closeDevo(){
  if(state.devoSub !== null){ state.devoSub = null; }
  else { state.devo = null; }
  render();
  window.scrollTo(0,0);
}


function formatLiturgicalDate(date=new Date()){
  return date.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function dailyOSMInfo(date=new Date()){
  const matches=SANTORAL.filter(x=>x.day===date.getDate() && x.month===date.getMonth()+1);
  return {date, matches, prayer:dailyPrayerSuggestion(date)};
}
function dailyOSMCard(){
  const d=dailyOSMInfo();
  const feast=d.matches[0];
  if(feast){
    return `<div class="daily-panel fade-in">
      <div class="daily-kicker">Liturgia OSM do dia</div>
      <h3>${escapeHtml(feast.title)}</h3>
      <div class="daily-meta">${escapeHtml(feast.date)} · ${escapeHtml(feast.rank||'Celebração própria')}</div>
      <div class="daily-actions">
        <button onclick="openDetail(${feast._id})">Abrir celebração</button>
        <button onclick="shareSaint(${feast._id})">Partilhar</button>
      </div>
    </div>`;
  }
  const next=findNextSaint();
  return `<div class="daily-panel fade-in">
    <div class="daily-kicker">Liturgia OSM do dia</div>
    <h3>Dia sem celebração própria OSM</h3>
    <div class="daily-meta">Consulte o calendário litúrgico local para a celebração universal do dia. A próxima memória própria cadastrada é ${escapeHtml(next.title)}, em ${escapeHtml(next.date)}.</div>
    <div class="daily-actions"><button onclick="setTab('calendario')">Abrir calendário OSM</button></div>
  </div>`;
}

// ===================== views =====================
function viewHoje(){
  const today=todayInfo();
  const saint=findSaintForToday();
  const next=saint?null:findNextSaint();
  const celebration=saint||next;
  const online=navigator.onLine!==false;
  let celebrationCard='<div class="empty-state">Não há celebração servita cadastrada para hoje.</div>';
  if(celebration){
    const label=saint?'Celebração de hoje':'Próxima celebração';
    celebrationCard='<button class="home-celebration card fade-in" onclick="openDetail('+celebration._id+')" aria-label="Abrir '+escapeHtml(celebration.title)+'">'+
      saintImageHtml(celebration,false)+
      '<span class="home-celebration-text"><span class="rank">'+label+'</span><b>'+escapeHtml(celebration.title)+'</b><span class="date-line">'+escapeHtml(celebration.date)+'</span></span><span class="chev">›</span></button>'+
      '<div class="hub-shortcuts" aria-label="Atalhos da celebração">'+
      '<button onclick="openSaintSection('+celebration._id+',\'vida\')">Vida</button>'+
      '<button onclick="openSaintSection('+celebration._id+',\'liturgia\')">Liturgia</button>'+
      '<button onclick="openSaintSection('+celebration._id+',\'oracao\')">Oração</button></div>';
  }
  const prayer=dailyPrayerSuggestion();
  return '<div class="connection-strip '+(online?'':'offline')+'"><span class="connection-dot"></span><strong>'+(online?'Aplicativo disponível':'Modo offline ativo')+'</strong><span>Conteúdo salvo no aparelho</span></div>'+
    '<section class="liturgical-hero home-hero fade-in"><div class="liturgical-kicker">Ordem dos Servos de Maria</div><div class="home-date-line"><strong>'+today.day+'</strong><span>'+escapeHtml(MONTHS[today.month-1])+'</span></div><div class="liturgical-sub">'+escapeHtml(today.weekday)+'</div></section>'+
    '<div class="section-title home-heading">Celebração Servita</div>'+celebrationCard+
    '<div class="section-title home-heading">Encontrar uma celebração</div><div class="home-actions fade-in">'+
      '<button class="home-action" onclick="setTab(\'calendario\')"><span class="home-action-icon">▦</span><b>Calendário</b><small>Escolha qualquer data</small></button>'+
      '<button class="home-action" onclick="setTab(\'santoral\')"><span class="home-action-icon">✦</span><b>Santoral</b><small>Todos os santos e beatos OSM</small></button></div>'+
    '<div class="section-title home-heading">Liturgia de hoje</div><div class="presidency-grid fade-in">'+
      '<button class="presidency-card" onclick="openLiturgiaSection(\'missa\')"><span class="presidency-icon">✠</span><b>Missa do dia</b><small>Consulta online com cópia offline</small></button>'+
      '<button class="presidency-card" onclick="openLiturgiaSection(\'horas\')"><span class="presidency-icon">☷</span><b>Liturgia das Horas</b><small>Ofício do dia e textos próprios OSM</small></button></div>'+
    '<div class="section-title home-heading">Oração diária</div><div class="home-prayer-card card fade-in"><div><span class="rank">'+escapeHtml(prayer.label)+'</span><h3>'+(state.angelus==='rainha'?'Rainha do Céu':'O Anjo do Senhor')+'</h3><p>'+escapeHtml(prayer.note)+'</p></div><button class="action-btn" onclick="openDailyPrayer480(\''+escapeHtml(state.angelus)+'\')">Rezar</button></div>'+
    '<p class="offline-note"><b>Observação:</b> textos já baixados ficam disponíveis sem internet; a primeira consulta da Missa exige conexão.</p>';
}

function officeDateKey(s){return String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0');}
function officeRecordForSaint(s){
  if(!s||!OFICIOS_OSM?.celebracoes)return null;
  const key=officeDateKey(s),record=OFICIOS_OSM.celebracoes[key];
  return record&&Number(record.id)===Number(s.id)?record:null;
}
function saintHasOffice(s){
  const record=officeRecordForSaint(s);
  return !!record&&record.tipo_material!=='sem_material_proprio'&&!!record.material;
}
function officeClassificationForSaint(s){
  const record=officeRecordForSaint(s);
  if(!record)return '';
  if(record.tipo_material==='oficio_proprio')return 'Ofício próprio';
  if(record.tipo_material==='textos_proprios'){
    const hours=record.material?.horas||{};
    const keys=Object.entries(hours).filter(([,value])=>value&&(typeof value==='string'?value:value.texto||value.text)).map(([key])=>key);
    if(keys.length===1&&keys[0]==='oficio_leituras')return 'Ofício das Leituras próprio';
    if(keys.length===2&&keys.includes('laudes')&&keys.includes('vesperas'))return 'Laudes e Vésperas próprias + Comum';
    return 'Elementos próprios + Comum';
  }
  return 'Sem material próprio';
}
const OFFICE_HOURS=[
  ['invitatorio','Invitatório'],
  ['oficio','Ofício das Leituras'],
  ['laudes','Laudes'],
  ['horaMedia','Hora Média'],
  ['vesperas','Vésperas']
];
function officeHoursForSaint(s){
  const record=officeRecordForSaint(s),hours=record?.material?.horas||{};
  const sourceKeys={invitatorio:'invitatorio',oficio:'oficio_leituras',laudes:'laudes',horaMedia:'hora_media',vesperas:'vesperas'};
  const present=OFFICE_HOURS.filter(([key])=>{
    const item=hours[sourceKeys[key]];
    return !!(item&&(typeof item==='string'?item:item.texto||item.text));
  });
  if(present.length)return present;
  return hours.textos_proprios?[['oficio','Textos próprios']]:[];
}
function officeHourTextForSaint(s,key){
  const hours=officeRecordForSaint(s)?.material?.horas||{};
  const sourceKeys={invitatorio:'invitatorio',oficio:'oficio_leituras',laudes:'laudes',horaMedia:'hora_media',vesperas:'vesperas'};
  const value=hours[sourceKeys[key]]||hours.textos_proprios;
  return typeof value==='string'?value:String(value?.texto||value?.text||'');
}
function officeHourIsAntiphonOnly(s,key){
  if(!['laudes','vesperas'].includes(key))return false;
  const text=officeHourTextForSaint(s,key);
  if(!text||!/^\s*Ant\./im.test(text))return false;
  const remaining=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).filter(line=>
    !/^(?:C[âa]ntico evang[eé]lico(?:\s*\([^)]*\))?|Ant\.?\s*\d*|Antífona(?:\s*\d*)?)\s*.*$/i.test(line)
  );
  return remaining.length===0;
}
function officeHourButtonHtml(s,pair,className='office-hour-btn'){
  const [key,label]=pair;
  const saintId=Number(s?._id);
  const short=officeHourIsAntiphonOnly(s,key);
  const symbols={invitatorio:'✦',oficio:'▤',laudes:'☀',horaMedia:'◷',vesperas:'☾'};
  const canticle=key==='laudes'?'Benedictus':'Magnificat';
  const note=short?`<em class="office-hour-note">Próprio: antífona · inclui ${canticle}</em>`:'';
  return `<button class="${className} office-hour-choice" aria-label="Abrir ${escapeHtml(label)}${short?' — antífona própria; '+canticle+' incluído':''}" onclick="openSantoralOfficeHour(${saintId},'${key}')"><span class="office-hour-icon" aria-hidden="true">${symbols[key]||'✦'}</span><span class="office-hour-copy"><small>Hora litúrgica própria</small><strong>${escapeHtml(label)}</strong>${note}</span><span class="office-hour-arrow" aria-hidden="true">›</span></button>`;
}
function openSantoralOfficeHour(saintId,hour){
  const saint=SANTORAL.find(x=>x._id===saintId);
  const record=officeRecordForSaint(saint);
  if(!record||!saintHasOffice(saint)) return;
  const available=officeHoursForSaint(saint);
  const actual=available.some(([key])=>key===hour)?hour:(available[0]?.[0]||'oficio');
  openServite('oficio:'+record.id+':'+actual);
  const label=(available.find(x=>x[0]===actual)||OFFICE_HOURS.find(x=>x[0]===actual)||[])[1]||'Ofício';
  const title=document.getElementById('serviteTitle');
  if(title) title.textContent=(saint?saint.title+' — ':'')+label;
}
function calendarCelebrationRow(s){
  const hasOffice=saintHasOffice(s);
  return `<article class="calendar-celebration-row">
    ${saintImageHtml(s,false)}
    <div class="daynum">${s.day}</div>
    <div class="rowtext">
      <div class="rowtitle">${escapeHtml(s.title)}</div>
      <div class="rowrank">${escapeHtml(saintRankSubtitle(s)||'Celebração OSM')}${hasOffice?' · '+escapeHtml(officeClassificationForSaint(s)):oficiosReady?' · Sem material próprio':' · Ofício indisponível'}</div>
    </div>
    <div class="calendar-entry-actions">
      <button onclick="openSaint(${s._id})">Santoral</button>
      ${hasOffice?`<button class="office" onclick="openSantoralOfficeHour(${s._id},'${officeHoursForSaint(s)[0]?.[0]||'oficio'}')">Ofício</button>`:''}
    </div>
  </article>`;
}

function viewSantoral(){if(state.detailId!==null)return viewSaintDetail(state.detailId);let letters=[...new Set(SANTORAL.map(s=>s.title.replace(/^(SANTO|SANTA|B\.|BEATO|BEATA)\s+/i,'').trim()[0].toUpperCase()))].sort();let alpha=state.alpha||'';let q=state.search.trim().toLowerCase();let list=SANTORAL.filter(s=>(!q||(s.title+' '+s.date).toLowerCase().includes(q))&&(!alpha||s.title.replace(/^(SANTO|SANTA|B\.|BEATO|BEATA)\s+/i,'').trim().toUpperCase().startsWith(alpha)));let rows=list.map(s=>`<div class="saint-row" onclick="openSaint(${s._id})">${saintImageHtml(s,false)}<div class="daynum">${s.day}</div><div class="rowtext"><div class="rowtitle">${escapeHtml(s.title)}</div><div class="rowrank">${escapeHtml(s.date)} · ${escapeHtml(saintRankSubtitle(s))}</div></div><div class="chev">›</div></div>`).join('');return `<div class="section-title">Índice do Santoral</div><div class="search-wrap"><input class="search-input" data-live-search="santoral" placeholder="Buscar santo, beato ou data…" value="${escapeHtml(state.search)}" oninput="liveSearchRender('santoral',this)"></div><div class="alpha-index"><button class="alpha-btn ${!alpha?'active':''}" onclick="state.alpha='';render()">•</button>${letters.map(l=>`<button class="alpha-btn ${alpha===l?'active':''}" onclick="state.alpha='${l}';render()">${l}</button>`).join('')}</div><div class="card fade-in" style="padding:6px 16px;">${rows||'<div class="empty-state">Nenhum nome encontrado.</div>'}</div>`}


function liveSearchRender(kind, el){
  const start=el.selectionStart, end=el.selectionEnd;
  if(kind==='santoral'){ state.search=el.value; state.alpha=''; }
  else { globalQuery=el.value; }
  render();
  requestAnimationFrame(function(){
    const n=document.querySelector('input[data-live-search="'+kind+'"]');
    if(n){
      n.focus({preventScroll:true});
      try{ n.setSelectionRange(start,end); }catch(e){}
    }
  });
}

function onSearch(val){ state.search=val; render(); }

function viewDetail(id){
  const s = SANTORAL.find(x=>x._id===id);
  if(!s) return `<div class="no-results">Não encontrado.</div>`;
  return `
    <button class="back-btn" onclick="closeDetail()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      Voltar
    </button>
    ${saintImageHtml(s,true)}
    <div class="detail-header fade-in">
      ${saintRankSubtitle(s)?`<div class="rank">${escapeHtml(saintRankSubtitle(s))}</div>`:''}
      <h2>${escapeHtml(s.title)}</h2>
      <div class="date-line">${escapeHtml(s.date)}</div>
      <div class="action-row"><button class="action-btn" onclick="shareSaint(${s._id})">Partilhar celebração</button></div>
      <div class="detail-divider"></div>
    </div>
    <div class="bio-text fade-in">${escapeHtml(s.bio)}</div>
    ${s.prayer ? `
    <div class="prayer-card fade-in">
      <div class="label">Oração</div>
      <div class="text">${escapeHtml(s.prayer)}</div>
    </div>` : ''}
    ${saintHasOffice(s) ? `
    <div class="section-title" style="margin-top:28px;">Liturgia das Horas</div>
    <div class="card office-hours-card fade-in">
      <div class="office-hours-intro">${officeClassificationForSaint(s)}</div>
      <div class="office-hours-grid">
        ${officeHoursForSaint(s).map(pair=>officeHourButtonHtml(s,pair)).join('')}
      </div>
    </div>` : ''}
  `;
}

function closeDetail(){
  if(state.detailId===null||state.detailId===undefined) return;
  const origin=['hoje','calendario','santoral','liturgia','oracoes'].includes(state.detailOriginTab)?state.detailOriginTab:'santoral';
  state.detailId=null;state.devo=null;state.devoSub=null;
  state.tab=origin;state.prayerSection='praticas';
  localStorage.setItem('osmLastTab',origin);
  render();requestAnimationFrame(function(){window.scrollTo(0,state.detailOriginScroll||0);});
}
function viewOracoesBase480(){
  if(state.devo) return viewDevoDetail(state.devo);

  return `
    
    <div class="section-title">Práticas marianas diárias</div>
    <div class="card fade-in">
      <div class="toggle-row">
        <button class="toggle-btn ${state.angelus==='anjo'?'active':''}" onclick="openDailyPrayer480('anjo')">O Anjo do Senhor</button>
        <button class="toggle-btn ${state.angelus==='rainha'?'active':''}" onclick="openDailyPrayer480('rainha')">Rainha do Céu</button>
      </div>
      <div class="prayer-block">${renderPrayer(state.angelus==='anjo' ? PRAYERS.daily.anjo : PRAYERS.daily.rainha)}</div>
    </div>

    <div class="section-title">Homenagens marianas</div>
    <div class="card fade-in" style="padding:6px 16px;">
      ${DEVO_LIST.map(devoRowHtml).join('')}
    </div>

    <div class="section-title">Recursos de oração servita</div>
    <div class="quick-grid fade-in">
      <button class="quick-card" onclick="openServite('rosario')"><b>Rosário</b><span>Rosário guiado</span></button>
      <button class="quick-card" onclick="openServite('regra')"><b>Regra OSSM</b><span>Espiritualidade da Ordem Secular</span></button>
    </div>

    <div class="section-title">Orações várias</div>
    <div class="card fade-in" style="padding:6px 16px;">
      ${VARIAS_LIST.map(devoRowHtml).join('')}
    </div>
  `;
}

let dailyPrayerOpen480 = null;

function openDailyPrayer480(which){
  dailyPrayerOpen480 = which;
  state.tab = 'oracoes';
  state.devo = null;
  state.devoSub = null;
  state.angelus = which;
  localStorage.setItem('osmLastTab','oracoes');
  render();
  window.scrollTo(0,0);
}
function closeDailyPrayer480(){
  dailyPrayerOpen480 = null;
  render();
  window.scrollTo(0,0);
}
function viewDailyPrayer480(which){
  const isRegina = which === 'rainha';
  const title = isRegina ? 'Rainha do Céu (Regina Caeli)' : 'O Anjo do Senhor';
  const text = isRegina ? PRAYERS.daily.rainha : PRAYERS.daily.anjo;
  return `
    <div class="detail-header fade-in">
      <button class="back-btn" onclick="closeDailyPrayer480()">←</button>
      <div><div class="detail-title">${title}</div><div class="detail-date">${isRegina?'Tempo Pascal':'Prática mariana diária'}</div></div>
    </div>
    <div class="card fade-in">
      <div class="prayer-block">${renderPrayer(text)}</div>
    </div>`;
}
function viewOracoes(){
  if(dailyPrayerOpen480) return viewDailyPrayer480(dailyPrayerOpen480);
  return viewOracoesBase480();
}


function setAngelus(which){ state.angelus = which; render(); }

// ---- devotion detail router ----
function viewDevoDetail(key){
  if(key.startsWith('varias')){
    const idx = parseInt(key.slice('varias'.length));
    const item = PRAYERS.devotions.variasHome[idx];
    return simpleTextDetail(item.title, '', item.text);
  }
  if(key === 'coroa') return simpleTextDetail('Coroa de Nossa Senhora das Dores', 'Sete dores de Maria', PRAYERS.devotions.coroa);
  if(key === 'stabat') return simpleTextDetail('Stabat Mater', 'Hino da Mãe dolorosa', PRAYERS.devotions.stabat);
  if(key === 'vigilia') return viewVigilia();
  if(key === 'via_matris') return viewViaMatris();
  if(key === 'ladainhas') return viewLadainhas();
  return `<div class="no-results">Não encontrado.</div>`;
}

function backToOracoes(){ state.devo=null; state.devoSub=null; render(); window.scrollTo(0,0); }

function simpleTextDetail(title, sub, text, backFn){
  pendingSharePrayer={title,text};
  const back = backFn || 'backToOracoes()';
  return `
    <button class="back-btn" onclick="${back}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      Voltar
    </button>
    <div class="detail-header fade-in" style="position:relative;">${favButton('prayer',state.devo||title)}
      <h2 style="font-size:26px;">${escapeHtml(title)}</h2>
      ${sub ? `<div class="date-line">${escapeHtml(sub)}</div>` : ''}
      <div class="action-row"><button class="action-btn" id="sharePrayerBtn">Partilhar oração</button></div>
      <div class="detail-divider"></div>
    </div>
    <div class="card fade-in">
      <div class="prayer-block">${renderPrayer(text)}</div>
    </div>
  `;
}

// ---- Vigília (2 formulas) ----
function viewVigilia(){
  if(state.devoSub){
    const f = PRAYERS.devotions.vigilia[state.devoSub];
    const title = state.devoSub === 'formula1' ? 'Primeira Fórmula' : 'Segunda Fórmula';
    return simpleTextDetail(title, 'Vigília de Nossa Senhora', f, "openDevo('vigilia')");
  }
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      Voltar
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:26px;">Vigília de Nossa Senhora</h2>
      <div class="date-line">Uma das homenagens mais antigas dos Servos a Santa Maria</div>
      <div class="detail-divider"></div>
    </div>
    <div class="card fade-in" style="padding:6px 16px;">
      <div class="saint-row" onclick="openDevo('vigilia','formula1')">
        <div class="rowtext"><div class="rowtitle">Primeira Fórmula</div><div class="rowrank">Santa Maria, Senhora dos seus Servos</div></div>
        <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </div>
      <div class="saint-row" onclick="openDevo('vigilia','formula2')">
        <div class="rowtext"><div class="rowtitle">Segunda Fórmula</div><div class="rowrank">Santa Maria, Serva do Senhor</div></div>
        <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </div>
    </div>
  `;
}

// ---- Via Matris (intro + 7 stations) ----
function viewViaMatris(){
  const vm = PRAYERS.devotions.via_matris;
  if(state.devoSub !== null){
    const st = vm.stations[state.devoSub];
    return simpleTextDetail(st.title, 'Via Matris — Novena das Dores', st.text, "openDevo('via_matris')");
  }
  const rows = vm.stations.map((s,i)=>`
    <div class="saint-row" onclick="openDevo('via_matris', ${i})">
      <div class="daynum" style="font-size:16px;">${i+1}</div>
      <div class="rowtext"><div class="rowtitle">${escapeHtml(s.title.split('—')[1]||s.title)}</div></div>
      <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    </div>`).join('');
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      Voltar
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:26px;">Via Matris</h2>
      <div class="date-line">Novena perpétua de Nossa Senhora das Dores</div>
      <div class="detail-divider"></div>
    </div>
    <div class="card fade-in" style="margin-bottom:14px;">
      <div class="bio-text" style="font-size:16px;">${escapeHtml(vm.intro.slice(0,420))}…</div>
    </div>
    <div class="section-title">As sete dores</div>
    <div class="card fade-in" style="padding:6px 16px;">${rows}</div>
  `;
}

// ---- Ladainhas (3 items) ----
function viewLadainhas(){
  const list = PRAYERS.devotions.ladainhas;
  if(state.devoSub !== null){
    const l = list[state.devoSub];
    return simpleTextDetail(l.title, 'Ladainha mariana', l.text, "openDevo('ladainhas')");
  }
  const rows = list.map((l,i)=>`
    <div class="saint-row" onclick="openDevo('ladainhas', ${i})">
      <div class="rowtext"><div class="rowtitle">${escapeHtml(l.title)}</div></div>
      <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    </div>`).join('');
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      Voltar
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:26px;">Ladainhas Marianas</h2>
      <div class="date-line">Três ladainhas próprias da espiritualidade servita</div>
      <div class="detail-divider"></div>
    </div>
    <div class="card fade-in" style="padding:6px 16px;">${rows}</div>
  `;
}

function viewSobre(){
  return `
    <div class="section-title">Sobre o aplicativo</div>
    <div class="card fade-in about-text">
      <p><b>Liturgia OSM</b> reúne conteúdos próprios da Ordem dos Servos de Maria, favorecendo a oração, a memória litúrgica, a espiritualidade mariana e o acesso aos principais recursos servitas.</p>
    </div>

    <div class="section-title">Criação do aplicativo</div>
    <div class="card fade-in credit-list app-creator-card">
      <div><b>Criação:</b> WENDEL MASSAYUKI SANTOS OKUYAMA</div>
      <div><b>Aplicativo:</b> Liturgia OSM</div>
      <div><b>Versão:</b> ${APP_VERSION}</div>
    </div>

    <div class="section-title">Redes sociais da Ordem</div>
    <div class="social-links fade-in">
      <a class="social-link" href="https://youtube.com/@savosmbrasil?si=Pcn71bJ212PwwLuY" target="_blank" rel="noopener noreferrer" onclick="return openExternalLink(event, this.href)">
        <span class="social-icon">▶</span>
        <span><div class="social-label">YouTube — Servos de Maria Brasil</div><div class="social-sub">@savosmbrasil</div></span>
      </a>
      <a class="social-link" href="https://www.instagram.com/ordem.servitas?igsh=OHI4cGg3c3l2NGIx&igsi=OHI4cGg3c3l2NGIx" target="_blank" rel="noopener noreferrer" onclick="return openExternalLink(event, this.href)">
        <span class="social-icon">◎</span>
        <span><div class="social-label">Instagram — Ordem dos Servitas</div><div class="social-sub">@ordem.servitas</div></span>
      </a>
    </div>

    <div class="section-title">Ficha da edição</div>
    <div class="card fade-in credit-list">
      <div><b>Título original:</b> "Preghiere"</div>
      <div><b>Organização:</b> Consiglio Nazionale OSSM, Roma, 1988</div>
      <div><b>Tradução:</b> frei José M. Milanez, osm (in memoriam)</div>
      <div><b>Edição:</b> 3ª edição revisada, 2024</div>
      <div><b>Publicação:</b> Ordem dos Servos de Maria — Província São Peregrino do Brasil</div>
      <div><b>Sede:</b> Cúria Provincial dos Servos de Maria, São José dos Campos - SP</div>
      <div><b>Site:</b> servitasbra.org</div>
    </div>
  `;
}

// ===================== router =====================
function openExternalLink(event, url){
  if(event) event.preventDefault();
  if(!navigator.onLine){
    showToast('Este link precisa de conexão com a internet.');
    return false;
  }
  try{
    const browser = getCapacitorPlugin('Browser');
    if(browser?.open){
      browser.open({url});
      return false;
    }
  }catch(error){
    console.warn("Não foi possível usar o navegador nativo.", error);
  }
  window.open(url, "_blank", "noopener,noreferrer");
  return false;
}

let MEMORIA_LITURGICA={};
let memoriaSelectedDate=null;
function setPrayerSection(section){
  state.prayerSection=section;
  state.devo=null; state.devoSub=null; memoriaSelectedDate=null;
  render(); window.scrollTo(0,0);
}
function openMemoriaLiturgica(date){
  state.prayerSection='memoria'; state.devo=null; state.devoSub=null;
  memoriaSelectedDate=date; render(); window.scrollTo(0,0);
}
function closeMemoriaLiturgica(){
  memoriaSelectedDate=null; render(); window.scrollTo(0,0);
}
function viewMemoriaLiturgica(){
  const data=MEMORIA_LITURGICA;
  if(!Array.isArray(data.memory_dates)) return '<div class="empty-state">Carregando a Memória Litúrgica…</div>'; 
  if(memoriaSelectedDate){
    const item=data.celebrations.find(x=>x.date===memoriaSelectedDate);
    const saint=SANTORAL.find(s=>String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0')===memoriaSelectedDate);
    if(!data.memory_dates.includes(memoriaSelectedDate)||!saint) return '<div class="empty-state">Não há Memória Litúrgica cadastrada para esta celebração.</div>';
    const heading=saint.title,life=item?.breve_vida||item?.apresentacao||'',prayer=item?.oracao_propria||saint.prayer||'';
    const textBlock=(title,text)=>text?`<div class="section-title">${title}</div><div class="card fade-in"><div class="prayer-block" style="white-space:pre-wrap;">${escapeHtml(text)}</div></div>`:'';
    const commonSource=`<p class="reader-note">Fonte dos textos comuns: ${escapeHtml(data.source)}.</p>`;
    const prayerSource=item?.oracao_propria?'Livro de Oração dos Servos de Maria, seção Memória Litúrgica.':'Santoral da Ordem.';
    return `<button class="back-btn" onclick="closeMemoriaLiturgica()">← Voltar à Memória Litúrgica</button>
      <div class="detail-header fade-in"><h2>${escapeHtml(heading)}</h2><div class="date-line">${escapeHtml(saint.date)}</div></div>
      ${textBlock('Hino',data.common.hino)}${textBlock('Antífona',data.common.antifona)}${textBlock('Salmo 111',data.common.salmo)}
      ${commonSource}${(item?.source_note||data.editorial_notes?.[memoriaSelectedDate])?`<p class="reader-note">Nota da fonte: ${escapeHtml(item?.source_note||data.editorial_notes[memoriaSelectedDate])}</p>`:''}${textBlock(item?.breve_vida?'Breve vida':'Apresentação',life)}
      ${textBlock('Oração própria',prayer)}<p class="reader-note">Fonte da oração: ${escapeHtml(prayerSource)}</p>`;
  }
  const rows=data.memory_dates.map(date=>{
    const saint=SANTORAL.find(s=>String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0')===date);
    return saint?`<div class="saint-row" onclick="openMemoriaLiturgica('${date}')"><div class="daynum">${saint.day}</div><div class="rowtext"><div class="rowtitle">${escapeHtml(saint.title)}</div><div class="rowrank">${escapeHtml(saint.date)} · Livro de Oração</div></div><div class="chev">›</div></div>`:'';
  }).join('');
  return `<div class="section-title">Memória Litúrgica</div>
    <p class="reader-note">Roteiro próprio do Livro de Oração dos Servos de Maria: hino, antífona, salmo, breve vida e oração própria.</p>
    <div class="card fade-in" style="padding:6px 16px;">${rows}</div>`;
}
function viewVida(){
  if(state.detailId!==null) return viewSantoral();
  const current=state.tab==='calendario'?'calendario':state.tab==='santoral'?'santoral':'hoje';
  const tabs=`<div class="toggle-row" aria-label="Seções de Vida">
    <button class="toggle-btn ${current==='hoje'?'active':''}" onclick="setTab('hoje')">Hoje</button>
    <button class="toggle-btn ${current==='calendario'?'active':''}" onclick="setTab('calendario')">Calendário</button>
    <button class="toggle-btn ${current==='santoral'?'active':''}" onclick="setTab('santoral')">Santoral</button>
  </div>`;
  return tabs+(current==='calendario'?viewCalendario():current==='santoral'?viewSantoral():viewHoje());
}
function setLiturgiaSection(section){state.liturgiaSection=section;render();window.scrollTo(0,0);}
function viewLiturgia(){
  const section=state.liturgiaSection||'missa';
  const switcher=`<div class="toggle-row" aria-label="Seções de Liturgia">
    <button class="toggle-btn ${section==='missa'?'active':''}" onclick="setLiturgiaSection('missa')">Missa</button>
    <button class="toggle-btn ${section==='horas'?'active':''}" onclick="setLiturgiaSection('horas')">Liturgia das Horas</button>
  </div>`;
  if(section==='horas'){
    const saints=SANTORAL.filter(s=>saintHasOffice(s));
    const todayBlock='<div class="card fade-in"><div class="rowtitle">Liturgia das Horas de hoje</div><p class="reader-note">'+escapeHtml(formatLiturgicalDate())+'</p><button class="action-btn" onclick="openServite(\'oficio\')">Abrir Ofício de hoje</button></div>';
    const officeWarning=!oficiosReady?'<div class="card" role="alert"><p>O cadastro local dos Ofícios está indisponível. A Vida e as orações continuam acessíveis.</p><button class="action-btn" onclick="loadCanonicalOffices()">Tentar carregar os Ofícios</button></div>':'';
    const ownBlocks='<div class="section-title">Ofícios e textos próprios OSM</div><p class="reader-note">A celebração do santo abre somente as horas disponíveis no texto.</p>'+
      '<div class="card fade-in" style="padding:6px 16px;">'+saints.map(function(s){return '<div class="saint-row saint-row-hours"><div class="daynum">'+s.day+'</div><div class="rowtext"><div class="rowtitle">'+escapeHtml(s.title)+'</div><div class="rowrank">'+escapeHtml(s.date)+'</div></div><div class="office-hours-grid">'+officeHoursForSaint(s).map(function(pair){return officeHourButtonHtml(s,pair);}).join('')+'</div></div>';}).join('')+'</div>';
    return switcher+'<div class="section-title">Liturgia das Horas</div>'+officeWarning+todayBlock+(oficiosReady?ownBlocks:'');
  }
  const d=new Date(), value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  return switcher+`<div class="section-title">Missa</div><p class="reader-note">Liturgia da Missa do dia, com consulta por data e cópia offline quando disponível.</p>
    <div class="card fade-in"><button class="action-btn" onclick="openDailyLiturgy('${value}')">Abrir Missa do dia</button></div>`;
}

function render(){
  const view=document.getElementById('view');
  if(!view) return;
  if(!santoralReady){
    view.innerHTML=santoralLoadError
      ? '<div class="card" role="alert"><h2>Santoral indisponível</h2><p>Não foi possível carregar os dados canônicos. Verifique a conexão e tente novamente.</p><button class="action-btn" onclick="loadCanonicalSantoral();loadCanonicalOffices()">Tentar novamente</button></div>'
      : '<div class="card" role="status">Carregando os dados litúrgicos canônicos…</div>';
    return;
  }
  let html='';
  if(state.detailId!==null&&state.detailId!==undefined){
    html=window.renderCelebrationHub?window.renderCelebrationHub(state.detailId):'<div class="empty-state">Carregando a celebração…</div>';
  }else if(['vida','hoje','calendario','santoral'].includes(state.tab)) html=viewVida();
  else if(state.tab==='liturgia') html=viewLiturgia();
  else if(state.tab==='oracoes') html=viewOracoes();
  else if(state.tab==='biblioteca') html=viewBiblioteca();
  else html=viewSobre();
  view.innerHTML=html;
  const activeTab=['vida','hoje','calendario','santoral'].includes(state.tab)?'vida':state.tab;
  document.querySelectorAll('#tabbar .tab-btn').forEach(function(button){
    const active=button.dataset.tab===activeTab;
    button.classList.toggle('active',active);
    button.setAttribute('aria-current',active?'page':'false');
  });
  const share=document.getElementById('sharePrayerBtn');
  if(share&&pendingSharePrayer) share.onclick=function(){sharePrayer(pendingSharePrayer.title,pendingSharePrayer.text);};
  if(typeof applyMainLanguage==='function') applyMainLanguage();
  if(typeof updateBackButton==='function') updateBackButton();
  if(typeof window.updateCelebrationButton==='function') window.updateCelebrationButton();
}
document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=> setTab(b.dataset.tab));
});


// ===================== Liturgia OSM 4.2 =====================
let calDate = new Date();
let selectedCalDate = null;
let globalQuery = '';
let libraryMode = 'todos';
let prayerCategory = null;
const FAV_KEY='osmFavoritesV4', RECENT_KEY='osmRecentV4';
function loadJSON(k,d){try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
function favs(){return loadJSON(FAV_KEY,[])}
function recents(){return loadJSON(RECENT_KEY,[])}
function itemKey(type,key){return type+':'+key}
function isFav(type,key){return favs().includes(itemKey(type,key))}
function toggleFav(type,key){let a=favs(),k=itemKey(type,key);a=a.includes(k)?a.filter(x=>x!==k):[k,...a];saveJSON(FAV_KEY,a);render()}
function addRecent(type,key,title,sub=''){let a=recents().filter(x=>x.k!==itemKey(type,key));a.unshift({k:itemKey(type,key),type,key,title,sub,ts:Date.now()});saveJSON(RECENT_KEY,a.slice(0,12))}
function favButton(type,key){return `<button class="favorite-btn ${isFav(type,key)?'active':''}" onclick="event.stopPropagation();toggleFav('${type}','${String(key).replace(/'/g,"\\'")}')" aria-label="Favorito">${isFav(type,key)?'★':'☆'}</button>`}
function openSaint(id){
  const saint=SANTORAL.find(x=>x._id===id||x.id===id);
  if(!saint)return;
  addRecent('saint',saint._id,saint.title,saint.date);
  openDetail(saint._id);
}function openDevo(key, sub){ state.tab='oracoes'; localStorage.setItem('osmLastTab','oracoes'); state.detailId=null; state.devo=key; state.devoSub=(sub===undefined?null:sub); let title=key; try{ if(key.startsWith('varias')) title=PRAYERS.devotions.variasHome[parseInt(key.slice(6))].title; else title=(DEVO_LIST.find(x=>x.key===key)||{}).title||key; }catch(e){} addRecent('prayer',key,title,'Oração'); render(); window.scrollTo(0,0); }
function celebrationOrder(){
  return [...SANTORAL].sort((a,b)=>(a.month-b.month)||(a.day-b.day)||String(a.title).localeCompare(String(b.title),'pt-BR'));
}
function adjacentCelebration(id,delta){
  const ordered=celebrationOrder();
  const i=ordered.findIndex(x=>x._id===id);
  if(i<0) return null;
  const j=i+delta;
  return (j>=0&&j<ordered.length)?ordered[j]:null;
}
function viewSaintDetail(id){
  let h=viewDetail(id);
  h=h.replace('<div class="detail-header fade-in">',`<div class="detail-header fade-in" style="position:relative;">${favButton('saint',id)}`);
  const ordered=[...SANTORAL].sort((a,b)=>(a.month*100+a.day)-(b.month*100+b.day)),idx=ordered.findIndex(s=>s._id===id),prev=ordered[(idx-1+ordered.length)%ordered.length],next=ordered[(idx+1)%ordered.length];
  return h+`<div class="detail-navigation"><button onclick="openSaint(${prev._id})"><small>‹ Celebração anterior</small><b>${escapeHtml(prev.title)}</b></button><button onclick="openSaint(${next._id})"><small>Próxima celebração ›</small><b>${escapeHtml(next.title)}</b></button></div>`;
}
function allPrayerEntries(){
 const a=[
  {key:'daily-anjo',title:'O Anjo do Senhor',sub:'Prática mariana diária',text:PRAYERS.daily.anjo,open:"openDailyPrayer480('anjo')"},
  {key:'daily-rainha',title:'Rainha do Céu',sub:'Tempo Pascal',text:PRAYERS.daily.rainha,open:"openDailyPrayer480('rainha')"},
  ...DEVO_LIST.map(x=>({key:x.key,title:x.title,sub:x.sub||'Devoção mariana',text:'',open:`openDevo('${x.key}')`})),
  ...PRAYERS.devotions.variasHome.map((x,i)=>({key:'varias'+i,title:x.title,sub:'Orações diversas',text:x.text,open:`openDevo('varias${i}')`}))
 ]; return a;
}
function categoryOf(p){let t=(p.title+' '+p.sub).toLowerCase();if(/dor|matris|stabat|coroa/.test(t))return 'dores';if(/voca|miss|apost/.test(t))return 'missao';if(/defunt|doent|alegr|visita|refei|necess/.test(t))return 'comunidade';if(/ladain/.test(t))return 'ladainhas';if(/vigília|vigilia|anjo|rainha/.test(t))return 'diarias';return 'marianas'}
function globalResults(q){q=q.trim().toLowerCase();if(!q)return [];let rs=[];SANTORAL.forEach(s=>{let hay=(s.title+' '+s.date+' '+s.bio+' '+(s.prayer||'')).toLowerCase();if(hay.includes(q))rs.push({kind:'Santo / Beato',title:s.title,sub:s.date,action:`openSaint(${s._id})`})});allPrayerEntries().forEach(p=>{let hay=(p.title+' '+p.sub+' '+(p.text||'')).toLowerCase();if(hay.includes(q))rs.push({kind:'Oração',title:p.title,sub:p.sub,action:p.open})});return rs.slice(0,40)}
function resultRows(rs){if(!rs.length)return '<div class="empty-state">Nenhum resultado encontrado.</div>';return `<div class="card fade-in" style="padding:6px 16px;">${rs.map(r=>`<div class="saint-row" onclick="${r.action}"><div class="rowtext"><div class="result-kind">${escapeHtml(r.kind)}</div><div class="rowtitle">${escapeHtml(r.title)}</div><div class="rowrank">${escapeHtml(r.sub||'')}</div></div><div class="chev">›</div></div>`).join('')}</div>`}
function goCalendarToday(){
  const n=new Date(); calDate=new Date(n.getFullYear(),n.getMonth(),1); selectedCalDate=new Date(n.getFullYear(),n.getMonth(),n.getDate()); render();
}
function selectCalendarDay(y,m,d){ selectedCalDate=new Date(y,m,d); render(); }
window.calendarRankFilter='todos';
function rankClass(s){const r=(s?.rank||'').toLowerCase();if(r.includes('solenidade'))return 'solemnity';if(r.includes('beato'))return 'blessed';if(r.includes('servo'))return 'servant';return 'saint';}
function rankAllowed(s){return calendarRankFilter==='todos'||rankClass(s)===calendarRankFilter;}
  function viewCalendario(){
  let y=calDate.getFullYear(),m=calDate.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),today=new Date(),cells='';
  for(let i=0;i<first;i++)cells+='<div class="cal-day empty"></div>';
  for(let d=1;d<=days;d++){
    const all=SANTORAL.filter(s=>s.month===m+1&&s.day===d),ss=all.filter(rankAllowed),lead=ss[0],isT=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d,isSel=selectedCalDate&&selectedCalDate.getFullYear()===y&&selectedCalDate.getMonth()===m&&selectedCalDate.getDate()===d;
    cells+=`<button class="cal-day ${ss.length?'has-feast rank-'+rankClass(lead):''} ${isT?'today':''} ${isSel?'selected':''}" onclick="selectCalendarDay(${y},${m},${d})" aria-label="${d} de ${MONTHS[m]}${ss.length?', com celebração OSM':''}">${d}${ss.length?'<span class="cal-dot"></span>':''}</button>`;
  }
  const monthFeasts=SANTORAL.filter(s=>s.month===m+1&&rankAllowed(s));let dayBlock='';
  if(selectedCalDate&&selectedCalDate.getFullYear()===y&&selectedCalDate.getMonth()===m){const d=selectedCalDate.getDate(),selected=SANTORAL.filter(s=>s.month===m+1&&s.day===d&&rankAllowed(s));dayBlock=`<div class="section-title">${d} de ${MONTHS[m]}</div>${selected.length?`<div class="card fade-in" style="padding:6px 16px;">${selected.map(calendarCelebrationRow).join('')}</div>`:'<div class="empty-state">Não há celebração desta categoria neste dia.</div>'}`;}
  const filters=[['todos','Todas'],['solemnity','Solenidades'],['saint','Santos'],['blessed','Beatos'],['servant','Servos de Deus']];
  return `<div class="section-title">Calendário OSM</div><select class="calendar-month-select" aria-label="Selecionar mês" onchange="setCalendarMonth(this.value)">${MONTHS.map((n,i)=>`<option value="${i}" ${i===m?'selected':''}>${n[0].toUpperCase()+n.slice(1)} ${y}</option>`).join('')}</select><div class="calendar-filters">${filters.map(f=>`<button class="calendar-filter ${calendarRankFilter===f[0]?'active':''}" onclick="setCalendarFilter('${f[0]}')">${f[1]}</button>`).join('')}</div><div class="calendar-legend"><span><i class="sol"></i>Solenidade</span><span><i class="san"></i>Santo</span><span><i class="bea"></i>Beato</span><span><i class="ser"></i>Servo de Deus</span></div><div class="card fade-in"><div class="calendar-toolbar"><button class="cal-nav" onclick="calDate=new Date(${y},${m-1},1);selectedCalDate=null;render()" aria-label="Mês anterior">‹</button><div class="calendar-title">${MONTHS[m]} ${y}</div><button class="cal-nav" onclick="calDate=new Date(${y},${m+1},1);selectedCalDate=null;render()" aria-label="Próximo mês">›</button></div><button class="today-chip" onclick="goCalendarToday()">Ir para hoje</button><div class="calendar-grid">${['D','S','T','Q','Q','S','S'].map(x=>`<div class="cal-head">${x}</div>`).join('')}${cells}</div></div>${dayBlock}<div class="section-title">Celebrações do mês</div>${monthFeasts.length?`<div class="card fade-in" style="padding:6px 16px;">${monthFeasts.map(calendarCelebrationRow).join('')}</div>`:'<div class="empty-state">Não há celebrações desta categoria no mês.</div>'}`;
}
function viewOSMPlus(){return `<div class="section-title">Mais recursos OSM</div><div class="quick-grid fade-in"><button class="quick-card" onclick="openServite('regra')"><b>Regra OSSM</b><span>Regra e textos próprios da Ordem</span></button><button class="quick-card" onclick="openServite('rosario')"><b>Rosário</b><span>Rosário completo e modo guiado</span></button><button class="quick-card" onclick="openServite('coroa')"><b>Coroa das Sete Dores</b><span>Fórmulas e oração guiada</span></button><button class="quick-card" onclick="openServite('oficio')"><b>Ofício</b><span>Horas e textos litúrgicos próprios</span></button><button class="quick-card" onclick="openServite('sabado')"><b>Sábado Mariano</b><span>Textos e devoções marianas</span></button><button class="quick-card" onclick="openLanguagePanel()"><b>Idiomas</b><span>Recursos linguísticos do conteúdo servita</span></button></div>`}
function resolveStored(k){let [type,key]=k.split(':');if(type==='saint'){let s=SANTORAL.find(x=>String(x._id)===key);if(s)return {kind:'Santoral',title:s.title,sub:s.date,action:`openSaint(${s._id})`}}else{let p=allPrayerEntries().find(x=>x.key===key);if(p)return {kind:'Oração',title:p.title,sub:p.sub,action:prayerActionForKey(key)}}return null}
function prayerActionForKey(key){
 if(key==='daily-anjo') return "openDailyPrayer480('anjo')";
 if(key==='daily-rainha') return "openDailyPrayer480('rainha')";
 return `openDevo('${String(key).replace(/'/g,"\\'")}')`;
}
function viewBiblioteca(){let f=favs().map(resolveStored).filter(Boolean),r=recents().map(x=>({kind:x.type==='saint'?'Santoral':'Oração',title:x.title,sub:x.sub,action:x.type==='saint'?`openSaint(${x.key})`:prayerActionForKey(x.key)}));let search=globalQuery?globalResults(globalQuery):[];return `<div class="section-title">Biblioteca pessoal</div><div class="global-search"><input data-live-search="global" value="${escapeHtml(globalQuery)}" placeholder="Pesquisar santos e orações…" oninput="liveSearchRender('global',this)"><span class="glass">⌕</span></div><div class="library-pills"><button class="library-pill ${libraryMode==='todos'?'active':''}" onclick="libraryMode='todos';render()">Visão geral</button><button class="library-pill ${libraryMode==='favoritos'?'active':''}" onclick="libraryMode='favoritos';render()">Favoritos</button><button class="library-pill ${libraryMode==='recentes'?'active':''}" onclick="libraryMode='recentes';render()">Últimos acessados</button></div>${globalQuery?`<div class="section-title">Resultados</div>${resultRows(search)}`:`${libraryMode!=='recentes'?`<div class="section-title">Favoritos</div>${f.length?resultRows(f):'<div class="empty-state">Toque na estrela de uma oração ou celebração para guardá-la aqui.</div>'}`:''}${libraryMode!=='favoritos'?`<div class="section-title">Últimos acessados</div>${r.length?resultRows(r):'<div class="empty-state">Os conteúdos consultados aparecerão aqui.</div>'}`:''}`}`}
const MAIN_I18N={
 pt:{today:'Hoje',calendar:'Calendário',sanctoral:'Santoral',prayers:'Orações',library:'Biblioteca',resources:'Recursos Servitas',languages:'Idiomas',title:'Idioma',close:'Fechar'},
 la:{today:'Hodie',calendar:'Calendarium',sanctoral:'Sanctorale',prayers:'Preces',library:'Bibliotheca',resources:'Instrumenta Servorum Mariae',languages:'Lingua',title:'Lingua',close:'Claudere'},
 it:{today:'Oggi',calendar:'Calendario',sanctoral:'Santorale',prayers:'Preghiere',library:'Biblioteca',resources:'Risorse dei Servi di Maria',languages:'Lingue',title:'Lingua',close:'Chiudi'},
 en:{today:'Today',calendar:'Calendar',sanctoral:'Sanctoral',prayers:'Prayers',library:'Library',resources:'Servite Resources',languages:'Languages',title:'Language',close:'Close'}
};
let MAIN_LANG=localStorage.getItem('santoral-osm-lang')||'pt';
if(!MAIN_I18N[MAIN_LANG]) MAIN_LANG='pt';
function applyMainLanguage(){
  const d=MAIN_I18N[MAIN_LANG];
  const labels={pt:['Vida','Liturgia','Oração'],la:['Vita','Liturgia','Oratio'],it:['Vita','Liturgia','Preghiera'],en:['Life','Liturgy','Prayer']};
  const selected=labels[MAIN_LANG]||labels.pt;
  document.querySelectorAll('#tabbar .tab-btn span').forEach((el,i)=>{if(selected[i])el.textContent=selected[i]});
  document.querySelectorAll('.language-option').forEach(b=>b.classList.toggle('active',b.dataset.mainLang===MAIN_LANG));
  const a=document.getElementById('languageTitle'); if(a)a.textContent=d.title;
  const c=document.querySelector('.language-close'); if(c)c.textContent=d.close;
  document.querySelectorAll('.section-title').forEach(el=>{
    if(['Recursos Servitas','Instrumenta Servorum Mariae','Risorse dei Servi di Maria','Servite Resources'].includes(el.textContent.trim())) el.textContent=d.resources;
  });
  document.querySelectorAll('.quick-card b').forEach(el=>{
    if(['Idiomas','Lingua','Lingue','Languages'].includes(el.textContent.trim())) el.textContent=d.languages;
  });
}
function openLanguagePanel(){
  const o=document.getElementById('languageOverlay'); if(!o)return;
  applyMainLanguage(); o.classList.add('open'); o.setAttribute('aria-hidden','false');
}
function closeLanguagePanel(){
  const o=document.getElementById('languageOverlay'); if(!o)return;
  o.classList.remove('open'); o.setAttribute('aria-hidden','true');
}
function setMainLanguage(lang){
  if(!MAIN_I18N[lang])return;
  MAIN_LANG=lang;
  localStorage.setItem('santoral-osm-lang',lang);
  applyMainLanguage();
}


let APP_NAV_STACK=[];
let APP_LAST_TAB=state && state.tab ? state.tab : 'hoje';
function updateBackButton(){
  const button=document.getElementById('floatingBack');
  if(!button) return;
  const hasDetail=state.detailId!==null&&state.detailId!==undefined;
  const overlay=['serviteOverlay','languageOverlay','mainMenuOverlay','dailyLiturgyOverlay'].some(id=>document.getElementById(id)?.classList.contains('open'));
  const visible=hasDetail||!!state.devo||state.devoSub!==null&&state.devoSub!==undefined||!!dailyPrayerOpen480||overlay||state.tab!=='hoje';
  button.classList.toggle('show',visible);
  button.setAttribute('aria-label',hasDetail?'Voltar à origem':'Voltar para Hoje');
  button.title=hasDetail?'Voltar à origem':'Voltar para Hoje';
}

function smartBack(){
  const menu=document.getElementById('mainMenuOverlay');
  const language=document.getElementById('languageOverlay');
  const servite=document.getElementById('serviteOverlay');
  const mass=document.getElementById('dailyLiturgyOverlay');
  if(menu&&menu.classList.contains('open')){closeMainMenu();return true;}
  if(language&&language.classList.contains('open')){closeLanguagePanel();return true;}
  if(servite&&servite.classList.contains('open')){if(typeof closeServite==='function')closeServite();else servite.classList.remove('open');updateBackButton();return true;}
  if(mass&&mass.classList.contains('open')&&typeof window.closeDailyLiturgy==='function'){window.closeDailyLiturgy();updateBackButton();return true;}
  if(dailyPrayerOpen480){closeDailyPrayer480();return true;}
  if(memoriaSelectedDate){closeMemoriaLiturgica();return true;}
  if(state.devoSub!==null&&state.devoSub!==undefined){closeDevo();return true;}
  if(state.devo){closeDevo();return true;}
  if(state.detailId!==null&&state.detailId!==undefined){closeDetail();return true;}
  if(state.tab==='liturgia'&&state.liturgiaSection==='horas'){setLiturgiaSection('missa');return true;}
  if(state.tab!=='hoje'){setTab('vida');return true;}
  return false;
}

function handleAndroidBack(event){
  if(smartBack()) return true;
  if(event&&event.canGoBack){window.history.back();return true;}
  const appPlugin=getCapacitorPlugin('App');
  if(appPlugin&&typeof appPlugin.exitApp==='function'){appPlugin.exitApp();return true;}
  return false;
}

function installAndroidBackHandler(){
  const capacitor=window.Capacitor;
  const appPlugin=getCapacitorPlugin('App');
  if(!capacitor?.isNativePlatform?.()) return;
  if(!appPlugin||typeof appPlugin.addListener!=='function'){
    console.error('[Liturgia OSM] Plugin @capacitor/app ausente; o botão Voltar do Android não pode ser tratado.');
    return;
  }
  try{
    Promise.resolve(appPlugin.addListener('backButton',handleAndroidBack)).catch(error=>console.warn('[Liturgia OSM] Não foi possível ligar o botão Voltar do Android.',error));
  }catch(error){console.warn('[Liturgia OSM] Plugin do botão Voltar indisponível.',error);}
}


// init: assign ids, set active tab
SANTORAL.forEach((s,i)=> s._id = i);
document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
applyPreferences();
render();
/* END SCRIPT BLOCK: legacy-block-3 */

/* BEGIN SCRIPT BLOCK: legacy-block-4 */
// Service Worker é usado apenas no navegador/PWA. No app Android, os arquivos já são empacotados pelo Capacitor.
if ("serviceWorker" in navigator && !window.Capacitor?.isNativePlatform?.()) {
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
/* END SCRIPT BLOCK: legacy-block-4 */

/* BEGIN SCRIPT BLOCK: serviteIntegrationScript */
let currentServiteView='';
const serviteNames={regra:'Regra OSSM',rosario:'Rosário',coroa:'Coroa das Sete Dores',oficio:'Ofício',sabado:'Sábado Mariano',idioma:'Idiomas',completo:'Recursos OSM'};
function serviteUrl(view){return 'servite.html?view='+encodeURIComponent(view||'completo');}
function serviteAdjustFont(delta){try{const frame=document.getElementById('serviteFrame');const change=frame?.contentWindow?.changeFontSize;if(typeof change==='function')change(delta);}catch(error){console.warn('[Liturgia OSM] Controle de fonte do recurso indisponível.',error);}} function openServite(view){
  currentServiteView=view||'completo';
  const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');
  document.getElementById('serviteTitle').textContent=serviteNames[currentServiteView]||'Recursos OSM';
  fr.src=serviteUrl(currentServiteView);
  ov.classList.add('open');ov.setAttribute('aria-hidden','false');document.body.classList.add('servite-open');
  if(!history.state?.serviteOverlay) history.pushState({...history.state,serviteOverlay:true},'');
}
function closeServite(fromHistory=false){const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');const wasOpen=ov?.classList.contains('open');ov.classList.remove('open');ov.setAttribute('aria-hidden','true');document.body.classList.remove('servite-open');fr.src='about:blank';if(wasOpen&&!fromHistory&&history.state?.serviteOverlay)history.back();}
function serviteReload(){if(currentServiteView)document.getElementById('serviteFrame').src=serviteUrl(currentServiteView)+'&reload='+Date.now();}
window.addEventListener('popstate',()=>{if(document.getElementById('serviteOverlay')?.classList.contains('open'))closeServite(true);});
/* END SCRIPT BLOCK: serviteIntegrationScript */

/* BEGIN SCRIPT BLOCK: interface490Script */
(function(){
  const crest=document.querySelector('.crest');
  if(crest) crest.innerHTML='<img src="icon-192.png" alt="Emblema dos Servos de Maria">';

  function recentCard(){
    const item=recents()[0];
    if(!item) return '';
    const action=item.type==='saint'?`openSaint(${item.key})`:prayerActionForKey(String(item.key));
    return `<div class="section-title home-heading">Continuar</div>
      <div class="card continue-card fade-in" onclick="${action}">
        <div class="continue-mark">↻</div><div class="continue-text"><small>Último conteúdo consultado</small><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.sub||'Liturgia OSM')}</span></div><div class="chev">›</div>
      </div>`;
  }

  

  const menu=document.querySelector('.main-menu');
  if(menu) menu.innerHTML=`<div class="main-menu-head"><h3>Menu</h3><button class="tool-btn" onclick="closeMainMenu()" aria-label="Fechar menu">✕</button></div>
    <div class="menu-section"><div class="menu-label">Navegação</div><div class="menu-nav-grid"><button class="menu-action" onclick="closeMainMenu();setTab('hoje')">Hoje</button><button class="menu-action" onclick="closeMainMenu();setTab('calendario')">Calendário</button><button class="menu-action" onclick="closeMainMenu();setTab('santoral')">Santoral</button><button class="menu-action" onclick="closeMainMenu();setTab('oracoes')">Orações</button><button class="menu-action" onclick="closeMainMenu();openServite('oficio')">Ofício</button><button class="menu-action" onclick="closeMainMenu();setTab('biblioteca')">Biblioteca</button></div></div>
    <div class="menu-section"><div class="menu-label">Leitura</div><div class="menu-row"><button class="menu-action" onclick="adjustFont(-0.08)">A−</button><span class="reader-scale-value">100%</span><button class="menu-action" onclick="adjustFont(0.08)">A+</button><button class="menu-action" onclick="resetFont()">Padrão</button></div><button class="menu-action menu-wide" onclick="toggleTheme()">☼ / ☾ Alternar tema claro ou escuro</button></div>
    <div class="menu-section"><div class="menu-label">Recursos Servitas</div><button class="menu-action menu-wide" onclick="closeMainMenu();openServite('regra')">Regra OSSM</button><button class="menu-action menu-wide" onclick="closeMainMenu();openServite('rosario')">Rosário</button><button class="menu-action menu-wide" onclick="closeMainMenu();openServite('coroa')">Coroa das Sete Dores</button><button class="menu-action menu-wide" onclick="closeMainMenu();openServite('sabado')">Sábado Mariano</button></div>
    <div class="menu-section"><div class="menu-label">Aplicativo</div><button class="menu-action menu-wide" onclick="closeMainMenu();openLanguagePanel()">Idioma da interface</button><button class="menu-action menu-wide" onclick="closeMainMenu();setTab('sobre')">Sobre, créditos e redes sociais</button></div>
    <div class="menu-section"><div class="menu-status"><span class="connection-dot"></span><span>Versão ${APP_VERSION} · textos OSM offline; Missa do dia exige internet ou cópia salva</span></div></div>`;

  window.addEventListener('online',()=>{if(state.tab==='hoje')render();});
  window.addEventListener('offline',()=>{if(state.tab==='hoje')render();});
  applyPreferences(); render();
})();
/* END SCRIPT BLOCK: interface490Script */

/* BEGIN SCRIPT BLOCK: quality491Script */
(function(){
  function normalizeExtractedProse(text){
    return String(text||'').replace(/\r/g,'').replace(/\u00a0/g,' ')
      .replace(/([A-Za-zÀ-ÿ])-\n\s*([a-zà-ÿ])/g,'$1$2')
      .split(/\n\s*\n/).map(p=>p.replace(/\n\s*/g,' ').replace(/\s{2,}/g,' ').trim()).filter(Boolean).join('\n\n');
  }
  SANTORAL.forEach(s=>{s.bio=normalizeExtractedProse(s.bio);});

  window.setCalendarMonth=function(month){calDate=new Date(calDate.getFullYear(),Number(month),1);selectedCalDate=null;render();};
  window.setCalendarFilter=function(filter){calendarRankFilter=filter;selectedCalDate=null;render();};


  let wakeLock=null;
  window.toggleCelebrationMode=async function(){
    const active=document.body.classList.toggle('celebration-mode'),button=document.getElementById('celebrationToggle');button.textContent=active?'Sair do modo celebração':'Modo celebração';
    try{if(active&&navigator.wakeLock)wakeLock=await navigator.wakeLock.request('screen');else if(wakeLock){await wakeLock.release();wakeLock=null;}}catch(e){}
    showToast(active?'Modo celebração ativado.':'Modo celebração encerrado.');
  };
  function updateCelebrationButton(){const b=document.getElementById('celebrationToggle');if(!b)return;const dailyOpen=typeof dailyPrayerOpen480!=='undefined'&&!!dailyPrayerOpen480;const reading=state.detailId!==null||!!state.devo||!!state.devoSub||dailyOpen;b.classList.toggle('show',reading||document.body.classList.contains('celebration-mode'));}
  window.updateCelebrationButton=updateCelebrationButton;
  render();
})();
/* END SCRIPT BLOCK: quality491Script */

/* BEGIN SCRIPT BLOCK: dailyLiturgy492Script */
(function(){
  const API='https://liturgia.up.railway.app/v2/';
  const CACHE_PREFIX='osmDailyMassV2:';
  let selectedDate='';
  const two=n=>String(n).padStart(2,'0');
  const localISO=(date=new Date())=>`${date.getFullYear()}-${two(date.getMonth()+1)}-${two(date.getDate())}`;
  const cacheKey=date=>CACHE_PREFIX+date;
  const CACHE_MAX_AGE=30*24*60*60*1000;
  const readCache=date=>{try{const key=cacheKey(date),cached=JSON.parse(localStorage.getItem(key)||'null'),saved=Date.parse(cached?.savedAt||'');if(!cached||!Number.isFinite(saved)||Date.now()-saved>CACHE_MAX_AGE){localStorage.removeItem(key);return null;}return cached;}catch(e){return null}};
  const saveCache=(date,data)=>{try{localStorage.setItem(cacheKey(date),JSON.stringify({savedAt:new Date().toISOString(),data}))}catch(e){}};
  const safe=value=>escapeHtml(String(value||''));
  function readingCards(group,label){
    const items=(Array.isArray(group)?group:(group?[group]:[])).filter(item=>item&&(item.texto||item.referencia||item.refrao));
    return items.map((item,index)=>{
      const title=String(item.titulo||'').trim();
      const fallback=items.length>1?`${label} ${index+1}`:'';
      const displayTitle=title&&title.localeCompare(label,'pt-BR',{sensitivity:'base'})!==0?title:fallback;
      return `<article class="daily-reading">${displayTitle?`<b>${safe(displayTitle)}</b>`:''}${item.referencia?`<em>${safe(item.referencia)}</em>`:''}${item.refrao?`<em>${safe(item.refrao)}</em>`:''}<p>${safe(item.texto)}</p></article>`;
    }).join('');
  }
  function section(title,body){return body?`<section class="daily-section"><h3>${safe(title)}</h3>${body}</section>`:''}
  function renderMass(payload,offline){
    const data=payload.data||payload,prayers=data.oracoes||{},readings=data.leituras||{},antiphons=data.antifonas||{};
    const saved=payload.savedAt?new Date(payload.savedAt).toLocaleString('pt-BR'):'';
    const extras=[...(Array.isArray(prayers.extras)?prayers.extras:[]),...(Array.isArray(readings.extras)?readings.extras:[])];
    return `<div class="daily-source"><b>${offline?'Cópia offline':'Conteúdo atualizado online'}</b>${saved?` · salva em ${safe(saved)}`:''}<br>Liturgia diária recebida pela API comunitária Liturgia Diária v2. Confira orientações e celebrações próprias no calendário litúrgico local.</div>
      <div class="card daily-title-card"><span class="daily-color">${safe(data.cor||'Cor litúrgica')}</span><h2>${safe(data.liturgia||'Liturgia do dia')}</h2><small>${safe(data.data||'')}</small></div>
      ${section('Antífona de entrada',readingCards({texto:antiphons.entrada},'Antífona de entrada'))}
      ${section('Oração coleta',readingCards({texto:prayers.coleta},'Oração coleta'))}
      ${section('Primeira leitura',readingCards(readings.primeiraLeitura,'Primeira leitura'))}
      ${section('Salmo responsorial',readingCards(readings.salmo,'Salmo responsorial'))}
      ${section('Segunda leitura',readingCards(readings.segundaLeitura,'Segunda leitura'))}
      ${section('Evangelho',readingCards(readings.evangelho,'Evangelho'))}
      ${section('Textos próprios e complementares',readingCards(extras,'Texto complementar'))}
      ${section('Oração sobre as oferendas',readingCards({texto:prayers.oferendas},'Oração sobre as oferendas'))}
      ${section('Antífona da comunhão',readingCards({texto:antiphons.comunhao},'Antífona da comunhão'))}
      ${section('Oração depois da comunhão',readingCards({texto:prayers.comunhao},'Oração depois da comunhão'))}`;
  }
  window.loadDailyLiturgy=async function(date){
    selectedDate=date||localISO(); const input=document.getElementById('dailyLiturgyDate');if(input)input.value=selectedDate;
    const target=document.getElementById('dailyLiturgyContent'),cached=readCache(selectedDate);
    if(!target)return;
    if(cached)target.innerHTML=renderMass(cached,true);else target.innerHTML='<div class="daily-loading">Carregando a liturgia…</div>';
    if(!navigator.onLine){if(!cached)target.innerHTML='<div class="daily-error">Esta data ainda não foi salva. Conecte-se à internet uma vez para baixar a liturgia.</div>';return;}
    try{
      const [year,month,day]=selectedDate.split('-');
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);let response;try{response=await fetch(`${API}?dia=${day}&mes=${month}&ano=${year}`,{headers:{Accept:'application/json'},signal:controller.signal});}finally{clearTimeout(timeout);}
      if(!response.ok)throw new Error('Liturgia não encontrada');
      const data=await response.json();saveCache(selectedDate,data);target.innerHTML=renderMass({savedAt:new Date().toISOString(),data},false);
    }catch(error){if(!cached){const message=error?.name==='AbortError'?'A consulta demorou mais que o esperado. Verifique a conexão e tente novamente.':'Não foi possível acessar o serviço da Missa. Verifique a conexão e tente novamente.';target.innerHTML=`<div class="daily-error">${safe(message)}<br><button class="daily-retry" onclick="loadDailyLiturgy('${safe(selectedDate)}')">Tentar novamente</button></div>`;}}
  };
  window.openDailyLiturgy=function(date){const overlay=document.getElementById('dailyLiturgyOverlay');if(!overlay)return;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');overlay.scrollTop=0;loadDailyLiturgy(date||localISO());};
  window.closeDailyLiturgy=function(){document.getElementById('dailyLiturgyOverlay').classList.remove('open');document.getElementById('dailyLiturgyOverlay').setAttribute('aria-hidden','true');if(document.body.classList.contains('celebration-mode'))toggleCelebrationMode();};
  window.moveDailyDate=function(amount){const date=new Date(selectedDate+'T12:00:00');date.setDate(date.getDate()+amount);loadDailyLiturgy(localISO(date));};
  
  const menu=document.querySelector('.main-menu');
  if(menu){const nav=menu.querySelector('.menu-nav-grid');if(nav)nav.insertAdjacentHTML('beforeend','<button class="menu-action" onclick="closeMainMenu();openDailyLiturgy()">Missa do dia</button>');const status=menu.querySelector('.menu-status span:last-child');if(status)status.textContent=`Versão ${APP_VERSION} · Missa do dia online; cópias locais por até 30 dias`;}
  window.addEventListener('online',()=>{if(document.getElementById('dailyLiturgyOverlay').classList.contains('open'))loadDailyLiturgy(selectedDate);});
  render();
})();
/* END SCRIPT BLOCK: dailyLiturgy492Script */

/* BEGIN SCRIPT BLOCK: canonicalSantoral495 */
async function loadCanonicalSantoral(){
  santoralLoading=true;
  santoralLoadError=false;
  render();
  try{
    const response=await fetch('./data/santoral.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Santoral indisponível');
    const canonical=await response.json();
    if(!Array.isArray(canonical)||canonical.length===0)throw new Error('O Santoral precisa ser uma lista não vazia.');
    const ids=new Set(),dates=new Set();
    for(const item of canonical){
      if(!item||!Number.isInteger(item.id)||item.id<0||!Number.isInteger(item.month)||item.month<1||item.month>12||!Number.isInteger(item.day)||item.day<1||item.day>new Date(2024,item.month,0).getDate()||typeof item.date!=='string'||!item.date.trim()||typeof item.title!=='string'||!item.title.trim()||typeof item.rank!=='string'||!item.rank.trim()||typeof item.bio!=='string')throw new Error('Registro inválido no Santoral.');
      const dateKey=String(item.month).padStart(2,'0')+'-'+String(item.day).padStart(2,'0');
      if(ids.has(item.id)||dates.has(dateKey))throw new Error('ID ou data duplicada no Santoral.');
      ids.add(item.id);dates.add(dateKey);
    }
    SANTORAL=canonical.map(item=>({...item,_id:Number(item.id),special:item.special??''}));
    const requestedCelebration=new URLSearchParams(window.location.search).get('celebracao');
    if(requestedCelebration!==null&&SANTORAL.some(item=>Number(item.id)===Number(requestedCelebration))){state.tab='santoral';state.detailOriginTab='santoral';state.detailId=Number(requestedCelebration);}
    santoralReady=true;
  }catch(error){
    santoralReady=false;
    santoralLoadError=true;
    console.warn('[Liturgia OSM] Não foi possível carregar o Santoral canônico.',error);
  }finally{
    santoralLoading=false;
    if(santoralReady)await loadCanonicalOffices();
    render();
  }
}
window.loadCanonicalSantoral=loadCanonicalSantoral;
async function loadCanonicalOffices(){
  oficiosLoadError=false;
  try{
    const response=await fetch('./data/oficios-osm.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Ofícios indisponíveis');
    const source=await response.json();
    const dates=source?.celebracoes;
    if(source.schema_version!==3||!dates||Object.keys(dates).length!==32)throw new Error('Base de Ofícios incompleta.');
    for(const saint of SANTORAL){
      const key=officeDateKey(saint),record=dates[key];
      if(!record||Number(record.id)!==Number(saint.id)||!['oficio_proprio','textos_proprios','sem_material_proprio'].includes(record.tipo_material))throw new Error('Ofício divergente em '+key);
    }
    OFICIOS_OSM=source;oficiosReady=true;
  }catch(error){oficiosReady=false;oficiosLoadError=true;console.warn('[Liturgia OSM] Não foi possível carregar os Ofícios canônicos.',error);}
  render();
}
window.loadCanonicalOffices=loadCanonicalOffices;
loadCanonicalSantoral();
/* END SCRIPT BLOCK: canonicalSantoral495 */

/* BEGIN SCRIPT BLOCK: canonicalMemoriaLiturgica */
(async function(){
  try{
    const response=await fetch('./data/memoria-liturgica.json',{cache:'no-store'});
    if(!response.ok)throw new Error('Memória Litúrgica indisponível');
    const source=await response.json();
    if(source.schema_version!==2||!source.common||!Array.isArray(source.memory_dates)||source.memory_dates.length!==25||!Array.isArray(source.celebrations)||source.celebrations.length>source.memory_dates.length)throw new Error('Fonte incompleta');
    MEMORIA_LITURGICA=source;
    render();
  }catch(error){console.warn('[Liturgia OSM] Não foi possível carregar a Memória Litúrgica.',error);}
})();
/* END SCRIPT BLOCK: canonicalMemoriaLiturgica */

/* BEGIN SCRIPT BLOCK: canonicalNavigation4926 */
(function(){
  const fallbackMasses={schema_version:1,celebrations:[]};
  window.MISSAS_OSM=fallbackMasses;

  function dateKey(s){return String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0');}
  function massDate(s){
    let year=new Date().getFullYear();
    let date=new Date(year,Number(s.month)-1,Number(s.day),12);
    if(date.getMonth()+1!==Number(s.month)||date.getDate()!==Number(s.day)){
      year+=1;date=new Date(year,Number(s.month)-1,Number(s.day),12);
    }
    return year+'-'+String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0');
  }
  function hubEmpty(text){return '<div class="hub-empty">'+escapeHtml(text)+'</div>';}
  function hubText(title,text){
    if(!text)return '';
    return '<div class="section-title">'+escapeHtml(title)+'</div><div class="hub-card hub-text">'+escapeHtml(text)+'</div>';
  }
  function properMassFor(s){
    const records=window.MISSAS_OSM&&Array.isArray(window.MISSAS_OSM.celebrations)?window.MISSAS_OSM.celebrations:[];
    return records.find(item=>item.date===dateKey(s)||String(item.santoral_id)===String(s.id));
  }
  function properMassBlock(item){
    const readings=Array.isArray(item.readings)?item.readings:[];
    const readingHtml=readings.map(function(reading){
      const title=reading.title||reading.label||'Leitura';
      const reference=reading.reference||reading.referencia||'';
      return '<div class="section-title">'+escapeHtml(title)+'</div><div class="hub-card hub-text">'+
        (reference?'<b>'+escapeHtml(reference)+'</b><br>':'')+escapeHtml(reading.text||'')+'</div>';
    }).join('');
    const content=hubText('Coleta',item.collect||item.coleta)+readingHtml+
      hubText('Prefácio',item.preface||item.prefacio);
    if(!content)return hubEmpty('O cadastro da Missa própria ainda não contém textos conferidos.');
    return '<div class="hub-card"><div class="hub-card-title">Missa própria</div>'+content+
      '<p class="hub-source">Fonte: '+escapeHtml(item.source||'fonte não informada')+'</p></div>';
  }
  function liturgyBlock(s){
    const ownMass=properMassFor(s);
    const date=massDate(s);
    const mass=ownMass?properMassBlock(ownMass):
      '<div class="hub-card"><div class="hub-card-title">Missa do dia</div>'+
      '<p class="hub-card-note">Não há Missa própria cadastrada. A consulta da data de '+escapeHtml(s.date)+' exige internet; a cópia consultada fica disponível offline por até 30 dias.</p>'+
      '<button class="hub-action" onclick="openDailyLiturgy(\''+date+'\')">Consultar Missa desta data <span>›</span></button></div>';
    let office='';
    const hours=saintHasOffice(s)?officeHoursForSaint(s):[];
    if(!oficiosReady){
      office='<div class="hub-card" role="alert"><div class="hub-card-title">Ofício indisponível</div>'+
        '<p class="hub-card-note">O cadastro local dos Ofícios não foi carregado. Vida e Oração permanecem disponíveis.</p>'+
        '<button class="hub-action" onclick="loadCanonicalOffices()">Tentar novamente <span>↻</span></button></div>';
    }else if(hours.length){
      const classification=officeClassificationForSaint(s);
      const officeTitle=classification==='Ofício próprio'?'Liturgia das Horas':'Textos próprios do Ofício';
      office='<div class="hub-card"><div class="hub-card-title">'+officeTitle+'</div>'+
        '<p class="hub-card-note">'+escapeHtml(classification)+'</p><div class="hub-actions">'+
        hours.map(function(pair){return officeHourButtonHtml(s,pair,'hub-action');}).join('')+
        '</div></div>';
    }else if(officeRecordForSaint(s)?.tipo_material==='sem_material_proprio'){
      office='<div class="hub-card"><div class="hub-card-title">Liturgia das Horas</div>'+ 
        hubEmpty('Sem material próprio: usar o Comum.')+
        '<button class="hub-action" style="margin-top:10px" onclick="openServite(\'oficio\')">Abrir Ofício Comum <span>›</span></button></div>';
    }else{
      office='<div class="hub-card"><div class="hub-card-title">Textos próprios do Ofício</div>'+hubEmpty('Não há horas próprias cadastradas; usar o Comum.')+
        '<button class="hub-action" style="margin-top:10px" onclick="openServite(\'oficio\')">Abrir Ofício Comum <span>›</span></button></div>';
    }
    return mass+office;
  }
  function prayerBlock(s){
    const data=MEMORIA_LITURGICA||{},date=dateKey(s);
    const item=Array.isArray(data.celebrations)?data.celebrations.find(entry=>entry.date===date):null;
    const covered=(Array.isArray(data.memory_dates)&&data.memory_dates.includes(date))||!!item;
    if(!covered)return (s.prayer?hubText('Oração própria do Santoral',s.prayer)+'<p class="hub-source">Fonte da oração: Santoral da Ordem.</p>':hubEmpty('O Santoral não traz oração própria cadastrada.'))+hubEmpty('O Livro de Oração não traz Memória Litúrgica cadastrada para esta celebração.');
    const common=data.common||{};
    const life=item?.breve_vida||item?.apresentacao||'';
    const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
    const distinctLife=life&&compact(life)!==compact(s.bio||'')?life:'';
    const prayer=item?.oracao_propria||s.prayer||'',sourceNote=item?.source_note||data.editorial_notes?.[date]||'';
    const prayerSource=item?.oracao_propria?'Livro de Oração dos Servos de Maria, 3ª edição revisada (2024), seção Memória Litúrgica.':'Santoral da Ordem.';
    const lifeSource=distinctLife?'Livro de Oração dos Servos de Maria, 3ª edição revisada (2024), seção Memória Litúrgica.':'Santoral da Ordem.';
    return hubText('Hino',common.hino)+hubText('Antífona',common.antifona)+
      hubText('Salmo 111',common.salmo)+
      hubText(item?.breve_vida?'Breve vida':'Apresentação',distinctLife)+
      '<p class="hub-source">Fonte dos textos comuns: '+escapeHtml(data.source||'Livro de Oração dos Servos de Maria, seção Memória Litúrgica.')+'</p>'+ 
      hubText('Oração própria',prayer)+
      (prayer?'<p class="hub-source">Fonte da oração: '+escapeHtml(prayerSource)+'</p>':'')+
      (distinctLife?'<p class="hub-source">Fonte da vida breve: '+escapeHtml(lifeSource)+'</p>':'')+
      (sourceNote?'<p class="hub-source">Nota da fonte: '+escapeHtml(sourceNote)+'</p>':'')+
      '<p class="hub-source">Memória Litúrgica do Livro de Oração; distinta da Liturgia das Horas.</p>';
  }
  function orderedCelebrations(){
    return SANTORAL.slice().sort(function(a,b){
      return Number(a.month)-Number(b.month)||Number(a.day)-Number(b.day)||String(a.title).localeCompare(String(b.title),'pt-BR');
    });
  }
  function navigationBlock(s){
    const ordered=orderedCelebrations();
    const index=ordered.findIndex(item=>item._id===s._id);
    if(index<0||!ordered.length)return hubEmpty('Navegação entre celebrações indisponível.');
    const previous=ordered[(index+ordered.length-1)%ordered.length];
    const next=ordered[(index+1)%ordered.length];
    return '<div class="hub-navigation-grid">'+
      '<button class="hub-action" onclick="openSaint('+previous._id+')">‹ Anterior <span>'+escapeHtml(previous.title)+'</span></button>'+
      '<button class="hub-action" onclick="openSaint('+next._id+')">Próxima <span>'+escapeHtml(next.title)+' ›</span></button>'+
      '<button class="hub-action hub-share" onclick="shareSaint('+s._id+')">Compartilhar celebração <span>↗</span></button></div>';
  }
  window.renderCelebrationHub=function(id){
    const saint=SANTORAL.find(item=>item._id===id||item.id===id);
    if(!saint)return '<div class="empty-state">Celebração não encontrada.</div>';
    const origin=state.detailOriginTab||'santoral';
    const backLabel=origin==='calendario'?'Voltar ao Calendário':origin==='hoje'?'Voltar a Hoje':origin==='liturgia'?'Voltar à Liturgia':origin==='oracoes'?'Voltar a Oração':'Voltar ao Santoral';
    const life='<div class="hub-life">'+saintImageHtml(saint,true)+
      (saintRankSubtitle(saint)?'<div class="rank">'+escapeHtml(saintRankSubtitle(saint))+'</div>':'')+
      '<h1 class="hub-life-title">'+escapeHtml(saint.title)+'</h1>'+
      '<div class="hub-life-meta">'+escapeHtml(saint.date)+'</div>'+
      '<div class="hub-life-bio">'+escapeHtml(saint.bio||'Biografia não cadastrada.')+'</div></div>';
    return '<button class="hub-back" onclick="closeDetail()">‹ '+backLabel+'</button>'+
      '<div class="saint-hub">'+
      '<section class="hub-block" id="hub-vida"><div class="hub-block-title">Vida</div>'+life+'</section>'+
      '<section class="hub-block" id="hub-liturgia"><div class="hub-block-title">Liturgia</div>'+liturgyBlock(saint)+'</section>'+
      '<section class="hub-block" id="hub-oracao"><div class="hub-block-title">Oração</div>'+prayerBlock(saint)+'</section>'+
      '<section class="hub-block" id="hub-navegacao"><div class="hub-block-title">Navegação</div>'+navigationBlock(saint)+'</section>'+
      '</div>';
  };
  window.openSaintSection=function(id,section){
    openDetail(id);
    requestAnimationFrame(function(){
      const target=document.getElementById('hub-'+section);
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    });
  };
  window.openLiturgiaSection=function(section){
    state.liturgiaSection=section==='horas'?'horas':'missa';
    setTab('liturgia');
  };

  installAndroidBackHandler();
  window.addEventListener('keydown',function(event){if(event.key==='Escape')smartBack();});
  window.addEventListener('popstate',function(){
    const mass=document.getElementById('dailyLiturgyOverlay');
    if(mass&&mass.classList.contains('open')&&typeof window.closeDailyLiturgy==='function'){window.closeDailyLiturgy();updateBackButton();return;}
    if(state.detailId!==null&&state.detailId!==undefined)closeDetail();
  });

  fetch('./data/missas-osm.json',{cache:'no-store'}).then(function(response){
    if(!response.ok)throw new Error('Arquivo de Missas próprias indisponível');
    return response.json();
  }).then(function(data){
    if(data.schema_version!==1||!Array.isArray(data.celebrations))throw new Error('Cadastro de Missas próprias inválido');
    window.MISSAS_OSM=data;
    if(state.detailId!==null&&state.detailId!==undefined)render();
  }).catch(function(error){console.info('[Liturgia OSM] Missas próprias ainda sem registros conferidos.',error);});
  render();
})();
/* END SCRIPT BLOCK: canonicalNavigation4926 */
