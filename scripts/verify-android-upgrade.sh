#!/usr/bin/env bash
set -euo pipefail
mkdir -p validation-results
exec > >(tee validation-results/upgrade.log) 2>&1
PACKAGE=com.liturgia_osm.app
DATA=/data/user/0/$PACKAGE
adb root
adb wait-for-device
adb install baseline/Liturgia-OSM-4.9.102.apk
trap 'adb logcat -d > validation-results/logcat.txt; adb exec-out screencap -p > validation-results/after.png' EXIT
TEST_APK=android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk
adb install -t "$TEST_APK"
adb shell am instrument -w -e phase seed com.liturgia_osm.app.test/com.liturgia_osm.validation.UpgradeInstrumentation | tee validation-results/seed.txt
grep -q 'validation=PASS' validation-results/seed.txt
adb shell am force-stop "$PACKAGE"
adb shell "test -d '$DATA/app_webview/Default/Local Storage/leveldb'"
adb shell "mkdir -p '$DATA/files'; echo upgrade-4.9.102-to-4.9.111 > '$DATA/files/upgrade-preservation-check.txt'"
adb shell "cd '$DATA'; find app_webview/Default/'Local Storage' files shared_prefs -type f -exec sha256sum {} \; | sort" > validation-results/data-before.sha256
adb shell dumpsys package "$PACKAGE" > validation-results/package-before.txt
adb pull "$DATA/app_webview/Default/Local Storage" validation-results/storage-before
python3 - <<'PY'
from pathlib import Path
raw=b''.join(p.read_bytes() for p in Path('validation-results/storage-before').rglob('*') if p.is_file())
assert b'osmReaderScale' in raw or b'santoral-osm-fontsize' in raw, 'Real reading preference missing from WebView storage'
PY
adb install -r Liturgia-OSM-4.9.111.apk
adb shell pm grant "$PACKAGE" android.permission.POST_NOTIFICATIONS
adb shell "cd '$DATA'; find app_webview/Default/'Local Storage' files shared_prefs -type f -exec sha256sum {} \; | sort" > validation-results/data-after.sha256
diff -u validation-results/data-before.sha256 validation-results/data-after.sha256
adb shell dumpsys package "$PACKAGE" > validation-results/package-after.txt
grep -q 'versionCode=41015' validation-results/package-after.txt
grep -q 'versionName=4.9.111' validation-results/package-after.txt
BEFORE_UID=$(sed -n 's/.*userId=\([0-9]*\).*/\1/p' validation-results/package-before.txt | head -1)
AFTER_UID=$(sed -n 's/.*userId=\([0-9]*\).*/\1/p' validation-results/package-after.txt | head -1)
test -n "$BEFORE_UID" && test "$BEFORE_UID" = "$AFTER_UID"
adb logcat -c
adb shell am instrument -w -e phase verify com.liturgia_osm.app.test/com.liturgia_osm.validation.UpgradeInstrumentation | tee validation-results/verify.txt
grep -q 'validation=PASS' validation-results/verify.txt
adb shell "cat '$DATA/files/upgrade-preservation-check.txt'" | tr -d '\r' | grep -qx 'upgrade-4.9.102-to-4.9.111'
echo 'PASS: signed release upgrade 4.9.102 -> 4.9.111; UID, WebView localStorage, font size, theme, favorites, history and app files preserved; updated app launched.'
