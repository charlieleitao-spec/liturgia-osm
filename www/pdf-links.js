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
      if(!/^data\/pdfs\/(missal|oficios)\/[a-z0-9-]+\.pdf$/.test(path))return null;
      const page=Number(new URLSearchParams(url.hash.slice(1)).get('page'));
      return {path,page:Number.isSafeInteger(page)&&page>0?page:1};
    }catch{return null;}
  }
  root.OSMPdf={resolve};
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
      await plugin.open({...pdf,title:root.document.querySelector('.proper-mass-reader .hub-card-title, #view h2')?.textContent||'PDF oficial OSM'});
    }catch(error){
      console.error('[PDF local]',error);
      root.alert('Não foi possível abrir este PDF. Feche e abra o aplicativo e tente novamente.');
    }finally{opening=false;}
  },true);
})(typeof window!=='undefined'?window:globalThis);
