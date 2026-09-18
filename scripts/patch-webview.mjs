import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const target = path.join(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "liturgia_osm",
  "app",
  "MainActivity.java",
);

const source = `package com.liturgia_osm.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebSettings settings = getBridge().getWebView().getSettings();
        String userAgent = settings.getUserAgentString();
        if (userAgent != null) {
            settings.setUserAgentString(
                userAgent
                    .replace("; wv", "")
                    .replace(" Version/4.0", "")
            );
        }

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
    }
}
`;

await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, source, "utf8");
console.log("Compatibilidade do WebView aplicada.");
