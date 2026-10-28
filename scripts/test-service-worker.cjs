const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('www/sw.js','utf8');
async function run({cached,quota=false}){
 const handlers={};let network=0,globalLookup=0,puts=0;
 const fresh={ok:true,version:'network',clone(){return this;}};
 const cache={match:async()=>cached,put:async()=>{puts++;if(quota)throw new Error('QuotaExceededError');}};
 vm.runInNewContext(source,{URL,fetch:async()=>{network++;return fresh;},caches:{open:async name=>{assert.equal(name,'liturgia-osm-v4.9.129-personal-v1');return cache;},match:async()=>{globalLookup++;return {version:'stale'};}},self:{location:{origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn}});
 let response;
 handlers.fetch({request:{method:'GET',url:'https://example.test/app.js'},respondWith:p=>response=p});
 return {response:await response,network,globalLookup,puts};
}
(async()=>{
 const cached={version:'current'};
 const hit=await run({cached});assert.equal(hit.response,cached);assert.equal(hit.globalLookup,0);assert.equal(hit.network,0);
 const miss=await run({});assert.equal(miss.response.version,'network');assert.equal(miss.globalLookup,0);assert.equal(miss.puts,1);
 const quota=await run({quota:true});assert.equal(quota.response.version,'network');assert.equal(quota.puts,1);
 console.log('Service worker: cache da versão ativa, rede em falta de cache e resposta preservada sem espaço para gravar.');
})().catch(error=>{console.error(error);process.exitCode=1;});
