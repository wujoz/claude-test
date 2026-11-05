#!/usr/bin/env python3
"""Składa src/ w jeden samodzielny plik index.html (style i skrypty w środku)."""
import sys
from pathlib import Path

root = Path(__file__).parent
src = root / 'src'
head = '''<title>Lodówka+</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Wirtualna lodówka: skanuj produkty kodem QR, pilnuj dat ważności i twórz posiłki z tego, co masz.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
''' + (src / 'styles.css').read_text() + '</style>\n'
body = (src / 'body.html').read_text()
scripts = ('<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>\n'
           '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>\n'
           '<script>\n' + (src / 'data.js').read_text() + '\n' + (src / 'app.js').read_text() + '</script>\n')
content = head + body + scripts

full = ('<!doctype html>\n<html lang="pl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head + '</head>\n<body>\n' + body + scripts + '</body>\n</html>\n')
(root / 'index.html').write_text(full)
if len(sys.argv) > 1:  # opcjonalnie: wersja bez szkieletu (np. do publikacji jako Artifact)
    Path(sys.argv[1]).write_text(content)
print('OK: index.html')
