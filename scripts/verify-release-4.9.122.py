"""Confere apenas o preparo da release; não repete os testes funcionais aprovados."""
from pathlib import Path
import json
import subprocess

BASE = "68524cc133ae1f65d593b12d05e2aa9d95740193"
def original(path):
    return subprocess.check_output(["git", "show", BASE + ":" + path], text=True)

allowed = {
    "package.json", "package-lock.json", "www/app.js", "www/sw.js",
    ".github/workflows/release-4.9.122.yml", "docs/releases/4.9.122.md",
    "scripts/verify-release-4.9.122.py",
}
changed = set(subprocess.check_output(["git", "diff", "--name-only", BASE, "HEAD"], text=True).splitlines())
assert changed <= allowed, "Alterações fora do preparo aprovado: " + str(changed - allowed)
for path in ["package.json", "package-lock.json"]:
    previous, current = json.loads(original(path)), json.loads(Path(path).read_text())
    assert current["version"] == "4.9.122"
    current["version"] = previous["version"]
    if path == "package-lock.json":
        assert current["packages"][""]["version"] == "4.9.122"
        current["packages"][""]["version"] = previous["packages"][""]["version"]
    assert current == previous, "Dependências ou scripts foram alterados: " + path
replacements = {
    "www/app.js": ("const APP_VERSION = '4.9.121';", "const APP_VERSION = '4.9.122';"),
    "www/sw.js": ("const CACHE = 'liturgia-osm-v4.9.121-personal-v1';", "const CACHE = 'liturgia-osm-v4.9.122-personal-v1';"),
}
for path, (old, new) in replacements.items():
    assert original(path).count(old) == 1
    assert Path(path).read_text() == original(path).replace(old, new), path + " difere do código testado"
workflow = Path(".github/workflows/release-4.9.122.yml").read_text()
assert "versionCode 41035" in workflow and "versionName='4.9.122'" in workflow
assert "5b2b3319cc9f9bb61a14fb8a30e63044db225f7b930fca9568c82854f38b4fe0" in workflow
assert "gh release create v4.9.122" in workflow
assert "applicationIdSuffix" not in workflow
print("Release 4.9.122: código aprovado preservado; somente versão/cache, preparo e notas de publicação alterados.")
