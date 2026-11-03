#!/usr/bin/env python3
"""
Professionelle Druckdaten für Visitenkarte und Tisch-Speisekarte: `npm run druckdaten`

Nimmt die PDFs aus `npm run card` und `npm run tischkarte` (RGB, 3 mm Beschnitt) und
schreibt nach print/druckdaten/:
- PDF/X-3 in CMYK für Offsetdruck auf gestrichenem Papier:
  ISO Coated v2 300 % (ECI), Ausgabebedingung FOGRA39
- Endformat als TrimBox, Beschnitt (3 mm rundum) als BleedBox
- dunkle Schrift, Linien und QR-Code in reinem Schwarz (100 % K) statt aus vier Farben
- jede Datei zusätzlich mit Schnittmarken (für Druckereien, die welche wünschen)

Prüft dabei: keine Transparenz, Schriften eingebettet, Farbauftrag höchstens 300 %.

Braucht Ghostscript, das ECI-Profil und pikepdf:
  sudo apt install ghostscript icc-profiles
  pip install pikepdf
Ein anderes Profil lässt sich mit ICC_PROFILE=/pfad/zum/profil.icc angeben.
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import pikepdf
except ImportError:
    sys.exit('\n✖ pikepdf fehlt. Einmalig installieren: pip install pikepdf\n')

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'print' / 'druckdaten'
ICC = Path(os.environ.get('ICC_PROFILE', '/usr/share/color/icc/ISOcoated_v2_300_eci.icc'))
MM = 72 / 25.4
BLEED = 3 * MM
# Schnittmarken: beginnen am Rand des Beschnitts, 5 mm lang, Seite 10 mm größer als das Endformat
MARK_FROM, MARK_TO, MARK_PAGE = 3 * MM, 8 * MM, 10 * MM
# Dunkle Schrift der Entwürfe (#1b1814); im Druck reines Schwarz
TEXT_BLACK_RGB = (0x1B, 0x18, 0x14)

JOBS = [
    ('print/visitenkarte/Elmo-Shawarma_Visitenkarte_85x55mm_3mm-Beschnitt.pdf',
     'Elmo-Shawarma_Visitenkarte_85x55mm', 'Elmo Shawarma Visitenkarte 85 x 55 mm'),
    *(
        (f'print/speisekarte-tisch/Elmo-Shawarma_Speisekarte_40x20cm_{v}.pdf',
         f'Elmo-Shawarma_Speisekarte_40x20cm_{v}', f'Elmo Shawarma Speisekarte 40 x 20 cm {v.replace("_", " ")}')
        for v in ('hell_ohne-Beschreibung',)
    ),
]


def pdfx_def(title: str) -> str:
    """PostScript-Vorspann für Ghostscript: PDF/X-3-Kennung und Ausgabebedingung FOGRA39."""
    return f"""
[ /GTS_PDFXVersion (PDF/X-3:2002) /Title ({title}) /Trapped /False /DOCINFO pdfmark
[/_objdef {{icc_PDFX}} /type /stream /OBJ pdfmark
[{{icc_PDFX}} << /N 4 >> /PUT pdfmark
[{{icc_PDFX}} ({ICC}) (r) file /PUT pdfmark
[/_objdef {{OutputIntent_PDFX}} /type /dict /OBJ pdfmark
[{{OutputIntent_PDFX}} <<
  /Type /OutputIntent /S /GTS_PDFX
  /OutputCondition (Offsetdruck, gestrichenes Papier, ISO 12647-2)
  /Info (ISO Coated v2 300% \\(ECI\\))
  /OutputConditionIdentifier (FOGRA39)
  /RegistryName (http://www.color.org)
  /DestOutputProfile {{icc_PDFX}}
>> /PUT pdfmark
[{{Catalog}} <</OutputIntents [ {{OutputIntent_PDFX}} ]>> /PUT pdfmark
"""


def ghostscript(src: Path, dst: Path, title: str, tmp: Path) -> None:
    """RGB-PDF farbmetrisch nach CMYK (ISO Coated v2 300 %) als PDF/X-3 umwandeln."""
    defs = tmp / 'pdfx.ps'
    defs.write_text(pdfx_def(title), encoding='latin-1')
    subprocess.run([
        'gs', '-q', '-dBATCH', '-dNOPAUSE', '-dNOSAFER', '-dPDFX', '-sDEVICE=pdfwrite',
        '-sColorConversionStrategy=CMYK', '-sProcessColorModel=DeviceCMYK',
        f'-sOutputICCProfile={ICC}', '-dRenderIntent=1',  # relativ farbmetrisch
        '-dCompatibilityLevel=1.4', '-dAutoRotatePages=/None',
        '-dEmbedAllFonts=true', '-dSubsetFonts=true',
        f'-sOutputFile={dst}', str(defs), str(src),
    ], check=True)


def text_black_cmyk(tmp: Path) -> bytes:
    """CMYK-Wert, den Ghostscript für die dunkle Schrift (#1b1814) erzeugt, als Operanden-Text."""
    r, g, b = (c / 255 for c in TEXT_BLACK_RGB)
    probe = tmp / 'probe.ps'
    probe.write_text(f'%!PS\n<< /PageSize [20 20] >> setpagedevice\n{r:.5f} {g:.5f} {b:.5f} setrgbcolor 0 0 10 10 rectfill showpage\n')
    out = tmp / 'probe.pdf'
    subprocess.run([
        'gs', '-q', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pdfwrite', '-sColorConversionStrategy=CMYK',
        '-sProcessColorModel=DeviceCMYK', f'-sOutputICCProfile={ICC}', '-dRenderIntent=1',
        '-dCompressPages=false', f'-sOutputFile={out}', str(probe),
    ], check=True)
    with pikepdf.open(out) as pdf:
        data = pdf.pages[0].Contents.read_bytes()
    match = re.search(rb'([\d.]+ [\d.]+ [\d.]+ [\d.]+) k', data)
    if not match:
        sys.exit('✖ Schwarzwert der Schrift nicht ermittelt')
    return match.group(1)


def contents(page) -> list:
    c = page.obj.get('/Contents')
    return list(c) if isinstance(c, pikepdf.Array) else [c]


def check_transparency(pdf) -> list:
    """PDF/X-3 erlaubt keine Transparenz: weiche Masken, Deckkraft unter 100 %, Füllmethoden."""
    issues = []
    for obj in pdf.objects:
        if not isinstance(obj, (pikepdf.Dictionary, pikepdf.Stream)):
            continue
        d = obj if isinstance(obj, pikepdf.Dictionary) else obj.stream_dict
        if d.get('/Type') == '/ExtGState' or '/CA' in d or '/ca' in d:
            for key in ('/CA', '/ca'):
                if key in d and float(d[key]) < 1:
                    issues.append(f'Deckkraft {key}={float(d[key])}')
            if '/SMask' in d and d['/SMask'] != pikepdf.Name('/None'):
                issues.append('weiche Maske')
            if '/BM' in d and d['/BM'] not in (pikepdf.Name('/Normal'), pikepdf.Name('/Compatible')):
                issues.append(f'Füllmethode {d["/BM"]}')
        if d.get('/Subtype') == '/Image' and '/SMask' in d:
            issues.append('Bild mit Transparenz')
    return issues


def finish(src: Path, dst: Path, black: bytes) -> int:
    """Boxen setzen, dunkle Schrift auf 100 % K stellen; gibt die Zahl der Ersetzungen zurück."""
    pattern = re.compile(rb'(?<![\d.])' + re.escape(black) + rb' ([kK])\b')
    replaced = 0
    with pikepdf.open(src) as pdf:
        for page in pdf.pages:
            for stream in contents(page):
                data, n = pattern.subn(rb'0 0 0 1 \1', stream.read_bytes())
                if n:
                    stream.write(data)
                    replaced += n
            x0, y0, x1, y1 = (float(v) for v in page.MediaBox)
            page.obj.BleedBox = pikepdf.Array([x0, y0, x1, y1])
            page.obj.TrimBox = pikepdf.Array([round(v, 3) for v in (x0 + BLEED, y0 + BLEED, x1 - BLEED, y1 - BLEED)])
        issues = check_transparency(pdf)
        if issues:
            sys.exit(f'✖ {dst.name}: Transparenz gefunden ({", ".join(sorted(set(issues)))})')
        pdf.save(dst, object_stream_mode=pikepdf.ObjectStreamMode.disable, force_version='1.3')
    return replaced


def with_crop_marks(src: Path, dst: Path) -> None:
    """Seite um das Endformat herum vergrößern und Schnittmarken in Passerfarbe (alle vier Farben) zeichnen."""
    with pikepdf.open(src) as pdf:
        for page in pdf.pages:
            tx0, ty0, tx1, ty1 = (float(v) for v in page.obj.TrimBox)
            page.obj.MediaBox = pikepdf.Array([round(v, 3) for v in (tx0 - MARK_PAGE, ty0 - MARK_PAGE, tx1 + MARK_PAGE, ty1 + MARK_PAGE)])
            lines = []
            for x in (tx0, tx1):
                lines += [(x, ty0 - MARK_TO, x, ty0 - MARK_FROM), (x, ty1 + MARK_FROM, x, ty1 + MARK_TO)]
            for y in (ty0, ty1):
                lines += [(tx0 - MARK_TO, y, tx0 - MARK_FROM, y), (tx1 + MARK_FROM, y, tx1 + MARK_TO, y)]
            marks = 'q 0.25 w 0 J 1 1 1 1 K\n' + ''.join(f'{a:.3f} {b:.3f} m {c:.3f} {d:.3f} l S\n' for a, b, c, d in lines) + 'Q\n'
            page.obj.Contents = pikepdf.Array(
                [pikepdf.Stream(pdf, b'q\n'), *contents(page), pikepdf.Stream(pdf, b'\nQ\n' + marks.encode())]
            )
        pdf.save(dst, object_stream_mode=pikepdf.ObjectStreamMode.disable, force_version='1.3')


def max_ink(pdf_path: Path, tmp: Path) -> float:
    """Höchster Farbauftrag (Summe C+M+Y+K in %) innerhalb des Beschnitts, gerendert mit 72 dpi."""
    from PIL import Image
    tif = tmp / 'tac.tif'
    worst = 0.0
    with pikepdf.open(pdf_path) as pdf:
        pages = len(pdf.pages)
    for n in range(1, pages + 1):
        subprocess.run(['gs', '-q', '-dBATCH', '-dNOPAUSE', '-sDEVICE=tiff32nc', '-r72', '-dUseBleedBox',
                        f'-dFirstPage={n}', f'-dLastPage={n}', f'-sOutputFile={tif}', str(pdf_path)], check=True)
        img = Image.open(tif)
        pixels = img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()
        worst = max(worst, max(sum(px) for px in pixels) / 255 * 100)
    return worst


def main() -> None:
    if not shutil.which('gs'):
        sys.exit('\n✖ Ghostscript fehlt. Einmalig installieren: sudo apt install ghostscript\n')
    if not ICC.exists():
        sys.exit(f'\n✖ Farbprofil fehlt: {ICC}\n  sudo apt install icc-profiles oder ICC_PROFILE=… setzen\n')
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='elmo-druck-') as t:
        tmp = Path(t)
        black = text_black_cmyk(tmp)
        for src_rel, stem, title in JOBS:
            src = ROOT / src_rel
            if not src.exists():
                sys.exit(f'✖ {src_rel} fehlt. Erst npm run card und npm run tischkarte ausführen.')
            converted = tmp / f'{stem}.gs.pdf'
            ghostscript(src, converted, title, tmp)
            final = OUT / f'{stem}_PDFX3_FOGRA39.pdf'
            replaced = finish(converted, final, black)
            marked = OUT / f'{stem}_PDFX3_FOGRA39_Schnittmarken.pdf'
            with_crop_marks(final, marked)
            ink = max_ink(final, tmp)
            if ink > 305:  # 300 % plus Rundung beim Rendern
                sys.exit(f'✖ {final.name}: Farbauftrag {ink:.0f} % über 300 %')
            print(f'✔ {final.name}  (Farbauftrag max. {ink:.0f} %, Schwarz 100 K: {replaced} Stellen)')
            print(f'✔ {marked.name}')
    print(f'\nDruckdaten (PDF/X-3, FOGRA39) in /{OUT.relative_to(ROOT)}/')


if __name__ == '__main__':
    main()
