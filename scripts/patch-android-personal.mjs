import fs from 'node:fs';
import path from 'node:path';

// Executado automaticamente pelo hook capacitor:sync:after, sem alterar workflows.
if (!process.env.CAPACITOR_PLATFORM_NAME || process.env.CAPACITOR_PLATFORM_NAME === 'android') {
  const target = 'android/app/src/main/java/com/liturgia_osm/app';
  const mainPath = path.join(target, 'MainActivity.java');
  let source = fs.readFileSync(mainPath, 'utf8');
  if (!source.includes('registerPlugin(PersonalBackupPlugin.class)')) {
    if (source.includes('super.onCreate(savedInstanceState);')) {
      source = source.replace('super.onCreate(savedInstanceState);', 'registerPlugin(PersonalBackupPlugin.class);\n        super.onCreate(savedInstanceState);');
    } else {
      source = source.replace(/(class MainActivity extends BridgeActivity\s*\{)/, '$1\n    @Override public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(PersonalBackupPlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n');
    }
    if (!source.includes('registerPlugin(PersonalBackupPlugin.class)')) throw new Error('Revisar registro do plugin de cópia pessoal no MainActivity.');
  }
  fs.copyFileSync(new URL('./android-personal/PersonalBackupPlugin.java', import.meta.url), path.join(target, 'PersonalBackupPlugin.java'));
  fs.writeFileSync(mainPath, source);
  console.log('Cópia pessoal Android integrada ao seletor de arquivos.');
}
