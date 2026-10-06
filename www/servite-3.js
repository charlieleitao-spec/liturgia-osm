const INVITATORIO_SALMO = `SALMO 94 — Convite ao louvor de Deus
Animai-vos uns aos outros, dia após dia, enquanto ainda se disser "hoje" (Hb 3,13).

- Vinde, exultemos de alegria no Senhor, *
aclamemos o Rochedo que nos salva!

- Ao seu encontro caminhemos com louvores, *
e com cantos de alegria o celebremos!

- Na verdade, o Senhor é o grande Deus, *
o grande Rei, muito maior que os deuses todos.

- Tem nas mãos as profundezas dos abismos, *
as alturas das montanhas lhe pertencem;

- o mar é dele, pois foi ele quem o fez, *
e a terra firme suas mãos a modelaram.

= Vinde adoremos e prostremo-nos por terra, *
e ajoelhemos ante o Deus que nos criou!

= Porque ele é o nosso Deus, nosso Pastor, †
e nós somos o seu povo e seu rebanho, *
as ovelhas que conduz com sua mão.

= Oxalá ouvísseis hoje a sua voz: †
"Não fecheis os corações como em Meriba, *
como em Massa, no deserto, aquele dia,

- em que outrora vossos pais me provocaram, *
apesar de terem visto as minhas obras".

- Quarenta anos desgostou-me aquela raça †
e eu disse: "Eis um povo transviado, *
seu coração não conheceu os meus caminhos!"

- E por isso lhes jurei na minha ira: *
"Não entrarão no meu repouso prometido!"

- Glória ao Pai, ao Filho e ao Espírito Santo, *
como era no princípio, agora e sempre. Amém!`;

// ===================== i18n helpers =====================
let LANG = 'pt';
function t(key){
  return (I18N[LANG] && I18N[LANG][key]) || I18N.pt[key] || key;
}

function todayInfo(){
  const d = new Date();
  const months = MONTHS_I18N[LANG] || MONTHS_I18N.pt;
  const weekdays = WEEKDAYS_I18N[LANG] || WEEKDAYS_I18N.pt;
  return { day:d.getDate(), month:d.getMonth()+1, weekday:weekdays[d.getDay()], monthName:months[d.getMonth()] };
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

// Preserva integralmente a composição do texto-fonte.
// Estrofes são separadas somente pelas linhas em branco já existentes;
// *, †, hífens e outros sinais litúrgicos nunca são usados para reconstruí-las.
function formatLiturgicalStanzas(value){
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}
function formatLitanyStanzas(value){
  return formatLiturgicalStanzas(value);
}
function renderWithLitanySpacing(text){
  return renderPrayer(text);
}
// render a prayer block, separating paragraphs while preserving line breaks inside each paragraph
function renderPrayer(text){
  const formatted = formatLiturgicalStanzas(text);
  const paragraphs = formatted
    .split(/\n[ \t]*\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
  return paragraphs.map(paragraph => {
    const esc = escapeHtml(paragraph);
    const marked = esc.replace(/^(D\.|T\.|C\.|L\.\d?|L\.|V\.|R\.|\u2123\.|\u211f\.)/gm, '<span class="rubric">$1</span>');
    return `<p class="prayer-paragraph">${marked}</p>`;
  }).join('');
}

const LITURGICAL_HEAD_RE = /^(?:\d+[.)-]?\s*)?(HINO|SALMODIA|PRIMEIRA LEITURA|SEGUNDA LEITURA|LEITURA BREVE|RESPONS[ÓO]RIO(?: BREVE)?(?:\s+.*)?|C[ÂA]NTICO EVANG[ÉE]LICO|PRECES|PAI[- ]NOSSO|ORA[ÇC][ÃA]O|CONCLUS[ÃA]O)\s*[:.-]?\s*$/i;

// Estrutura o ofício sem alterar, completar ou reconstruir o texto-fonte.
// Linhas e estrofes procedem exclusivamente das quebras existentes na fonte.
function renderLiturgicalHourContent(text){
  const root = document.createElement('div');
  root.className = 'today-servita-reader';
  const lines = formatLiturgicalStanzas(text).split('\n');
  let block = null;
  let currentHead = '';
  let stanza = null;
  let precesCount = 0;

  function startBlock(label){
    block = document.createElement('section');
    block.className = 'litblock';
    currentHead = String(label || '').replace(/^\d+[.)-]?\s*/, '').replace(/\s*[:.-]?\s*$/, '').toUpperCase();
    precesCount = 0;
    stanza = null;
    if(label){
      const heading = document.createElement('div');
      heading.className = 'litheading';
      heading.textContent = label;
      block.appendChild(heading);
    }
    root.appendChild(block);
  }
  function add(value, className='littext', target=block){
    if(!target){ startBlock(''); target = block; }
    const node = document.createElement('div');
    node.className = className;
    node.textContent = value;
    target.appendChild(node);
    return node;
  }
  function addStanzaLine(line){
    if(!stanza){
      stanza = document.createElement('div');
      stanza.className = currentHead === 'HINO' ? 'hymn-stanza' : 'psalm-stanza';
      block.appendChild(stanza);
    }
    add(line, currentHead === 'HINO' ? 'hymn-stanza-line' : 'psalm-verse', stanza);
  }
  function splitReadingLine(line){
    const match = line.match(/^((?:cf\.\s*)?(?:[1-3]\s*)?[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁ-ú.]*\s+\d{1,3}[,.:]\d{1,3}[a-z]?(?:[-–]\d{1,3}[a-z]?)?(?:\.\d{1,3}[a-z]?(?:[-–]\d{1,3}[a-z]?)?)*(?:\s*;\s*(?:\d{1,3}[,.:])?\d{1,3}[a-z]?(?:[-–]\d{1,3}[a-z]?)?)*)\s+(.*)$/i);
    if(!match) return false;
    add(match[1].trim(), 'reading-ref');
    add(match[2].trim(), 'reading-body');
    return true;
  }
  function addPrecesLine(line){
    // Mantém o texto integral e recupera apenas as intenções explicitamente
    // iniciadas por uma nova invocação na própria fonte.
    const intentions = line.split(/(?<=\.)\s+(?=(?:Pastor eterno|Senhor Jesus|Cristo(?: ressuscitado)?),)/);
    intentions.forEach(intention => add(intention, precesCount++ === 0 ? 'preces-intro' : 'preces-intention'));
  }

  lines.forEach(raw => {
    if(!raw.trim()){
      stanza = null;
      return;
    }
    const line = raw.trim().replace(/^[•▪◦]\s*/, '');
    let match;

    if((match = line.match(/^(ORA[ÇC][ÃA]O|C[ÂA]NTICO EVANG[ÉE]LICO)\s*(\([^)]*\))\s*$/i))){
      startBlock(match[1]);
      add(match[2].slice(1,-1).trim(), 'rubric');
      return;
    }
    if((match = line.match(/^(LEITURA BREVE|RESPONS[ÓO]RIO BREVE|RESPONS[ÓO]RIO|SALMODIA)\b\s*[:.–—-]?\s*(.*)$/i))){
      startBlock(match[1]);
      const rest = match[2].trim();
      if(rest){
        if(/^LEITURA/i.test(match[1])){
          if(!splitReadingLine(rest)) add(rest, 'reading-body');
        }else{
          add(rest, /^RESPONS/i.test(match[1]) ? 'response' : 'rubric');
        }
      }
      return;
    }
    if(LITURGICAL_HEAD_RE.test(line)){
      startBlock(line);
      return;
    }
    if((match = line.match(/^HINO\b\s*(\([^)]*\))?\s*(.*)$/i))){
      startBlock('HINO');
      if(match[1]) add(match[1].slice(1,-1).trim(), 'rubric');
      if(match[2]) addStanzaLine(match[2].trim());
      return;
    }
    if(!block) startBlock('');

    if(/^(?:Ant\.|Antífona)\s*\d*/i.test(line)){ stanza=null; add(line,'antiphon'); return; }
    if(/^(Salmo|Cântico|C[âa]ntico)\s+/i.test(line)){ stanza=null; currentHead='SALMODIA'; add(line,'psalm-title'); return; }
    if(/^(V\.|R\.|℣\.|℟\.)\s*/.test(line)){ stanza=null; add(line, currentHead==='PRECES'?'preces-response':'response'); return; }
    if(/^(Escolhe-se|Série\s+[A-C]\b|Salmos? do|Salmos? e cântico|Como no (?:Comum|Ordinário|Próprio)|Do Comum|Quando esta memória|Antífona e salmos|Salmodia complementar)/i.test(line)){
      stanza=null; add(line,'rubric'); return;
    }
    if(/^(PRIMEIRA LEITURA|SEGUNDA LEITURA|LEITURA BREVE)$/.test(currentHead)){
      if(splitReadingLine(line)) return;
      if(/^(Da|Do|Dos|Das)\s+/.test(line) && line.length < 180) add(line,'reading-ref');
      else add(line,'reading-body');
      return;
    }
    if(currentHead==='HINO' || currentHead==='SALMODIA'){
      addStanzaLine(line);
      return;
    }
    if(currentHead==='PRECES'){
      addPrecesLine(line);
      return;
    }
    if(/^(ORAÇÃO|PAI[- ]NOSSO|CONCLUSÃO)$/.test(currentHead)){
      add(line,'liturgical-prayer');
      return;
    }
    add(line);
  });
  // O invólucro carrega o escopo visual canônico do Hoje na Família Servita.
  // Devolver somente innerHTML descartava essa classe e reativava o cartão antigo.
  return root.outerHTML;
}

// Splits a saint's raw "oficio" text into its canonical-hour sections:
// Invitatório (merged into Ofício), Ofício das Leituras, Laudes, Hora Média, Vésperas (I/II merged).
function splitOficioByHour(text){
  const HEADER_RE = /^(Invitat[oó]rio|Of[ií]cio das Leituras|Laudes|Hora M[eé]dia|I Vésperas|II Vésperas|Vésperas)[ \t]*$/gm;
  const matches = [];
  let m;
  while((m = HEADER_RE.exec(text)) !== null){
    matches.push({ label: m[1], start: m.index, contentStart: m.index + m[0].length });
  }
  const buckets = { invitatorio: [], oficio: [], laudes: [], horaMedia: [], vesperas: [] };
  function bucketFor(label){
    if(label === 'Laudes') return 'laudes';
    if(label === 'Hora Média' || label === 'Hora Media') return 'horaMedia';
    if(label === 'Vésperas' || label === 'I Vésperas' || label === 'II Vésperas') return 'vesperas';
    if(label === 'Invitatório' || label === 'Invitatorio') return 'invitatorio';
    return 'oficio'; // Ofício das Leituras
  }
  if(matches.length === 0){
    const trimmed = text.trim();
    if(trimmed) buckets.oficio.push({ label:null, text: trimmed });
    return buckets;
  }
  // text before the first header
  const pre = text.slice(0, matches[0].start).trim();
  if(pre) buckets.oficio.push({ label:null, text: pre });
  for(let i=0;i<matches.length;i++){
    const seg = matches[i];
    const end = (i+1 < matches.length) ? matches[i+1].start : text.length;
    const segText = text.slice(seg.contentStart, end).trim();
    if(!segText) continue;
    // omit the label when it's redundant with the section's own card title
    const skipLabel = (seg.label === 'Invitatório' || seg.label === 'Invitatorio' || seg.label === 'Ofício das Leituras' || seg.label === 'Laudes' ||
                        seg.label === 'Hora Média' || seg.label === 'Hora Media' ||
                        (seg.label === 'Vésperas'));
    buckets[bucketFor(seg.label)].push({ label: skipLabel ? null : seg.label, text: segText });
  }
  return buckets;
}

function renderFinalAntifonaBlock(){
  if(!state.finalAntifona || !FINAL_ANTIFONAS.find(a => a.key === state.finalAntifona)){
    state.finalAntifona = 'salve';
  }
  const tabs = FINAL_ANTIFONAS.map(a => `<button class="hour-tab-btn small ${state.finalAntifona===a.key ? 'active' : ''}" onclick="setFinalAntifona('${a.key}')">${escapeHtml(a.season)}</button>`).join('');
  const active = FINAL_ANTIFONAS.find(a => a.key === state.finalAntifona);
  return `
    <div class="hour-divider"></div>
    <div class="hour-sublabel">${escapeHtml(t('antifonasTitle'))}</div>
    <div class="hour-tabs" style="margin-bottom:10px;">${tabs}</div>
    <div class="fade-in">
      <div style="font-family:'Cinzel',serif; font-size:0.75rem; letter-spacing:.04em; color:var(--text-faint); margin-bottom:6px;">${escapeHtml(active.titleLat)}</div>
      <div>${renderPrayer(active.pt)}</div>
    </div>
  `;
}

function insertCanticleAfterAntiphon(text, canticleText){
  const re = /(C[âÂ]ntico [Ee]vang[eé]lico[^\n]*\n[^\n]*)/;
  if(re.test(text)){
    return text.replace(re, (m) => `${m}\n\n${canticleText}`);
  }
  return text; // no antiphon found in this segment; leave unchanged
}

function wrapSection(text){ return text ? [{label:null,text}] : []; }

function renderOficioTabs(oficioData){
  let buckets;
  if(oficioData && typeof oficioData==='object' && oficioData.horas){
    const h=oficioData.horas;
    const wrap=(value,label=null)=>{
      if(!value)return [];
      if(typeof value==='string')return value.trim()?[{label,text:value}]:[];
      const entries=[value,...(Array.isArray(value.alternativas)?value.alternativas:[])];
      const parts=entries.filter(item=>item&&typeof item==='object'&&(item.texto||item.text)).map((item,index)=>({
        label:item.titulo||item.title||(index===0?label:'Leitura alternativa'),
        text:item.texto||item.text
      }));
      if(typeof value.oracao==='string'&&value.oracao.trim())parts.push({label:'Oração',text:value.oracao});
      return parts;
    };
    buckets={
      invitatorio:wrap(h.invitatorio),
      oficio:[...wrap(h.oficio_leituras),...wrap(h.textos_proprios)],
      laudes:wrap(h.laudes),
      horaMedia:wrap(h.hora_media),
      vesperas:wrap(h.vesperas)
    };
  }else{
    buckets = splitOficioByHour(String(oficioData||''));
  }
  const order = [
    { key:'invitatorio', title:t('hourInvitatorio') },
    { key:'oficio', title:t('hourOficio') },
    { key:'laudes', title:t('hourLaudes') },
    { key:'horaMedia', title:t('hourHoraMedia') },
    { key:'vesperas', title:t('hourVesperas') },
  ].filter(o => buckets[o.key] && buckets[o.key].length);

  if(!order.length) return '';
  if(!state.oficioTab || !order.find(o => o.key === state.oficioTab)){
    state.oficioTab = order[0].key;
  }
  const hourSymbols={invitatorio:'✦',oficio:'▤',laudes:'☀',horaMedia:'◷',vesperas:'☾'};
  const tabs = order.map(o => `<button class="hour-tab-btn ${state.oficioTab===o.key ? 'active' : ''}" aria-pressed="${state.oficioTab===o.key}" onclick="setOficioTab('${o.key}')"><span class="hour-tab-symbol" aria-hidden="true">${hourSymbols[o.key]||'✦'}</span><span class="hour-tab-label">${escapeHtml(o.title)}</span></button>`).join('');
  const active = order.find(o => o.key === state.oficioTab);
  const segs = buckets[active.key];
  const canticleText = active.key === 'laudes' ? BENEDICTUS_TEXT : (active.key === 'vesperas' ? MAGNIFICAT_TEXT : null);
  const body = segs.map(s => {
    const txt = active.key === 'invitatorio' ? `${s.text}\n\n${INVITATORIO_SALMO}` : (canticleText ? insertCanticleAfterAntiphon(s.text, canticleText) : s.text);
    return `${s.label ? `<div class="hour-sublabel">${escapeHtml(s.label)}</div>` : ''}<div>${renderLiturgicalHourContent(txt)}</div>`;
  }).join('<div class="hour-divider"></div>');
  const finalAntifona = active.key === 'vesperas' ? renderFinalAntifonaBlock() : '';
  return `
    <div class="hour-tabs office-hours-tabs" role="group" aria-label="Escolher hora litúrgica">${tabs}</div>
    <div class="hour-tab-content fade-in ${active.key==='invitatorio'?'invitatorio-content':active.key==='oficio'?'oficio-leituras-content':active.key==='laudes'?'laudes-content':active.key==='horaMedia'?'hora-media-content':active.key==='vesperas'?'vesperas-content':''}">${body}${finalAntifona}</div>
  `;
}

// note shown under non-Portuguese-translated content
function langNoteHtml(){
  if(LANG === 'pt') return '';
  return `<p class="lang-note">${escapeHtml(t('langNote'))}</p>`;
}

function dailyPrayerText(which){
  if(LANG === 'pt') return which === 'anjo' ? PRAYERS.daily.anjo : PRAYERS.daily.rainha;
  return DAILY_I18N[which][LANG];
}

function stabatText(){
  if(LANG === 'pt') return PRAYERS.devotions.stabat;
  return STABAT_I18N[LANG];
}

// ===================== state =====================
let state = { tab:'hoje', angelus:'anjo', detailId:null, search:'', devo:null, devoSub:null, showOficio:false, oficioTab:null, regraChapter:null, finalAntifona:null, coroaFormula:'formula1', coroaGuidedStep:0, rosarioSet:'gozosos', rosarioGuidedStep:0 };

function setTab(tab){
  state.tab = tab; state.detailId = null; state.devo = null; state.devoSub = null; state.regraChapter = null;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  render();
  window.scrollTo(0,0);
}

function openDetail(id){
  state.detailId = id;
  state.showOficio = false;
  state.oficioTab = null;
  state.finalAntifona = null;
  render();
  document.getElementById('view').scrollTop = 0;
  window.scrollTo(0,0);
}

function openDevo(key, sub){
  state.devo = key;
  state.devoSub = sub !== undefined ? sub : null;
  state.oficioTab = null;
  state.finalAntifona = null;
  render();
  window.scrollTo(0,0);
}

function closeDevo(){
  if(state.devoSub !== null){ state.devoSub = null; }
  else { state.devo = null; }
  render();
  window.scrollTo(0,0);
}

// ===================== views =====================
function viewHoje(){
  const ti = todayInfo();
  const saint = findSaintForToday();
  const next = saint ? null : findNextSaint();

  let saintHtml;
  if(saint){
    saintHtml = `
      <div class="card saint-card fade-in">
        <span class="rank">${escapeHtml(saint.rank || t('memoriaBadge'))}</span>
        <h2>${escapeHtml(saint.title)}</h2>
        <div class="date-line">${escapeHtml(saint.date)} · Ordo Servorum Mariæ</div>
        ${langNoteHtml()}
        <div class="link-row"><button class="btn-link" onclick="openDetail(${saint._id})">${escapeHtml(t('readBio'))}</button></div>
      </div>`;
  } else {
    saintHtml = `
      <div class="card saint-card fade-in">
        <span class="rank">${escapeHtml(t('hojeBadge'))}</span>
        <p class="empty-note">${escapeHtml(t('noSaintToday'))} <b style="color:var(--gold-soft); font-style:normal;">${escapeHtml(next.title)}</b>, ${escapeHtml(t('em'))} ${escapeHtml(next.date)}.</p>
        <div class="link-row"><button class="btn-link" onclick="openDetail(${next._id})">${escapeHtml(t('viewCelebration'))}</button></div>
      </div>`;
  }

  return `
    <div class="hero-date fade-in">
      <div class="weekday">${escapeHtml(ti.weekday)}</div>
      <div class="day">${ti.day}</div>
      <div class="month">${LANG==='pt'?'de ':''}${escapeHtml(ti.monthName)}</div>
      <div class="hero-divider"></div>
    </div>

    <div class="section-title">${escapeHtml(t('todaySection'))}</div>
    ${saintHtml}

    <div class="section-title">${escapeHtml(t('dailyPrayerSection'))}</div>
    <div class="card fade-in">
      <div class="toggle-row">
        <button class="toggle-btn ${state.angelus==='anjo'?'active':''}" onclick="setAngelus('anjo')">${escapeHtml(t('anjoLabel'))}</button>
        <button class="toggle-btn ${state.angelus==='rainha'?'active':''}" onclick="setAngelus('rainha')">${escapeHtml(t('rainhaLabel'))}</button>
      </div>
      <div class="prayer-block">${renderPrayer(dailyPrayerText(state.angelus))}</div>
    </div>
  `;
}

function viewSantoral(){
  if(state.detailId !== null){
    return viewDetail(state.detailId);
  }
  const q = state.search.trim().toLowerCase();
  const filtered = q ? SANTORAL.filter(s => s.title.toLowerCase().includes(q) || s.date.toLowerCase().includes(q)) : SANTORAL;
  const months = MONTHS_I18N[LANG] || MONTHS_I18N.pt;

  let listHtml = '';
  if(!filtered.length){
    listHtml = `<div class="no-results">${escapeHtml(t('noResults'))} "${escapeHtml(state.search)}".</div>`;
  } else if(q){
    listHtml = filtered.map(rowHtml).join('');
  } else {
    for(let m=1; m<=12; m++){
      const items = filtered.filter(s=>s.month===m);
      if(!items.length) continue;
      listHtml += `<div class="month-group"><div class="month-label">${months[m-1]}</div>${items.map(rowHtml).join('')}</div>`;
    }
  }

  return `
    <div class="section-title">${escapeHtml(t('santoralSection'))}</div>
    <p style="color:var(--text-muted); font-size:0.9688rem; line-height:1.6; margin:-4px 0 18px;">
      ${escapeHtml(t('santoralIntro'))}
    </p>
    ${langNoteHtml()}
    <div class="search-wrap">
      <input class="search-input" type="text" placeholder="${escapeHtml(t('searchPlaceholder'))}" value="${escapeHtml(state.search)}" oninput="onSearch(this.value)">
    </div>
    ${listHtml}
  `;
}

function rowHtml(s){
  return `
    <div class="saint-row" onclick="openDetail(${s._id})">
      ${saintImageHtml(s)}
      <div class="daynum">${s.day}</div>
      <div class="rowtext">
        <div class="rowtitle">${escapeHtml(s.title)}</div>
        <div class="rowrank">${escapeHtml(s.rank||'')}</div>
      </div>
      <div class="chev">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
      </div>
    </div>`;
}

function onSearch(val){ state.search = val; render(true); }

function viewDetail(id){
  const s = SANTORAL.find(x=>x._id===id);
  if(!s) return `<div class="no-results">${escapeHtml(t('notFound'))}</div>`;
  return `
    <button class="back-btn" onclick="closeDetail()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      ${escapeHtml(t('back'))}
    </button>
    <div class="detail-header fade-in">
      <div class="rank">${escapeHtml(s.rank||'')}</div>
      <h2>${escapeHtml(s.title)}</h2>
      <div class="date-line">${escapeHtml(s.date)}</div>
      <div class="detail-divider"></div>
    </div>
    ${langNoteHtml()}
    ${saintImageHtml(s, true)}
    <div class="bio-text fade-in">${escapeHtml(s.bio)}</div>
    ${s.prayer ? `
    <div class="prayer-card fade-in">
      <div class="label">${escapeHtml(t('oracao'))}</div>
      <div class="text">${escapeHtml(s.prayer)}</div>
    </div>` : ''}
    ${s.oficio ? `
    <div class="section-title" style="margin-top:30px;">${escapeHtml(t('liturgyHours'))}</div>
    <div class="card fade-in">
      <button class="btn-link" style="width:100%; text-align:center;" onclick="toggleOficio()">
        ${state.showOficio ? escapeHtml(t('hideOffice')) : escapeHtml(t('showOffice'))}
      </button>
      ${state.showOficio ? `<div class="prayer-block" style="margin-top:16px;">${renderOficioTabs(s.oficio)}</div>` : ''}
    </div>` : ''}
  `;
}

function closeDetail(){ state.detailId = null; state.showOficio = false; state.oficioTab = null; render(); }
function toggleOficio(){ state.showOficio = !state.showOficio; state.oficioTab = null; render(); }
function setOficioTab(key){ state.oficioTab = key; render(); }
function setFinalAntifona(key){ state.finalAntifona = key; render(); }

function getDevoList(){
  return [
    { key:'vigilia', title:t('vigiliaTitle'), sub:t('vigiliaSub') },
    { key:'sabado', title:t('sabadoTitle'), sub:t('sabadoSub') },
    { key:'adoracao', title:t('adoracaoTitle'), sub:t('adoracaoSub') },
    { key:'antifonas', title:t('antifonasTitle'), sub:t('antifonasSub') },
    { key:'coroa', title:t('coroaTitle'), sub:t('coroaSub') },
    { key:'rosario', title:'Rosário — quatro mistérios', sub:'Método de São Luís Maria de Montfort e Mistérios Luminosos' },
    { key:'stabat', title:t('stabatTitle'), sub:t('stabatSub') },
    { key:'via_matris', title:t('viaMatrisTitle'), sub:t('viaMatrisSub') },
    { key:'ladainhas', title:t('ladainhasTitle'), sub:t('ladainhasSub') },
  ];
}
function getVariasList(){
  return PRAYERS.devotions.variasHome.map((it,i)=>({key:'varias'+i, title:it.title}));
}

function devoRowHtml(item){
  return `
    <div class="saint-row" onclick="openDevo('${item.key}')">
      <div class="rowtext" style="padding-left:2px;">
        <div class="rowtitle">${escapeHtml(item.title)}</div>
        ${item.sub ? `<div class="rowrank">${escapeHtml(item.sub)}</div>` : ''}
      </div>
      <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    </div>`;
}

function viewOracoes(){
  if(state.devo) return viewDevoDetail(state.devo);

  return `
    <div class="section-title">${escapeHtml(t('dailyMarianTitle'))}</div>
    <div class="card fade-in">
      <div class="toggle-row">
        <button class="toggle-btn ${state.angelus==='anjo'?'active':''}" onclick="setAngelus('anjo')">${escapeHtml(t('anjoLabel'))}</button>
        <button class="toggle-btn ${state.angelus==='rainha'?'active':''}" onclick="setAngelus('rainha')">${escapeHtml(t('rainhaLabel'))}</button>
      </div>
      <div class="prayer-block">${renderPrayer(dailyPrayerText(state.angelus))}</div>
    </div>

    <div class="section-title">${escapeHtml(t('marianHomageTitle'))}</div>
    <div class="card fade-in" style="padding:6px 16px;">
      ${getDevoList().map(devoRowHtml).join('')}
    </div>

    <div class="section-title">${escapeHtml(t('variousPrayersTitle'))}</div>
    ${LANG!=='pt' ? langNoteHtml() : ''}
    <div class="card fade-in" style="padding:6px 16px;">
      ${getVariasList().map(devoRowHtml).join('')}
    </div>
  `;
}

function setAngelus(which){ state.angelus = which; render(); }

// ---- devotion detail router ----
function viewDevoDetail(key){
  if(key.startsWith('varias')){
    const idx = parseInt(key.slice('varias'.length));
    const item = PRAYERS.devotions.variasHome[idx];
    return simpleTextDetail(item.title, item.sub || '', item.text, null, true);
  }
  if(key === 'coroa') return viewCoroa();
  if(key === 'rosario') return viewRosario();
  if(key === 'adoracao') return simpleTextDetail(t('adoracaoTitle'), t('adoracaoSub'), PRAYERS.devotions.adoracao, null, true);
  if(key === 'antifonas') return simpleTextDetail(t('antifonasTitle'), t('antifonasSub'), PRAYERS.devotions.antifonas, null, true);
  if(key === 'stabat') return simpleTextDetail(t('stabatTitle'), t('stabatSub'), stabatText());
  if(key === 'vigilia') return viewVigilia();
  if(key === 'sabado') return viewSabado();
  if(key === 'via_matris') return viewViaMatris();
  if(key === 'ladainhas') return viewLadainhas();
  if(key === 'oficio') return viewOficioIndex();
  return `<div class="no-results">${escapeHtml(t('notFound'))}</div>`;
}

function openSaintOffice(id){
  state.tab='santoral'; state.detailId=id; state.devo=null; state.devoSub=null;
  state.showOficio=true; state.oficioTab=null; state.finalAntifona=null;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab==='santoral'));
  render(); window.scrollTo(0,0);
}
function viewOficioIndex(){
  const items=SANTORAL.filter(s=>s.oficio && (typeof s.oficio==='string' ? s.oficio.trim() : Object.keys(s.oficio||{}).length));
  return `<button class="back-btn" onclick="backToOracoes()">← ${escapeHtml(t('back')||'Voltar')}</button>
    <div class="detail-header fade-in"><h2>Ofício próprio OSM</h2><div class="date-line">Celebrações com textos próprios do Ofício</div><div class="detail-divider"></div></div>
    <div class="card fade-in" style="padding:6px 16px;">${items.length?items.map(s=>`<div class="saint-row" onclick="openSaintOffice(${s._id})"><div class="daynum">${s.day}</div><div class="rowtext"><div class="rowtitle">${escapeHtml(s.title)}</div><div class="rowrank">${escapeHtml(s.date||'')}</div></div><div class="chev">›</div></div>`).join(''):'<div class="no-results">Nenhum Ofício próprio cadastrado.</div>'}</div>`;
}

const ROSARIO_MISTERIOS = window.OSM_ROSARIO_MISTERIOS;
function rosarioCurrent(){ return ROSARIO_MISTERIOS[state.rosarioSet] || ROSARIO_MISTERIOS.gozosos; }
function setRosarioSet(key){ state.rosarioSet = ROSARIO_MISTERIOS[key] ? key : 'gozosos'; state.rosarioGuidedStep = 0; state.devoSub = 'rosario'; render(); window.scrollTo(0,0); }
function setRosarioGuided(key){ state.devo='rosario'; state.devoSub='guided'; state.rosarioSet=ROSARIO_MISTERIOS[key] ? key : 'gozosos'; state.rosarioGuidedStep=0; render(); window.scrollTo(0,0); }
function rosarioSteps(set){
  const steps=[
    {kind:'intro', title:'Preparação do Rosário', text:'Pelo sinal da Santa Cruz. Em nome do Pai, e do Filho, e do Espírito Santo. Amém.\n\nCreio em Deus Pai...\n\nReze 1 Pai-Nosso, 3 Ave-Marias e 1 Glória ao Pai, oferecendo o Rosário pela intenção escolhida.'}
  ];
  set.mysteries.forEach((m,i)=>steps.push({kind:'mystery', number:i+1, title:m[0], text:m[1]+'\n\nReze: 1 Pai-Nosso, 10 Ave-Marias e 1 Glória ao Pai. Ao final, pode-se rezar a jaculatória: “Ó meu Jesus, perdoai-nos, livrai-nos do fogo do inferno, levai as almas todas para o Céu, principalmente as que mais precisarem da vossa misericórdia”.'}));
  steps.push({kind:'end', title:'Encerramento', text:'Salve, Rainha...\n\nPara concluir, agradeça a Deus, peça a proteção de Nossa Senhora e faça o sinal da cruz. Se desejar, acrescente a Ladainha de Nossa Senhora.'});
  return steps;
}
function rosarioNext(){ const max=rosarioSteps(rosarioCurrent()).length-1; state.rosarioGuidedStep=Math.min(max,state.rosarioGuidedStep+1); render(); window.scrollTo(0,0); }
function rosarioPrev(){ state.rosarioGuidedStep=Math.max(0,state.rosarioGuidedStep-1); render(); window.scrollTo(0,0); }
function rosarioRestart(){ state.rosarioGuidedStep=0; render(); window.scrollTo(0,0); }
function viewRosarioGuided(){
  const set=rosarioCurrent(), steps=rosarioSteps(set), index=Math.min(state.rosarioGuidedStep,steps.length-1), step=steps[index], progress=Math.round(((index+1)/steps.length)*100);
  return `<button class="back-btn" onclick="openDevo('rosario','rosario')">Voltar aos mistérios</button>
    <div class="detail-header fade-in"><div class="date-line">Modo guiado · ${escapeHtml(set.label)}</div><h2 style="font-size:1.625rem;">Rosário</h2><div class="detail-divider"></div></div>
    <div class="card guided-crown-card fade-in"><div class="guided-crown-head"><div class="guided-crown-kicker">Etapa ${index+1} de ${steps.length}</div><div class="guided-crown-kicker">${progress}%</div></div><div class="guided-crown-progress"><span style="width:${progress}%"></span></div><div class="guided-crown-step"><h3 class="guided-crown-pain">${step.kind==='mystery'?`<span class="guided-crown-dot">${step.number}</span>`:''}${escapeHtml(step.title)}</h3>${step.kind==='mystery'?`<p>${escapeHtml(step.text.split('\n\n')[0])}</p><p style="color:var(--wine);font-weight:700;">${escapeHtml(step.text.split('\n\n').slice(1).join('\n\n'))}</p>`:`<div class="prayer-block">${renderPrayer(step.text)}</div>`}</div><div class="guided-crown-actions"><button class="hour-tab-btn" onclick="rosarioPrev()" ${index===0?'disabled':''}>Anterior</button>${index<steps.length-1?'<button class="hour-tab-btn active" onclick="rosarioNext()">Próxima etapa</button>':'<button class="hour-tab-btn active" onclick="rosarioRestart()">Recomeçar</button>'}</div></div>`;
}
function viewRosario(){
  const set=rosarioCurrent();
  if(state.devoSub==='guided') return viewRosarioGuided();
  const tabs=Object.entries(ROSARIO_MISTERIOS).map(([key,item])=>`<button class="hour-tab-btn ${state.rosarioSet===key?'active':''}" onclick="setRosarioSet('${key}')">${escapeHtml(item.label)}</button>`).join('');
  return `<button class="back-btn" onclick="backToOracoes()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>${escapeHtml(t('back'))}</button><div class="detail-header fade-in"><h2 style="font-size:1.625rem;">Rosário</h2><div class="date-line">São Luís Maria Grignion de Montfort · Mistérios Luminosos segundo São João Paulo II</div><div class="detail-divider"></div></div><div class="card fade-in"><div class="prayer-block">${renderPrayer('O Rosário é uma oração contemplativa. Escolha o conjunto de mistérios conforme o dia e contemple cada passagem com Maria, rezando as orações com atenção e amor. A sequência segue a forma tradicional do Rosário, com a inclusão dos Mistérios Luminosos propostos por São João Paulo II.')}</div></div><div class="hour-tabs coroa-tabs">${tabs}</div><div class="card fade-in"><div class="rowrank" style="text-align:center;margin-bottom:12px;">${escapeHtml(set.days)}</div><div class="prayer-block">${set.mysteries.map((m,i)=>`<p><strong>${i+1}. ${escapeHtml(m[0])}</strong><br>${escapeHtml(m[1])}</p>`).join('')}</div></div><div class="card fade-in" style="padding:14px 16px;"><button class="hour-tab-btn active" style="width:100%;" onclick="setRosarioGuided('${state.rosarioSet}')">Iniciar modo guiado e animado</button><div class="rowrank" style="text-align:center;margin-top:8px;">Reze passo a passo, contemplando cada mistério.</div></div>`;
}
function setCoroaGuided(formula){
  state.devo = 'coroa';
  state.devoSub = 'guided';
  state.coroaFormula = formula || 'formula1';
  state.coroaGuidedStep = 0;
  render();
  window.scrollTo(0,0);
}
function coroaGuidedSteps(text){
  const source = String(text || '').trim();
  const litaniaAt = source.indexOf('LADAINHA');
  const beforeLitania = litaniaAt >= 0 ? source.slice(0, litaniaAt).trim() : source;
  const painRe = /(?=\dª DOR:)/g;
  const firstPain = beforeLitania.search(painRe);
  const opening = firstPain >= 0 ? beforeLitania.slice(0, firstPain).trim() : beforeLitania;
  const pains = firstPain >= 0 ? beforeLitania.slice(firstPain).split(painRe).map(s=>s.trim()).filter(Boolean) : [];
  const steps = [{kind:'intro', title:'Prepare-se para rezar', text:'Faça o sinal da cruz e coloque-se na presença de Deus. Em seguida, contemple com Maria o mistério da Paixão de Cristo.', body:opening}];
  pains.forEach((pain, index)=>steps.push({kind:'pain', number:index+1, title:'Dor de Nossa Senhora', text:pain}));
  if(litaniaAt >= 0) steps.push({kind:'litania', title:'Ladainha de Nossa Senhora das Dores', text:source.slice(litaniaAt).trim()});
  steps.push({kind:'finish', title:'Coroa concluída', text:'Permaneça alguns instantes em silêncio e agradeça a Deus pela companhia de Maria no caminho da cruz.'});
  return steps;
}
function guidedCrownNext(){
  const source = PRAYERS.devotions.coroa || '';
  const first = source.indexOf('PRIMEIRA FÓRMULA');
  const second = source.indexOf('SEGUNDA FÓRMULA');
  const secondRaw = source.slice(second >= 0 ? second + 'SEGUNDA FÓRMULA'.length : 0);
  const litania = secondRaw.includes('LADAINHA') ? secondRaw.slice(secondRaw.indexOf('LADAINHA')) : '';
  const raw = state.coroaFormula === 'formula2' ? secondRaw : `${source.slice(first >= 0 ? first + 'PRIMEIRA FÓRMULA'.length : 0, second >= 0 ? second : source.length)}\n\n${litania}`;
  const max = coroaGuidedSteps(raw).length - 1;
  state.coroaGuidedStep = Math.min(max, state.coroaGuidedStep + 1); render(); window.scrollTo(0,0);
}
function guidedCrownPrev(){ state.coroaGuidedStep = Math.max(0, state.coroaGuidedStep - 1); render(); window.scrollTo(0,0); }
function guidedCrownRestart(){ state.coroaGuidedStep = 0; render(); window.scrollTo(0,0); }
function viewCoroaGuided(formulaText){
  const steps = coroaGuidedSteps(formulaText);
  const index = Math.min(state.coroaGuidedStep, steps.length-1);
  const step = steps[index];
  const progress = Math.round(((index+1)/steps.length)*100);
  const isPain = step.kind === 'pain';
  const displayText = step.kind === 'intro' ? step.body : step.text;
  return `
    <button class="back-btn" onclick="openDevo('coroa', '${state.coroaFormula}')">Voltar às fórmulas</button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">Rezar a Coroa</h2>
      <div class="date-line">Modo guiado · ${state.coroaFormula === 'formula2' ? 'Segunda Fórmula' : 'Primeira Fórmula'}</div>
      <div class="detail-divider"></div>
    </div>
    <figure class="guided-crown-visual fade-in">
      <img src="media/servite-01.webp" alt="Esquema ilustrativo da Coroa de Nossa Senhora das Dores, com as sete dores, o Pai-Nosso e as sete Ave-Marias">
      <figcaption>Use este esquema como referência visual: comece pelo Pai-Nosso e percorra as sete dores, rezando sete Ave-Marias em cada uma.</figcaption>
    </figure>
    <div class="card guided-crown-card fade-in">
      <div class="guided-crown-head"><div class="guided-crown-kicker">Etapa ${index+1} de ${steps.length}</div><div class="guided-crown-kicker">${progress}%</div></div>
      <div class="guided-crown-progress"><span style="width:${progress}%"></span></div>
      <div class="guided-crown-step">
        <h3 class="guided-crown-pain">${isPain ? `<span class="guided-crown-dot">${step.number}</span>` : ''}${escapeHtml(step.title)}</h3>
        ${step.kind === 'pain' ? `<p>${escapeHtml(step.text.split('\n')[0])}</p><p style="color:var(--wine);font-weight:700;">Reze: Pai-Nosso e 7 Ave-Marias.</p>` : `<div class="prayer-block">${renderPrayer(displayText)}</div>`}
      </div>
      <div class="guided-crown-actions">
        <button class="hour-tab-btn" onclick="guidedCrownPrev()" ${index===0?'disabled':''}>Anterior</button>
        ${index < steps.length-1 ? `<button class="hour-tab-btn active" onclick="guidedCrownNext()">Próxima etapa</button>` : `<button class="hour-tab-btn active" onclick="guidedCrownRestart()">Recomeçar</button>`}
      </div>
    </div>
  `;
}
function viewCoroa(){
  const raw = PRAYERS.devotions.coroa || '';
  const firstMarker = 'PRIMEIRA FÓRMULA';
  const secondMarker = 'SEGUNDA FÓRMULA';
  const firstStart = raw.indexOf(firstMarker);
  const secondStart = raw.indexOf(secondMarker);
  const intro = firstStart >= 0 ? raw.slice(0, firstStart).trim() : '';
  const firstText = firstStart >= 0 ? raw.slice(firstStart + firstMarker.length, secondStart >= 0 ? secondStart : raw.length).trim() : raw;
  const secondText = secondStart >= 0 ? raw.slice(secondStart + secondMarker.length).trim() : '';
  const litaniaMarker = 'LADAINHA';
  const litaniaStart = secondText.indexOf(litaniaMarker);
  const litaniaText = litaniaStart >= 0 ? secondText.slice(litaniaStart).trim() : '';
  const secondFormulaText = litaniaStart >= 0 ? secondText.slice(0, litaniaStart).trim() : secondText;
  const firstWithLitania = litaniaText ? `${firstText}\n\n${litaniaText}` : firstText;
  const secondWithLitania = litaniaText ? `${secondFormulaText}\n\n${litaniaText}` : secondFormulaText;
  const activeTab = state.devoSub === 'formula2' || (state.devoSub === 'guided' && state.coroaFormula === 'formula2') ? 'formula2' : 'formula1';
  const activeText = activeTab === 'formula2' ? secondWithLitania : firstWithLitania;
  if(state.devoSub === 'guided'){
    const guidedSource = activeTab === 'formula2' ? secondWithLitania : firstWithLitania;
    return viewCoroaGuided(guidedSource);
  }
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      ${escapeHtml(t('back'))}
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">${escapeHtml(t('coroaTitle'))}</h2>
      <div class="date-line">${escapeHtml(t('coroaSub'))}</div>
      <div class="detail-divider"></div>
    </div>
    ${langNoteHtml()}
    <div class="card fade-in">
      <div class="prayer-block">${renderPrayer(intro)}</div>
    </div>
    <div class="hour-tabs coroa-tabs">
      <button class="hour-tab-btn ${activeTab==='formula1'?'active':''}" onclick="openDevo('coroa','formula1')">${escapeHtml(t('formula1'))}</button>
      <button class="hour-tab-btn ${activeTab==='formula2'?'active':''}" onclick="openDevo('coroa','formula2')">${escapeHtml(t('formula2'))}</button>
    </div>
    <div class="card fade-in" style="padding:14px 16px;">
      <button class="hour-tab-btn active" style="width:100%;" onclick="setCoroaGuided('${activeTab}')">Iniciar modo guiado e animado</button>
      <div class="rowrank" style="text-align:center;margin-top:8px;">Reze passo a passo, contemplando cada uma das sete dores.</div>
    </div>
    <div class="card fade-in">
      <div class="prayer-block">${renderWithLitanySpacing(activeText)}</div>
    </div>
  `;
}

function backToOracoes(){ state.devo=null; state.devoSub=null; render(); window.scrollTo(0,0); }

function simpleTextDetail(title, sub, text, backFn, showNote, useLitanySpacing){
  const back = backFn || 'backToOracoes()';
  return `
    <button class="back-btn" onclick="${back}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      ${escapeHtml(t('back'))}
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">${escapeHtml(title)}</h2>
      ${sub ? `<div class="date-line">${escapeHtml(sub)}</div>` : ''}
      <div class="detail-divider"></div>
    </div>
    ${showNote ? langNoteHtml() : ''}
    <div class="card fade-in">
      <div class="prayer-block">${useLitanySpacing ? renderWithLitanySpacing(text) : renderPrayer(text)}</div>
    </div>
  `;
}

// ---- Vigília (2 formulas) ----
function viewVigilia(){
  if(state.devoSub){
    const f = PRAYERS.devotions.vigilia[state.devoSub];
    const title = state.devoSub === 'formula1' ? t('formula1') : t('formula2');
    return simpleTextDetail(title, t('vigiliaOfNS'), f, "openDevo('vigilia')", true);
  }
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      ${escapeHtml(t('back'))}
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">${escapeHtml(t('vigiliaTitle'))}</h2>
      <div class="date-line">${escapeHtml(t('vigiliaSub'))}</div>
      <div class="detail-divider"></div>
    </div>
    ${langNoteHtml()}
    <div class="card fade-in" style="padding:6px 16px;">
      <div class="saint-row" onclick="openDevo('vigilia','formula1')">
        <div class="rowtext"><div class="rowtitle">${escapeHtml(t('formula1'))}</div><div class="rowrank">${escapeHtml(t('formula1Sub'))}</div></div>
        <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </div>
      <div class="saint-row" onclick="openDevo('vigilia','formula2')">
        <div class="rowtext"><div class="rowtitle">${escapeHtml(t('formula2'))}</div><div class="rowrank">${escapeHtml(t('formula2Sub'))}</div></div>
        <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </div>
    </div>
  `;
}

// ---- Santa Maria no Sábado (5 formularies) ----
function viewSabado(){
  const s = PRAYERS.devotions.sabado;
  const formKeys = ['form1','form2','form3','form4','form5'];
  if(state.devoSub){
    const body = s[state.devoSub];
    const title = s[state.devoSub + 'Title'];
    return `
      <button class="back-btn" onclick="openDevo('sabado')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
        ${escapeHtml(t('back'))}
      </button>
      <div class="detail-header fade-in">
        <h2 style="font-size:1.375rem;">${escapeHtml(title)}</h2>
        <div class="date-line">${escapeHtml(t('sabadoTitle'))}</div>
        <div class="detail-divider"></div>
      </div>
      ${langNoteHtml()}
      <div class="card fade-in">
        <div class="prayer-block">${renderOficioTabs(body)}</div>
      </div>
    `;
  }
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      ${escapeHtml(t('back'))}
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">${escapeHtml(t('sabadoTitle'))}</h2>
      <div class="date-line">${escapeHtml(t('sabadoSub'))}</div>
      <div class="detail-divider"></div>
    </div>
    ${langNoteHtml()}
    <div class="card fade-in" style="margin-bottom:16px;">
      <div class="prayer-block">${renderPrayer(s.intro)}</div>
    </div>
    <div class="card fade-in" style="padding:6px 16px;">
      ${formKeys.map((k,i) => `
      <div class="saint-row" onclick="openDevo('sabado','${k}')">
        <div class="rowtext"><div class="rowtitle">${escapeHtml(['I','II','III','IV','V'][i])} — ${escapeHtml(s[k+'Title'])}</div></div>
        <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </div>`).join('')}
    </div>
  `;
}

// ---- Via Matris (intro + 7 stations) ----
function viewViaMatris(){
  const vm = PRAYERS.devotions.via_matris;
  if(state.devoSub !== null){
    const st = vm.stations[state.devoSub];
    return simpleTextDetail(st.title, t('viaMatrisOfDores'), st.text, "openDevo('via_matris')", true);
  }
  const rows = vm.stations.map((s,i)=>`
    <div class="saint-row" onclick="openDevo('via_matris', ${i})">
      <div class="daynum" style="font-size:1rem;">${i+1}</div>
      <div class="rowtext"><div class="rowtitle">${escapeHtml(s.title.split('—')[1]||s.title)}</div></div>
      <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    </div>`).join('');
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      ${escapeHtml(t('back'))}
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">${escapeHtml(t('viaMatrisTitle'))}</h2>
      <div class="date-line">${escapeHtml(t('novenaPerpetua'))}</div>
      <div class="detail-divider"></div>
    </div>
    ${langNoteHtml()}
    <div class="card fade-in" style="margin-bottom:14px;">
      <div class="bio-text" style="font-size:1rem;">${escapeHtml(vm.intro.slice(0,420))}…</div>
    </div>
    <div class="section-title">${escapeHtml(t('sevenSorrows'))}</div>
    <div class="card fade-in" style="padding:6px 16px;">${rows}</div>
  `;
}

// ---- Ladainhas (3 items) ----
function viewLadainhas(){
  const list = PRAYERS.devotions.ladainhas;
  if(state.devoSub !== null){
    const l = list[state.devoSub];
    return simpleTextDetail(l.title, t('ladainhaGenericSub'), l.text, "openDevo('ladainhas')", true, true);
  }
  const rows = list.map((l,i)=>`
    <div class="saint-row" onclick="openDevo('ladainhas', ${i})">
      <div class="rowtext"><div class="rowtitle">${escapeHtml(l.title)}</div></div>
      <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
    </div>`).join('');
  return `
    <button class="back-btn" onclick="backToOracoes()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
      ${escapeHtml(t('back'))}
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">${escapeHtml(t('ladainhasTitle'))}</h2>
      <div class="date-line">${escapeHtml(t('threeLadainhas'))}</div>
      <div class="detail-divider"></div>
    </div>
    ${langNoteHtml()}
    <div class="card fade-in" style="padding:6px 16px;">${rows}</div>
  `;
}

// ---- Regra de Vida da Ordem Secular ----
function setRegraChapter(idx){
  state.regraChapter = idx;
  render();
  window.scrollTo(0,0);
}

function backFromRegra485(){
  if(state.regraChapter !== null){
    state.regraChapter = null;
    render();
    window.scrollTo(0,0);
    return;
  }
  try{
    if(window.parent && window.parent !== window && typeof window.parent.closeServite === 'function'){
      window.parent.closeServite();
      return;
    }
  }catch(e){}
  state.tab = 'hoje';
  render();
  window.scrollTo(0,0);
}
function reflowRuleProse(value){
  const source=String(value||'').replace(/\r\n?/g,'\n');
  const reflow=prose=>prose.split(/\n[ \t]*\n+/).map(paragraph=>paragraph.replace(/[ \t]*\n[ \t]*/g,' ').replace(/[ \t]{2,}/g,' ').trim()).filter(Boolean).join('\n\n');
  const introMarker='O mesmo Espírito Santo';
  const introAt=source.indexOf(introMarker);
  if(introAt<0)return reflow(source);
  const heading=source.slice(0,introAt).trimEnd();
  return heading+'\n\n'+reflow(source.slice(introAt));
}
function renderRuleParagraphs(value){
  const source=String(value||'').replace(/\r\n?/g,'\n')
    .replace(/([.!?])\s+(\d+\.\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g,'$1\n\n$2');
  return source
    .split(/\n[ \t]*\n+/)
    .map(paragraph=>paragraph.replace(/[ \t]*\n[ \t]*/g,' ').replace(/[ \t]{2,}/g,' ').trim())
    .filter(Boolean)
    .map(paragraph=>{
      const article=paragraph.match(/^(\d+\.)(\s+)([\s\S]*)$/);
      const content=article?'<strong class="rule-number">'+escapeHtml(article[1])+'</strong> '+escapeHtml(article[3]):escapeHtml(paragraph);
      return '<p class="rule-paragraph">'+content+'</p>';
    }).join('');
}
function viewRegra(){
  const r = PRAYERS.regra;
  if(state.regraChapter !== null){
    const isIntro = state.regraChapter === 'intro';
    const title = isIntro ? t('regraIntroLabel') : `${t('regraChapterLabel')} ${r.chapters[state.regraChapter].roman} — ${r.chapters[state.regraChapter].title}`;
    const text = reflowRuleProse(isIntro ? r.intro : r.chapters[state.regraChapter].text);
    return `
      <button class="regra-floating-back" onclick="backFromRegra485()" aria-label="Voltar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>
        ${escapeHtml(t('back'))}
      </button>
      <div class="detail-header fade-in">
        <h2 style="font-size:1.375rem;">${escapeHtml(title)}</h2>
        <div class="detail-divider"></div>
      </div>
      ${langNoteHtml()}
      <div class="card fade-in regra-card">
        ${isIntro?'<div class="prayer-block regra-prose">'+renderPrayer(text)+'</div>':'<div class="rule-prose">'+renderRuleParagraphs(text)+'</div>'}
      </div>
    `;
  }
  return `
    <button class="regra-floating-back" onclick="backFromRegra485()" aria-label="Voltar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6"/></svg>
      <span>${escapeHtml(t('back'))}</span>
    </button>
    <div class="detail-header fade-in">
      <h2 style="font-size:1.625rem;">${escapeHtml(t('regraTitle'))}</h2>
      <div class="date-line">${escapeHtml(t('regraSub'))}</div>
      <div class="detail-divider"></div>
    </div>
    ${langNoteHtml()}
    <div class="card fade-in" style="padding:6px 16px; margin-bottom:16px;">
      <div class="saint-row" onclick="setRegraChapter('intro')">
        <div class="rowtext"><div class="rowtitle">${escapeHtml(t('regraIntroLabel'))}</div></div>
        <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </div>
    </div>
    <div class="card fade-in" style="padding:6px 16px;">
      ${r.chapters.map((c,i) => `
      <div class="saint-row" onclick="setRegraChapter(${i})">
        <div class="rowtext"><div class="rowtitle">${escapeHtml(t('regraChapterLabel'))} ${escapeHtml(c.roman)}</div><div class="rowrank">${escapeHtml(c.title)}</div></div>
        <div class="chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></div>
      </div>`).join('')}
    </div>
  `;
}

function viewSobre(){
  return `
    <div class="section-title">${escapeHtml(t('aboutSection'))}</div>
    <div class="card fade-in about-text">
      <p>Esta coletânea de orações e celebrações próprias da Ordem dos Servos de Maria destina-se às comunidades religiosas, às fraternidades leigas da Ordem Secular e a todos os que desejam alimentar sua vida de fé segundo a espiritualidade servita.</p>
      <p>O Santoral reúne a memória litúrgica dos santos, beatos e servos de Deus da Ordem: o hino, a antífona, o salmo comuns, e a breve biografia com a oração própria de cada um deles.</p>
    </div>
    <div class="about-quote fade-in">
      "Somos servos da Virgem Gloriosa, de cuja viuvez trazemos o hábito. Procuramos modelar a nossa vida segundo o exemplo dos Santos Apóstolos e viver segundo a regra do santo doutor Agostinho."
      <div style="font-size:0.875rem; margin-top:8px; color:var(--text-muted);">— São Filipe Benizi</div>
    </div>
    <div class="section-title">${escapeHtml(t('editionSection'))}</div>
    <div class="card fade-in credit-list">
      <div><b>Título original:</b> "Preghiere"</div>
      <div><b>Organização:</b> Consiglio Nazionale OSSM, Roma, 1988</div>
      <div><b>Tradução:</b> frei José M. Milanez, osm (in memoriam)</div>
      <div><b>Edição:</b> 3ª edição revisada, 2024</div>
      <div><b>Publicação:</b> Ordem dos Servos de Maria — Província São Peregrino do Brasil</div>
      <div><b>Sede:</b> Cúria Provincial dos Servos de Maria, São José dos Campos - SP</div>
      <div><b>Site:</b> servitasbra.org</div>
    </div>
    <div class="section-title">${escapeHtml(t('socialSection'))}</div>
    <div class="social-links fade-in">
      <a class="social-link" href="https://youtube.com/@savosmbrasil?si=Pcn71bJ212PwwLuY" target="_blank" rel="noopener noreferrer">
        <span class="social-icon">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5L15.8 12l-6.2 3.5Z"/></svg>
        </span>
        <span>
          <div class="social-label">${escapeHtml(t('socialYoutube'))}</div>
          <div class="social-sub">@savosmbrasil</div>
        </span>
      </a>
      <a class="social-link" href="https://www.instagram.com/ordem.servitas?igsh=OHI4cGg3c3l2NGIx&igsi=OHI4cGg3c3l2NGIx" target="_blank" rel="noopener noreferrer">
        <span class="social-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
        </span>
        <span>
          <div class="social-label">${escapeHtml(t('socialInstagram'))}</div>
          <div class="social-sub">@ordem.servitas</div>
        </span>
      </a>
    </div>
  `;
}

// ===================== router =====================
function render(){
  const view = document.getElementById('view');
  let html = '';
  if(state.tab === 'hoje') html = viewHoje();
  else if(state.tab === 'santoral') html = viewSantoral();
  else if(state.tab === 'oracoes') html = viewOracoes();
  else if(state.tab === 'regra') html = viewRegra();
  else if(state.tab === 'sobre') html = viewSobre();
  view.innerHTML = html;
}

document.querySelectorAll('.tab-btn').forEach(b=>{
  b.addEventListener('click', ()=> setTab(b.dataset.tab));
});

// ===================== settings panel =====================
function toggleSettings(){
  const panel = document.getElementById('settingsPanel');
  const btn = document.getElementById('settingsBtn');
  const isHidden = panel.hasAttribute('hidden');
  if(isHidden){ panel.removeAttribute('hidden'); btn.classList.add('active'); }
  else { panel.setAttribute('hidden',''); btn.classList.remove('active'); }
}

function applyStaticI18n(){
  document.documentElement.setAttribute('lang', LANG === 'pt' ? 'pt-BR' : LANG);
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('#langGroup .chip').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang === LANG);
  });
}

function setLanguage(lang){
  LANG = lang;
  try{ localStorage.setItem('santoral-osm-lang', lang); }catch(e){}
  applyStaticI18n();
  render();
}

function setTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  try{ localStorage.setItem('osmTheme', theme); localStorage.setItem('santoral-osm-theme', theme); }catch(e){}
  updateThemeChips();
}
function updateThemeChips(){
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const lightChip = document.getElementById('themeChipLight');
  const darkChip = document.getElementById('themeChipDark');
  if(lightChip) lightChip.classList.toggle('active', current === 'light');
  if(darkChip) darkChip.classList.toggle('active', current === 'dark');
}

// ===================== font size control =====================
const FONT_MIN = 13, FONT_MAX = 22, FONT_STEP = 1;
function changeFontSize(dir){
  const current = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  let next = Math.round(current + dir * FONT_STEP);
  next = Math.max(FONT_MIN, Math.min(FONT_MAX, next));
  document.documentElement.style.fontSize = next + 'px';
  try{ localStorage.setItem('santoral-osm-fontsize', next); localStorage.setItem('osmReaderScale', (next/16).toFixed(2)); }catch(e){}
}

// ===================== init =====================
async function initServite(){
  const [santoralData, oficiosData] = await Promise.all([
    fetch('data/santoral.json').then(r=>r.json()),
    fetch('data/oficios-osm.json').then(r=>r.json())
  ]);
  const celebracoes = oficiosData && oficiosData.schema_version===3 ? oficiosData.celebracoes : {};
  SANTORAL = santoralData.map((item,index)=>{
    const key=String(item.month).padStart(2,'0')+'-'+String(item.day).padStart(2,'0');
    const lit=celebracoes[key]||null;
    return {...item, special:item.special??'', oficio:lit&&lit.tipo_material!=='sem_material_proprio' ? lit.material : null, tipo_material:lit?.tipo_material||'sem_material_proprio', _id:index};
  });
  SANTORAL.forEach((s,i)=> s._id = i);
document.querySelector('.tab-btn[data-tab="hoje"]').classList.add('active');
try{
  const savedLang = localStorage.getItem('santoral-osm-lang');
  if(savedLang && I18N[savedLang]) LANG = savedLang;
}catch(e){}
applyStaticI18n();
updateThemeChips();
render();
  window.dispatchEvent(new Event('servite-ready'));
}
initServite().catch(error=>{document.getElementById('view').innerHTML='<div class="empty-note">Não foi possível carregar os textos offline.</div>';console.error(error);});
