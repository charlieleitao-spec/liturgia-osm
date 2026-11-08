package com.liturgia_osm.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name="LocalPdf")
public final class LocalPdfPlugin extends Plugin {
    private final java.util.concurrent.ExecutorService downloads=java.util.concurrent.Executors.newSingleThreadExecutor();
    @Override protected void handleOnDestroy(){downloads.shutdownNow();super.handleOnDestroy();}
    private void library(PluginCall call, String action) {
        downloads.execute(()->{
            try {
                String path=call.getString("path");
                if("download".equals(action)) LibraryDownloads.download(getContext(),path);
                if("remove".equals(action)) LibraryDownloads.remove(getContext(),path);
                JSObject result=new JSObject();result.put("downloaded",LibraryDownloads.status(getContext(),path));call.resolve(result);
            } catch(Exception error) {call.reject("Não foi possível acessar o livro. Verifique a conexão e tente novamente.",error);}
        });
    }
    @PluginMethod public void status(PluginCall call){library(call,"status");}
    @PluginMethod public void download(PluginCall call){library(call,"download");}
    @PluginMethod public void remove(PluginCall call){library(call,"remove");}

    @PluginMethod
    public void open(PluginCall call){
        String path=call.getString("path");
        if(path==null||!path.matches("data/pdfs/(missal|oficios|biblioteca)/[a-z0-9-]+\\.pdf")){
            call.reject("PDF local inválido");return;
        }
        try(java.io.InputStream input=LocalPdfStore.input(getContext(),path)){
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
