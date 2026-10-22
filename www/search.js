/* Índice invertido local, carregado apenas ao abrir a busca. */
(function(root){
  'use strict';
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const words=value=>normalize(value).match(/[a-z0-9]+/g)||[];
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
  root.OSMSearch={createIndex,normalize};
  if(typeof module!=='undefined')module.exports=root.OSMSearch;
})(typeof window!=='undefined'?window:globalThis);
