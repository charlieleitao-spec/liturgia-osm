import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("sync_content", Path(__file__).with_name("sync-servita-content.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SharedContentTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source, self.target = self.root / "source", self.root / "target"
        self.source.mkdir()
        self.target.mkdir()
        self.pdf = b"%PDF-1.4\nfixture\n%%EOF\n"
        self.asset = "data/pdfs/biblioteca/documento.pdf"
        file = self.source / "www" / self.asset
        file.parent.mkdir(parents=True)
        file.write_bytes(self.pdf)
        self.catalog = {"schema_version": 1, "language": "pt-BR", "documents": [
            {"id": "documento", "title": "Documento & formação", "offline_asset": "./" + self.asset, "start_page": 1}]}
        self.write_catalog()
        subprocess.run(["git", "init", "-q", str(self.source)], check=True)
        subprocess.run(["git", "-C", str(self.source), "add", "."], check=True)
        subprocess.run(["git", "-C", str(self.source), "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "fixture"], check=True)
        self.commit = subprocess.check_output(["git", "-C", str(self.source), "rev-parse", "HEAD"], text=True).strip()
        self.page = self.target / "recursos.html"
        self.page.write_text("<main>" + module.BEGIN + "old" + module.END + "<p>Preservar</p></main>")
        local = self.target / self.asset
        local.parent.mkdir(parents=True)
        local.write_bytes(self.pdf)
        manifest = self.target / "android-pdf/documents.json"
        manifest.parent.mkdir()
        manifest.write_text(json.dumps({"documents": [{"path": self.asset, "size": len(self.pdf), "sha256": hashlib.sha256(self.pdf).hexdigest()}]}))

    def write_catalog(self):
        p = self.source / "www" / module.CATALOG
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(module.json_bytes(self.catalog))

    def test_somos_snapshot_is_deterministic_and_escaped(self):
        module.sync(self.source, self.target, "somos", self.commit)
        self.assertIn("Documento &amp; formação", self.page.read_text())
        self.assertIn("<p>Preservar</p>", self.page.read_text())
        self.assertEqual([], module.sync(self.source, self.target, "somos", self.commit, check=True))
        lock = json.loads((self.target / module.LOCK).read_bytes())
        self.assertEqual(self.commit, lock["commit"])
        self.assertEqual(hashlib.sha256((self.source / "www" / module.CATALOG).read_bytes()).hexdigest(), lock["catalog_sha256"])

    def test_hoje_preserves_pdf_and_detects_drift(self):
        module.sync(self.source, self.target, "hoje", self.commit)
        self.assertEqual(self.pdf, (self.target / self.asset).read_bytes())
        (self.target / module.CATALOG).write_text("{}")
        with self.assertRaisesRegex(ValueError, "divergentes"):
            module.sync(self.source, self.target, "hoje", self.commit, check=True)
        self.assertEqual("{}", (self.target / module.CATALOG).read_text())

    def test_tampered_pdf_prevents_all_writes(self):
        (self.target / self.asset).write_bytes(b"%PDF-tampered")
        with self.assertRaisesRegex(ValueError, "PDF local divergente"):
            module.sync(self.source, self.target, "hoje", self.commit)
        self.assertFalse((self.target / module.CATALOG).exists())
        self.assertFalse((self.target / module.LOCK).exists())

    def test_missing_marker_prevents_all_writes(self):
        self.page.write_text("<main>Preservar</main>")
        with self.assertRaisesRegex(ValueError, "Marcadores"):
            module.sync(self.source, self.target, "somos", self.commit)
        self.assertFalse((self.target / module.CATALOG).exists())

    def test_wrong_revision_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "checkout"):
            module.sync(self.source, self.target, "somos", "a" * 40)

    def test_unsafe_pdf_path_is_rejected(self):
        self.catalog["documents"][0]["offline_asset"] = "./data/pdfs/biblioteca/../../other.pdf"
        self.write_catalog()
        with self.assertRaisesRegex(ValueError, "Caminho"):
            module.sync(self.source, self.target, "source")

    def test_source_mirror_matches_canonical_bytes(self):
        module.sync(self.source, self.target, "source")
        self.assertEqual((self.source / "www" / module.CATALOG).read_bytes(), (self.target / module.CATALOG).read_bytes())


if __name__ == "__main__":
    unittest.main()
