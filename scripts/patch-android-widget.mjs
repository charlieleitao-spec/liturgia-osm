import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {buildNotifications}=require('../www/reminders.js');
const root='android/app/src/main';
const put=(name,text)=>{const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);};
const saints=JSON.parse(fs.readFileSync('www/data/santoral.json','utf8'));
const rows=saints.map(s=>{
  // Reuse the approved reminder wording, including title/selo exceptions.
  const n=buildNotifications([s],'07:00',new Date(2024,s.month-1,s.day,0))[0];
  if(!n)throw new Error('Celebração não exportada: '+s.id);
  const [name,grade='']=n.body.split(' · ');
  return {id:s.id,month:s.month,day:s.day,name,grade,categoria:s.categoria,genero:s.genero,exibir_selo:s.exibir_selo!==false};
});
put('assets/santoral-widget.json',JSON.stringify(rows));
for(const name of ['ServitaWidget','ServitaSquareWidget'])put(`java/com/liturgia_osm/app/${name}.java`,fs.readFileSync(`scripts/android-widget/${name}.java`,'utf8'));
put('res/drawable/servita_widget_background.xml','<shape xmlns:android="http://schemas.android.com/apk/res/android"><solid android:color="#15121c"/><corners android:radius="16dp"/><stroke android:width="1dp" android:color="#b89b52"/></shape>');
for(const square of [false,true]){
 const kind=square?'square':'compact';
 put(`res/layout/servita_${kind}.xml`,`<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/servita_root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:gravity="center_vertical" android:padding="${square?12:8}dp" android:background="@drawable/servita_widget_background">
<TextView android:id="@+id/servita_date" android:layout_width="match_parent" android:layout_height="wrap_content" android:text="Família Servita" android:textColor="#d3b76b" android:textSize="11sp" android:maxLines="1"/>
<TextView android:id="@+id/servita_name" android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1" android:gravity="center_vertical" android:text="Celebração do dia" android:textColor="#fff9e9" android:textSize="${square?16:14}sp" android:textStyle="bold" android:maxLines="${square?5:2}" android:ellipsize="end"/>
<TextView android:id="@+id/servita_grade" android:layout_width="match_parent" android:layout_height="wrap_content" android:textColor="#d3b76b" android:textSize="12sp" android:maxLines="1" android:ellipsize="end"/>
</LinearLayout>`);
 put(`res/xml/servita_${kind}_info.xml`,`<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="${square?110:250}dp" android:minHeight="${square?110:60}dp" android:targetCellWidth="${square?2:4}" android:targetCellHeight="${square?2:1}" android:initialLayout="@layout/servita_${kind}" android:previewLayout="@layout/servita_${kind}" android:resizeMode="horizontal|vertical" android:updatePeriodMillis="1800000" android:widgetCategory="home_screen"/>`);
}
const manifest=path.join(root,'AndroidManifest.xml');let xml=fs.readFileSync(manifest,'utf8');
xml=xml.replace(/\s*<!-- SERVITA WIDGET BEGIN -->[\s\S]*?<!-- SERVITA WIDGET END -->/g,'');
const receivers=['ServitaWidget','ServitaSquareWidget'].map((name,i)=>`<receiver android:name=".${name}" android:label="Família Servita ${i?'2×2':'4×1'}" android:exported="false"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE"/><action android:name="android.intent.action.BOOT_COMPLETED"/><action android:name="android.intent.action.TIME_SET"/><action android:name="android.intent.action.TIMEZONE_CHANGED"/><action android:name="android.intent.action.MY_PACKAGE_REPLACED"/></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/servita_${i?'square':'compact'}_info"/></receiver>`).join('\n');
xml=xml.replace('</application>',`<!-- SERVITA WIDGET BEGIN -->\n${receivers}\n<!-- SERVITA WIDGET END -->\n</application>`);
if(!xml.includes('android.permission.RECEIVE_BOOT_COMPLETED'))xml=xml.replace('<application','<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>\n<application');
fs.writeFileSync(manifest,xml);
// Explicit widget intents do not require a public URL handler.
fs.appendFileSync('android/app/proguard-rules.pro','\n-keep class com.liturgia_osm.app.ServitaWidget { *; }\n-keep class com.liturgia_osm.app.ServitaSquareWidget { *; }\n');
console.log('Widgets 4x1 e 2x2:',rows.length,'celebrações locais.');
