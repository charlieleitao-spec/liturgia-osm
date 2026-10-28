package com.liturgia_osm.validation;

import android.app.Activity;
import android.app.Instrumentation;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.graphics.Bitmap;
import android.graphics.pdf.PdfRenderer;
import android.widget.TextView;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Upgrade the actual signed release, then decode every optimized PDF offline. */
public final class AssetUpgradeInstrumentation extends Instrumentation {
    private String phase;
    private WebView webView;
    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        phase = args.getString("phase", "verify");
        start();
    }
    private WebView find(View view) {
        if (view instanceof WebView) return (WebView)view;
        if (view instanceof ViewGroup) {
            ViewGroup group=(ViewGroup)view;
            for(int i=0;i<group.getChildCount();i++) {
                WebView found=find(group.getChildAt(i));
                if(found!=null)return found;
            }
        }
        return null;
    }
    private String evaluate(String code) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);
        AtomicReference<String> result=new AtomicReference<>();
        runOnMainSync(()->webView.evaluateJavascript(code,value->{result.set(value);latch.countDown();}));
        if(!latch.await(10,TimeUnit.SECONDS))throw new Exception("JavaScript timeout");
        return result.get();
    }
    private void waitFor(String code) throws Exception {
        for(int attempt=0;attempt<60;attempt++) {
            if("true".equals(evaluate(code)))return;
            Thread.sleep(500);
        }
        throw new Exception("Condition failed: "+code);
    }
    @Override public void onStart() {
        Bundle result=new Bundle();
        try {
            Activity activity=startActivitySync(getTargetContext().getPackageManager()
                .getLaunchIntentForPackage("com.liturgia_osm.app")
                .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
            runOnMainSync(()->webView=find(activity.getWindow().getDecorView()));
            if(webView==null)throw new Exception("WebView not found");
            waitFor("typeof santoralReady!=='undefined' && santoralReady && oficiosReady && typeof adjustFont==='function'");
            if("seed".equals(phase)) {
                waitFor("APP_VERSION==='4.9.128'");
                evaluate("(()=>{adjustFont(.08);toggleTheme();if(!isFav('prayer','rosario'))toggleFav('prayer','rosario');addRecent('prayer','rosario','Rosário','Oração');localStorage.setItem('assetUpgradeExpected',JSON.stringify({scale:localStorage.getItem('osmReaderScale'),theme:localStorage.getItem('osmTheme'),favorites:localStorage.getItem('osmFavoritesV4'),recent:localStorage.getItem('osmRecentV4')}));return true;})()");
            } else {
                waitFor("APP_VERSION==='4.9.129'");
                waitFor("(()=>{const e=JSON.parse(localStorage.getItem('assetUpgradeExpected')||'null');return !!e && e.scale===localStorage.getItem('osmReaderScale') && e.theme===localStorage.getItem('osmTheme') && e.favorites===localStorage.getItem('osmFavoritesV4') && e.recent===localStorage.getItem('osmRecentV4') && isFav('prayer','rosario') && Math.abs(readerScale-Number(e.scale))<.001 && lightMode===(e.theme==='light');})()");
                evaluate("(()=>{const original=window.fetch.bind(window);window.externalAssetRequests=0;window.fetch=(input,...args)=>{const u=new URL(typeof input==='string'?input:input.url,location.href);if(u.origin!==location.origin){externalAssetRequests++;return Promise.reject(new Error('External network denied'));}return original(input,...args);};openGlobalSearch();})()");
                waitFor("!!globalSearchIndex && globalSearchIndex.documents.length===708 && globalSearchIndex.search('misericórdia').length>0 && externalAssetRequests===0");
                Class<?> store=getTargetContext().getClassLoader().loadClass("com.liturgia_osm.app.LocalPdfStore");
                java.lang.reflect.Method open=store.getMethod("open",android.content.Context.class,String.class);
                int files=0,pages=0;
                for(String directory:new String[]{"missal","oficios","biblioteca"}) {
                    for(String name:getTargetContext().getAssets().list("public/data/pdfs/"+directory)) {
                        if(!name.endsWith(".pdf"))continue;
                        try(PdfRenderer renderer=(PdfRenderer)open.invoke(null,getTargetContext(),"data/pdfs/"+directory+"/"+name)) {
                            files++;
                            for(int i=0;i<renderer.getPageCount();i++) {
                                try(PdfRenderer.Page page=renderer.openPage(i)) {
                                    Bitmap bitmap=Bitmap.createBitmap(192,Math.max(1,192*page.getHeight()/page.getWidth()),Bitmap.Config.ARGB_8888);
                                    page.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                                    bitmap.recycle();pages++;
                                }
                            }
                        }
                    }
                }
                if(files!=66||pages!=594)throw new Exception("PDF inventory: "+files+"/"+pages);
                ActivityMonitor monitor=addMonitor("com.liturgia_osm.app.LocalPdfActivity",null,false);
                String selected=evaluate("(()=>{const row=globalSearchIndex.search('Deus','PDFs').find(r=>r.doc.source.includes('/oficios/')&&r.doc.page===2);if(!row)return false;openSearchDocument(row.id);document.querySelector('#view a[href*=\".pdf\"]').click();return true;})()");
                if(!"true".equals(selected))throw new Exception("Search page 2 not found");
                Activity viewer=waitForMonitorWithTimeout(monitor,15000);
                if(viewer==null)throw new Exception("PDF viewer did not open");
                runOnMainSync(()->{
                    TextView position=viewer.getWindow().getDecorView().findViewWithTag("pdf-position");
                    if(position==null||!position.getText().toString().startsWith("Página 2 de "))throw new AssertionError("Wrong #page=2 destination");
                    viewer.finish();
                });
                removeMonitor(monitor);
                waitFor("externalAssetRequests===0");
                result.putInt("pdfFiles",files);result.putInt("pdfPages",pages);
            }
            result.putString("validation","PASS");result.putString("phase",phase);
            finish(Activity.RESULT_OK,result);
        } catch(Throwable error) {
            result.putString("validation","FAIL");result.putString("error",error.toString());
            finish(Activity.RESULT_CANCELED,result);
        }
    }
}
