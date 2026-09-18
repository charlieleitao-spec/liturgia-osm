import { copyFile, readFile, writeFile } from 'node:fs/promises';

const root = 'projeto/liturgia-osm-main';
const htmlPath = `${root}/santoral-osm-5-1 (7).html`;

let html = await readFile(htmlPath, 'utf8');
html = html
  .replace('4.5.1 — edição offline', '4.5.2 — edição offline')
  .replace(
    '<a class="social-link" href="https://youtube.com/@savosmbrasil?si=Pcn71bJ212PwwLuY" target="_blank" rel="noopener noreferrer">',
    '<a class="social-link" href="https://www.youtube.com/@savosmbrasil" onclick="return openExternalLink(event, this.href)">'
  )
  .replace(
    '<a class="social-link" href="https://www.instagram.com/ordem.servitas?igsh=OHI4cGg3c3l2NGIx&igsi=OHI4cGg3c3l2NGIx" target="_blank" rel="noopener noreferrer">',
    '<a class="social-link" href="https://www.instagram.com/ordem.servitas/" onclick="return openExternalLink(event, this.href)">'
  )
  .replace(
    '\nfunction render(){',
    `\nfunction openExternalLink(event, url){
  if(event) event.preventDefault();
  window.location.assign(url);
  return false;
}

function render(){`
  );
await writeFile(htmlPath, html);

for (const file of ['package.json', 'package-lock.json']) {
  const path = `${root}/${file}`;
  const value = (await readFile(path, 'utf8')).replaceAll('4.5.1', '4.5.2');
  await writeFile(path, value);
}

const gradlePath = `${root}/android/app/build.gradle`;
let gradle = await readFile(gradlePath, 'utf8');
gradle = gradle.replace('versionCode 46', 'versionCode 47').replace('versionName "4.5.1"', 'versionName "4.5.2"');
await writeFile(gradlePath, gradle);

const swPath = `${root}/sw.js`;
let sw = await readFile(swPath, 'utf8');
sw = sw.replace('liturgia-osm-v4.5.1-offline', 'liturgia-osm-v4.5.2-offline');
await writeFile(swPath, sw);

await copyFile('icon-512-v452.png', `${root}/icon-512.png`);
await copyFile('icon-192-v452.png', `${root}/icon-192.png`);

const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
for (const density of densities) {
  const dir = `${root}/android/app/src/main/res/mipmap-${density}`;
  await copyFile('icon-512-v452.png', `${dir}/ic_launcher.png`);
  await copyFile('icon-512-v452.png', `${dir}/ic_launcher_round.png`);
  await copyFile('icon-512-v452.png', `${dir}/ic_launcher_foreground.png`);
}

console.log('Correções 4.5.2 aplicadas.');
