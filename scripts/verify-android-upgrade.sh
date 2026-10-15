#!/usr/bin/env bash
set -euo pipefail
mkdir -p validation-results
exec > >(tee validation-results/upgrade.log) 2>&1
PACKAGE=com.liturgia_osm.app
DATA=/data/user/0/$PACKAGE
adb root
adb wait-for-device
adb install baseline/Liturgia-OSM-4.9.85.apk
adb shell am start -W -n "$PACKAGE/.MainActivity"
sleep 12
adb shell uiautomator dump /sdcard/window.xml
adb pull /sdcard/window.xml validation-results/before.xml
# Change a genuine reading preference through the installed release UI.
read -r X Y < <(python3 - <<'PY'
import xml.etree.ElementTree as ET
import re
tree = ET.parse('validation-results/before.xml')
for node in tree.iter('node'):
    if 'Aumentar fonte' in node.get('content-desc', '') or node.get('text') == 'A+':
        x1,y1,x2,y2 = map(int,re.findall(r'\d+',node.get('bounds')))
        print((x1+x2)//2,(y1+y2)//2)
        break
else:
    raise SystemExit('Reading font control not found in baseline app')
PY
)
adb shell input tap "$X" "$Y"
sleep 3
adb shell am force-stop "$PACKAGE"
adb shell "test -d '$DATA/app_webview/Default/Local Storage/leveldb'"
adb shell "mkdir -p '$DATA/files'; echo upgrade-4.9.85-to-4.9.86 > '$DATA/files/upgrade-preservation-check.txt'"
adb shell "cd '$DATA'; find app_webview/Default/'Local Storage' files shared_prefs -type f -exec sha256sum {} \; | sort" > validation-results/data-before.sha256
adb shell dumpsys package "$PACKAGE" > validation-results/package-before.txt
adb pull "$DATA/app_webview/Default/Local Storage" validation-results/storage-before
python3 - <<'PY'
from pathlib import Path
raw=b''.join(p.read_bytes() for p in Path('validation-results/storage-before').rglob('*') if p.is_file())
assert b'osmReaderScale' in raw or b'santoral-osm-fontsize' in raw, 'Real reading preference missing from WebView storage'
PY
adb install -r Liturgia-OSM-4.9.86.apk
adb shell "cd '$DATA'; find app_webview/Default/'Local Storage' files shared_prefs -type f -exec sha256sum {} \; | sort" > validation-results/data-after.sha256
diff -u validation-results/data-before.sha256 validation-results/data-after.sha256
adb shell dumpsys package "$PACKAGE" > validation-results/package-after.txt
grep -q 'versionCode=40990' validation-results/package-after.txt
grep -q 'versionName=4.9.86' validation-results/package-after.txt
BEFORE_UID=$(sed -n 's/.*userId=\([0-9]*\).*/\1/p' validation-results/package-before.txt | head -1)
AFTER_UID=$(sed -n 's/.*userId=\([0-9]*\).*/\1/p' validation-results/package-after.txt | head -1)
test -n "$BEFORE_UID" && test "$BEFORE_UID" = "$AFTER_UID"
adb logcat -c
adb shell am start -W -n "$PACKAGE/.MainActivity"
sleep 12
adb shell pidof "$PACKAGE"
adb shell uiautomator dump /sdcard/window.xml
adb pull /sdcard/window.xml validation-results/after.xml
grep -q 'Aumentar fonte\|Liturgia\|Santoral' validation-results/after.xml
adb shell "cat '$DATA/files/upgrade-preservation-check.txt'" | tr -d '\r' | grep -qx 'upgrade-4.9.85-to-4.9.86'
adb logcat -d > validation-results/logcat.txt
if grep -q 'FATAL EXCEPTION' validation-results/logcat.txt; then exit 1; fi
adb exec-out screencap -p > validation-results/after.png
echo 'PASS: signed release upgrade 4.9.85 -> 4.9.86; UID, WebView localStorage, shared preferences and app files preserved; updated app launched.'
