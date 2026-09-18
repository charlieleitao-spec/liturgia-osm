import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://osmliturgist-companion.lovable.app";
const OUTPUT = "www";
const queue = ["/", "/favicon.ico"];
const queued = new Set(queue);
const downloaded = new Set();

const textExtensions = new Set([".html", ".js", ".css", ".json", ".webmanifest", ".txt"]);
const assetPattern = /(?:["'(])((?:\/assets\/|\/santos\/)[^"'()\s]+|\.\/[^"'()\s]+\.(?:js|css|json|png|jpe?g|svg|webp|woff2?|ico))/g;

function cleanIndex(html) {
  return html
    .replaceAll("\0", "")
    .replace('<html lang="en">', '<html lang="pt-BR">')
    .replace(/<script defer src="\/~flock\.js"[^>]*><\/script>/g, "")
    .replace(/<style>[\s\S]*?#lovable-badge[\s\S]*?<\/style>/g, "")
    .replace(/<aside\s+id="lovable-badge"[\s\S]*?<\/aside>\s*<script>[\s\S]*?lovable-badge[\s\S]*?<\/script>/g, "");
}

function localPath(url) {
  const pathname = new URL(url, ORIGIN).pathname;
  return pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
}

function enqueueReferences(text, sourceUrl) {
  for (const match of text.matchAll(assetPattern)) {
    const resolved = new URL(match[1], sourceUrl);
    if (resolved.origin !== ORIGIN) continue;
    const pathname = resolved.pathname;
    if (!queued.has(pathname)) {
      queued.add(pathname);
      queue.push(pathname);
    }
  }

}

await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });

while (queue.length) {
  const pathname = queue.shift();
  if (downloaded.has(pathname)) continue;

  const url = new URL(pathname, ORIGIN).href;
  const response = await fetch(url, {
    headers: { "user-agent": "Liturgia-OSM-Android-Build/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  }

  const outputPath = path.join(OUTPUT, localPath(url));
  await mkdir(path.dirname(outputPath), { recursive: true });

  const extension = path.extname(new URL(url).pathname).toLowerCase();
  const contentType = response.headers.get("content-type") || "";
  const isText = pathname === "/" || textExtensions.has(extension) || contentType.startsWith("text/") || contentType.includes("javascript") || contentType.includes("json");

  if (isText) {
    let text = await response.text();
    if (pathname === "/") text = cleanIndex(text);
    enqueueReferences(text, url);
    await writeFile(outputPath, text, "utf8");
  } else {
    await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
  }

  downloaded.add(pathname);
  console.log(`Baixado: ${pathname}`);
}

const manifest = {
  name: "Liturgia OSM",
  short_name: "Liturgia OSM",
  start_url: "./",
  display: "standalone",
  background_color: "#15121c",
  theme_color: "#15121c",
  lang: "pt-BR",
};

await writeFile(path.join(OUTPUT, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));
console.log(`Aplicação Lovable preparada em ${OUTPUT}/ com ${downloaded.size} arquivos.`);
