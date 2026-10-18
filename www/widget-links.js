/* Android widget links: queue until the canonical santoral has loaded. */
(function(root){
 let ids=new Set(),open,pending=null,started=false,lastUrl=null,lastError=null;
 function receive(url){
   lastUrl=url;
   try{const match=typeof url==='string'&&/^liturgiaosm:\/\/celebracao\/(\d+)$/.exec(url);if(!match)return;
     pending=Number(match[1]);flush();
   }catch(error){lastError=String(error);console.warn('[Widget OSM] Link não aberto',error);}
 }
 function flush(){if(open&&ids.has(pending)){const id=pending;pending=null;open(id);}}
 root.OSMWidgetLinks={
   diagnostics(){return {started,lastUrl,lastError,pending,count:ids.size,opener:typeof open};},
   setData(saints,callback){ids=new Set(saints.map(s=>Number(s.id)));open=callback;flush();},
   init(){if(started||root.Capacitor?.getPlatform?.()!=='android')return;
     const app=getCapacitorPlugin('App');if(!app)return;started=true;
     try{Promise.resolve(app.addListener('appUrlOpen',e=>receive(e.url))).catch(console.warn);
       Promise.resolve(app.getLaunchUrl()).then(e=>{if(e?.url)receive(e.url);}).catch(console.warn);
     }catch(error){console.warn('[Widget OSM]',error);}
   }
 };
})(window);
