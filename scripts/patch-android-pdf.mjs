import fs from 'node:fs';
const root='android/app/src/main';
const target=root+'/java/com/liturgia_osm/app/';
fs.mkdirSync(target,{recursive:true});
for(const name of ['LocalPdfStore','LocalPdfPlugin','LocalPdfActivity','LocalPdfPrintAdapter'])fs.copyFileSync('scripts/android-pdf/'+name+'.java',target+name+'.java');
let main=fs.readFileSync(target+'MainActivity.java','utf8');
if(!main.includes('registerPlugin(LocalPdfPlugin.class)')){
  if(/void onCreate\(/.test(main))main=main.replace('super.onCreate(savedInstanceState);','registerPlugin(LocalPdfPlugin.class);\n        super.onCreate(savedInstanceState);');
  else main=main.replace(/(class MainActivity extends BridgeActivity\s*\{)/,'$1\n    @Override public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(LocalPdfPlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n');
  if(!main.includes('registerPlugin(LocalPdfPlugin.class)'))throw new Error('Revisar registro do leitor PDF no MainActivity');
  fs.writeFileSync(target+'MainActivity.java',main);
}
const manifest=root+'/AndroidManifest.xml';let xml=fs.readFileSync(manifest,'utf8');
if(!xml.includes('.LocalPdfActivity'))xml=xml.replace('</application>','<activity android:name=".LocalPdfActivity" android:exported="false" />\n</application>');
fs.writeFileSync(manifest,xml);
fs.appendFileSync('android/app/proguard-rules.pro','\n-keep class com.liturgia_osm.app.LocalPdfActivity { *; }\n-keep class com.liturgia_osm.app.LocalPdfStore { *; }\n-keep class com.liturgia_osm.app.LocalPdfPrintAdapter { *; }\n');
console.log('Leitor PDF Android local: sem rede, dependência externa ou permissão de armazenamento.');
