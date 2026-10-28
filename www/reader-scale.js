/* A mesma preferência e o mesmo passo em todos os leitores. Sem recriar a página. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.OSMReaderScale=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const MIN=.76,MAX=2,STEP=.08;
 function normalize(value){const n=Number(value);return Number.isFinite(n)?Math.round(Math.max(MIN,Math.min(MAX,n))*100)/100:1;}
 function read(storage){const value=storage.getItem('osmReaderScale');return normalize(value===null||value===''?1:value);}
 function write(storage,value){const scale=normalize(value);storage.setItem('osmReaderScale',String(scale));storage.setItem('santoral-osm-fontsize',String(scale*16));return scale;}
 function next(value,direction){return normalize(normalize(value)+Math.sign(direction)*STEP);}
 return {MIN,MAX,STEP,normalize,read,write,next};
});
