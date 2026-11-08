/* Shared download controls for the Library and global search. */
(function(root){
  'use strict';
  const valid=path=>/^data\/pdfs\/biblioteca\/[a-z0-9-]+\.pdf$/.test(path||'');
  const cap=()=>root.Capacitor||(root.parent!==root?root.parent.Capacitor:null);
  const plugin=()=>{const c=cap();return c?.isNativePlatform?.()&&c.getPlatform?.()==='android'?(c.Plugins?.LocalPdf||c.registerPlugin('LocalPdf')):null;};
  let catalog;
  const items=()=>catalog||(catalog=fetch('./data/biblioteca-servita-catalogo.json').then(r=>{if(!r.ok)throw Error('Catálogo indisponível');return r.json();}).then(c=>c.documents));
  async function entry(path){const doc=(await items()).find(d=>d.download_path===path);if(!doc||!valid(path))throw Error('Livro não cadastrado');return doc;}
  // Web fallback uses persistent IndexedDB; Android always uses filesDir through LocalPdf.
  function webStore(mode,path,value){return new Promise((resolve,reject)=>{
    const request=root.indexedDB.open('osm-library-downloads',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('books');
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction('books',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('books');
      const op=mode==='get'?store.get(path):mode==='remove'?store.delete(path):store.put(value,path);let result;
      op.onsuccess=()=>{result=op.result;};tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=tx.onabort=()=>{db.close();reject(tx.error||Error('Armazenamento indisponível'));};
    };
  });}
  const hash=async buffer=>Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',buffer)),b=>b.toString(16).padStart(2,'0')).join('');
  async function verified(buffer,doc){if(!buffer||buffer.byteLength!==doc.download.bytes||await hash(buffer)!==doc.download.sha256)throw Error('Falha de integridade SHA-256. Baixe novamente.');return buffer;}
  const pending=new Map();
  async function status(path){const doc=await entry(path),native=plugin();if(native)return (await native.status({path})).downloaded;try{return Boolean(await verified(await webStore('get',path),doc));}catch{return false;}}
  async function download(path){
    if(pending.has(path))return pending.get(path);
    const task=(async()=>{
      const doc=await entry(path),native=plugin();
      if(native){await native.download({path});return;}
      const res=await fetch(doc.download.url,{cache:'no-store',redirect:'error'});
      if(!res.ok)throw Error('Não foi possível baixar. Verifique a conexão.');
      const buffer=await res.arrayBuffer();await verified(buffer,doc);
      await webStore('put',path,buffer);
    })().finally(()=>pending.delete(path));pending.set(path,task);return task;
  }
  async function remove(path){await entry(path);if(pending.has(path))await pending.get(path);const native=plugin();if(native)await native.remove({path});else await webStore('remove',path);}
  async function open(path,page=1,title='Biblioteca Servita'){
    const doc=await entry(path),native=plugin();if(native)return native.open({path,page,title});
    const data=await verified(await webStore('get',path),doc),url=URL.createObjectURL(new Blob([data],{type:'application/pdf'}));
    const anchor=root.document.createElement('a');anchor.href=url+'#page='+page;anchor.target='_blank';anchor.rel='noopener';anchor.textContent='Abrir PDF baixado';
    // Keep an explicit user gesture for browsers which block async window.open.
    const dialog=root.document.createElement('dialog');dialog.append(anchor);const close=root.document.createElement('button');close.textContent='Fechar';close.onclick=()=>{dialog.close();dialog.remove();URL.revokeObjectURL(url);};dialog.append(close);root.document.body.append(dialog);dialog.showModal();
  }
  async function controls(container,path,page=1,title='Biblioteca Servita'){
    container.replaceChildren();const info=root.document.createElement('p');info.setAttribute('role','status');info.textContent='Conferindo download…';container.append(info);
    try{
      const ready=await status(path);
      if(!container.isConnected)return;
      info.textContent=ready?'Disponível para uso offline.':'É preciso conexão para baixar este livro. Depois, ele abre sem internet.';
      const button=root.document.createElement('button');button.className='action-btn';button.textContent=ready?'Abrir PDF':'Baixar para uso offline';container.append(button);
      button.onclick=async()=>{
        button.disabled=true;
        try{if(ready)await open(path,page,title);else{info.textContent='Baixando e verificando SHA-256…';await download(path);await refresh();}}
        catch(error){info.textContent='Não foi possível concluir. Verifique a conexão ou o espaço disponível e tente novamente.';console.error('[Biblioteca]',error);}
        finally{button.disabled=false;}
      };
      if(ready){const erase=root.document.createElement('button');erase.className='action-btn';erase.textContent='Remover download';erase.onclick=async()=>{erase.disabled=true;button.disabled=true;try{await remove(path);await refresh();}catch(error){info.textContent='Não foi possível remover o download. Tente novamente.';erase.disabled=false;button.disabled=false;}};container.append(erase);}
    }catch(error){info.textContent='Não foi possível conferir os downloads. Tente novamente.';const retry=root.document.createElement('button');retry.textContent='Tentar novamente';retry.onclick=()=>controls(container,path,page,title);container.append(retry);}
  }
  async function refresh(){await Promise.all([...root.document.querySelectorAll('[data-library-path]')].map(el=>controls(el,el.dataset.libraryPath,Number(el.dataset.page)||1,el.dataset.title)));}
  function mount(){for(const el of root.document.querySelectorAll('[data-library-path]:not([data-library-bound])')){el.dataset.libraryBound='true';controls(el,el.dataset.libraryPath,Number(el.dataset.page)||1,el.dataset.title);}}
  async function openOrOffer(path,page,title){
    if(await status(path))return open(path,page,title);
    const dialog=root.document.createElement('dialog'),heading=root.document.createElement('h2');heading.textContent=title||'Biblioteca Servita';dialog.append(heading);
    const area=root.document.createElement('div');area.dataset.libraryPath=path;area.dataset.page=page;area.dataset.title=title||'Biblioteca Servita';dialog.append(area);
    const close=root.document.createElement('button');close.textContent='Fechar';close.onclick=()=>{dialog.close();dialog.remove();};dialog.append(close);root.document.body.append(dialog);dialog.showModal();mount();
  }
  root.OSMLibrary={valid,status,download,remove,open,openOrOffer,mount,controls};
  if(root.document){new MutationObserver(mount).observe(root.document.documentElement,{childList:true,subtree:true});mount();}
})(typeof window!=='undefined'?window:globalThis);
