/* Índice invertido local, carregado apenas ao abrir a busca. */
(function(root){
  'use strict';
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const words=value=>normalize(value).match(/[a-z0-9]+/g)||[];
  const ignored=new Set(['image','id','santoral_id','schema_version','description','categoria',
    'genero','grau_confirmado','tipo_material','editorial_notes']);
  function sourceText(value){
    if(typeof value==='string')return /^(?:https?:\/\/|(?:\.\/)?(?:data|media)\/)/.test(value)?'':value;
    if(Array.isArray(value))return value.map(sourceText).filter(Boolean).join('\n\n');
    if(value&&typeof value==='object')return Object.entries(value)
      .filter(([key])=>!ignored.has(key)&&!key.endsWith('_url')&&!key.endsWith('_pdf'))
      .map(([,item])=>sourceText(item)).filter(Boolean).join('\n\n');
    return '';
  }
  // Cache é opcional: armazenamento recusado/cheio nunca impede a busca offline.
  function corpusCache(mode,value){
    return new Promise(resolve=>{
      if(!root.indexedDB){resolve(null);return;}
      let db,finished=false;
      const finish=result=>{if(finished)return;finished=true;clearTimeout(timer);db?.close();resolve(result);};
      const timer=setTimeout(()=>finish(null),1500);
      try {
        const request=root.indexedDB.open('osm-search-v2',1);
        request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('corpus'))request.result.createObjectStore('corpus');};
        request.onerror=request.onblocked=()=>finish(null);
        request.onsuccess=()=>{
          db=request.result;
          if(finished){db.close();return;}
          const transaction=db.transaction('corpus',mode==='read'?'readonly':'readwrite');
          const store=transaction.objectStore('corpus');
          const operation=mode==='read'?store.get('current'):store.put(value,'current');
          let result=null;
          operation.onsuccess=()=>{result=operation.result;};
          transaction.oncomplete=()=>finish(result);
          transaction.onerror=transaction.onabort=()=>finish(null);
        };
      } catch {finish(null);}
    });
  }
  async function loadDocuments(corpus,readJSON,cache=corpusCache){
    if(corpus.schema===1)return corpus.documents;
    if(corpus.schema!==2)throw new Error('Formato de busca incompatível');
    const revision=JSON.stringify([corpus.schema,corpus.sources]);
    const cached=await cache('read');
    if(cached?.revision===revision&&Array.isArray(cached.documents)&&cached.documents.length===corpus.documents.length)return cached.documents;
    const read=readJSON||async function(source){
      const response=await fetch('./data/'+source);
      if(!response.ok)throw new Error('Fonte local indisponível: '+source);
      return response.json();
    };
    const sources=new Map();
    const documents=await Promise.all(corpus.documents.map(async document=>{
      if(!Array.isArray(document.ref))return {...document};
      const {ref,...record}=document;
      if(!Object.hasOwn(corpus.sources,'data/'+record.source)||!record.source.endsWith('.json')||record.source.includes('..'))throw new Error('Fonte inválida');
      if(!sources.has(record.source))sources.set(record.source,Promise.resolve().then(()=>read(record.source)));
      let value=await sources.get(record.source);
      for(const key of ref){
        if(value===null||typeof value!=='object'||!Object.hasOwn(value,key))throw new Error('Referência inválida: '+record.source);
        value=value[key];
      }
      return {...record,text:sourceText(value).trim()};
    }));
    await cache('write',{revision,documents});
    return documents;
  }
  function createIndex(documents){
    const postings=new Map();
    const normalized=documents.map(doc=>normalize(doc.title+' '+doc.source+' '+doc.text));
    documents.forEach((doc,id)=>{
      new Set(words(doc.title+' '+doc.source+' '+doc.text)).forEach(word=>{
        if(!postings.has(word))postings.set(word,new Set());
        postings.get(word).add(id);
      });
    });
    return {documents, search(query,category=''){
      const terms=[...new Set(words(query))];
      if(!terms.length)return [];
      let ids=null;
      terms.forEach((term,index)=>{
        const matches=new Set();
        for(const [word,values] of postings){
          if(word===term || index===terms.length-1 && word.startsWith(term))for(const id of values)matches.add(id);
        }
        ids=ids===null?matches:new Set([...ids].filter(id=>matches.has(id)));
      });
      const phrase=normalize(query).trim();
      return [...ids].filter(id=>!category||documents[id].category===category).map(id=>{
        const doc=documents[id],title=normalize(doc.title);
        const score=(title.includes(phrase)?100:0)+terms.filter(term=>title.includes(term)).length*10+(normalized[id].includes(phrase)?5:0);
        const offset=Math.max(0,normalize(doc.text).indexOf(terms[0])-65);
        return {id,doc,score,snippet:(offset?'…':'')+doc.text.slice(offset,offset+220).replace(/\s+/g,' ')+(offset+220<doc.text.length?'…':'')};
      }).sort((a,b)=>b.score-a.score||a.id-b.id);
    }};
  }
  root.OSMSearch={createIndex,normalize,loadDocuments};
  if(typeof module!=='undefined')module.exports=root.OSMSearch;
})(typeof window!=='undefined'?window:globalThis);
