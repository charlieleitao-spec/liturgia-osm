package com.liturgia_osm.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name="LocalPdf")
public final class LocalPdfPlugin extends Plugin {
    @PluginMethod
    public void open(PluginCall call){
        String path=call.getString("path");
        if(path==null||!path.matches("data/pdfs/(missal|oficios|biblioteca)/[a-z0-9-]+\\.pdf")){
            call.reject("PDF local inválido");return;
        }
        try(java.io.InputStream input=getContext().getAssets().open("public/"+path)){
            getActivity().runOnUiThread(()->{
                try {
                    Intent intent=new Intent(getContext(),LocalPdfActivity.class);
                    intent.putExtra("path",path);
                    intent.putExtra("page",Math.max(1,call.getInt("page",1)));
                    intent.putExtra("title",call.getString("title","PDF oficial OSM"));
                    getActivity().startActivity(intent);
                    JSObject result=new JSObject();result.put("opened",true);call.resolve(result);
                }catch(Exception error){call.reject("Não foi possível abrir o leitor local",error);}
            });
        }catch(Exception error){call.reject("PDF não encontrado no aplicativo",error);}
    }
}
