package com.liturgia_osm.app;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Only downloads pinned documents declared by the packaged catalog. */
public final class LibraryDownloads {
    public static boolean isLibrary(String path) {
        return path != null && path.matches("data/pdfs/biblioteca/[a-z0-9-]+\\.pdf");
    }
    private static JSONObject entry(Context context, String path) throws Exception {
        if (!isLibrary(path)) throw new IOException("Documento inválido");
        try (InputStream in = context.getAssets().open("public/data/biblioteca-servita-catalogo.json")) {
            ByteArrayOutputStream bytes=new ByteArrayOutputStream(); byte[] buffer=new byte[4096]; int count;
            while((count=in.read(buffer))!=-1) bytes.write(buffer,0,count);
            JSONArray docs = new JSONObject(new String(bytes.toByteArray(), StandardCharsets.UTF_8)).getJSONArray("documents");
            for (int i=0; i<docs.length(); i++) {
                JSONObject doc=docs.getJSONObject(i);
                if (path.equals(doc.optString("download_path"))) {
                    JSONObject data=doc.getJSONObject("download");
                    String url=data.getString("url"), hash=data.getString("sha256");
                    if (!hash.matches("[a-f0-9]{64}") || data.getLong("bytes")<5 || data.getLong("bytes")>20000000 ||
                        !url.matches("https://raw\\.githubusercontent\\.com/charlieleitao-spec/liturgia-osm/[a-f0-9]{40}/www/"+path))
                        throw new IOException("Origem inválida");
                    return data;
                }
            }
        }
        throw new IOException("Documento não cadastrado");
    }
    private static File file(Context context, JSONObject data) {
        return new File(new File(context.getFilesDir(), "biblioteca"), data.optString("sha256")+".pdf");
    }
    private static String hex(byte[] bytes) {
        StringBuilder text=new StringBuilder();
        for (byte b:bytes) text.append(String.format(java.util.Locale.ROOT,"%02x",b & 255));
        return text.toString();
    }
    public static synchronized File local(Context context, String path) throws Exception {
        JSONObject data=entry(context,path); File f=file(context,data);
        if (!f.isFile() || f.length()!=data.getLong("bytes")) throw new IOException("Baixe o livro para uso offline");
        MessageDigest digest=MessageDigest.getInstance("SHA-256");
        try(InputStream in=new FileInputStream(f)) {
            byte[] buffer=new byte[16384]; int count;
            while((count=in.read(buffer))!=-1) digest.update(buffer,0,count);
        }
        if (!hex(digest.digest()).equals(data.getString("sha256"))) throw new IOException("Download inválido; baixe novamente");
        return f;
    }
    public static synchronized boolean status(Context context, String path) throws Exception {
        entry(context,path);
        try {local(context,path);return true;} catch(IOException missing) {return false;}
    }
    public static synchronized void remove(Context context, String path) throws Exception {
        File f=file(context,entry(context,path));
        if(f.exists()&&!f.delete()) throw new IOException("Não foi possível remover o download");
        // Remove any reader copy left by versions which opened packaged library PDFs.
        File legacy=new File(new File(context.getCacheDir(),"osm-pdfs"),path.replace('/','_'));
        if(legacy.exists()&&!legacy.delete()) throw new IOException("Não foi possível remover a cópia temporária");
    }
    public static synchronized void download(Context context, String path) throws Exception {
        JSONObject data=entry(context,path);
        if(status(context,path)) return;
        File target=file(context,data), directory=target.getParentFile();
        if(!directory.isDirectory()&&!directory.mkdirs()) throw new IOException("Armazenamento indisponível");
        File temporary=File.createTempFile("download-", ".tmp", directory);
        HttpsURLConnection connection=(HttpsURLConnection)new URL(data.getString("url")).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(15000);connection.setReadTimeout(20000);
        try {
            if(connection.getResponseCode()!=200) throw new IOException("Não foi possível baixar o livro. Verifique a conexão.");
            long expected=data.getLong("bytes"), total=0;
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            try(InputStream in=connection.getInputStream();FileOutputStream out=new FileOutputStream(temporary)) {
                byte[] buffer=new byte[16384];int count;
                while((count=in.read(buffer))!=-1) {
                    total+=count;
                    if(total>expected) throw new IOException("Tamanho do download inválido");
                    out.write(buffer,0,count);digest.update(buffer,0,count);
                }
                out.getFD().sync();
            }
            if(total!=expected || !hex(digest.digest()).equals(data.getString("sha256"))) throw new IOException("Falha de integridade SHA-256. Tente baixar novamente.");
            try(InputStream in=new FileInputStream(temporary)) {
                byte[] magic=new byte[5];
                if(in.read(magic)!=5 || !new String(magic,StandardCharsets.US_ASCII).equals("%PDF-")) throw new IOException("O arquivo recebido não é PDF");
            }
            // Same filesystem: incomplete files never become visible to the reader.
            android.system.Os.rename(temporary.getAbsolutePath(),target.getAbsolutePath());
        } finally {connection.disconnect();temporary.delete();}
    }
}
