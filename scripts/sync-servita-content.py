#!/usr/bin/env python3
"""Build local library snapshots from a reviewed Liturgia OSM checkout.

No network access, calendar changes, PDF replacement, or runtime dependency.
"""
import argparse
import hashlib
import html
import json
import re
import subprocess
from pathlib import Path

REPOSITORY = "charlieleitao-spec/liturgia-osm"
CATALOG = "data/biblioteca-servita-catalogo.json"
LOCK = "conteudo-servita.lock.json"
BEGIN = "<!-- BEGIN SERVITA CATALOG -->"
END = "<!-- END SERVITA CATALOG -->"


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def source_data(source):
    raw = (source / "www" / CATALOG).read_bytes()
    catalog = json.loads(raw)
    if catalog.get("schema_version") != 1 or catalog.get("language") != "pt-BR":
        raise ValueError("Catálogo: esquema ou idioma incompatível")
    documents = catalog.get("documents")
    if not isinstance(documents, list) or not documents:
        raise ValueError("Catálogo vazio")
    ids, assets = set(), {}
    for doc in documents:
        if not isinstance(doc, dict):
            raise ValueError("Documento inválido")
        ident = doc.get("id")
        if not isinstance(ident, str) or not ident or ident in ids:
            raise ValueError("Identificador ausente ou duplicado")
        ids.add(ident)
        if not isinstance(doc.get("title"), str) or not doc["title"].strip():
            raise ValueError("Título ausente: " + ident)
        asset = doc.get("offline_asset", "")
        if not re.fullmatch(r"\./data/pdfs/biblioteca/[a-z0-9-]+\.pdf", asset):
            raise ValueError("Caminho de PDF inválido: " + ident)
        if type(doc.get("start_page")) is not int or doc["start_page"] < 1:
            raise ValueError("Página inicial inválida: " + ident)
        relative = asset[2:]
        file = (source / "www" / relative).resolve()
        if not file.is_relative_to((source / "www").resolve()):
            raise ValueError("PDF fora da fonte")
        data = file.read_bytes()
        if not data.startswith(b"%PDF-"):
            raise ValueError("Arquivo não é PDF: " + relative)
        assets[relative] = {"sha256": sha256(data), "size": len(data)}
    return raw, catalog, dict(sorted(assets.items()))


def planned_files(source, target, profile, commit=None):
    raw, catalog, assets = source_data(source)
    if profile == "source":
        return {target / CATALOG: raw}
    if not commit or not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("Informe o SHA completo da revisão aprovada da fonte")
    actual = subprocess.check_output(
        ["git", "-C", str(source), "rev-parse", "HEAD"], text=True
    ).strip()
    if actual != commit:
        raise ValueError("O checkout da fonte não corresponde à revisão informada")
    dirty = subprocess.check_output(["git", "-C", str(source), "status", "--porcelain", "--untracked-files=no"], text=True)
    if dirty.strip():
        raise ValueError("O checkout da fonte possui alterações locais; use a revisão aprovada sem modificações")
    if profile == "hoje":
        manifest = json.loads((target / "android-pdf/documents.json").read_bytes())
        known = {item["path"]: item for item in manifest["documents"]}
        for relative, metadata in assets.items():
            item = known.get(relative, {})
            if any(item.get(key) != value for key, value in metadata.items()):
                raise ValueError("PDF precisa de revisão no manifesto Android: " + relative)
            file = (target / relative).resolve()
            if not file.is_relative_to(target.resolve()):
                raise ValueError("PDF fora do destino")
            data = file.read_bytes()
            if len(data) != metadata["size"] or sha256(data) != metadata["sha256"]:
                raise ValueError("PDF local divergente; nenhum catálogo foi alterado: " + relative)
    lock = {
        "schema_version": 1,
        "repository": REPOSITORY,
        "commit": commit,
        "catalog_path": "www/" + CATALOG,
        "catalog_sha256": sha256(raw),
        "assets": assets,
    }
    planned = {target / CATALOG: raw, target / LOCK: json_bytes(lock)}
    if profile == "somos":
        file = target / "recursos.html"
        page = file.read_text(encoding="utf-8")
        if page.count(BEGIN) != 1 or page.count(END) != 1:
            raise ValueError("Marcadores únicos do catálogo ausentes na página de recursos")
        titles = "; ".join(html.escape(doc["title"]) for doc in catalog["documents"])
        pattern = re.escape(BEGIN) + r"[\s\S]*?" + re.escape(END)
        fragment = BEGIN + "\n<p>" + titles + ".</p>\n" + END
        page = re.sub(pattern, lambda match: fragment, page, count=1)
        planned[file] = page.encode()
    return planned


def sync(source, target, profile, commit=None, check=False):
    # Prepare and validate everything before writing any of the generated files.
    planned = planned_files(source, target, profile, commit)
    changed = [file for file, data in planned.items()
               if not file.exists() or file.read_bytes() != data]
    if check and changed:
        raise ValueError("Cópias geradas divergentes: " + ", ".join(str(p.relative_to(target)) for p in changed))
    for file in changed:
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(planned[file])
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--target", type=Path, required=True)
    parser.add_argument("--profile", choices=["source", "hoje", "somos"], required=True)
    parser.add_argument("--source-commit")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        changed = sync(args.source.resolve(), args.target.resolve(), args.profile,
                       args.source_commit, args.check)
    except (ValueError, OSError, KeyError, TypeError, subprocess.CalledProcessError) as exc:
        parser.exit(1, "Erro: " + str(exc) + "\n")
    print("Biblioteca: cópias verificadas." if not changed else
          "Biblioteca: " + str(len(changed)) + " arquivo(s) gerado(s).")


if __name__ == "__main__":
    main()
