package com.liturgia_osm.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Acesso apenas ao documento escolhido pelo usuário; sem permissão de armazenamento. */
@CapacitorPlugin(name="PersonalBackup")
public final class PersonalBackupPlugin extends Plugin {
    private static final int MAX_BYTES = 2 * 1024 * 1024;

    @PluginMethod
    public void save(PluginCall call) {
        String content = call.getString("content");
        String filename = call.getString("filename", "liturgia-osm-pessoal.json");
        if (content == null || content.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES
                || !filename.matches("liturgia-osm-pessoal(?:-[0-9-]+)?\\.json")) {
            call.reject("Cópia pessoal inválida ou maior que 2 MB."); return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        try { startActivityForResult(call, intent, "saveResult"); }
        catch (Exception error) { call.reject("Não foi possível escolher o destino da cópia.", error); }
    }

    @PluginMethod
    public void read(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*"); // Provedores de arquivos podem identificar JSON como texto ou binário.
        try { startActivityForResult(call, intent, "readResult"); }
        catch (Exception error) { call.reject("Não foi possível escolher a cópia.", error); }
    }

    private Uri chosen(PluginCall call, ActivityResult result) {
        if (call == null) return null;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null
                || result.getData().getData() == null) {
            JSObject cancelled = new JSObject(); cancelled.put("cancelled", true); call.resolve(cancelled); return null;
        }
        return result.getData().getData();
    }

    @ActivityCallback
    private void saveResult(PluginCall call, ActivityResult result) {
        Uri uri = chosen(call, result); if (uri == null) return;
        new Thread(() -> {
            try (OutputStream out = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new java.io.IOException("Destino indisponível");
                out.write(call.getString("content", "").getBytes(StandardCharsets.UTF_8));
                out.flush();
            } catch (Exception error) { call.reject("Não foi possível salvar a cópia. Escolha outro destino.", error); return; }
            JSObject saved = new JSObject(); saved.put("saved", true); call.resolve(saved);
        }, "osm-personal-export").start();
    }

    @ActivityCallback
    private void readResult(PluginCall call, ActivityResult result) {
        Uri uri = chosen(call, result); if (uri == null) return;
        new Thread(() -> {
            try (InputStream in = getContext().getContentResolver().openInputStream(uri);
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                if (in == null) throw new java.io.IOException("Arquivo indisponível");
                byte[] buffer = new byte[8192]; int count;
                while ((count = in.read(buffer)) != -1) {
                    if (out.size() + count > MAX_BYTES) { call.reject("Arquivo muito grande. Limite de 2 MB."); return; }
                    out.write(buffer, 0, count);
                }
                JSObject loaded = new JSObject(); loaded.put("content", out.toString(StandardCharsets.UTF_8.name())); call.resolve(loaded);
            } catch (Exception error) { call.reject("Não foi possível ler a cópia escolhida.", error); }
        }, "osm-personal-import").start();
    }
}
