"""Verify the exact approved APK against its synchronized web sources."""
import hashlib
from pathlib import Path
import sys
import zipfile

apk = Path(sys.argv[1])
expected = '219b423a27d01943524cd925b59d5ace1ffcf2c068aa214dd0e09c93be66ea37'
assert hashlib.sha256(apk.read_bytes()).hexdigest() == expected, 'APK diferente do aprovado'
with zipfile.ZipFile(apk) as archive:
    assert archive.testzip() is None
    compared = 0
    for source in Path('www').rglob('*'):
        if source.is_file():
            name = 'assets/public/' + source.relative_to('www').as_posix()
            assert archive.read(name) == source.read_bytes(), f'Fonte divergente: {source}'
            compared += 1
print(f'APK aprovado e {compared} arquivos web idênticos aos fontes sincronizados.')
