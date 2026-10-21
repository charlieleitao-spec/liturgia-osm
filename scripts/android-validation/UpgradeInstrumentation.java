package com.liturgia_osm.validation;

import android.app.Activity;
import android.app.Instrumentation;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Exercises the unmodified, signed release through Android instrumentation. */
public final class UpgradeInstrumentation extends Instrumentation {
    private String phase;
    private WebView webView;
    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        phase = args.getString("phase", "verify");
        start();
    }
    private WebView find(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i=0; i<group.getChildCount(); i++) {
                WebView result = find(group.getChildAt(i));
                if (result != null) return result;
            }
        }
        return null;
    }
    private String evaluate(String code) throws Exception {
        CountDownLatch ready = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>();
        runOnMainSync(() -> webView.evaluateJavascript(code, result -> {
            value.set(result);
            ready.countDown();
        }));
        if (!ready.await(10, TimeUnit.SECONDS)) throw new Exception("WebView JavaScript timeout");
        return value.get();
    }
    @Override public void onStart() {
        Bundle result = new Bundle();
        try {
            Activity activity = startActivitySync(getTargetContext().getPackageManager()
                .getLaunchIntentForPackage("com.liturgia_osm.app")
                .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
            runOnMainSync(() -> webView = find(activity.getWindow().getDecorView()));
            if (webView == null) throw new Exception("Release WebView not found");
            boolean ready = false;
            for (int attempt=0; attempt<60; attempt++) {
                if ("true".equals(evaluate("typeof adjustFont==='function' && typeof toggleFav==='function' && typeof santoralReady!=='undefined' && santoralReady && oficiosReady && SANTORAL.length===32 && !document.getElementById('view').innerText.includes('Carregando os dados')"))) {
                    ready = true; break;
                }
                Thread.sleep(1000);
            }
            if (!ready) throw new Exception("Release page not ready: " + evaluate("JSON.stringify({url:location.href,text:document.body.innerText,html:document.documentElement.outerHTML.slice(0,500)})"));
            if ("seed".equals(phase)) {
                String seeded = evaluate("(()=>{adjustFont(0.2);toggleTheme();toggleFav('prayer','rosario');addRecent('prayer','rosario','Rosário','Oração');localStorage.setItem('upgradeExpected',JSON.stringify({scale:localStorage.getItem('osmReaderScale'),theme:localStorage.getItem('osmTheme'),favorites:localStorage.getItem('osmFavoritesV4'),recent:localStorage.getItem('osmRecentV4')}));return isFav('prayer','rosario')})()");
                if (!"true".equals(seeded)) throw new Exception("Could not seed actual release settings");
            } else {
                String valid = evaluate("(()=>{const e=JSON.parse(localStorage.getItem('upgradeExpected')||'null');return APP_VERSION==='4.9.109' && !!e && e.scale===localStorage.getItem('osmReaderScale') && e.theme===localStorage.getItem('osmTheme') && e.favorites===localStorage.getItem('osmFavoritesV4') && e.recent===localStorage.getItem('osmRecentV4') && isFav('prayer','rosario') && Math.abs(readerScale-Number(e.scale))<0.001 && lightMode===(e.theme==='light')})()");
                if (!"true".equals(valid)) throw new Exception("Stored data or loaded preferences did not survive upgrade: " + evaluate("JSON.stringify({...localStorage})"));
                // Both native providers must be discoverable by the launcher.
                long providerCount=android.appwidget.AppWidgetManager.getInstance(getTargetContext()).getInstalledProviders().stream()
                    .filter(p->p.provider.getPackageName().equals("com.liturgia_osm.app")).count();
                if(providerCount!=2)throw new Exception("Expected two widget sizes, got "+providerCount);
                Class<?> widget=getTargetContext().getClassLoader().loadClass("com.liturgia_osm.app.ServitaWidget");
                java.lang.reflect.Method model=widget.getMethod("modelForDate",android.content.Context.class,int.class,int.class);
                int[][] dates={{9,15},{2,17},{3,1}};
                String[] names={"Nossa Senhora das Dores","Sete Santos Fundadores","Sem celebração própria hoje"};
                for(int i=0;i<dates.length;i++){
                    org.json.JSONObject row=(org.json.JSONObject)model.invoke(null,getTargetContext(),dates[i][0],dates[i][1]);
                    if(!names[i].equals(row.getString("name")))throw new Exception("Widget date mismatch: "+row);
                    for(boolean square:new boolean[]{false,true}){
                        android.widget.RemoteViews views=(android.widget.RemoteViews)widget.getMethod("viewsForDate",android.content.Context.class,boolean.class,int.class,int.class)
                            .invoke(null,getTargetContext(),square,dates[i][0],dates[i][1]);
                        final String expected=names[i];
                        runOnMainSync(()->{
                            android.view.View view=views.apply(getTargetContext(),new android.widget.FrameLayout(getTargetContext()));
                            int nameId=getTargetContext().getResources().getIdentifier("servita_name","id","com.liturgia_osm.app");
                            if(!expected.contentEquals(((android.widget.TextView)view.findViewById(nameId)).getText()))throw new AssertionError("RemoteViews text mismatch");
                        });
                    }
                }
                android.content.Intent widgetIntent=(android.content.Intent)widget.getMethod("openIntent",android.content.Context.class,int.class).invoke(null,getTargetContext(),23);
                evaluate("window.widgetProbe={events:[],errors:[],present:!!window.OSMWidgetLinks,platform:window.Capacitor?.getPlatform?.()};window.addEventListener('error',e=>window.widgetProbe.errors.push(e.message));getCapacitorPlugin('App').addListener('appUrlOpen',e=>window.widgetProbe.events.push(e.url));");
                getTargetContext().startActivity(widgetIntent);
                boolean opened=false;
                for(int attempt=0;attempt<20;attempt++){
                    if("true".equals(evaluate("state.detailId===23"))){opened=true;break;}
                    Thread.sleep(500);
                }
                if(!opened)throw new Exception("Widget intent did not open the celebration: " + evaluate("JSON.stringify({probe:window.widgetProbe,detail:state.detailId,ready:santoralReady,widget:typeof window.OSMWidgetLinks,diagnostics:window.OSMWidgetLinks?.diagnostics(),parsed:(()=>{try{const u=new URL('liturgiaosm://celebracao/23');return [u.protocol,u.hostname,u.pathname]}catch(e){return String(e)}})()})"));
                String controls = evaluate("(()=>{const t=document.getElementById('reminderEnabled');return !!t && !t.disabled && !t.checked && !document.getElementById('reminderSettings').hidden})()");
                if (!"true".equals(controls)) throw new Exception("Reminder controls not ready: " + evaluate("document.body.innerText"));
                // Native plugin on the signed APK; Android permission granted by the test shell.
                evaluate("window.osmOriginalConfirm=window.confirm;window.confirm=()=>true;document.getElementById('reminderEnabled').click()");
                boolean enabled = false;
                for (int attempt=0; attempt<30; attempt++) {
                    if ("true".equals(evaluate("!document.getElementById('reminderEnabled').disabled && document.getElementById('reminderEnabled').checked && document.getElementById('reminderStatus').innerText.startsWith('Ativo')"))) { enabled=true;break; }
                    Thread.sleep(1000);
                }
                if (!enabled) throw new Exception("Native reminder activation failed: " + evaluate("document.getElementById('reminderStatus').innerText"));
                evaluate("window.osmPendingResult=null;getCapacitorPlugin('LocalNotifications').getPending().then(r=>{window.osmPendingResult=r.notifications.filter(n=>n.extra?.source==='osmDailyReminder').length}).catch(()=>window.osmPendingResult=-1)");
                Thread.sleep(2000);
                if (!"true".equals(evaluate("window.osmPendingResult>0"))) throw new Exception("No native celebrations scheduled");
                evaluate("document.getElementById('reminderEnabled').click();window.confirm=window.osmOriginalConfirm");
                boolean disabled = false;
                for (int attempt=0; attempt<30; attempt++) {
                    if ("true".equals(evaluate("!document.getElementById('reminderEnabled').disabled && !document.getElementById('reminderEnabled').checked && document.getElementById('reminderStatus').innerText.startsWith('Desligado')"))) { disabled=true;break; }
                    Thread.sleep(1000);
                }
                if (!disabled) throw new Exception("Native reminder cancellation failed");
                evaluate("window.osmPendingResult=null;getCapacitorPlugin('LocalNotifications').getPending().then(r=>{window.osmPendingResult=r.notifications.filter(n=>n.extra?.source==='osmDailyReminder').length})");
                Thread.sleep(2000);
                if (!"true".equals(evaluate("window.osmPendingResult===0"))) throw new Exception("Native reminders remain after switch off");

            }
            Thread.sleep(2000);
            result.putString("validation", "PASS");
            result.putString("phase", phase);
            finish(Activity.RESULT_OK, result);
        } catch (Throwable error) {
            result.putString("validation", "FAIL");
            result.putString("error", error.toString());
            finish(Activity.RESULT_CANCELED, result);
        }
    }
}
