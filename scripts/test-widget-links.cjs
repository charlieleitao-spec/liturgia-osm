const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{
 let listener,opened=[];
 const app={addListener:(name,fn)=>{listener=fn;return {remove(){}};},getLaunchUrl:async()=>({url:'liturgiaosm://celebracao/23'})};
 const window={Capacitor:{getPlatform:()=> 'android',registerPlugin:name=>{assert.equal(name,'App');return app;}}};
 vm.runInNewContext(fs.readFileSync('www/widget-links.js','utf8'),{window,URL:class {constructor(){throw new Error('Custom schemes cannot rely on WebView URL parsing');}},console,getCapacitorPlugin:name=>window.Capacitor.Plugins?.[name]||window.Capacitor.registerPlugin(name)});
 window.OSMWidgetLinks.init();await new Promise(r=>setImmediate(r));
 assert.equal(opened.length,0);
 window.OSMWidgetLinks.setData([{id:23},{id:3}],id=>opened.push(id));assert.deepEqual(opened,[23]);
 listener({url:'liturgiaosm://celebracao/3'});assert.deepEqual(opened,[23,3]);
 for(const url of ['https://celebracao/23','liturgiaosm://wrong/23','liturgiaosm://celebracao/999','liturgiaosm://celebracao/hoje','liturgiaosm://celebracao/3x','liturgiaosm://celebracao/3?x=1','liturgiaosm://celebracao/3#x','liturgiaosm://evil@celebracao/3'])listener({url});
 assert.deepEqual(opened,[23,3]);
 console.log('Widget: abertura fria enfileirada, toque com app aberto e rejeição de links inválidos OK.');
})();
