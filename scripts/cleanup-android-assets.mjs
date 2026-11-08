// Capacitor generates unused empty compatibility placeholders during every sync.
import fs from 'node:fs';
import path from 'node:path';
if (!process.env.CAPACITOR_PLATFORM_NAME || process.env.CAPACITOR_PLATFORM_NAME === 'android') {
  const directory = 'android/app/src/main/assets/public';
  const placeholders = ['cordova.js', 'cordova_plugins.js'];
  for (const name of placeholders) {
    const target = path.join(directory, name);
    if (!fs.existsSync(target)) continue;
    if (fs.statSync(target).size !== 0) throw new Error('Compatibility asset is no longer empty; review before removal: '+name);
    fs.unlinkSync(target);
  }
  console.log('Empty compatibility placeholders removed from the Android package.');
}
