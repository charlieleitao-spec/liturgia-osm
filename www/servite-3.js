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
    if(/^(Salmo|Cântico|C[âa]ntico)\s+/i.test(line)){ stanza=null; add(line,'psalm-title'); return; }
    if(/^(V\.|R\.|℣\.|℟\.)\s*/.test(line)){ stanza=null; add(line, currentHead==='PRECES'?'preces-response':'response'); return; }
    if(/^(Escolhe-se|Salmos? do|Salmos? e cântico|Como no (?:Comum|Ordinário|Próprio)|Do Comum|Quando esta memória|Antífona e salmos|Salmodia complementar)/i.test(line)){
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
  const tabs = order.map(o => `<button class="hour-tab-btn ${state.oficioTab===o.key ? 'active' : ''}" onclick="setOficioTab('${o.key}')">${escapeHtml(o.title)}</button>`).join('');
  const active = order.find(o => o.key === state.oficioTab);
  const segs = buckets[active.key];
  const canticleText = active.key === 'laudes' ? BENEDICTUS_TEXT : (active.key === 'vesperas' ? MAGNIFICAT_TEXT : null);
  const body = segs.map(s => {
    const txt = active.key === 'invitatorio' ? `${s.text}\n\n${INVITATORIO_SALMO}` : (canticleText ? insertCanticleAfterAntiphon(s.text, canticleText) : s.text);
    return `${s.label ? `<div class="hour-sublabel">${escapeHtml(s.label)}</div>` : ''}<div>${renderLiturgicalHourContent(txt)}</div>`;
  }).join('<div class="hour-divider"></div>');
  const finalAntifona = active.key === 'vesperas' ? renderFinalAntifonaBlock() : '';
  return `
    <div class="hour-tabs">${tabs}</div>
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
  if(state.devoSub !== null){