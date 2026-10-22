"""Subset embedded fonts. Reject any page with changed text or pixels (144 dpi).

Original PDFs must be kept outside the checkout. No network access.
Requires PyMuPDF and Poppler pdftotext.
"""
import csv
import hashlib
import subprocess
import tempfile
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'docs/size-optimization'
REPORT.mkdir(parents=True, exist_ok=True)
rows = []
for path in sorted((ROOT / 'www/data/pdfs').rglob('*.pdf')):
    original = path.read_bytes()
    before = fitz.open(stream=original, filetype='pdf')
    candidate = fitz.open(stream=original, filetype='pdf')
    candidate.subset_fonts()
    optimized = candidate.tobytes(garbage=4, deflate=True)
    after = fitz.open(stream=optimized, filetype='pdf')
    assert len(before) == len(after), path
    for index, (a, b) in enumerate(zip(before, after), 1):
        assert a.rect == b.rect and a.rotation == b.rotation, (path, index, 'geometry')
        assert a.get_text() == b.get_text(), (path, index, 'text')
        pa = a.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        pb = b.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        assert (pa.width, pa.height, pa.samples) == (pb.width, pb.height, pb.samples), (path, index, 'pixels')
    with tempfile.NamedTemporaryFile(suffix='.pdf') as tmp:
        tmp.write(optimized)
        tmp.flush()
        extract = lambda p: subprocess.check_output(['pdftotext', '-layout', str(p), '-'])
        assert extract(path) == extract(tmp.name), (path, 'Poppler text')
    accepted = len(optimized) < len(original)
    if accepted:
        path.write_bytes(optimized)
    rows.append([path.relative_to(ROOT).as_posix(), len(before), len(original), path.stat().st_size,
                 len(original) - path.stat().st_size, 'identical', 'identical at 144 dpi',
                 hashlib.sha256(original).hexdigest(), hashlib.sha256(path.read_bytes()).hexdigest()])
    print(path.name, len(original), path.stat().st_size, flush=True)
with (REPORT / 'pdf-bytes.csv').open('w') as out:
    writer = csv.writer(out)
    writer.writerow(['file', 'pages', 'before_bytes', 'after_bytes', 'saved_bytes', 'text', 'render', 'before_sha256', 'after_sha256'])
    writer.writerows(rows)
print('TOTAL', len(rows), 'PDFs;', sum(r[1] for r in rows), 'pages;', sum(r[4] for r in rows), 'bytes saved')
