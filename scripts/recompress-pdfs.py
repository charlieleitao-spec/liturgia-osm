"""Recompress with qpdf, accepting smaller files only after content/render checks.
Usage: QPDF=/path/qpdf python3 scripts/recompress-pdfs.py
"""
import csv
import hashlib
import os
import subprocess
import tempfile
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'docs/size-optimization/4.9.129'
REPORT.mkdir(parents=True, exist_ok=True)
QPDF = os.environ.get('QPDF', 'qpdf')

def extract(path, layout=False):
    return subprocess.check_output(['pdftotext', *(['-layout'] if layout else []), str(path), '-'])

def links(page):
    return [{k: v for k, v in link.items() if k not in ('xref', 'id')} for link in page.get_links()]

def verify(original, candidate):
    subprocess.run([QPDF, '--check', str(candidate)], check=True, capture_output=True)
    a, b = fitz.open(original), fitz.open(candidate)
    assert len(a) == len(b), (original, 'page count')
    assert a.get_toc() == b.get_toc(), (original, 'bookmarks')
    assert a.get_page_labels() == b.get_page_labels(), (original, 'page labels')
    assert {k:v for k,v in a.metadata.items() if k != 'format'} == {k:v for k,v in b.metadata.items() if k != 'format'}, (original, 'metadata')
    for layout in (False, True):
        # Form-feed delimiters ensure equality per page as well as overall.
        assert extract(original, layout) == extract(candidate, layout), (original, 'pdftotext', layout)
    for index, (pa, pb) in enumerate(zip(a, b), 1):
        assert (pa.rect, pa.rotation, pa.mediabox, pa.cropbox) == (pb.rect, pb.rotation, pb.mediabox, pb.cropbox), (original, index, 'geometry')
        assert links(pa) == links(pb), (original, index, 'links')
        ra, rb = (p.get_pixmap(dpi=144, alpha=False) for p in (pa, pb))
        assert (ra.width, ra.height, ra.samples) == (rb.width, rb.height, rb.samples), (original, index, 'pixels at 144 dpi')
    count = len(a)
    a.close(); b.close()
    return count

def main():
    rows = []
    for path in sorted((ROOT / 'www/data/pdfs').rglob('*.pdf')):
        original = path.read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            candidate = Path(directory) / 'candidate.pdf'
            subprocess.run([QPDF, '--object-streams=generate', '--compress-streams=y', '--recompress-flate', '--compression-level=9', str(path), str(candidate)], check=True, capture_output=True)
            pages = verify(path, candidate)
            optimized = candidate.read_bytes()
            accepted = len(optimized) < len(original)
            if accepted:
                path.write_bytes(optimized)
        rows.append([path.relative_to(ROOT).as_posix(), pages, len(original), path.stat().st_size, len(original)-path.stat().st_size, 'accepted' if accepted else 'kept original (not smaller)', 'identical', 'identical at 144 dpi', 'pass', hashlib.sha256(original).hexdigest(), hashlib.sha256(path.read_bytes()).hexdigest()])
        print(rows[-1][:6], flush=True)
    with (REPORT / 'pdf-bytes.csv').open('w', newline='') as output:
        writer = csv.writer(output, lineterminator="\n")
        writer.writerow(['file','pages','before_bytes','after_bytes','saved_bytes','decision','text','render','qpdf_check','before_sha256','after_sha256'])
        writer.writerows(rows)
    print('TOTAL',len(rows),'PDFs',sum(r[1] for r in rows),'pages',sum(r[2] for r in rows),'->',sum(r[3] for r in rows),flush=True)

if __name__ == "__main__":
    main()
