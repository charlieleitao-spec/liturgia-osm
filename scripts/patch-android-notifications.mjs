import fs from 'node:fs';
const file='android/app/src/main/AndroidManifest.xml';
let xml=fs.readFileSync(file,'utf8');
if(!xml.includes('xmlns:tools='))xml=xml.replace('<manifest ','<manifest xmlns:tools="http://schemas.android.com/tools" ');
for(const permission of ['POST_NOTIFICATIONS','RECEIVE_BOOT_COMPLETED']){
 if(!xml.includes(`android.permission.${permission}`))xml=xml.replace('</manifest>',`    <uses-permission android:name="android.permission.${permission}" />\n</manifest>`);
}
// Explicit merger removal: the plugin declares exact alarms in its own manifest.
for(const permission of ['SCHEDULE_EXACT_ALARM','USE_EXACT_ALARM']){
 xml=xml.replace(new RegExp(`<uses-permission\\b[^>]*android:name="android.permission.${permission}"[^>]*/>\\s*`,'g'),'');
 xml=xml.replace('</manifest>',`    <uses-permission android:name="android.permission.${permission}" tools:node="remove" />\n</manifest>`);
}
fs.writeFileSync(file,xml);
console.log('Notificações opcionais; permissões de alarmes exatos removidas.');
