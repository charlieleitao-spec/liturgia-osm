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
// Plugin 8.3.1 restores missed one-shot alarms on boot. Expire our previous-day
// celebrations both during restore and delivery (including delays from Doze).
const native='node_modules/@capacitor/local-notifications/android/src/main/kotlin/com/capacitorjs/plugins/localnotifications/';
fs.writeFileSync(native+'ServitaNotificationGuard.kt',`package com.capacitorjs.plugins.localnotifications

internal object ServitaNotificationGuard {
    fun expired(notification: org.json.JSONObject?): Boolean {
        val extra = notification?.optJSONObject("extra") ?: return false
        if (extra.optString("source") != "osmDailyReminder") return false
        val date = extra.optString("celebrationDate")
        val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
        return date.isNotEmpty() && date < today
    }
}
`);
for(const [name,anchor,addition] of [
 ['LocalNotificationRestoreReceiver.kt','            val notification = storage.getSavedNotification(id) ?: continue',`            if (ServitaNotificationGuard.expired(storage.getSavedNotificationAsJSObject(id))) {
                storage.deleteNotification(id)
                continue
            }
`],
 ['TimedNotificationPublisher.kt','        LocalNotificationsPlugin.fireReceived(notificationJson)',`        if (ServitaNotificationGuard.expired(notificationJson)) {
            storage.deleteNotification(id.toString())
            return
        }
`]
]){
 const path=native+name;let source=fs.readFileSync(path,'utf8');
 if(!source.includes('ServitaNotificationGuard.expired')){
  if(!source.includes(anchor))throw new Error('Plugin alterado: revisar patch '+name);
  source=source.replace(anchor,addition+anchor);fs.writeFileSync(path,source);
 }
}
