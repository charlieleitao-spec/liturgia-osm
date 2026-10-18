package com.liturgia_osm.app;

import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.net.Uri;
import android.widget.RemoteViews;
import org.json.*;
import java.util.*;
import java.io.*;

public class ServitaWidget extends AppWidgetProvider {
    public static JSONObject modelForDate(Context context, int month, int day) throws Exception {
        try (InputStream in = context.getAssets().open("santoral-widget.json")) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; int count;
            while ((count = in.read(buffer)) != -1) bytes.write(buffer, 0, count);
            JSONArray records = new JSONArray(bytes.toString("UTF-8"));
            for (int i=0; i<records.length(); i++) {
                JSONObject row = records.getJSONObject(i);
                if (row.getInt("month")==month && row.getInt("day")==day) return row;
            }
        }
        return new JSONObject().put("id", -1).put("name", "Sem celebração própria hoje").put("grade", "");
    }
    public static Intent openIntent(Context context, int id) {
        return new Intent(Intent.ACTION_VIEW, Uri.parse("liturgiaosm://celebracao/"+(id>=0?id:"hoje")), context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    }
    public static RemoteViews viewsForDate(Context context, boolean square, int month, int day) throws Exception {
        JSONObject row = modelForDate(context, month, day);
        RemoteViews views = new RemoteViews(context.getPackageName(), square?R.layout.servita_square:R.layout.servita_compact);
        views.setTextViewText(R.id.servita_name, row.getString("name"));
        views.setTextViewText(R.id.servita_grade, row.getString("grade"));
        views.setTextViewText(R.id.servita_date, String.format(new Locale("pt","BR"), "%02d/%02d · Família Servita",day,month));
        views.setOnClickPendingIntent(R.id.servita_root, PendingIntent.getActivity(context, row.getInt("id"), openIntent(context,row.getInt("id")), PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        return views;
    }
    public static void refresh(Context context) {
        AppWidgetManager manager=AppWidgetManager.getInstance(context);
        Calendar now=Calendar.getInstance(); boolean active=false;
        for (Class<?> provider : new Class<?>[]{ServitaWidget.class, ServitaSquareWidget.class}) {
            int[] ids=manager.getAppWidgetIds(new ComponentName(context,provider));
            if(ids.length==0)continue;
            active=true;
            try { manager.updateAppWidget(ids,viewsForDate(context,provider==ServitaSquareWidget.class,now.get(Calendar.MONTH)+1,now.get(Calendar.DAY_OF_MONTH))); }
            catch(Exception error){android.util.Log.e("ServitaWidget","Falha ao ler santoral local",error);}
        }
        AlarmManager alarm=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent next=PendingIntent.getBroadcast(context,9140,new Intent(context,ServitaWidget.class).setAction("com.liturgia_osm.WIDGET_DAY"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        if(active){now.add(Calendar.DATE,1);now.set(Calendar.HOUR_OF_DAY,0);now.set(Calendar.MINUTE,0);now.set(Calendar.SECOND,0);now.set(Calendar.MILLISECOND,0);alarm.set(AlarmManager.RTC,now.getTimeInMillis(),next);}else alarm.cancel(next);
    }
    @Override public void onReceive(Context context, Intent intent){super.onReceive(context,intent);refresh(context);}
}
