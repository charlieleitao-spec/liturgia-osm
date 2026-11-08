/* PDFs do APK: leitor Android local, inclusive resultados com #page. */
(function(root){
  'use strict';
  function resolve(input,base){
    try {
      const url=new URL(input,base),origin=new URL(base).origin;
      let path=url.origin===origin?url.pathname.replace(/^\//,''):'';
      if(['servidimaria.net','www.servidimaria.net'].includes(url.hostname)&&['http:','https:'].includes(url.protocol)){
        const match=url.pathname.match(/^\/sitoosm\/po\/textos-osm\/livros-liturgicos-osm\/(missa|lhoras)\/([a-z0-9-]+\.pdf)$/i);
        if(match)path='data/pdfs/'+(match[1]==='missa'?'missal':'oficios')+'/'+match[2];
      }
      if(!/^data\/pdfs\/(missal|oficios|biblioteca)\/[a-z0-9-]+\.pdf$/.test(path))return null;
      const page=Number(new URLSearchParams(url.hash.slice(1)).get('page'));
      return {path,page:Number.isSafeInteger(page)&&page>0?page:1};
    }catch{return null;}
  }
  function escape(value){return String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  // Um único tratamento para preces em todos os leitores. Só organiza os
  // sinais e limites presentes na fonte; não acrescenta palavras nem respostas.
  function formatIntercessions(value,prefix='preces-'){
    const blocks=[],group=[];
    const explicitRequests=/^[-–—_]\s*\S/m.test(String(value||''));
    let lines=[],role='intro',blank=false;
    const endGroup=()=>{if(group.length){blocks.push('<div class="liturgical-intercession '+prefix+'intercession">'+group.join('\n')+'</div>');group.length=0;}};
    const flush=()=>{
      if(!lines.length)return;
      const text=lines.join(' ').replace(/\s+/g,' ').trim();
      if(role==='intention'&&!explicitRequests){
        const boundary=text.match(/;\s+|,\s+(?=(?:fazei|dai|concedei|enchei|ajudai|ensinai|olhai|aceitai|orientai|aumentai)\b)/i);
        if(boundary){
          const cut=boundary.index+1;
          group.push('<p class="liturgical-intercession-intention '+prefix+'intention">'+escape(text.slice(0,cut))+'</p>\n<p class="liturgical-intercession-petition '+prefix+'petition">'+escape(text.slice(cut).trim())+'</p>');
          lines=[];return;
        }
      }
      const alias=role==='refrain'&&prefix==='preces-'?'response':role;
      const html='<p class="liturgical-intercession-'+role+' '+prefix+alias+(role==='refrain'?' liturgical-response':'')+'">'+escape(text).replace(/^((?:[RV][./]|[℣℟]\.?)\s*)/,'<span class="rubric">$1</span>')+'</p>';
      if(role==='intention'||role==='petition')group.push(html);else{endGroup();blocks.push(html);}
      lines=[];
    };
    const start=(type,line)=>{flush();role=type;lines.push(line);};
    const source=String(value||'').replace(/\r\n?/g,'\n').replace(/(?<![RV℣℟]\.)(?<=\.)[ \t]+(?=(?:Pastor eterno|Senhor Jesus|Cristo(?: ressuscitado)?),)/g,'\n');
    for(const raw of source.split('\n')){
      const line=raw.trim();
      if(!line){blank=true;continue;}
      if(/^Copyright\b/i.test(line))continue;
      if(/^\[/.test(line)){start('rubric',line);blank=false;continue;}
      if(/^(?:R[./]|℟\.?)\s*/.test(line)){start('refrain',line);blank=false;continue;}
      if(/^(?:V[./]|℣\.?)\s*/.test(line)){start('response',line);blank=false;continue;}
      if(/^[-–—_]\s*\S/.test(line)){start('petition',line);blank=false;continue;}
      const ended=lines.length&&/[.!?]["”’»)]*$/.test(lines.at(-1));
      const newInvocation=/^[A-ZÀ-Ý]/.test(line)&&ended&&['refrain','petition','intention'].includes(role);
      if(newInvocation||(blank&&role==='intention'&&ended)){
        flush();endGroup();role='intention';
      }
      lines.push(line);blank=false;
      if(role==='rubric'&&/\][.]?$/.test(line)){flush();role='intro';}
    }
    flush();endGroup();return blocks.join('\n');
  }
  function formatOfficeText(value){
    const blocks=[],sourceNotes=new Set();
    let paragraph=[],kind='prose',mode='prose',lastIndent=0,seenHour=false;
    const hour=/^(?:(?:I{1,3}|IV|V|1[ªa]?|2[ªa]?)\s+)?(?:Invitatório|Ofício das Leituras|Laudes|Vésperas|Hora Média|Completas)$/i;
    const section=/^(HINO|SALMODIA|(?:PRIMEIRA|SEGUNDA|TERCEIRA) LEITURA|LEITURA(?: BREVE| ALTERNATIVA)?|RESPONSÓRIO(?: BREVE)?|PRECES|ORAÇÃO(?: SÁLMICA| SOBRE O CÂNTICO)?|CÂNTICO EVANGÉLICO|PAI[- ]NOSSO|CONCLUSÃO|DESPEDIDA)(?:\s+(.+))?$/i;
    function inline(text){return escape(text).replace(/^((?:Ant\.(?:\s*\d+)?|Antífona(?:\s*\d+)?|[VR][./]|[℣℟]\.?)\s*)/i,'<span class="rubric">$1</span>').replace(/([^\s<>]+)\s+([*†])(?=\s|$)/g,'<span class="liturgical-cue">$1 $2</span>');}
    function flush(){
      if(!paragraph.length)return;
      if(mode==='preces')blocks.push(formatIntercessions(paragraph.join('\n'),'office-'));
      else if(kind==='hymn'||kind==='psalm')blocks.push('<div class="office-'+kind+'-stanza">'+paragraph.map(line=>'<span class="office-verse-line">'+inline(line)+'</span>').join('\n')+'</div>');
      else blocks.push('<p class="office-'+kind+(kind==='response'&&/^(?:R[./]|℟)/.test(paragraph[0])?' liturgical-response':'')+'">'+inline(paragraph.join(' '))+'</p>');
      paragraph=[];
    }
    function add(line,nextKind){if(kind!==nextKind)flush();kind=nextKind;paragraph.push(line);}
    const lines=String(value||'').replace(/\r\n?/g,'\n').split('\n').flatMap(raw=>{
      const match=raw.match(/^(.*[.;])\s+(Ofício das Leituras|Laudes|Vésperas|Invitatório|Hora Média)$/i);
      return match?[match[1],match[2]]:[raw];
    });
    for(const [lineIndex,raw] of lines.entries()){
      const line=raw.trim().replace(/[ \t]+/g,' '),indent=raw.length-raw.trimStart().length;
      if(!line){
        if(mode==='preces'){paragraph.push('');continue;}
        // A PDF page break may interrupt a sentence. Only join prose when
        // the following text continues in lower case; keep poetic stanzas.
        const next=lines.slice(lineIndex+1).find(value=>value.trim()&&!/^Copyright\s*©/i.test(value.trim()))||'';
        const continuation=kind==='prose'&&paragraph.length&&mode!=='hymn'&&mode!=='psalm'
          &&!/[.!?;:]\s*["”’»)]*$/.test(paragraph.at(-1))&&/^[a-zà-ÿ]/.test(next.trim());
        if(!continuation){flush();lastIndent=0;}
        continue;
      }
      if(/^Copyright\s*©/i.test(line)){sourceNotes.add(line);continue;}
      if(hour.test(line)){flush();blocks.push('<h3 class="office-hour-heading">'+escape(line)+'</h3>');mode='prose';seenHour=true;continue;}
      const heading=line.match(section);
      // A complete section label may have a biblical reference or a short rubric.
      if(heading&&(!heading[2]||/^(?:RESPONSÓRIO|LEITURA BREVE|HINO)$/i.test(heading[1]))){
        flush();blocks.push('<h4 class="office-section-heading">'+escape(heading[1])+'</h4>');
        if(heading[2])blocks.push('<p class="office-reference">'+escape(heading[2])+'</p>');
        mode=/^PRECES$/i.test(heading[1])?'preces':/^HINO$/i.test(heading[1])?'hymn':/LEITURA/i.test(heading[1])?'reading':/SALMODIA|CÂNTICO EVANGÉLICO/i.test(heading[1])?'psalm':'prose';
        continue;
      }
      if(mode==='preces'){paragraph.push(line);continue;}
      if(!seenHour&&line.length>5&&line===line.toLocaleUpperCase('pt-BR')&&/[A-ZÀ-Ý]/.test(line)){
        flush();blocks.push('<h3 class="office-document-heading">'+escape(line)+'</h3>');continue;
      }
      if(!seenHour&&/^(?:\d{1,2} de |Solenidade$|Festa$|Memória(?: facultativa)?$)/i.test(line)){
        flush();blocks.push('<p class="office-document-meta">'+escape(line)+'</p>');continue;
      }
      if(/^(?:Salmo\s+\d|Cântico\s*\(|Série\s+[A-Z])/i.test(line)){
        flush();blocks.push('<h4 class="office-psalm-heading">'+escape(line)+'</h4>');mode='psalm';continue;
      }
      if(/^(?:Ant\.|Antífona)\s*\d*/i.test(line)){flush();add(line,'antiphon');}
      else if(/^(?:[VR][./]|[℣℟]\.?)\s*/.test(line)){flush();add(line,'response');}
      else if(/^(?:Escolhe-se|Salmos? do|Salmos? e antífonas|Salmo invitatório|Do Comum|Como no (?:Comum|Ordinário)|Ou:)/i.test(line)){
        flush();add(line,'instruction');
      }else if(mode==='hymn')add(line,'hymn');
      else if(mode==='psalm'&&(/^[-–—=]\s|[*†]/.test(line)||kind==='psalm'&&paragraph.length))add(line,'psalm');
      else if(['antiphon','response','instruction','reference'].includes(kind)&&paragraph.length&&indent<5)add(line,kind);
      else if(mode==='reading'&&/^(?:Da|Do|Das|Dos)\s/.test(line)&&!paragraph.length)add(line,'reference');
      else if(mode==='reading'&&indent>=14&&line.length<140){flush();add(line,'caption');flush();}
      else {
        if(kind==='prose'&&paragraph.length&&indent>=5&&lastIndent<5&&/[.!?»”)]$/.test(paragraph.at(-1)))flush();
        add(line,'prose');
      }
      lastIndent=indent;
    }
    flush();for(const note of sourceNotes)blocks.push('<small class="office-source-note">'+escape(note)+'</small>');return blocks.join('\n');
  }
  function officeResources(record){
    if(!record)return '';
    const url=record.local_pdf_url||record.pdf_url;
    const pdf=url?'<a class="btn-link office-pdf-link" href="'+escape(url)+'" target="_blank" rel="noopener">Abrir PDF completo</a>':'';
    const transcript=record.pdf_transcript?'<details class="office-transcript"><summary class="btn-link">Ler texto completo do Ofício</summary><div class="hub-text office-transcript-text">'+formatOfficeText(record.pdf_transcript)+'</div></details>':'';
    return pdf||transcript?'<div class="office-complete-resources">'+pdf+transcript+'</div>':'';
  }
  root.OSMPdf={resolve,officeResources,formatOfficeText,formatIntercessions};
  if(typeof module!=='undefined')module.exports=root.OSMPdf;
  if(!root.document)return;
  const capacitor=()=>root.Capacitor||(root.parent!==root?root.parent.Capacitor:null);
  let opening=false;
  root.document.addEventListener('click',async event=>{
    const anchor=event.target.closest?.('a[href]'),cap=capacitor();
    if(!anchor||!cap?.isNativePlatform?.()||cap.getPlatform?.()!=='android')return;
    const pdf=resolve(anchor.href,root.location.href);
    if(!pdf)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(opening)return;
    opening=true;
    try {
      const plugin=cap.Plugins?.LocalPdf||cap.registerPlugin('LocalPdf');
      if(root.OSMLibrary?.valid(pdf.path)){await root.OSMLibrary.openOrOffer(pdf.path,pdf.page,'Biblioteca Servita');return;}
      await plugin.open({...pdf,title:root.document.querySelector('.proper-mass-reader .hub-card-title, #view h2')?.textContent||'PDF oficial OSM'});
    }catch(error){
      console.error('[PDF local]',error);
      root.alert('Não foi possível abrir este PDF. Feche e abra o aplicativo e tente novamente.');
    }finally{opening=false;}
  },true);
})(typeof window!=='undefined'?window:globalThis);
