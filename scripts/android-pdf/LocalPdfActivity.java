package com.liturgia_osm.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.pdf.PdfRenderer;
import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** One rendered page at a time bounds memory usage; Android supplies the PDF engine. */
public final class LocalPdfActivity extends Activity {
    private PdfRenderer renderer;
    private PageView pageView;
    private TextView position;
    private Button previous,next;
    private int pageIndex;
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private Button button(String text,String description,String tag){
        Button button=new Button(this);button.setText(text);button.setContentDescription(description);
        button.setTag(tag);button.setMinHeight(dp(48));button.setMinimumWidth(dp(48));return button;
    }
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        try {
            renderer=LocalPdfStore.open(this,getIntent().getStringExtra("path"));
            pageIndex=Math.max(0,Math.min(renderer.getPageCount()-1,state==null?getIntent().getIntExtra("page",1)-1:state.getInt("page")));
            LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.WHITE);
            // Respect display cutouts, gesture navigation and system bars on API 35+.
            root.setOnApplyWindowInsetsListener((view,insets)->{
                if(android.os.Build.VERSION.SDK_INT>=30){
                    android.graphics.Insets bars=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.displayCutout());
                    view.setPadding(bars.left,bars.top,bars.right,bars.bottom);
                }else view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
                return insets;
            });
            LinearLayout toolbar=new LinearLayout(this);toolbar.setGravity(Gravity.CENTER_VERTICAL);
            Button close=button("‹","Voltar ao aplicativo","pdf-close");close.setOnClickListener(view->finish());toolbar.addView(close,new LinearLayout.LayoutParams(dp(56),dp(56)));
            TextView title=new TextView(this);title.setText(getIntent().getStringExtra("title"));title.setTextColor(Color.BLACK);title.setTextSize(15);title.setMaxLines(2);
            toolbar.addView(title,new LinearLayout.LayoutParams(0,dp(56),1));
            Button less=button("−","Diminuir ampliação","pdf-zoom-out"),more=button("+","Aumentar ampliação","pdf-zoom-in");
            toolbar.addView(less,new LinearLayout.LayoutParams(dp(48),dp(56)));toolbar.addView(more,new LinearLayout.LayoutParams(dp(48),dp(56)));
            root.addView(toolbar);
            pageView=new PageView();pageView.setTag("pdf-page");root.addView(pageView,new LinearLayout.LayoutParams(-1,0,1));
            less.setOnClickListener(view->pageView.zoomBy(1/1.25f));more.setOnClickListener(view->pageView.zoomBy(1.25f));
            LinearLayout navigation=new LinearLayout(this);navigation.setGravity(Gravity.CENTER_VERTICAL);
            previous=button("‹ Anterior","Página anterior","pdf-previous");next=button("Próxima ›","Próxima página","pdf-next");
            position=new TextView(this);position.setTag("pdf-position");position.setGravity(Gravity.CENTER);position.setTextColor(Color.BLACK);position.setTextSize(13);
            navigation.addView(previous,new LinearLayout.LayoutParams(0,dp(56),1));navigation.addView(position,new LinearLayout.LayoutParams(0,dp(56),1));navigation.addView(next,new LinearLayout.LayoutParams(0,dp(56),1));root.addView(navigation);
            previous.setOnClickListener(view->{if(pageIndex>0){pageIndex--;renderPage();}});
            next.setOnClickListener(view->{if(pageIndex+1<renderer.getPageCount()){pageIndex++;renderPage();}});
            setContentView(root);renderPage();
            if(state!=null)pageView.zoomBy(state.getFloat("zoom",1));
        }catch(Exception error){
            new AlertDialog.Builder(this).setMessage("Não foi possível abrir este PDF local.").setPositiveButton("Voltar",(dialog,which)->finish()).setOnCancelListener(dialog->finish()).show();
        }
    }
    private void renderPage(){
        try(PdfRenderer.Page page=renderer.openPage(pageIndex)){
            int width=Math.min(1800,Math.max(800,Math.round(getResources().getDisplayMetrics().widthPixels*1.5f)));
            int height=Math.max(1,Math.round(width*(float)page.getHeight()/page.getWidth()));
            if(height>3000){width=Math.max(1,width*3000/height);height=3000;}
            Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);bitmap.eraseColor(Color.WHITE);
            page.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
            pageView.show(bitmap);position.setText("Página "+(pageIndex+1)+" de "+renderer.getPageCount());
            previous.setEnabled(pageIndex>0);next.setEnabled(pageIndex+1<renderer.getPageCount());
        }
    }
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putInt("page",pageIndex);if(pageView!=null)state.putFloat("zoom",pageView.zoom);}
    @Override protected void onDestroy(){if(pageView!=null)pageView.release();if(renderer!=null)renderer.close();super.onDestroy();}
    private final class PageView extends View {
        private Bitmap bitmap;
        private float zoom=1,panX,panY,lastX,lastY;
        private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
        private final ScaleGestureDetector scale;
        PageView(){super(LocalPdfActivity.this);setBackgroundColor(0xffe5e5e5);scale=new ScaleGestureDetector(getContext(),new ScaleGestureDetector.SimpleOnScaleGestureListener(){
            @Override public boolean onScale(ScaleGestureDetector detector){zoomBy(detector.getScaleFactor());return true;}
        });}
        void show(Bitmap value){Bitmap old=bitmap;bitmap=value;zoom=1;panX=panY=0;describe();invalidate();if(old!=null)old.recycle();}
        void zoomBy(float factor){zoom=Math.max(1,Math.min(4,zoom*factor));if(zoom==1)panX=panY=0;describe();invalidate();}
        void describe(){setContentDescription("PDF. Página "+(pageIndex+1)+". Ampliação "+Math.round(zoom*100)+"%. Use os botões para ampliar ou mudar de página.");}
        @Override protected void onDraw(Canvas canvas){
            super.onDraw(canvas);if(bitmap==null)return;
            float fit=Math.min((float)getWidth()/bitmap.getWidth(),(float)getHeight()/bitmap.getHeight());
            float width=bitmap.getWidth()*fit*zoom,height=bitmap.getHeight()*fit*zoom;
            panX=Math.max(-Math.max(0,(width-getWidth())/2),Math.min(panX,Math.max(0,(width-getWidth())/2)));
            panY=Math.max(-Math.max(0,(height-getHeight())/2),Math.min(panY,Math.max(0,(height-getHeight())/2)));
            float left=(getWidth()-width)/2+panX,top=(getHeight()-height)/2+panY;
            canvas.drawBitmap(bitmap,null,new RectF(left,top,left+width,top+height),paint);
        }
        @Override public boolean onTouchEvent(MotionEvent event){
            scale.onTouchEvent(event);
            if(event.getActionMasked()==MotionEvent.ACTION_DOWN){lastX=event.getX();lastY=event.getY();return true;}
            if(event.getActionMasked()==MotionEvent.ACTION_MOVE){if(!scale.isInProgress()&&event.getPointerCount()==1&&zoom>1){panX+=event.getX()-lastX;panY+=event.getY()-lastY;invalidate();}lastX=event.getX();lastY=event.getY();return true;}
            if(event.getActionMasked()==MotionEvent.ACTION_UP){performClick();return true;}
            return true;
        }
        @Override public boolean performClick(){super.performClick();return true;}
        void release(){if(bitmap!=null){bitmap.recycle();bitmap=null;}}
    }
}
