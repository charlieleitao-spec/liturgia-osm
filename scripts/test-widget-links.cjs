const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{
 let listener,opened=[];
 const window={Capacitor:{getPlatform:()=> 'android',Plugins:{App:{addListener:(name,fn)=>{listener=fn;return {remove(){}};},getLaunchUrl:async()=>({url:'liturgiaosm://celebracao/23'})}}}};
 vm.runInNewContext(fs.readFileSync('www/widget-links.js','utf8'),{window,URL,console});
 window.OSMWidgetLinks.init();await new Promise(r=>setImmediate(r));
 assert.equal(opened.length,0);
 window.OSMWidgetLinks.setData([{id:23},{id:3}],id=>opened.push(id));assert.deepEqual(opened,[23]);
 listener({url:'liturgiaosm://celebracao/3'});assert.deepEqual(opened,[23,3]);
 for(const url of ['https://celebracao/23','liturgiaosm://wrong/23','liturgiaosm://celebracao/999','liturgiaosm://celebracao/hoje','liturgiaosm://celebracao/3x'])listener({url});
 assert.deepEqual(opened,[23,3]);
 console.log('Widget: abertura fria enfileirada, toque com app aberto e rejeição de links inválidos OK.');
})();
