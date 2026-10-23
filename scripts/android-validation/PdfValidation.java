package com.liturgia_osm.validation;

import android.app.Activity;
import android.app.Instrumentation;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.view.View;
import android.widget.TextView;
import java.lang.reflect.Method;

final class PdfValidation {
    interface JavaScript { String evaluate(String code) throws Exception; }
    static void verify(Instrumentation instrumentation,JavaScript javascript) throws Exception {
        // Decode every bundled page using the same engine as the real reader.
        Class<?> store=instrumentation.getTargetContext().getClassLoader().loadClass("com.liturgia_osm.app.LocalPdfStore");
        Method open=store.getMethod("open",android.content.Context.class,String.class);
        int files=0,pages=0;
        for(String directory:new String[]{"missal","oficios"}){
            for(String file:instrumentation.getTargetContext().getAssets().list("public/data/pdfs/"+directory)){
                if(!file.endsWith(".pdf"))continue;
                try(PdfRenderer renderer=(PdfRenderer)open.invoke(null,instrumentation.getTargetContext(),"data/pdfs/"+directory+"/"+file)){
                    files++;
                    for(int index=0;index<renderer.getPageCount();index++){
                        try(PdfRenderer.Page page=renderer.openPage(index)){
                            Bitmap bitmap=Bitmap.createBitmap(192,Math.max(1,192*page.getHeight()/page.getWidth()),Bitmap.Config.ARGB_8888);bitmap.eraseColor(Color.WHITE);
                            page.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                            boolean ink=false;
                            for(int y=0;y<bitmap.getHeight()&&!ink;y+=2)for(int x=0;x<bitmap.getWidth();x+=2)if((bitmap.getPixel(x,y)&0xffffff)!=0xffffff){ink=true;break;}
                            bitmap.recycle();if(!ink)throw new Exception("Blank Android PDF page: "+file+" #"+(index+1));pages++;
                        }
                    }
                }
            }
        }
        if(files!=63||pages!=342)throw new Exception("PDF inventory mismatch: "+files+"/"+pages);
        // Click the actual Mass button and verify native rendering/navigation/zoom/return.
        Instrumentation.ActivityMonitor monitor=instrumentation.addMonitor("com.liturgia_osm.app.LocalPdfActivity",null,false);
        javascript.evaluate("openLiturgiaDetail('missa',0);document.querySelector('#view .proper-mass-reader a[href*=\".pdf\"]').click()");
        Activity viewer=instrumentation.waitForMonitorWithTimeout(monitor,15000);
        if(viewer==null)throw new Exception("Mass PDF button did not open native viewer");
        assertPosition(instrumentation,viewer,1);
        instrumentation.waitForIdleSync();
        instrumentation.runOnMainSync(()->{
            int minimum=Math.round(48*viewer.getResources().getDisplayMetrics().density);
            for(String tag:new String[]{"pdf-close","pdf-zoom-out","pdf-zoom-in","pdf-previous","pdf-next"}){
                View control=viewer.getWindow().getDecorView().findViewWithTag(tag);
                if(!(control instanceof android.widget.ImageButton)||control.getWidth()<minimum||control.getHeight()<minimum||control.getElevation()!=0||control.getContentDescription()==null)
                    throw new AssertionError("PDF control style, touch area or label: "+tag);
            }
            if(viewer.getWindow().getDecorView().findViewWithTag("pdf-previous").isEnabled())throw new AssertionError("Previous must be disabled on first page");
        });
        screenshot(instrumentation,"pdf-reader-first.png");
        instrumentation.runOnMainSync(()->viewer.getWindow().getDecorView().findViewWithTag("pdf-next").performClick());
        assertPosition(instrumentation,viewer,2);
        instrumentation.runOnMainSync(()->viewer.getWindow().getDecorView().findViewWithTag("pdf-zoom-in").performClick());
        instrumentation.runOnMainSync(()->{
            View page=viewer.getWindow().getDecorView().findViewWithTag("pdf-page");
            if(!page.getContentDescription().toString().contains("125%"))throw new AssertionError("Zoom control failed");
        });
        screenshot(instrumentation,"pdf-reader-zoom.png");
        instrumentation.runOnMainSync(()->{
            viewer.getWindow().getDecorView().findViewWithTag("pdf-zoom-out").performClick();
            if(!viewer.getWindow().getDecorView().findViewWithTag("pdf-page").getContentDescription().toString().contains("100%"))throw new AssertionError("Zoom out failed");
            viewer.getWindow().getDecorView().findViewWithTag("pdf-previous").performClick();
        });
        assertPosition(instrumentation,viewer,1);
        instrumentation.runOnMainSync(()->{
            viewer.getWindow().getDecorView().findViewWithTag("pdf-close").performClick();
        });
        instrumentation.waitForIdleSync();instrumentation.removeMonitor(monitor);
        // Search result must open the local office at its precise PDF page.
        monitor=instrumentation.addMonitor("com.liturgia_osm.app.LocalPdfActivity",null,false);
        String selected=javascript.evaluate("(()=>{const result=globalSearchIndex.search('Deus','PDFs').find(row=>row.doc.source.includes('/oficios/')&&row.doc.page===2);openGlobalSearch();openSearchDocument(result.id);document.querySelector('#view a[href*=\".pdf\"]').click();return result.doc.page;})()");
        if(!"2".equals(selected))throw new Exception("Expected office search page 2");
        Activity office=instrumentation.waitForMonitorWithTimeout(monitor,15000);
        if(office==null)throw new Exception("Search PDF button did not open native viewer");
        assertPosition(instrumentation,office,2);
        instrumentation.runOnMainSync(office::finish);instrumentation.waitForIdleSync();instrumentation.removeMonitor(monitor);
        if(!"true".equals(javascript.evaluate("!location.pathname.endsWith('.pdf') && externalSearchRequests===0")))throw new Exception("PDF opening navigated WebView or used external network");
        System.out.println("PASS: 63 PDFs / 342 pages decoded by Android; Mass and Office/search opened offline; five flat icon buttons with 48dp touch targets; previous/next, zoom in/out and return passed; native screenshots saved.");
    }
    private static void screenshot(Instrumentation instrumentation,String name) throws Exception {
        instrumentation.waitForIdleSync();Thread.sleep(400);
        Bitmap bitmap=instrumentation.getUiAutomation().takeScreenshot();
        if(bitmap==null)throw new Exception("Native PDF screenshot unavailable");
        try(java.io.FileOutputStream output=new java.io.FileOutputStream(new java.io.File(instrumentation.getTargetContext().getFilesDir(),name))){
            if(!bitmap.compress(Bitmap.CompressFormat.PNG,100,output))throw new Exception("Could not save native PDF screenshot");
        }finally{bitmap.recycle();}
    }
    private static void assertPosition(Instrumentation instrumentation,Activity viewer,int page){
        instrumentation.runOnMainSync(()->{
            TextView position=viewer.getWindow().getDecorView().findViewWithTag("pdf-position");
            if(position==null||!position.getText().toString().startsWith("Página "+page+" de "))throw new AssertionError("Wrong PDF page: "+(position==null?"missing":position.getText()));
        });
    }
}
