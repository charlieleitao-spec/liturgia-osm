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
                if ("true".equals(evaluate("typeof adjustFont==='function' && typeof toggleFav==='function' && document.getElementById('view').innerText.length>20"))) {
                    ready = true; break;
                }
                Thread.sleep(1000);
            }
            if (!ready) throw new Exception("Release page not ready: " + evaluate("JSON.stringify({url:location.href,text:document.body.innerText,html:document.documentElement.outerHTML.slice(0,500)})"));
            if ("seed".equals(phase)) {
                String seeded = evaluate("(()=>{adjustFont(0.2);toggleTheme();toggleFav('prayer','rosario');addRecent('prayer','rosario','Rosário','Oração');localStorage.setItem('upgradeExpected',JSON.stringify({scale:localStorage.getItem('osmReaderScale'),theme:localStorage.getItem('osmTheme'),favorites:localStorage.getItem('osmFavoritesV4'),recent:localStorage.getItem('osmRecentV4')}));return isFav('prayer','rosario')})()");
                if (!"true".equals(seeded)) throw new Exception("Could not seed actual release settings");
            } else {
                String valid = evaluate("(()=>{const e=JSON.parse(localStorage.getItem('upgradeExpected')||'null');return APP_VERSION==='4.9.104' && !!e && e.scale===localStorage.getItem('osmReaderScale') && e.theme===localStorage.getItem('osmTheme') && e.favorites===localStorage.getItem('osmFavoritesV4') && e.recent===localStorage.getItem('osmRecentV4') && isFav('prayer','rosario') && Math.abs(readerScale-Number(e.scale))<0.001 && lightMode===(e.theme==='light')})()");
                if (!"true".equals(valid)) throw new Exception("Stored data or loaded preferences did not survive upgrade: " + evaluate("JSON.stringify({...localStorage})"));
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
