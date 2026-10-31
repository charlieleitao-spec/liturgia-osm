/* BEGIN SCRIPT BLOCK: legacy-block-2 */
let SANTORAL = [];
let OFICIOS_OSM = null;
let santoralReady = false;
let oficiosReady = false;
let oficiosLoadError = false;
let santoralLoading = true;
let santoralLoadError = false;
function saintFallbackMonogram(s){
  const title=String(s?.title||'').replace(/^(?:B(?:\.A)?\.|São|Santo|Santa|Servo de Deus)\s+/i,'');
  const words=(title.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+/g)||[]).filter(word=>!['a','as','da','das','de','do','dos','e','o','os'].includes(word.toLocaleLowerCase('pt-BR')));
  return (words.slice(0,2).map(word=>Array.from(word)[0]).join('')||'OSM').toLocaleUpperCase('pt-BR');
}
function saintImageHtml(s, detail=false){
  const src=s.image;
  if(!src){
    const label=`Imagem não disponível para ${escapeHtml(s.title)}`;
    const mark=escapeHtml(saintFallbackMonogram(s));
    return detail
      ? `<div class="saint-image-detail saint-image-placeholder fade-in" role="img" aria-label="${label}"><span>${mark}</span></div>`
      : `<div class="saint-thumb saint-thumb--fallback" role="img" aria-label="${label}"><span>${mark}</span></div>`;
  }
  return detail ? `<div class="saint-image-detail fade-in"><img src="${src}" alt="Imagem de ${escapeHtml(s.title)}"></div>` : `<div class="saint-thumb"><img src="${src}" alt="Imagem de ${escapeHtml(s.title)}"></div>`;
}
const CELEBRATION_GRADE_LABELS={solenidade:'Solenidade',festa:'Festa',memoria:'Memória',memoria_facultativa:'Memória facultativa',comemoracao:'Comemoração'};
function celebrationGradeLabel(value){
  const raw=String(value||'').trim();
  if(CELEBRATION_GRADE_LABELS[raw])return CELEBRATION_GRADE_LABELS[raw];
  const normalized=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').split(' · ')[0].trim().replace(/\s+/g,'_');
  return CELEBRATION_GRADE_LABELS[normalized]||'';
}
function saintDisplayGrade(s){
  if(s?.categoria==='servo_de_deus')return 'Memória biográfica';
  return celebrationGradeLabel(s?.grau);
}
function celebrationLabel(s){
  if(!s)return '';
  if(s.categoria==='beato')return s.genero==='f'?'Beata':'Beato';
  if(s.categoria==='servo_de_deus')return s.genero==='f'?'Serva de Deus':'Servo de Deus';
  return '';
}
function celebrationTitleText(value,s){
  const original=String(value||'').trim();
  if(s?.categoria==='santo')return original;
  let name=original;
  const oldPrefix=/^(?:B\.A\.|B\.|Beato|Beata|Servo de Deus|Serva de Deus)\s*/i;
  while(oldPrefix.test(name))name=name.replace(oldPrefix,'').trim();
  const label=celebrationLabel(s);
  return label?label+' '+name:name;
}
function celebrationNameHtml(value,s){
  return escapeHtml(celebrationTitleText(value,s));
}
function celebrationDateText(s){return String(s?.date||'').replace(/\s*\(dies natalis\)\s*/ig,'').trim();}
function celebrationSubtitle(s,gradeOverride=''){
  const date=celebrationDateText(s);
  const gradeLabel=(s?.categoria==='servo_de_deus'?saintDisplayGrade(s):celebrationGradeLabel(gradeOverride||s?.grau));
  return date+(date&&gradeLabel?' · ':'')+gradeLabel;
}
function saintRankSubtitle(s){
  if(s?.categoria==='beato'||s?.categoria==='servo_de_deus')return '';
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
const PRAYER_CONTEXT_HEADINGS = /^(?:Comum|Nas festas marianas|Nas visitas de familiares e amigos|Nos momentos de alegria)$/i;
const PRAYER_TEXT_HEADINGS = /^(?:Antífona(?: de entrada)?|Salmo(?:\s+[\d,.\-–—]+)?|Hino|Canto|Invitatório|Ofício das Leituras|Salmodia|Cântico(?: evangélico)?|Oração(?: própria| sálmica| sobre o cântico| das (?:Nove|Doze|Quinze) Horas)?|Leitura breve|Introdução(?: à leitura| às leituras)?|Absolvição|Primeira leitura|Segunda leitura|Terceira leitura|Evangelho(?: de .+)?|Reflexão|Invocações|Responsório(?: breve)?|Preces|Festa|Laudes|Vésperas|Hora Média|Salve Rainha|Oremos|Oração pela Igreja pela Ordem|À VIRGEM (?:DO (?:SIM|\"MAGNIFICAT\")|AO PÉ DA CRUZ))$/i;
function liturgicalLineHtml(value, verse=false){
  let text=String(value??'').trim();
  let prefix='';
  if(verse){
    const mark=text.match(/^([–—=\-])\s*/);
    if(mark){prefix='<span class="liturgical-marker">'+escapeHtml(mark[1])+'</span>';text=text.slice(mark[0].length);}
    const number=text.match(/^(\d{1,3})(?=\s*[A-Za-zÀ-ÿ“"«])/);
    if(number){prefix+='<sup class="verse-number">'+number[1]+'</sup> ';text=text.slice(number[0].length).trimStart();}
  }
  let html=escapeHtml(text);
  html=html.replace(/^((?:\d+ª\s*)?(?:Ant\.(?:\s*\d+)?|Antífona)|D\.|T\.|C\.|R[./]|V[./]|A\.|B\.|L\d?:|L\.|℣\.?|℟\.?)(?=\s|[A-Za-zÀ-ÿ]|$)\s*/, '<span class="rubric">$1</span> ');
  // Rubric signs remain with the following word when the screen wraps.
  html=html.replace(/(<span class="rubric">[^<]+<\/span>) ([^\s<]+)/g,'<span class="liturgical-cue">$1 $2</span>');
  html=html.replace(/([^\s<>]+)\s+([*†])(?=\s|$)/g,'<span class="liturgical-cue">$1 $2</span>');
  return prefix+html;
}
function prayerLineHtml(line, vigilia=false){
  return liturgicalLineHtml(line,vigilia);
}
function normalizeCopiedLineBreaks(value){
  const source=String(value??'').replace(/\r\n?/g,'\n');
  const joined=source.replace(/([^\s-]+)-\n[ \t]*([^\s-]+)/g,(match,left,right,offset,whole)=>{
    const suffix=(right.match(/^[A-Za-zÀ-ÿ]+/)||[''])[0].toLocaleLowerCase('pt-BR');
    const keepsHyphen=/\d$/.test(left)&&/^\d/.test(right)
      ||/^(?:o|a|as|la|las|lhe|lhes|lo|los|me|na|nas|no|nos|se|te|vos|os)$/i.test(suffix)&&(left.length>=4||/[áàâéêíóôúãõrszu]$/i.test(left))
      ||whole[offset-1]==='-'&&/^(?:ei|ás|á|emos|eis|ão|ia|ias|íamos|íeis|iam)$/i.test(suffix)
      ||/^(?:bem|mal|todo|toda|mestre)$/i.test(left);
    return left+(keepsHyphen?'-':'')+right;
  });
  return joined.split('\n').map(line=>line.replace(/[ \t]+([,.;:!?])/g,'$1').replace(/[ \t]{2,}/g,' ').replace(/[ \t]+$/,'')).join('\n');
}
function formatPrayerStanza(lines, vigilia, hymnMode, preces=false){
  const clean=lines.map(line=>normalizeCopiedLineBreaks(line).trim());
  if(hymnMode) return clean.map(line=>'<span class="'+(hymnMode==='psalm'?'liturgical-verse-line':'liturgical-hymn-line')+'">'+prayerLineHtml(line,hymnMode==='psalm')+'</span>').join('');
  const speaker=/^(?:D\.|T\.|C\.|R[./]|V[./]|A\.|B\.|L\d?:|L\.)\s*/;
  const verse=/^(?:[–—=]\s*|\d{1,3}\s*[†*])/;
  if(clean.some(speaker.test.bind(speaker))){
    const turns=[];
    for(const line of clean){
      if(speaker.test(line)||verse.test(line)||!turns.length)turns.push(line);
      else turns[turns.length-1]+=' '+line;
    }
    return turns.map(line=>'<span class="liturgical-turn'+(preces&&/^R\./.test(line)?' liturgical-response':'')+'">'+prayerLineHtml(line,false)+'</span>').join('');
  }
  if(clean.some(verse.test.bind(verse)))return clean.map(line=>'<span class="liturgical-verse-line">'+prayerLineHtml(line,true)+'</span>').join('');
  return prayerLineHtml(clean.join(' ').replace(/\s+/g,' ').trim(),false);
}
function normalizeVigiliaTypography(text){
  // Não unir automaticamente linhas dos salmos: o asterisco e o sinal †
  // marcam a estrutura poética, não uma quebra de linha acidental do PDF.
  const source=normalizeCopiedLineBreaks(text)
    .replace(/([–—=]\s*\d{1,3})(?=[A-Za-zÀ-ÿ])/g,'$1 ')
    .replace(/SÚPLICA DOS SERVOS DE MARIA\s+A NOSSA SENHORA\s+(?=Bondade)/gi,'SÚPLICA DOS SERVOS DE MARIA A NOSSA SENHORA\n');
  const lines=source.split('\n'),out=[];
  const isHeading=line=>PRAYER_TEXT_HEADINGS.test(line)
    || /^(?:Despedida|SÚPLICA DOS SERVOS DE MARIA A NOSSA SENHORA|Primeira fórmula|Segunda fórmula)$/i.test(line);
  const structural=line=>isHeading(line)
    || /^(?:[–—=]\s*|[DTC RVABL]\d?\.|[123]ª\s*Ant\.|SALMO\s+\d+)/i.test(line);
  let inPsalm=false, inHymn=false, blank=false;
  for(const raw of lines){
    const line=raw.trim();
    if(!line){blank=true;continue;}
    if(/^SALMO\s+\d+/i.test(line)){inPsalm=true;inHymn=false;}
    else if(isHeading(line)||/^[123]ª\s*Ant\./i.test(line)){
      inPsalm=false;inHymn=/^(?:Hino|Canto)$/i.test(line);
    }
    const previous=out[out.length-1]||'';
    // A heading always occupies its own block. Blank PDF page breaks inside
    // unfinished prose may be joined, while psalm and hymn stanzas stay intact.
    const prose=!inPsalm&&!inHymn&&!structural(line)&&previous&&!isHeading(previous)
      &&!/^(?:[–—=]|SALMO|Santa Maria,?$)/i.test(previous);
    const joinAntiphon=prose&&/^[123]ª\s*Ant\./i.test(previous);
    const joinProse=prose&&(!blank||!/[.!?:;]$/.test(previous))&&!/^['"“]/.test(line);
    if(joinAntiphon||joinProse)out[out.length-1]=previous+' '+line;
    else {if(blank&&out.length)out.push('');out.push(line);}
    blank=false;
  }
  return out.join('\n').replace(/([.!?])\s+(?=[123]ª\s*Ant\.)/g,'$1\n');
}

function renderPrayer(text, options={}){
  const vigilia = options.vigilia === true;
  let source = normalizeCopiedLineBreaks(String(text ?? '').replace(/<PARSED TEXT FOR PAGE:\s*\d+\s*\/\s*\d+>/gi, ''));
  if(vigilia){
    source = normalizeVigiliaTypography(source)
      .replace(/^(Primeira fórmula|Segunda fórmula)\n[ \t]*Santa Maria,?\n[ \t]*(Senhora Dos Seus Servos|Serva Do Senhor)/im,
        (_, formula, title)=>formula+'\nSanta Maria, '+title.replace(/Dos Seus Servos/i,'dos seus servos').replace(/Do Senhor/i,'do Senhor'));
  }
  const blocks = [];
  let stanza = [];
  let hymnMode = false;
  let pendingPsalmCaption = false;
  let precesMode = false;
  let psalmQuote = [];
  const flushPsalmQuote = () => {
    if(psalmQuote.length) blocks.push('<p class="liturgical-psalm-quote">'+escapeHtml(psalmQuote.join(' '))+'</p>');
    psalmQuote=[];
  };
  const flushStanza = () => {
    if(!stanza.length) return;
    blocks.push('<p class="prayer-stanza'+(hymnMode==='hymn'?' liturgical-hymn-stanza':'')+'">'+formatPrayerStanza(stanza,vigilia,hymnMode,precesMode)+'</p>');
    stanza = [];
  };
  for(const rawLine of source.replace(/\r\n?/g,'\n').split('\n')){
    const line = rawLine.trim();
    if(!line){ flushPsalmQuote(); flushStanza(); continue; }
    if(psalmQuote.length){
      if(/^[–—=]\s*|^(?:\d+ª\s*)?Ant\.|^Salmo\b/i.test(line)) flushPsalmQuote();
      else {psalmQuote.push(line);continue;}
    }
    if(vigilia && hymnMode==='psalm' && !stanza.length && /^[“"«]/.test(line)){psalmQuote.push(line);continue;}
    if(vigilia && pendingPsalmCaption){
      flushStanza();
      blocks.push('<h5 class="prayer-psalm-caption">'+escapeHtml(line)+'</h5>');
      pendingPsalmCaption = false;
      continue;
    }
    if(PRAYER_CONTEXT_HEADINGS.test(line) || (vigilia && /^(?:Primeira|Segunda) fórmula$/i.test(line))){
      flushStanza();
      blocks.push('<h3 class="prayer-context-heading">'+escapeHtml(line)+'</h3>');
      hymnMode = false;
      pendingPsalmCaption = false;
      continue;
    }
    if(vigilia && /^Santa Maria, (?:Senhora dos seus servos|Serva do Senhor)$/i.test(line)){
      flushStanza();
      blocks.push('<h4 class="prayer-formula-title">'+escapeHtml(line)+'</h4>');
      hymnMode = false;
      continue;
    }
    if(PRAYER_TEXT_HEADINGS.test(line) || /^Salmo\s+\d+\b/i.test(line)){
      flushStanza();
      blocks.push('<h4 class="prayer-text-heading'+(/^(?:Laudes|Vésperas|Ofício das Leituras|Hora Média|Invitatório)$/i.test(line)?' liturgical-hour-heading':/^Salmo(?:\s|$)/i.test(line)?' liturgical-psalm-heading':'')+'">'+escapeHtml(line)+'</h4>');
      hymnMode = /^(?:Hino|Canto)$/i.test(line)?'hymn':/^(?:Salmo|Cântico)/i.test(line)?'psalm':false;
      precesMode = /^Preces$/i.test(line);
      pendingPsalmCaption = vigilia && /^Salmo\b/i.test(line);
      continue;
    }
    if(/^(?:(?:\d+ª\s*)?Ant\.|Antífona\s)/i.test(line)){flushStanza();hymnMode=false;blocks.push('<p class="prayer-antiphon">'+prayerLineHtml(line,true)+'</p>');continue;}
    if(vigilia && /^(?:SÚPLICA DOS SERVOS DE MARIA|Despedida$)/i.test(line)){flushStanza();hymnMode=false;blocks.push('<h4 class="prayer-text-heading">'+escapeHtml(line)+'</h4>');continue;}
    stanza.push(line);
  }
  flushPsalmQuote();
  flushStanza();
  return blocks.join('');
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
const APP_VERSION = '4.9.130';
const storedTab = localStorage.getItem('osmLastTab');
const validTabs = ['hoje','calendario','santoral','oracoes','biblioteca','sobre'];
const dailySuggestion = dailyPrayerSuggestion();
let pendingSharePrayer = null;
let state = { tab: 'hoje', angelus:dailySuggestion.key, detailId:null, search:'', devo:null, devoSub:null, liturgiaDetail:null };
let readerScale = OSMReaderScale.read(localStorage);
let lightMode = localStorage.getItem('osmTheme') !== 'dark';
function applyPreferences(){
  readerScale = OSMReaderScale.normalize(readerScale);
  document.documentElement.style.setProperty('--reader-scale', readerScale.toFixed(2));
  document.body.classList.toggle('light-mode', lightMode);
  document.documentElement.style.colorScheme = lightMode ? 'light' : 'dark';
  const themeMeta=document.querySelector('meta[name=theme-color]'); if(themeMeta) themeMeta.content=lightMode?'#f7f4ed':'#0c1827';
  document.querySelectorAll('.menu-theme').forEach(button=>button.setAttribute('aria-pressed',String(!lightMode)));
  const b=document.getElementById('themeBtn'); if(b) b.textContent = lightMode ? '☾' : '☼'; document.querySelectorAll('.reader-scale-value').forEach(rv=>rv.textContent=Math.round(readerScale*100)+'%');
}
function adjustFont(delta){
  window.OSMPersonalReader?.cancelPosition();
  readerScale=OSMReaderScale.write(localStorage,OSMReaderScale.normalize(readerScale+delta));
  applyPreferences();
}
function resetFont(){window.OSMPersonalReader?.cancelPosition();readerScale=OSMReaderScale.write(localStorage,1);applyPreferences();}
// Keep background content out of keyboard and screen-reader navigation while a dialog is open.
const dialogOrigins = new Map();
const dialogBackground = new Map();
const dialogOwnInert = new Map();
function dialogControls(dialog){
  return [...dialog.querySelectorAll('button, [href], input, select, textarea, iframe, [tabindex]')]
    .filter(node=>!node.disabled && node.tabIndex>=0 && node.getClientRects().length);
}
function openAccessibleDialog(id){
  const dialog=document.getElementById(id);
  if(dialog.classList.contains('open'))return;
  dialogOwnInert.set(id,Boolean(dialog.inert));
  dialog.inert=false;
  document.body.classList.remove('scroll-controls-hidden');
  dialogOrigins.set(id,document.activeElement);
  if(id==='dailyLiturgyOverlay')dialog.append(document.getElementById('celebrationToggle'));
  dialog.classList.add('open');dialog.setAttribute('aria-hidden','false');
  const background=[...document.body.children].filter(node=>node!==dialog && !['SCRIPT','STYLE'].includes(node.tagName));
  dialogBackground.set(id,background.map(node=>[node,node.inert]));
  background.forEach(node=>node.inert=true);
  (dialogControls(dialog)[0]||dialog).focus();
}
function closeAccessibleDialog(id){
  const dialog=document.getElementById(id);
  if(!dialog.classList.contains('open'))return;
  for(const [node,inert] of dialogBackground.get(id)||[])node.inert=inert;
  dialogBackground.delete(id);
  dialog.classList.remove('open');dialog.setAttribute('aria-hidden','true');
  dialog.inert=dialogOwnInert.get(id)??false;dialogOwnInert.delete(id);
  if(id==='dailyLiturgyOverlay')dialog.before(document.getElementById('celebrationToggle'));
  const origin=dialogOrigins.get(id);dialogOrigins.delete(id);
  const target=origin?.isConnected && origin.matches('button, [href], input, select, textarea, [tabindex]') && !origin.closest('[inert]')?origin:document.getElementById('menuBtn');
  target?.focus();
}
document.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const dialog=[...document.querySelectorAll('[role="dialog"].open')].find(node=>!node.inert);if(!dialog)return;
  const controls=dialogControls(dialog),first=controls[0],last=controls.at(-1);
  if(!first){event.preventDefault();dialog.focus();return;}
  if(event.shiftKey && (document.activeElement===first||document.activeElement===dialog)){
    event.preventDefault();last.focus();
  }else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
});
function openMainMenu(){openAccessibleDialog('mainMenuOverlay');document.getElementById('menuBtn').setAttribute('aria-expanded','true');applyPreferences();const closeButton=document.querySelector('#mainMenuOverlay .main-menu-head button');closeButton?.focus();requestAnimationFrame(()=>{if(document.getElementById('mainMenuOverlay')?.classList.contains('open') && !document.getElementById('mainMenuOverlay').contains(document.activeElement))closeButton?.focus();});if(typeof updateBackButton==='function')updateBackButton();}
function closeMainMenu(){closeAccessibleDialog('mainMenuOverlay');document.getElementById('menuBtn').setAttribute('aria-expanded','false');if(typeof updateBackButton==='function')updateBackButton();}
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
  const allowed=['busca','hoje','calendario','santoral','liturgia','oracoes','biblioteca','sobre'];
  if(!allowed.includes(tab)) return;
  state.tab=tab;
  dailyPrayerOpen480=null;
  localStorage.setItem('osmLastTab',tab);
  state.detailId=null;state.devo=null;state.devoSub=null;
  if(tab!=='liturgia')state.liturgiaDetail=null;
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
  addRecent('saint',saint._id,saint.title,saint.date);
  dailyPrayerOpen480=null;
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
  let celebrationCard='<div class="empty-state">Não há celebração servita cadastrada para hoje.</div>';
  if(celebration){
    const label=saint?'Celebração de hoje':'Próxima celebração';
    celebrationCard='<button class="home-celebration card fade-in" onclick="openDetail('+celebration._id+')" aria-label="Abrir '+escapeHtml(celebration.title)+'">'+
      saintImageHtml(celebration,false)+
      '<span class="home-celebration-text"><span class="rank">'+label+'</span><b>'+celebrationNameHtml(celebration.title,celebration)+'</b><span class="date-line">'+escapeHtml(celebration.date)+'</span></span><span class="chev">›</span></button>'+
      '<div class="hub-shortcuts" aria-label="Atalhos da celebração">'+
      '<button onclick="openSaintSection('+celebration._id+',\'vida\')">Vida</button>'+
      '<button onclick="openSaintSection('+celebration._id+',\'liturgia\')">Liturgia</button>'+
      '<button onclick="openSaintSection('+celebration._id+',\'oracao\')">Oração</button></div>';
  }
  const prayer=dailyPrayerSuggestion();
  return '<section class="liturgical-hero home-hero fade-in"><div class="liturgical-kicker">Ordem dos Servos de Maria</div><div class="home-date-line"><strong>'+today.day+'</strong><span>'+escapeHtml(MONTHS[today.month-1])+'</span></div><div class="liturgical-sub">'+escapeHtml(today.weekday)+'</div></section>'+
    '<div class="section-title home-heading">Acesso rápido</div><div class="hub-shortcuts home-quick-actions" aria-label="Acessos rápidos da liturgia">'+
    '<button onclick="openDailyLiturgy()" aria-label="Consultar Missa do dia">Missa do dia</button>'+
    '<button onclick="setTab(\'liturgia\');setLiturgiaSection(\'horas\')" aria-label="Consultar Ofício próprio dos Servos de Maria">Ofício OSM</button>'+
    '<button onclick="setTab(\'santoral\')" aria-label="Consultar Santoral">Santoral</button></div>'+
    '<div class="section-title home-heading">Celebração Servita</div>'+celebrationCard+
    
    '<div class="section-title home-heading">Oração diária</div><div class="home-prayer-card card fade-in"><div><span class="rank">'+escapeHtml(prayer.label)+'</span><h3>'+(state.angelus==='rainha'?'Rainha do Céu':'O Anjo do Senhor')+'</h3><p>'+escapeHtml(prayer.note)+'</p></div><button class="action-btn" onclick="openDailyPrayer480(\''+escapeHtml(state.angelus)+'\')">Rezar</button></div>'+
    homePersonalAccess()+
    '<div class="home-end-ornament" aria-hidden="true"><span></span></div>';
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
  return `<button class="${className} office-hour-choice" aria-label="Abrir ${escapeHtml(label)}${short?' — antífona própria; '+canticle+' incluído':''}" onclick="openSantoralOfficeHour(${saintId},'${key}')"><span class="office-hour-icon" aria-hidden="true">${symbols[key]||'✦'}</span><span class="office-hour-copy"><strong>${escapeHtml(label)}</strong>${note}</span><span class="office-hour-arrow" aria-hidden="true">›</span></button>`;
}
function liturgiaDateKey(s){return String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0');}
function liturgiaCelebrations(type){
  if(type==='horas')return SANTORAL.filter(s=>saintHasOffice(s)&&officeHoursForSaint(s).length>0).map(s=>({saint:s}));
  const records=window.MISSAS_OSM&&Array.isArray(window.MISSAS_OSM.celebrations)?window.MISSAS_OSM.celebrations:[];
  return SANTORAL.map(s=>({saint:s,mass:records.find(item=>item.date===liturgiaDateKey(s)||(item.santoral_id!==undefined&&String(item.santoral_id)===String(s.id)))}))
    .filter(entry=>entry.mass&&!entry.mass.date_rule&&entry.mass.group!=='Santa Maria no Sábado');
}
function renderLiturgiaCelebrationList(tipo,entries){
  const rows=entries.map(entry=>{
    const saint=entry.saint,item=entry.mass;
    const title=celebrationTitleText(saint?.title||item?.title||'Celebração própria',saint);
    const date=saint?.date||item?.display_date||item?.date_label||item?.date||'';
    const rank=saint?saintDisplayGrade(saint):(item?.rank||'');
    const subtitleParts=[date,rank].map(x=>String(x||'').trim()).filter(Boolean);
    // Nas Missas marianas o grupo já aparece no título da seção: não o repetir no subtítulo.
    const normalizedSubtitleParts=item?.group==='Santa Maria no Sábado'
      ?subtitleParts.map(x=>x.replace(/(?:^|\s*·\s*)Santa Maria no Sábado(?:\s*·\s*|$)/gi,' · ').replace(/^\s*·\s*|\s*·\s*$/g,'').trim()).filter(Boolean)
      :subtitleParts;
    const subtitle=[...new Set(normalizedSubtitleParts.flatMap(x=>x.split(/\s*·\s*/).map(y=>y.trim()).filter(Boolean)))].join(' · ');
    const reference=tipo==='horas'?Number(saint?._id):Number((window.MISSAS_OSM?.celebrations||[]).indexOf(item));
    const action='openLiturgiaDetail(\''+tipo+'\','+reference+')';
    const dayNumber=saint?String(saint.day||''):'';
    const dayMarkup=dayNumber?'<span class="daynum" aria-hidden="true">'+escapeHtml(dayNumber)+'</span>':'';
    return '<button class="liturgia-celebration-row '+(dayNumber?'liturgia-day-row':'')+'" type="button" onclick="'+action+'" aria-label="Abrir '+escapeHtml(title)+'"><span class="liturgia-daynum">'+dayMarkup+'</span><span class="rowtext"><span class="rowtitle">'+escapeHtml(title)+'</span><span class="rowrank">'+escapeHtml(subtitle)+'</span></span><span class="chev" aria-hidden="true">›</span></button>';
  }).join('');
  return '<div class="card fade-in">'+(rows||'<div class="empty-state">Nenhuma celebração própria cadastrada.</div>')+'</div>';
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
  return `<article class="calendar-celebration-row"><a class="calendar-celebration-link" href="?celebracao=${s._id}" onclick="event.preventDefault();openSaint(${s._id})"><span class="calendar-celebration-day">${String(s.day).padStart(2,"0")}</span> ${celebrationNameHtml(s.title,s)}</a></article>`;
}

function viewSantoral(){if(state.detailId!==null)return viewSaintDetail(state.detailId);return viewCalendario();}


function liveSearchRender(kind, el){
  const start=el.selectionStart, end=el.selectionEnd;
  if(kind==='santoral'){ state.search=el.value; state.alpha=''; }
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
    ${saintImageHtml(s,true)}
    <div class="detail-header fade-in">
      ${saintRankSubtitle(s)?`<div class="rank">${escapeHtml(saintRankSubtitle(s))}</div>`:''}
      <h2>${celebrationNameHtml(s.title,s)}</h2>
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
      ${OSMPdf.officeResources(officeRecordForSaint(s))}
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
    <div class="quick-grid fade-in">
      <button class="quick-card" onclick="openDailyPrayer480('anjo')"><b>O Anjo do Senhor</b><span>Oração mariana diária</span></button>
      <button class="quick-card" onclick="openDailyPrayer480('rainha')"><b>Rainha do Céu</b><span>Tempo Pascal</span></button>
    </div>

    <div class="section-title">Homenagens marianas</div>
    <div class="card fade-in" style="padding:6px 16px;">
      ${DEVO_LIST.filter(x=>x.key!=='coroa').map(devoRowHtml).join('')}
    </div>

    <div class="section-title">Recursos de oração servita</div>
    <div class="quick-grid fade-in">
      <button class="quick-card" onclick="openServite('rosario')"><b>Rosário</b><span>Rosário guiado</span></button>
      <button class="quick-card" onclick="openDevo('coroa')"><b>Coroa de Nossa Senhora das Dores</b><span>Oração pelas dores de Maria</span></button>
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
  state.detailId = null;
  addRecent('prayer','daily-'+which,which==='rainha'?'Rainha do Céu':'O Anjo do Senhor','Oração diária');
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
    <div class="detail-header fade-in favorite-heading">${favButton('prayer','daily-'+which)}
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

function simpleTextDetail(title, sub, text, backFn, readingClass){
  pendingSharePrayer={title,text};
  const back = backFn || 'backToOracoes()';
  const readerClass = readingClass === 'vigilia-reader' ? ' vigilia-reader' : '';
  const renderedText = readingClass === 'vigilia-reader' ? normalizeVigiliaTypography(text) : text;
  return `
    <div class="detail-header fade-in" style="position:relative;">${favButton('prayer',state.devo||title)}
      <h2 style="font-size:26px;">${escapeHtml(title)}</h2>
      ${sub ? `<div class="date-line">${escapeHtml(sub)}</div>` : ''}
      <div class="action-row"><button class="action-btn" id="sharePrayerBtn">Partilhar oração</button></div>
      <div class="detail-divider"></div>
    </div>
    <div class="liturgical-reading fade-in${readerClass}">
      <div class="prayer-block">${renderPrayer(renderedText, {vigilia:readingClass === 'vigilia-reader'})}</div>
    </div>
  `;
}

// ---- Vigília (2 formulas) ----
function viewVigilia(){
  if(state.devoSub){
    const f = PRAYERS.devotions.vigilia[state.devoSub];
    const title = state.devoSub === 'formula1' ? 'Primeira Fórmula' : 'Segunda Fórmula';
    return simpleTextDetail(title, 'Vigília de Nossa Senhora', f, "openDevo('vigilia')", 'vigilia-reader');
  }
  return `
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
    const textBlock=(title,text)=>text?`<div class="section-title">${title}</div><div class="card fade-in"><div class="prayer-block" style="white-space:pre-wrap;">${/^(?:Hino|Salmo)/i.test(title)?renderPrayer(title+'\n\n'+text).replace(/^<h4[^>]*>[^<]*<\/h4>/,''):renderPrayer(text)}</div></div>`:'';
    const commonSource=`<p class="reader-note">Fonte dos textos comuns: ${escapeHtml(data.source)}.</p>`;
    const prayerSource=item?.oracao_propria?'Livro de Oração dos Servos de Maria, seção Memória Litúrgica.':'Santoral da Ordem.';
    return `<div class="detail-header fade-in"><h2>${escapeHtml(heading)}</h2><div class="date-line">${escapeHtml(saint.date)}</div></div>
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
  const current=['calendario','santoral'].includes(state.tab)?'calendario':'hoje';
  const tabs=`<div class="toggle-row" aria-label="Seções de Vida">
    <button class="toggle-btn ${current==='hoje'?'active':''}" onclick="setTab('hoje')">Hoje</button>
    <button class="toggle-btn ${current==='calendario'?'active':''}" onclick="setTab('calendario')">Calendário</button>
  </div>`;
  return tabs+(current==='calendario'?viewCalendario():viewHoje());
}
function cleanMassText(text){
  return normalizeCopiedLineBreaks(String(text||''))
    .replace(/^[ \t]*copyright\b[^\r\n]*(?:\n|$)/gim,'')
    .replace(/\r\n?/g,'\n')
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n')
    .trim();
}
function properMassTextHtml(title,text){
  const clean=cleanMassText(text);
  if(!clean)return '';
  if(/^hinos?(?:\s|$)/i.test(String(title||''))){
    const stanzas=clean.split(/\n[ \t]*\n/).map(stanza=>'<p class="mass-hymn-stanza">'+escapeHtml(stanza).replace(/\n/g,'<br>')+'</p>').join('');
    return '<div class="liturgical-reading mass-hymn">'+stanzas+'</div>';
  }
  if(/^(?:Salmo|Cântico|Aclamação)/i.test(String(title||''))){
    const stanzas=clean.split(/\n[ \t]*\n/).map(stanza=>'<p class="mass-psalm-stanza">'+stanza.split('\n').map(line=>'<span class="liturgical-verse-line">'+liturgicalLineHtml(line,true)+'</span>').join('')+'</p>').join('');
    return '<div class="liturgical-reading mass-psalm">'+stanzas+'</div>';
  }
  const paragraphs=clean.replace(/\r\n?/g,'\n').split(/\n[ \t]*\n+/).map(block=>block.trim()).filter(Boolean);
  const content=paragraphs.map(block=>'<p class="proper-mass-prose">'+escapeHtml(block.replace(/\n[ \t]*/g,' ').replace(/[ \t]+/g,' '))+'</p>').join('');
  return '<div class="liturgical-reading hub-text proper-mass-prose-reader">'+content+'</div>';
}
function properMassSection(title,text){
  if(!text)return '';
  const body=properMassTextHtml(title,text);
  return body?'<div class="section-title">'+escapeHtml(title)+'</div>'+body:'';
}
function properMassAntiphon(title,item){
  if(!item)return '';
  const reference=item.reference||item.referencia||'';
  return properMassSection(title+(reference?' ('+reference+')':''),item.text||'');
}
function renderProperMassContent(item){
  if(!item)return '';
  if(Array.isArray(item.sections)&&item.sections.length){
    return item.sections.map(function(section){
      if(!section||!section.heading||!section.text)return '';
      return properMassSection(section.heading,section.text);
    }).join('');
  }
  const readings=Array.isArray(item.readings)?item.readings:[];
  const readingHtml=readings.map(function(reading){
    const title=reading.title||reading.label||'Leitura';
    const condition=reading.condition?' ('+reading.condition+')':'';
    const reference=reading.reference||reading.referencia||'';
    const body=properMassTextHtml(title+condition,reading.text||'');
    return body?'<div class="section-title">'+escapeHtml(title+condition)+'</div>'+(reference?'<p class="liturgical-reference">'+escapeHtml(reference)+'</p>':'')+body:'';
  }).join('');
  return properMassAntiphon('Antífona de entrada',item.entrance_antiphon||item.antifona_entrada)+
    properMassSection('Coleta',item.collect||item.coleta)+readingHtml+
    properMassSection('Sobre as oferendas',item.offertory||item.sobre_oferendas)+
    properMassSection('Prefácio',item.preface||item.prefacio)+
    properMassAntiphon('Antífona da comunhão',item.communion_antiphon||item.antifona_comunhao)+
    properMassSection('Depois da comunhão',item.after_communion||item.depois_da_comunhao);
}
function openLiturgiaDetail(tipo,reference){
  const type=tipo==='horas'?'horas':tipo==='missa'?'missa':null;
  if(!type)return;
  if(type==='horas'){
    const saint=SANTORAL.find(item=>Number(item._id)===Number(reference));
    if(!saint||!saintHasOffice(saint)||!officeHoursForSaint(saint).length)return;
    state.liturgiaDetail={tipo:type,reference:Number(saint._id)};
  }else{
    const records=window.MISSAS_OSM?.celebrations||[];
    const index=Number(reference),item=Number.isInteger(index)?records[index]:null;
    if(!item)return;
    state.liturgiaDetail={tipo:type,reference:index};
  }
  state.tab='liturgia';state.liturgiaSection=type;render();window.scrollTo(0,0);
}
function closeLiturgiaDetail(){state.liturgiaDetail=null;render();window.scrollTo(0,0);}
window.openLiturgiaDetail=openLiturgiaDetail;
window.closeLiturgiaDetail=closeLiturgiaDetail;
function setLiturgiaSection(section){state.liturgiaSection=section;if(state.liturgiaDetail?.tipo!==section)state.liturgiaDetail=null;render();window.scrollTo(0,0);}
function openMarianSaturdayOffices(){
  state.tab='liturgia';state.liturgiaSection='horas';state.liturgiaDetail=null;state.devo=null;state.devoSub=null;
  localStorage.setItem('osmLastTab','liturgia');
  render();
  requestAnimationFrame(function(){
    const section=document.getElementById('marianSaturdayOfficeCommon');
    if(section){section.open=true;section.scrollIntoView({behavior:'smooth',block:'start'});}
  });
}
function movableOfficeDate(item){
  if(item.date_rule==='sexta-feira_depois_do_v_domingo_da_quaresma'){
    const date=easterSunday(new Date().getFullYear());
    date.setDate(date.getDate()-9);
    return new Intl.DateTimeFormat('pt-BR',{dateStyle:'long'}).format(date);
  }
  return item.date_label||'Data móvel';
}
function liturgiaResourceRow(title,subtitle,content,subtitleUrl,id){
  return '<details class="liturgia-resource-detail"'+(id?' id="'+escapeHtml(id)+'"':'')+'><summary class="liturgia-celebration-row liturgia-resource-row"><span class="rowtext"><span class="rowtitle">'+escapeHtml(title)+'</span><span class="rowrank">'+(subtitleUrl?'<a href="'+escapeHtml(subtitleUrl)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+escapeHtml(subtitle)+'</a>':escapeHtml(subtitle))+'</span></span><span class="chev" aria-hidden="true">›</span></summary><div class="liturgia-resource-content">'+content+'</div></details>';
}
function liturgiaResourceAction(label,url){
  return url?'<a class="action-btn" href="'+escapeHtml(url)+'" target="_blank" rel="noopener">'+escapeHtml(label)+'</a>':'';
}
function movableOfficeBlocks(){
  const items=Array.isArray(OFICIOS_OSM?.celebracoes_moveis)?OFICIOS_OSM.celebracoes_moveis:[];
  if(!items.length)return '';
  const rows=items.map(function(item){
    const title=item.title||'Ofício próprio';
    const actualDate=movableOfficeDate(item);
    const subtitle=[item.rank,(item.date_label||'Data móvel')+(actualDate?' ('+actualDate+')':'')].filter(Boolean).join(' · ');
    const content='<div class="liturgia-resource-content-title">Abrir Ofício completo</div><div class="hub-text">'+renderPrayer(item.text||'')+'</div>'+OSMPdf.officeResources(item);
    return liturgiaResourceRow(title,subtitle,content);
  }).join('');
  return '<div class="section-title">Ofícios próprios com data móvel</div><div class="card fade-in liturgia-resource-list">'+rows+'</div>';
}
function normalizeMarianOfficeTranscript(text, season){
  let value=cleanMassText(text)
    .replace(/([A-Za-zÀ-ÿ])-\n\s*([a-zà-ÿ])/g,'$1$2')
    .replace(/\bce-lebra-se\b/gi,'celebra-se')
    .replace(/\boutu-bro\b/gi,'outubro');
  const lines=value.split('\n');
  const heading=/^MEMÓRIAS DE SANTA MARIA NO SÁBADO\s+TEMPO (?:DO ADVENTO|DO NATAL|PASCAL|COMUM)$/i;
  if(lines.length>1 && heading.test(lines[0].trim()) && lines[1].trim().toLowerCase()===String(season).toLowerCase()){
    lines.splice(0,2);
  }
  return lines.join('\n').trim();
}
function renderMarianOfficeTranscript(text, season){
  const source=normalizeMarianOfficeTranscript(text,season);
  const lines=source.split('\n');
  const blocks=[];
  let paragraph=[];
  let hymn=false;
  const heading=/^(?:Invitatório|Ofício das Leituras|Laudes|Vésperas|Hora Média|HINO|Hino|Salmodia|Preces|Oração|Cântico evangélico|Responsório breve|RESPONSÓRIO BREVE|Leitura breve(?:\s+.*)?|LEITURA BREVE(?:\s+.*)?)$/i;
  const response=/^(?:R\.|V\.)\s*/;
  const inlineHeading=/^(.*?\bp\.\s*\d+\.)\s+(Ofício das Leituras|Laudes|Vésperas|Hora Média)$/i;
  const flush=()=>{
    if(!paragraph.length)return;
    const joined=hymn?paragraph.map(escapeHtml).join('<br>'):escapeHtml(paragraph.join(' ').replace(/\s+/g,' '));
    blocks.push('<p class="marian-office-'+(hymn?'hymn':'prose')+'">'+joined+'</p>');
    paragraph=[];
  };
  for(const raw of lines){
    const line=raw.trim();
    if(!line){flush();continue;}
    if(heading.test(line)){
      flush();
      hymn=/^HINO$/i.test(line);
      blocks.push('<h4 class="prayer-text-heading">'+escapeHtml(line)+'</h4>');
      continue;
    }
    // Reconhecer somente rubricas e etiquetas completas, sem confundir frases comuns.
    if(/^(?:Ant\\.?\\s*\\d*\\.?|Antífona(?:\\s+\\d+)?|Salmo\\s+\\d+[A-Za-z]?(?:\\s*\\([^)]*\\))?|Cântico(?:\\s+[^,.:]{1,45})?|Leitura breve|Leitura bíblica|Responsório breve|Responsório|Oração conclusiva|Preces)\\s*[:.]?$/i.test(line)){
      flush();
      hymn=false;
      blocks.push('<p class="marian-office-liturgical-label">'+escapeHtml(line)+'</p>');
      continue;
    }
    if(!hymn && response.test(line)){
      flush();
      blocks.push('<p class="marian-office-response">'+escapeHtml(line)+'</p>');
      continue;
    }
    const embedded=!hymn && line.match(inlineHeading);
    if(embedded){
      const prefix=embedded[1].trim();
      if(prefix)paragraph.push(prefix);
      flush();
      hymn=false;
      blocks.push('<h4 class="prayer-text-heading">'+escapeHtml(embedded[2])+'</h4>');
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks.join('');
}
function marianSaturdayCommonForms(item){
  const source=normalizeMarianOfficeTranscript(item.pdf_transcript||'','Tempo Comum')
    .split('\n').filter(line=>!/^Copyright © CURIA GENERALIZIA OSM/i.test(line.trim())).join('\n');
  const titles=[
    'SANTA MARIA DOS SEUS SERVOS',
    'MARIA E A IGREJA',
    'MARIA, MULHER NOVA',
    'MARIA, RAINHA DA MISERICÓRDIA',
    'SANTA MARIA DAS AMÉRICAS'
  ];
  const roman=['I','II','III','IV','V'];
  const displayTitles=['Santa Maria dos seus Servos','Maria e a Igreja','Maria, Mulher Nova','Maria, Rainha da Misericórdia','Santa Maria das Américas'];
  const starts=titles.map(title=>source.indexOf(title));
  if(starts.some(index=>index<0))return '<p class="reader-note">Os cinco formulários completos estão no PDF oficial.</p>';
  const intro=source.slice(0,starts[0]).trim();
  const introHtml=intro?'<div class="marian-saturday-intro">'+renderMarianOfficeTranscript(intro,'Tempo Comum')+'</div>':'';
  const forms=titles.map((title,index)=>{
    const start=starts[index]+title.length;
    const end=index<titles.length-1?starts[index+1]:source.length;
    const body=source.slice(start,end).replace(/^\s*(?:I|II|III|IV|V)\s*/,'').trim();
    const content='<div class="liturgical-reading hub-text saturday-pdf-transcript">'+renderMarianOfficeTranscript(body,'Tempo Comum')+'</div>';
    return liturgiaResourceRow(roman[index]+' — '+displayTitles[index],'Ofício próprio OSM',content,null,'marianSaturdayForm'+(index+1));
  }).join('');
  return introHtml+forms;
}
function marianSaturdayOfficeBlocks(){
  const items=Array.isArray(OFICIOS_OSM?.sabados_marianos_pdf)?OFICIOS_OSM.sabados_marianos_pdf:[];
  if(!items.length)return '';
  const rows=items.map(function(item){
    const originalTitle=item.title||'Ofício de Santa Maria no Sábado';
    const title='Santa Maria no Sábado';
    const subtitle=(originalTitle.match(/Tempo (?:do Advento|do Natal|Pascal|Comum)/i)||[])[0]||originalTitle;
    const pdfUrl=item.local_pdf_url||item.pdf_url||'';
    const pdfAction=liturgiaResourceAction('Abrir PDF completo',pdfUrl);
    let reading='';
    if(item.id==='tempo-comum'&&item.pdf_transcript){
      reading=marianSaturdayCommonForms(item);
    }else if(item.pdf_transcript){
      reading='<details class="liturgia-resource-disclosure"><summary class="action-btn">Ler texto completo do Ofício</summary><div class="liturgical-reading hub-text saturday-pdf-transcript">'+renderMarianOfficeTranscript(item.pdf_transcript,subtitle)+'</div></details>';
    }
    const content=(pdfAction?'<div class="liturgia-resource-actions">'+pdfAction+'</div>':'')+reading;
    return liturgiaResourceRow(title,subtitle,content,null,item.id==='tempo-comum'?'marianSaturdayOfficeCommon':null);
  }).join('');
  return '<div class="section-title">Ofícios de Santa Maria no Sábado</div><div class="card fade-in liturgia-resource-list">'+rows+'</div>';
}
function renderLiturgiaDetail(tipo,reference){
  if(tipo==='horas'){
    const saint=SANTORAL.find(item=>Number(item._id)===Number(reference));
    const hours=saint&&saintHasOffice(saint)?officeHoursForSaint(saint):[];
    if(!saint||!hours.length){state.liturgiaDetail=null;return '';}
    const rank=saintDisplayGrade(saint);
    return '<div class="section-title">Ofícios próprios OSM</div><div class="hub-card"><div class="hub-card-title">'+celebrationNameHtml(saint.title,saint)+'</div>'+
      '<p class="reader-note">'+escapeHtml(saint.date)+(rank?' · '+escapeHtml(rank):'')+'</p>'+
      '<p class="hub-card-note">'+escapeHtml(officeClassificationForSaint(saint))+'</p><div class="office-hours-grid">'+
      hours.map(pair=>officeHourButtonHtml(saint,pair)).join('')+'</div>'+OSMPdf.officeResources(officeRecordForSaint(saint))+'</div>';
  }
  if(tipo==='missa'){
    const records=window.MISSAS_OSM?.celebrations||[];
    const item=records[Number(reference)];
    if(!item){state.liturgiaDetail=null;return '';}
    const saint=SANTORAL.find(s=>String(s.month).padStart(2,'0')+'-'+String(s.day).padStart(2,'0')===item.date)||{};
    const title=celebrationTitleText(saint.title||item.title||'Missa própria',saint);
    const date=item.display_date||saint.date||item.date_label||item.date||'Data móvel';
    return '<div class="section-title">Missa própria OSM</div><div class="proper-mass-reader"><div class="hub-card-title">'+escapeHtml(title)+'</div>'+
      '<p class="reader-note">'+escapeHtml(date)+(item.rank?' · '+escapeHtml(item.rank):'')+'</p>'+
      ((item.local_pdf_url||item.pdf_url)?'<p><a class="reader-note" href="'+escapeHtml(item.local_pdf_url||item.pdf_url)+'" target="_blank" rel="noopener">PDF oficial OSM</a></p>':'')+renderProperMassContent(item)+'<p class="hub-source">Fonte: '+escapeHtml(item.source||'fonte não informada')+'</p></div>';
  }
  state.liturgiaDetail=null;
  return '';
}
function viewLiturgia(){
  const section=state.liturgiaSection||'missa';
  const switcher=`<div class="toggle-row" aria-label="Seções de Liturgia">
    <button class="toggle-btn ${section==='missa'?'active':''}" onclick="setLiturgiaSection('missa')">Missa OSM</button>
    <button class="toggle-btn ${section==='horas'?'active':''}" onclick="setLiturgiaSection('horas')">Ofício OSM</button>
  </div>`;
  if(state.liturgiaDetail){const detail=renderLiturgiaDetail(state.liturgiaDetail.tipo,state.liturgiaDetail.reference);if(detail)return switcher+detail;}
  if(section==='horas'){
    const officeWarning=!oficiosReady?'<div class="card" role="alert"><p>O cadastro local dos Ofícios está indisponível. A Vida e as orações continuam acessíveis.</p><button class="action-btn" onclick="loadCanonicalOffices()">Tentar carregar os Ofícios</button></div>':'';
    const ownBlocks='<header class="liturgia-own-heading"><h1>Ofício próprio OSM</h1><p>Celebrações com textos próprios do Ofício</p><span aria-hidden="true"></span></header>'+renderLiturgiaCelebrationList('horas',liturgiaCelebrations('horas'));
    return switcher+officeWarning+(oficiosReady?ownBlocks+movableOfficeBlocks()+marianSaturdayOfficeBlocks():'');
  }
  const records=window.MISSAS_OSM&&Array.isArray(window.MISSAS_OSM.celebrations)?window.MISSAS_OSM.celebrations:[];
  const movableMasses=records.filter(item=>Boolean(item.date_rule));
  const marianSaturdayMasses=records.filter(item=>item.group==='Santa Maria no Sábado');
  const canonicalMasses=liturgiaCelebrations('missa');
  const movableRows=movableMasses.map(item=>({mass:item}));
  const marianSaturdayRows=marianSaturdayMasses.map(item=>({mass:item}));
  return switcher+`<header class="liturgia-own-heading"><h1>Missa própria OSM</h1><p>Celebrações com textos próprios da Missa</p><span aria-hidden="true"></span></header>
    ${renderLiturgiaCelebrationList('missa',canonicalMasses)}`+
    (movableRows.length?'<div class="section-title">Missas de celebrações móveis</div>'+renderLiturgiaCelebrationList('missa',movableRows):'')+
    (marianSaturdayRows.length?'<div class="section-title">Missas de Santa Maria no Sábado</div>'+renderLiturgiaCelebrationList('missa',marianSaturdayRows):'');
}


// Busca global: corpus empacotado com o aplicativo, sem serviços externos.
let globalSearchIndex=null, globalSearchLoading=null, globalSearchError=false;
let globalSearchQuery='', globalSearchCategory='', globalSearchDocument=null, globalSearchLimit=30;
function loadGlobalSearch(){
  if(globalSearchIndex||globalSearchLoading)return;
  globalSearchError=false;
  globalSearchLoading=fetch('./data/search-index.json').then(response=>{
    if(!response.ok)throw new Error('Índice indisponível');
    return response.json();
  }).then(data=>OSMSearch.loadDocuments(data))
    .then(documents=>{globalSearchIndex=OSMSearch.createIndex(documents);})
    .catch(error=>{globalSearchError=true;console.error('[Busca]',error);})
    .finally(()=>{
      globalSearchLoading=null;
      if(state.tab==='busca'){
        const input=document.getElementById('globalSearchInput');
        const focused=document.activeElement===input, caret=input?.selectionStart;
        render();
        if(focused){const next=document.getElementById('globalSearchInput');next?.focus();if(next&&caret!==null)next.setSelectionRange(caret,caret);}
      }
    });
}
function openGlobalSearch(){
  globalSearchDocument=null;setTab('busca');loadGlobalSearch();
  document.getElementById('globalSearchInput')?.focus();
}
function updateGlobalSearch(input){
  globalSearchQuery=input.value;globalSearchLimit=30;renderGlobalSearchResults();
}
function renderGlobalSearchResults(){
  const target=document.getElementById('globalSearchResults');
  if(!target)return;
  if(globalSearchError){target.innerHTML='<p role="alert">Não foi possível carregar a busca.</p><button class="action-btn" onclick="loadGlobalSearch();renderGlobalSearchResults()">Tentar novamente</button>';return;}
  if(!globalSearchIndex){target.innerHTML='<p role="status">Preparando a busca…</p>';return;}
  if(!OSMSearch.normalize(globalSearchQuery).match(/[a-z0-9]/)){target.innerHTML='<p>Digite um termo, uma oração, uma data ou uma edição. A busca consulta os textos e PDFs incluídos no aplicativo.</p>';return;}
  const results=globalSearchIndex.search(globalSearchQuery,globalSearchCategory);
  target.innerHTML='<p role="status">'+results.length+' resultados'+(results.length>globalSearchLimit?' · mostrando '+globalSearchLimit:'')+'</p>'+results.slice(0,globalSearchLimit).map(result=>
    '<button class="search-result card" onclick="openSearchDocument('+result.id+')"><strong>'+escapeHtml(result.doc.title)+'</strong><small>'+escapeHtml(result.doc.category+(result.doc.page?' · página '+result.doc.page:''))+'</small><span>'+escapeHtml(result.snippet)+'</span></button>').join('')+
    (results.length>globalSearchLimit?'<button class="action-btn" onclick="globalSearchLimit+=30;renderGlobalSearchResults()">Mostrar mais resultados</button>':'');
}
function openSearchDocument(id){globalSearchDocument=id;render();window.scrollTo(0,0);}
function closeSearchDocument(){globalSearchDocument=null;render();document.getElementById('globalSearchInput')?.focus();}
function viewGlobalSearch(){
  const doc=globalSearchIndex?.documents[globalSearchDocument];
  if(doc){
    return '<button class="action-btn" onclick="closeSearchDocument()">← Voltar aos resultados</button><h2>'+escapeHtml(doc.title)+'</h2><p>'+escapeHtml(doc.category+(doc.page?' · página '+doc.page:''))+'</p>'+
      (doc.url?'<p><a class="action-btn" href="'+escapeHtml(doc.url)+'" target="_blank" rel="noopener">Abrir PDF · página '+doc.page+'</a></p>':'')+
      '<div class="liturgical-reading"><div class="prayer-block search-document">'+escapeHtml(doc.text)+'</div></div>';
  }
  return '<h2>Buscar no Liturgia OSM</h2><label for="globalSearchInput">Termo, oração ou edição</label><input id="globalSearchInput" class="search-input" type="search" placeholder="Ex.: Coroa, misericórdia, 2024…" value="'+escapeHtml(globalSearchQuery)+'" oninput="updateGlobalSearch(this)"><label for="globalSearchCategory">Pesquisar em</label><select id="globalSearchCategory" class="search-input" onchange="globalSearchCategory=this.value;globalSearchLimit=30;renderGlobalSearchResults()">'+['','Orações','Missas','Ofícios','Santoral','PDFs'].map(category=>'<option value="'+category+'" '+(category===globalSearchCategory?'selected':'')+'>'+(category||'Todos os conteúdos')+'</option>').join('')+'</select><div id="globalSearchResults"></div>';
}

function render(){
  window.OSMPersonalReader?.beforeRender();
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
  else if(state.tab==='busca') html=viewGlobalSearch();
  else if(state.tab==='biblioteca') html=viewBiblioteca();
  else html=viewSobre();
  if(state.tab==='oracoes'&&state.devo&&!html.includes('class="favorite-btn')){
    html=html.replace('<div class="detail-header fade-in">',`<div class="detail-header fade-in favorite-heading">${favButton('prayer',state.devo)}`);
  }
  view.innerHTML=html;
  if(state.tab==='busca'&&globalSearchDocument===null)renderGlobalSearchResults();
  document.body.classList.toggle('liturgical-page',!!view.querySelector('.liturgical-reading,.prayer-block'));
  const activeTab=['vida','hoje','calendario','santoral'].includes(state.tab)?'vida':state.tab;
  document.querySelectorAll('#tabbar .tab-btn').forEach(function(button){
    const active=button.dataset.tab===activeTab;
    button.classList.toggle('active',active);
    button.setAttribute('aria-current',active?'page':'false');
  });
  const share=document.getElementById('sharePrayerBtn');
  if(share&&pendingSharePrayer) share.onclick=function(){sharePrayer(pendingSharePrayer.title,pendingSharePrayer.text);};
  if(typeof updateBackButton==='function') updateBackButton();
  if(typeof window.updateCelebrationButton==='function') window.updateCelebrationButton();
  window.OSMPersonalReader?.afterRender();
  document.body.classList.remove('scroll-controls-hidden');
}
document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=> setTab(b.dataset.tab));
});


// ===================== Liturgia OSM 4.2 =====================
let calDate = new Date();
let selectedCalDate = null;
let calendarIndexOpen = false;
let calendarSearch = '';
let prayerCategory = null;
const FAV_KEY='osmFavoritesV4', RECENT_KEY='osmRecentV4';
function loadJSON(k,d){try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
function favs(){const value=loadJSON(FAV_KEY,[]);return Array.isArray(value)?value.filter(x=>typeof x==='string'):[]}
function recents(){const value=loadJSON(RECENT_KEY,[]);return Array.isArray(value)?value.filter(x=>x&&typeof x.k==='string'):[]}
function itemKey(type,key){return type+':'+key}
function isFav(type,key){return favs().includes(itemKey(type,key))}
function toggleFav(type,key){let a=favs(),k=itemKey(type,key);a=a.includes(k)?a.filter(x=>x!==k):[k,...a];saveJSON(FAV_KEY,a);render()}
function addRecent(type,key,title,sub=''){let a=recents().filter(x=>x.k!==itemKey(type,key));a.unshift({k:itemKey(type,key),type,key,title,sub,ts:Date.now()});saveJSON(RECENT_KEY,a.slice(0,12))}
function favButton(type,key){return `<button class="favorite-btn ${isFav(type,key)?'active':''}" onclick="event.stopPropagation();toggleFav('${type}','${String(key).replace(/'/g,"\\'")}')" aria-pressed="${isFav(type,key)}" aria-label="${isFav(type,key)?'Remover dos favoritos':'Adicionar aos favoritos'}">${isFav(type,key)?'★':'☆'}</button>`}
function openSaint(id){
  const saint=SANTORAL.find(x=>x._id===id||x.id===id);
  if(!saint)return;
  openDetail(saint._id);
}function openDevo(key, sub){ dailyPrayerOpen480=null; state.tab='oracoes'; localStorage.setItem('osmLastTab','oracoes'); state.detailId=null; state.devo=key; state.devoSub=(sub===undefined?null:sub); let title=key; try{ if(key.startsWith('varias')) title=PRAYERS.devotions.variasHome[parseInt(key.slice(6))].title; else title=(DEVO_LIST.find(x=>x.key===key)||{}).title||key; }catch(e){} addRecent('prayer',key,title,'Oração'); render(); window.scrollTo(0,0); }
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
  return h+`<div class="detail-navigation"><button onclick="openSaint(${prev._id})"><small>‹ Celebração anterior</small><b>${celebrationNameHtml(prev.title,prev)}</b></button><button onclick="openSaint(${next._id})"><small>Próxima celebração ›</small><b>${celebrationNameHtml(next.title,next)}</b></button></div>`;
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
function resultRows(rs){if(!rs.length)return '<div class="empty-state">Nenhum resultado encontrado.</div>';return `<div class="card fade-in" style="padding:6px 16px;">${rs.map(r=>`<button class="saint-row personal-library-row" onclick="${r.action}"><div class="rowtext"><div class="result-kind">${escapeHtml(r.kind)}</div><div class="rowtitle">${escapeHtml(r.title)}</div><div class="rowrank">${escapeHtml(r.sub||'')}</div></div><div class="chev" aria-hidden="true">›</div></button>`).join('')}</div>`}
function goCalendarToday(){
  const n=new Date(); calDate=new Date(n.getFullYear(),n.getMonth(),1); selectedCalDate=new Date(n.getFullYear(),n.getMonth(),n.getDate()); render();
}
function selectCalendarDay(y,m,d){ selectedCalDate=new Date(y,m,d); render(); }
function liveCalendarSearch(input){
  const start=input.selectionStart,end=input.selectionEnd;
  state.search=input.value;
  state.alpha='';
  render();
  requestAnimationFrame(()=>{
    const next=document.querySelector('input[data-live-search="santoral"]');
    if(next){next.focus({preventScroll:true});try{next.setSelectionRange(start,end);}catch(e){}}
  });
}
function viewSantoralIndex(showTitle=true){
  const letters=[...new Set(SANTORAL.map(s=>String(s.title||'').replace(/^(SANTO|SANTA|B\.|BEATO|BEATA)\s+/i,'').trim()[0]?.toLocaleUpperCase('pt-BR')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const alpha=state.alpha||'';
  const query=String(state.search||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const list=SANTORAL.filter(s=>{
    const hay=`${s.title} ${s.date} ${celebrationSubtitle(s)} ${String(s.day).padStart(2,'0')}/${String(s.month).padStart(2,'0')}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
    const name=String(s.title||'').replace(/^(SANTO|SANTA|B\.|BEATO|BEATA)\s+/i,'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('pt-BR');
    return (!query||hay.includes(query))&&(!alpha||name.startsWith(alpha));
  });
  const rows=list.map(s=>`<div class="saint-row" onclick="openSaint(${s._id})">${saintImageHtml(s,false)}<div class="daynum">${s.day}</div><div class="rowtext"><div class="rowtitle">${celebrationNameHtml(s.title,s)}</div><div class="rowrank">${escapeHtml(celebrationSubtitle(s))}</div></div><div class="chev">›</div></div>`).join('');
  return `${showTitle?'<div class="section-title">Santoral</div>':''}<div class="search-wrap"><input class="search-input" type="search" data-live-search="santoral" placeholder="Buscar santo, beato ou data…" value="${escapeHtml(state.search||'')}" oninput="liveSearchRender('santoral',this)" aria-label="Buscar no Santoral"></div><div class="alpha-index"><button class="alpha-btn ${!alpha?'active':''}" onclick="state.alpha='';render()" aria-label="Todas as letras">•</button>${letters.map(l=>`<button class="alpha-btn ${alpha===l?'active':''}" onclick="state.alpha='${l}';render()">${l}</button>`).join('')}</div>${list.length?`<div class="card fade-in" style="padding:6px 16px;">${rows}</div>`:'<div class="empty-state">Nenhum nome encontrado.</div>'}`;
}
function viewCalendario(){
  const y=calDate.getFullYear(),m=calDate.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),today=new Date();
  const monthSaints=SANTORAL.filter(s=>s.month===m+1).sort((a,b)=>a.day-b.day);
  const weekdays=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let cells='';
  for(let i=0;i<first;i++)cells+='<div class="cal-day empty" aria-hidden="true"></div>';
  for(let d=1;d<=days;d++){
    const ss=monthSaints.filter(s=>s.day===d),isT=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d,isSel=selectedCalDate&&selectedCalDate.getFullYear()===y&&selectedCalDate.getMonth()===m&&selectedCalDate.getDate()===d;
    cells+=`<button class="cal-day ${ss.length?'has-feast':''} ${isT?'today':''} ${isSel?'selected':''}" onclick="selectCalendarDay(${y},${m},${d})" aria-pressed="${!!isSel}" ${isT?'aria-current="date"':''} aria-label="${d} de ${MONTHS[m]}${ss.length?', '+ss.map(s=>escapeHtml(s.title)).join('; '):''}"><span class="cal-number">${d}</span>${ss.length?'<span class="cal-dot" aria-hidden="true"></span>':''}</button>`;
  }
  let dayBlock='';
  if(selectedCalDate&&selectedCalDate.getFullYear()===y&&selectedCalDate.getMonth()===m){
    const d=selectedCalDate.getDate(),selected=monthSaints.filter(s=>s.day===d);
    const dateLabel=selectedCalDate.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    dayBlock=`<section class="calendar-selection" aria-label="Dia selecionado"><h2>${escapeHtml(dateLabel)}</h2>${selected.length?`<div class="calendar-selected-entries">${selected.map(calendarCelebrationRow).join('')}</div>`:'<p>Sem celebração própria OSM neste dia.</p>'}</section>`;
  }
  const monthRows=monthSaints.map(s=>{
    const weekday=weekdays[new Date(y,m,s.day).getDay()];
    return `<a class="calendar-month-entry" href="?celebracao=${s._id}" onclick="event.preventDefault();openSaint(${s._id})"><time datetime="${y}-${String(m+1).padStart(2,'0')}-${String(s.day).padStart(2,'0')}"><b>${String(s.day).padStart(2,'0')}</b><small>${weekday}</small></time><span class="calendar-entry-name">${celebrationNameHtml(s.title,s)}<small>${escapeHtml(saintDisplayGrade(s))}</small></span><span class="calendar-entry-arrow" aria-hidden="true">›</span></a>`;
  }).join('');
  const indexOpen=calendarIndexOpen||state.tab==='santoral'||!!(state.search||state.alpha);
  return `<section class="calendar-simple calendar-presented" aria-label="Calendário de celebrações"><div class="calendar-toolbar"><button class="cal-nav" onclick="calDate=new Date(${y},${m-1},1);selectedCalDate=null;render()" aria-label="Mês anterior">‹</button><select class="calendar-month-select" aria-label="Selecionar mês" onchange="setCalendarMonth(this.value)">${MONTHS.map((n,i)=>`<option value="${i}" ${i===m?'selected':''}>${n[0].toUpperCase()+n.slice(1)} ${y}</option>`).join('')}</select><button class="cal-nav" onclick="calDate=new Date(${y},${m+1},1);selectedCalDate=null;render()" aria-label="Próximo mês">›</button><button class="today-chip" onclick="goCalendarToday()">Hoje</button></div><div class="calendar-grid">${weekdays.map(x=>`<div class="cal-head">${x}</div>`).join('')}${cells}</div><div class="calendar-key"><span aria-hidden="true"></span>Celebração OSM</div></section>${dayBlock}<section class="calendar-month-agenda" aria-label="Celebrações do mês"><div class="calendar-agenda-heading"><h2>Neste mês</h2><span>${monthSaints.length} ${monthSaints.length===1?'celebração':'celebrações'}</span></div>${monthRows||'<p class="calendar-month-empty">Sem celebrações próprias OSM neste mês.</p>'}</section><details class="calendar-santoral-index" ${indexOpen?'open':''}><summary onclick="calendarIndexOpen=!this.parentElement.open">Consultar todo o Santoral</summary>${viewSantoralIndex(false)}</details>`;
}

function resolveStored(k){let [type,key]=k.split(':');if(type==='saint'){let s=SANTORAL.find(x=>String(x._id)===key);if(s)return {kind:'Santoral',title:s.title,sub:s.date,action:`openSaint(${s._id})`}}else{let p=allPrayerEntries().find(x=>x.key===key);if(p)return {kind:'Oração',title:p.title,sub:p.sub,action:prayerActionForKey(key)}}return null}
function prayerActionForKey(key){
 if(key==='daily-anjo') return "openDailyPrayer480('anjo')";
 if(key==='daily-rainha') return "openDailyPrayer480('rainha')";
 return `openDevo('${String(key).replace(/'/g,"\\'")}')`;
}
function homePersonalAccess(){
  const favorites=favs().map(resolveStored).filter(Boolean);
  const recent=recents().map(x=>resolveStored(x.k)).find(Boolean);
  const shortcut=r=>`<button class="personal-access-item" onclick="${r.action}"><span><b>${escapeHtml(r.title)}</b><small>${escapeHtml(r.kind)}</small></span><span aria-hidden="true">›</span></button>`;
  return `<section class="home-personal-access" aria-labelledby="personalAccessTitle"><div class="personal-access-heading"><h2 id="personalAccessTitle">Favoritos e recentes</h2><button onclick="setTab('biblioteca')" aria-label="Ver todos os favoritos e recentes">Ver todos</button></div>
    ${favorites.length?`<div class="personal-access-list" aria-label="Favoritos">${favorites.slice(0,3).map(shortcut).join('')}</div>`:'<p class="reader-note">Toque na estrela de uma oração ou celebração para salvá-la nos favoritos.</p>'}
    ${recent?`<h3 class="personal-access-recent">Continuar de onde parei</h3>${shortcut(recent)}`:''}</section>`;
}
function viewBiblioteca(){
  const favorites=favs().map(resolveStored).filter(Boolean);
  const recent=recents().map(x=>resolveStored(x.k)).filter(Boolean);
  return `<div class="section-title">Biblioteca pessoal</div>
    <div class="section-title">Favoritos</div>${favorites.length?resultRows(favorites):'<div class="empty-state">Toque na estrela de uma oração ou celebração para guardá-la aqui.</div>'}
    <div class="section-title">Últimos acessados</div>${recent.length?resultRows(recent):'<div class="empty-state">Os conteúdos consultados aparecerão aqui.</div>'}`;
}
let APP_NAV_STACK=[];
let APP_LAST_TAB=state && state.tab ? state.tab : 'hoje';
function updateBackButton(){
  const button=document.getElementById('floatingBack');
  if(!button) return;
  const platform=window.Capacitor?.getPlatform?.()||'';
  const androidApp=!!window.Capacitor?.isNativePlatform?.()&&(platform==='android'||/Android/i.test(navigator.userAgent));
  const hasDetail=state.detailId!==null&&state.detailId!==undefined;
  const overlay=['serviteOverlay','mainMenuOverlay','dailyLiturgyOverlay','personalOverlay'].some(id=>document.getElementById(id)?.classList.contains('open'));
  const subpage=hasDetail||!!state.devo||state.devoSub!==null&&state.devoSub!==undefined||!!dailyPrayerOpen480||!!memoriaSelectedDate||!!state.liturgiaDetail;
  const nonHomeTab=state.tab!=='vida'&&state.tab!=='hoje';
  const visible=!androidApp&&!overlay&&(subpage||nonHomeTab);
  button.classList.toggle('show',visible);
  const label=hasDetail?'Voltar à origem':'Voltar para Hoje';
  button.setAttribute('aria-label',label);
  button.title=label;
}

function smartBack(){
  if(document.getElementById('personalOverlay')?.classList.contains('open')){window.OSMPersonalReader.close();return true;}
  const menu=document.getElementById('mainMenuOverlay');
  const servite=document.getElementById('serviteOverlay');
  const mass=document.getElementById('dailyLiturgyOverlay');
  if(menu&&menu.classList.contains('open')){closeMainMenu();return true;}
  if(servite&&servite.classList.contains('open')){if(typeof closeServite==='function')closeServite();else servite.classList.remove('open');updateBackButton();return true;}
  if(mass&&mass.classList.contains('open')&&typeof window.closeDailyLiturgy==='function'){window.closeDailyLiturgy();updateBackButton();return true;}
  if(state.tab==='busca'&&globalSearchDocument!==null){closeSearchDocument();return true;}
  if(state.liturgiaDetail){closeLiturgiaDetail();return true;}
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
const serviteNames={regra:'Regra OSSM',rosario:'Rosário',coroa:'Coroa de Nossa Senhora das Dores',oficio:'Ofício',sabado:'Sábado Mariano',completo:'Recursos OSM'};
let serviteHistoryReturnPending=false;
function serviteUrl(view){return 'servite.html?view='+encodeURIComponent(view||'completo');}
function updateServiteFontControls(){
 const frame=document.getElementById('serviteFrame'),loaded=!!frame?.contentWindow?.OSMResourceContext?.ready,scale=OSMReaderScale.read(localStorage);
 document.querySelectorAll('[data-servite-font]').forEach(button=>{const step=Number(button.dataset.serviteFont);button.disabled=!loaded||(step<0?scale<=OSMReaderScale.MIN:scale>=OSMReaderScale.MAX);});
 if(loaded){readerScale=scale;applyPreferences();}
}
function serviteAdjustFont(delta){try{const frame=document.getElementById('serviteFrame');if(!frame?.contentWindow?.OSMResourceContext?.ready)return;frame.contentWindow.changeFontSize(delta);updateServiteFontControls();}catch(error){console.warn('[Liturgia OSM] Controle de fonte do recurso indisponível.',error);}}
function openServite(view){
  window.OSMPersonalReader?.resourceOpening();
  currentServiteView=view||'completo';
  document.querySelectorAll('[data-servite-font]').forEach(button=>button.disabled=true);
  const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');
  document.getElementById('serviteTitle').textContent=serviteNames[currentServiteView]||'Recursos OSM';
  fr.contentWindow.location.replace(new URL(serviteUrl(currentServiteView),location.href).href);
  openAccessibleDialog('serviteOverlay');document.body.classList.add('servite-open');
  if(!history.state?.serviteOverlay) history.pushState({...history.state,serviteOverlay:true},'');
}
function closeServite(fromHistory=false){window.OSMPersonalReader?.resourceClosed();const ov=document.getElementById('serviteOverlay'),fr=document.getElementById('serviteFrame');const wasOpen=ov?.classList.contains('open');closeAccessibleDialog('serviteOverlay');readerScale=parseFloat(localStorage.getItem('osmReaderScale')||'1');applyPreferences();document.body.classList.remove('servite-open');fr.contentWindow.location.replace('about:blank');if(wasOpen&&!fromHistory&&history.state?.serviteOverlay){serviteHistoryReturnPending=true;history.back();}}
// Keyboard events inside the embedded document do not bubble to the parent.
document.getElementById('serviteFrame').addEventListener('load',()=>{
  const frame=document.getElementById('serviteFrame');
  try{updateServiteFontControls();frame.contentDocument.addEventListener('keydown',event=>{
    if(!document.getElementById('serviteOverlay').classList.contains('open'))return;
    if(event.key==='Escape'){event.preventDefault();closeServite();return;}
    if(event.key!=='Tab')return;
    const controls=dialogControls(frame.contentDocument),active=frame.contentDocument.activeElement;
    if(event.shiftKey && active===controls[0]){
      event.preventDefault();document.querySelector('.servite-head .mini-tools button:last-child').focus();
    }else if(!event.shiftKey && active===controls.at(-1)){
      event.preventDefault();document.querySelector('.servite-close').focus();
    }
  });}catch(error){console.warn('[Liturgia OSM] Foco do recurso indisponível.',error);}
});
function serviteReload(){if(!currentServiteView)return;window.OSMPersonalReader?.resourceOpening();document.querySelectorAll('[data-servite-font]').forEach(button=>button.disabled=true);document.getElementById('serviteFrame').contentWindow.location.replace(new URL(serviteUrl(currentServiteView)+'&reload='+Date.now(),location.href).href);}
window.addEventListener('popstate',event=>{
  const resourceOpen=document.getElementById('serviteOverlay')?.classList.contains('open');
  if(resourceOpen||serviteHistoryReturnPending){
    serviteHistoryReturnPending=false;
    event.osmServiteReturn=true;
    if(resourceOpen)closeServite(true);
  }
});
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
  if(menu) menu.innerHTML=`<div class="main-menu-head"><h3 id="mainMenuTitle">Menu</h3><button class="tool-btn" onclick="closeMainMenu()" aria-label="Fechar menu">✕</button></div>
    <div class="menu-section menu-section-first"><div class="menu-label">Biblioteca</div><button class="menu-action menu-wide menu-entry" onclick="closeMainMenu();openGlobalSearch()">Buscar textos e documentos <span aria-hidden="true">›</span></button><button class="menu-action menu-wide menu-entry" onclick="closeMainMenu();setTab('biblioteca')">Favoritos e recentes <span aria-hidden="true">›</span></button></div>
    <div class="menu-section"><div class="menu-label">Recursos da família servita</div><a class="menu-action menu-wide menu-entry" href="./biblioteca-servita.html">Biblioteca Servita <span aria-hidden="true">›</span></a><button class="menu-action menu-wide menu-entry" onclick="closeMainMenu();openServite('regra')">Ordem Secular · Regra de Vida <span aria-hidden="true">›</span></button><a class="menu-action menu-wide menu-entry menu-resource-link" href="https://somosservos.blogspot.com/p/aplicativos-servitas.html#caminho-servita-app" target="_blank" rel="noopener noreferrer" onclick="return openExternalLink(event,this.href)">Caminho Servita <span aria-hidden="true">›</span></a><a class="menu-action menu-wide menu-entry menu-resource-link" href="https://charlieleitao-spec.github.io/somos-servos-app/recursos.html" target="_blank" rel="noopener noreferrer" onclick="return openExternalLink(event,this.href)">Oração, formação e memória <span aria-hidden="true">›</span></a></div>
    <div class="menu-section"><div class="menu-label">Ajustes de leitura</div><div class="menu-row menu-font-controls"><button class="menu-action" onclick="adjustFont(-0.08)" aria-label="Diminuir tamanho do texto">A−</button><span class="reader-scale-value" role="status" aria-label="Tamanho do texto">100%</span><button class="menu-action" onclick="adjustFont(0.08)" aria-label="Aumentar tamanho do texto">A+</button><button class="menu-action" onclick="resetFont()" aria-label="Restaurar tamanho padrão do texto">Padrão</button></div><button class="menu-action menu-wide menu-theme" aria-label="Tema escuro" aria-pressed="false" onclick="toggleTheme()">☼ / ☾ Alternar tema claro ou escuro</button></div>
    <div id="reminderSettings" class="menu-section" hidden><div class="menu-label">Lembrete de celebrações</div><div class="reminder-panel"><label class="reminder-switch-row" for="reminderEnabled"><span><strong>Receber lembrete</strong><small>Somente nas celebrações próprias da Ordem</small></span><input id="reminderEnabled" type="checkbox" role="switch" disabled></label><label class="reminder-time-row" for="reminderTime"><span>Horário do lembrete</span><input id="reminderTime" type="time" value="07:00" required disabled></label><p id="reminderStatus" role="status">Desligado. Apenas nos dias com celebração própria.</p></div></div>
    <details class="menu-section menu-about-details"><summary>Sobre, créditos e redes sociais</summary><div class="menu-about-content">${viewSobre()}</div></details>
    <div class="menu-section menu-footer"><div class="menu-status"><span class="connection-dot"></span><span>Versão ${APP_VERSION} · Missa e Ofício próprios OSM disponíveis offline</span></div></div>`;

  try{window.OSMReminders?.init();}catch(error){console.warn('[Lembrete OSM] Inicialização indisponível.',error);const status=document.getElementById('reminderStatus');if(status)status.textContent='Lembrete indisponível. Feche e abra o aplicativo para tentar novamente.';}
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


  let wakeLock=null;
  window.toggleCelebrationMode=async function(){
    const active=document.body.classList.toggle('celebration-mode'),button=document.getElementById('celebrationToggle');button.textContent=active?'Sair do modo celebração':'Modo celebração';
    try{if(active&&navigator.wakeLock)wakeLock=await navigator.wakeLock.request('screen');else if(wakeLock){await wakeLock.release();wakeLock=null;}}catch(e){}
    showToast(active?'Modo celebração ativado.':'Modo celebração encerrado.');
    updateCelebrationButton();
  };
  function updateCelebrationButton(){const b=document.getElementById('celebrationToggle');if(!b)return;const dailyPrayerOpen=typeof dailyPrayerOpen480!=='undefined'&&!!dailyPrayerOpen480;const dailyMassOpen=!!document.querySelector('#dailyLiturgyOverlay.open');const celebrationDetail=state.detailId!==null&&state.detailId!==undefined;const reading=celebrationDetail||!!state.devo||!!state.devoSub||dailyPrayerOpen||dailyMassOpen;const active=document.body.classList.contains('celebration-mode');
    // In normal reading the control belongs to the header, outside the text.
    const parent=active?document.body:dailyMassOpen?document.querySelector('#dailyLiturgyOverlay .daily-liturgy-body'):document.querySelector('.topbar');
    if(parent&&b.parentElement!==parent)parent.prepend(b);
    b.classList.toggle('show',reading||active);}
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
  function pruneDailyMassCache(now=Date.now()){
    try{
      for(let i=localStorage.length-1;i>=0;i--){
        const key=localStorage.key(i);
        if(!key||!key.startsWith(CACHE_PREFIX))continue;
        let saved;
        try{saved=Date.parse(JSON.parse(localStorage.getItem(key)||'null')?.savedAt||'');}catch(e){saved=NaN;}
        if(!Number.isFinite(saved)||now-saved>CACHE_MAX_AGE)localStorage.removeItem(key);
      }
    }catch(error){console.warn('[Liturgia OSM] Não foi possível limpar o cache antigo da Missa.',error);}
  }
  pruneDailyMassCache();
  const readCache=date=>{try{const key=cacheKey(date),cached=JSON.parse(localStorage.getItem(key)||'null'),saved=Date.parse(cached?.savedAt||'');if(!cached||!Number.isFinite(saved)||Date.now()-saved>CACHE_MAX_AGE){localStorage.removeItem(key);return null;}return cached;}catch(e){return null}};
  const saveCache=(date,data)=>{try{localStorage.setItem(cacheKey(date),JSON.stringify({savedAt:new Date().toISOString(),data}))}catch(e){}};
  const safe=value=>escapeHtml(cleanMassText(value));
  function readingBody(value,label){
    const scripture=/leitura|evangelho/i.test(String(label||''));
    return cleanMassText(value).split(/\n\s*\n/).filter(Boolean).map(paragraph=>{
      let html=safe(paragraph.trim());
      if(!/salmo|cântico|hino|responsório/i.test(String(label||'')))html=html.replace(/\r?\n[ \t]*/g,' ');
      else html=html.replace(/\r?\n/g,'<br>');
      if(scripture)html=html.replace(/(^|\s)(\d{1,3})(?=[A-Za-zÀ-ÿ])/g,'$1<sup class="verse-number">$2</sup> ');
      return `<p class="reading-paragraph">${html}</p>`;
    }).join('');
  }
  function readingCards(group,label){
    const items=(Array.isArray(group)?group:(group?[group]:[])).filter(item=>item&&(item.texto||item.referencia||item.refrao));
    return items.map((item,index)=>`<article class="daily-reading"><b>${safe(item.titulo||label+(items.length>1?' '+(index+1):''))}</b>${item.referencia?`<em>${safe(item.referencia)}</em>`:''}${item.refrao?`<em>${safe(item.refrao)}</em>`:''}${readingBody(item.texto,label)}</article>`).join('');
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
    const dateDisplay=document.getElementById('dailyLiturgyDateDisplay');
    if(dateDisplay){const [year,month,day]=selectedDate.split('-');dateDisplay.textContent=day+'/'+month+'/'+year;dateDisplay.setAttribute('aria-label','Data selecionada: '+day+'/'+month+'/'+year);}
    const target=document.getElementById('dailyLiturgyContent'),cached=readCache(selectedDate);
    if(!target)return;
    if(cached)target.innerHTML=renderMass(cached,true);else target.innerHTML='<div class="daily-loading">Carregando a liturgia…</div>';
    if(!navigator.onLine){if(!cached)target.innerHTML='<div class="daily-error">Esta data ainda não foi salva. Conecte-se à internet uma vez para baixar a liturgia.</div>';return;}
    try{
      const [year,month,day]=selectedDate.split('-');
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);let response;try{response=await fetch(`${API}?dia=${day}&mes=${month}&ano=${year}`,{headers:{Accept:'application/json'},signal:controller.signal});}finally{clearTimeout(timeout);}
      if(!response.ok)throw new Error('Liturgia não encontrada');
      const data=await response.json();saveCache(selectedDate,data);target.innerHTML=renderMass({savedAt:new Date().toISOString(),data},false);
    }catch(error){if(!cached){const message=error?.message==='Liturgia não encontrada'?'Não há texto da Missa disponível para esta data.':error?.name==='AbortError'?'O serviço da Missa não respondeu no prazo e não há cópia local para esta data.':'O serviço da Missa está indisponível e não há cópia local para esta data. Verifique a conexão e tente novamente.';target.innerHTML=`<div class="daily-error">${safe(message)}<br><button class="daily-retry" onclick="loadDailyLiturgy('${safe(selectedDate)}')">Tentar novamente</button></div>`;}}
  };
  window.openDailyLiturgy=function(date){openAccessibleDialog('dailyLiturgyOverlay');if(window.updateCelebrationButton)window.updateCelebrationButton();loadDailyLiturgy(date||localISO());};
  window.closeDailyLiturgy=function(){closeAccessibleDialog('dailyLiturgyOverlay');if(document.body.classList.contains('celebration-mode'))toggleCelebrationMode();if(window.updateCelebrationButton)window.updateCelebrationButton();};
  window.moveDailyDate=function(amount){const date=new Date(selectedDate+'T12:00:00');date.setDate(date.getDate()+amount);loadDailyLiturgy(localISO(date));};
  
  const menu=document.querySelector('.main-menu');
  if(menu){const status=menu.querySelector('.menu-status span:last-child');if(status)status.textContent=`Versão ${APP_VERSION} · Missa e Ofício próprios OSM disponíveis offline`;}
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
    window.OSMWidgetLinks?.setData(SANTORAL,id=>{closeMainMenu();openDetail(id);});
    window.OSMReminders?.setData(SANTORAL,id=>{closeMainMenu();openDetail(id);});
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
    if(source.schema_version!==3||!dates||Object.keys(dates).length!==SANTORAL.length)throw new Error('Base de Ofícios incompleta.');
    for(const saint of SANTORAL){
      const key=officeDateKey(saint),record=dates[key];
      if(!record||Number(record.id)!==Number(saint.id)||!['oficio_proprio','textos_proprios','sem_material_proprio'].includes(record.tipo_material))throw new Error('Ofício divergente em '+key);
    }
    OFICIOS_OSM=source;oficiosReady=true;
  }catch(error){oficiosReady=false;oficiosLoadError=true;console.warn('[Liturgia OSM] Não foi possível carregar os Ofícios canônicos.',error);}
  render();
}
window.loadCanonicalOffices=loadCanonicalOffices;
window.OSMWidgetLinks?.init();
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
    const content=/^(?:Hino|Salmo)/i.test(title)
      ?renderPrayer(title+'\n\n'+text).replace(/^<h4[^>]*>[^<]*<\/h4>/,'')
      :renderPrayer(text);
    return '<div class="section-title">'+escapeHtml(title)+'</div><div class="liturgical-reading hub-text">'+content+'</div>';
  }
  function properMassFor(s){
    const records=window.MISSAS_OSM&&Array.isArray(window.MISSAS_OSM.celebrations)?window.MISSAS_OSM.celebrations:[];
    return records.find(item=>item.date===dateKey(s)||String(item.santoral_id)===String(s.id));
  }
  function properMassBlock(item){
    const content=renderProperMassContent(item);
    if(!content)return hubEmpty('O cadastro da Missa própria ainda não contém textos conferidos.');
    return '<div class="hub-card"><div class="hub-card-title">Missa própria</div>'+content+
      '<p class="hub-source">Fonte: '+escapeHtml(item.source||'fonte não informada')+'</p></div>';
  }
  function liturgyBlock(s){
    const ownMass=properMassFor(s);
    const date=massDate(s);
    const mass=ownMass?properMassBlock(ownMass):
      '<div class="hub-card"><div class="hub-card-title">Missa do dia</div>'+
      '<p class="hub-card-note">Sem Missa própria cadastrada. Consulta de '+escapeHtml(s.date)+' online; fica offline por até 30 dias.</p>'+
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
        '</div>'+OSMPdf.officeResources(officeRecordForSaint(s))+'</div>';
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
    if(!covered)return s.prayer?hubText('Oração própria',s.prayer)+'<p class="hub-source">Fonte: Santoral da Ordem.</p>':hubEmpty('Não há oração própria nem Memória Litúrgica cadastradas para esta celebração.');
    const common=data.common||{};
    const life=item?.breve_vida||item?.apresentacao||'';
    const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
    const distinctLife=life&&compact(life)!==compact(s.bio||'')?life:'';
    const prayer=item?.oracao_propria||s.prayer||'',sourceNote=item?.source_note||data.editorial_notes?.[date]||'';
    const prayerSource=item?.oracao_propria?'Livro de Oração dos Servos de Maria, 3ª edição revisada (2024), seção Memória Litúrgica.':'Santoral da Ordem.';
    const lifeSource=distinctLife?'Livro de Oração dos Servos de Maria, 3ª edição revisada (2024), seção Memória Litúrgica.':'Santoral da Ordem.';
    const sources=['textos comuns: '+(data.source||'Livro de Oração dos Servos de Maria, seção Memória Litúrgica.')];
    if(prayer)sources.push('oração: '+prayerSource);
    if(distinctLife)sources.push('vida breve: '+lifeSource);
    if(sourceNote)sources.push('nota: '+sourceNote);
    return hubText('Hino',common.hino)+hubText('Antífona',common.antifona)+
      hubText('Salmo 111',common.salmo)+
      hubText(item?.breve_vida?'Breve vida':'Apresentação',distinctLife)+
      hubText('Oração própria',prayer)+
      '<p class="hub-source">Fontes — '+sources.map(escapeHtml).join('; ')+'. Memória Litúrgica do Livro de Oração, distinta da Liturgia das Horas.</p>';
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
    return '<nav class="hub-navigation-grid" aria-label="Navegação entre celebrações">'+
      '<button class="hub-action" aria-label="Celebração anterior" onclick="openSaint('+previous._id+')"><span class="hub-action-direction">‹ Anterior</span></button>'+
      '<button class="hub-action" aria-label="Próxima celebração" onclick="openSaint('+next._id+')"><span class="hub-action-direction">Próxima ›</span></button>'+
      '<button class="hub-action hub-share" onclick="shareSaint('+s._id+')"><span class="hub-action-direction">Compartilhar celebração</span><span class="hub-share-icon">↗</span></button></nav>';
  }
  let hubOpenState={id:null,liturgia:false,oracao:false};
  document.addEventListener('toggle',function(event){const el=event.target;if(el&&el.classList&&el.classList.contains('hub-collapsible')&&el.dataset.sec)hubOpenState[el.dataset.sec]=el.open;},true);
  window.renderCelebrationHub=function(id){
    const saint=SANTORAL.find(item=>item._id===id||item.id===id);
    if(!saint)return '<div class="empty-state">Celebração não encontrada.</div>';
    if(hubOpenState.id!==saint._id)hubOpenState={id:saint._id,liturgia:false,oracao:false};
    const life='<div class="hub-life"><div class="personal-favorite-action">'+favButton('saint',saint._id)+'</div>'+saintImageHtml(saint,true)+
      (saintRankSubtitle(saint)?'<div class="rank">'+escapeHtml(saintRankSubtitle(saint))+'</div>':'')+
      '<h1 class="hub-life-title">'+escapeHtml(saint.title)+'</h1>'+
      '<div class="hub-life-meta">'+escapeHtml(saint.date)+'</div>'+
      '<div class="hub-life-bio">'+escapeHtml(saint.bio||'Biografia não cadastrada.')+'</div></div>';
    return '<div class="saint-hub">'+
      '<section class="hub-block" id="hub-vida"><div class="hub-block-title">Vida</div>'+life+'</section>'+
      '<details class="hub-block hub-collapsible" id="hub-liturgia" data-sec="liturgia"'+(hubOpenState.liturgia?' open':'')+'><summary class="hub-block-title">Liturgia</summary>'+liturgyBlock(saint)+'</details>'+
      '<details class="hub-block hub-collapsible" id="hub-oracao" data-sec="oracao"'+(hubOpenState.oracao?' open':'')+'><summary class="hub-block-title">Oração</summary>'+prayerBlock(saint)+'</details>'+
      '<section class="hub-block hub-block-plain" id="hub-navegacao">'+navigationBlock(saint)+'</section>'+
      '</div>';
  };
  window.openSaintSection=function(id,section){
    const target0=SANTORAL.find(item=>item._id===id||item.id===id);
    if(target0&&(section==='liturgia'||section==='oracao'))hubOpenState={id:target0._id,liturgia:section==='liturgia',oracao:section==='oracao'};
    openDetail(id);
    requestAnimationFrame(function(){
      const target=document.getElementById('hub-'+section);
      if(target&&target.tagName==='DETAILS')target.open=true;
      if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
    });
  };
  window.openLiturgiaSection=function(section){
    state.liturgiaSection=section==='horas'?'horas':'missa';
    setTab('liturgia');
  };

  installAndroidBackHandler();
  window.addEventListener('keydown',function(event){if(event.key==='Escape')smartBack();});
  window.addEventListener('popstate',function(event){
    if(event.osmServiteReturn)return;
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
    if(state.detailId!==null&&state.detailId!==undefined||state.tab==='liturgia')render();
  }).catch(function(error){console.info('[Liturgia OSM] Missas próprias ainda sem registros conferidos.',error);});
  render();
})();
/* END SCRIPT BLOCK: canonicalNavigation4926 */


/* Recolhe a navegação durante a leitura e a mostra ao tocar ou rolar para cima. */
(function(){
  var lastTarget = window;
  var lastY = readY(window);
  var touchStartY = null;
  var touchLastY = null;
  var touchMoved = false;
  function readY(target){
    if(!target || target === window || target === document || target === document.documentElement || target === document.body){
      return Math.max(0, window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0);
    }
    return Math.max(0, Number(target.scrollTop) || 0);
  }
  function normalizeTarget(target){
    return !target || target === document || target === document.documentElement || target === document.body ? window : target;
  }
  function show(){ document.body.classList.remove('scroll-controls-hidden'); }
  function hide(){ document.body.classList.add('scroll-controls-hidden'); }
  function onScroll(event){
    if(document.querySelector('[role="dialog"].open')){show();return;}
    var target = normalizeTarget(event.target);
    var y = readY(target);
    if(target !== lastTarget){
      lastTarget = target;
      lastY = y;
      if(y > 140) hide(); else show();
      return;
    }
    if(y < 100 || y < lastY - 1) show();
    else if(y > 140 && y > lastY + 1) hide();
    lastY = y;
  }
  document.addEventListener('scroll', onScroll, true);
  window.addEventListener('scroll', onScroll, {passive:true});
  document.addEventListener('touchstart', function(event){
    if(!event.touches || !event.touches.length) return;
    touchStartY = touchLastY = event.touches[0].clientY;
    touchMoved = false;
  }, {passive:true, capture:true});
  document.addEventListener('touchmove', function(event){
    if(touchLastY === null || !event.touches || !event.touches.length) return;
    var y = event.touches[0].clientY;
    var delta = touchLastY - y;
    if(Math.abs(y - touchStartY) > 7) touchMoved = true;
    if(document.querySelector('[role="dialog"].open')){show();touchLastY=y;return;}
    if(delta > 4) hide();
    else if(delta < -4) show();
    touchLastY = y;
  }, {passive:true, capture:true});
  document.addEventListener('touchend', function(){
    if(!touchMoved) show();
    touchStartY = touchLastY = null;
  }, {passive:true, capture:true});
  document.addEventListener('touchcancel', function(){
    touchStartY = touchLastY = null;
  }, {passive:true, capture:true});
  document.addEventListener('wheel', function(event){
    if(document.querySelector('[role="dialog"].open')){show();return;}
    if(event.deltaY > 2) hide();
    else if(event.deltaY < -2) show();
  }, {passive:true, capture:true});
  document.addEventListener('click', function(event){
    if(event.target && event.target.closest && event.target.closest('.tabbar, #celebrationToggle')) show();
  }, true);
})();

