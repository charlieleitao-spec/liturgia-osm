package com.liturgia_osm.app;

import android.content.Context;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.IOException;

/** Opens packaged PDFs or verified persistent library downloads. */
public final class LocalPdfStore {
    public static InputStream input(Context context, String path) throws IOException {
        if (LibraryDownloads.isLibrary(path)) {
            try {return new java.io.FileInputStream(LibraryDownloads.local(context,path));}
            catch(Exception error) {throw new IOException(error);}
        }
        if(path==null || !path.matches("data/pdfs/(missal|oficios)/[a-z0-9-]+\\.pdf")) throw new IOException("PDF local inválido");
        return context.getAssets().open("public/"+path);
    }
    public static PdfRenderer open(Context context, String path) throws IOException {
        if (LibraryDownloads.isLibrary(path)) {
            ParcelFileDescriptor descriptor=null;
            try {
                descriptor=ParcelFileDescriptor.open(LibraryDownloads.local(context,path),ParcelFileDescriptor.MODE_READ_ONLY);
                return new PdfRenderer(descriptor);
            } catch(Exception error) {
                if(descriptor!=null)descriptor.close();
                throw new IOException(error);
            }
        }
        if(path==null || !path.matches("data/pdfs/(missal|oficios|biblioteca)/[a-z0-9-]+\\.pdf"))
            throw new IOException("PDF local inválido");
        File directory=new File(context.getCacheDir(),"osm-pdfs");
        if(!directory.isDirectory()&&!directory.mkdirs())throw new IOException("Cache indisponível");
        File temporary=File.createTempFile("pdf-", ".tmp", directory);
        File file=new File(directory,path.replace('/', '_'));
        try {
            try(InputStream input=input(context,path);
                FileOutputStream output=new FileOutputStream(temporary)){
                byte[] buffer=new byte[16384];int read;
                while((read=input.read(buffer))!=-1)output.write(buffer,0,read);
            }
            if(file.exists()&&!file.delete())throw new IOException("Falha ao atualizar PDF local");
            if(!temporary.renameTo(file))throw new IOException("Falha ao preparar PDF local");
            ParcelFileDescriptor descriptor=ParcelFileDescriptor.open(file,ParcelFileDescriptor.MODE_READ_ONLY);
            try {return new PdfRenderer(descriptor);}
            catch(IOException|RuntimeException error){descriptor.close();throw error;}
        } finally {temporary.delete();}
    }
}
