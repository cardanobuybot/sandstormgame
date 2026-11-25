#!/usr/bin/env python3
"""Draws the Sandstorm Game logo: a dust devil with an attitude in front of the sun, and the wordmark.

    python3 tools/make-logo.py [path/to/rubik-latin-900-normal.woff]

Writes SVG and PNG files into public/brand/ and the favicons into public/. Needs fonttools and rsvg-convert.
The letters are Rubik Black (SIL Open Font License) turned into outlines, so the files need no font.
"""
import math
import os
import subprocess
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FONT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, '..', 'dune-of-clash', 'node_modules', '@fontsource', 'rubik', 'files', 'rubik-latin-900-normal.woff')
OUT = os.path.join(ROOT, 'public', 'brand')

INK = '#2a1a12'
TEAL, TEAL_D = '#27b3a4', '#12776d'
SUN, SUN_L, SUN_D = '#f9a12e', '#ffd166', '#ee7d1c'
SAND, SAND_L, SAND_D = '#f3c77c', '#ffe9b8', '#d99a4a'
CREAM = '#fff6dc'


def text_path(font, text, size, x, base, tracking=0.0, skew=0.0):
    """Outlines of a line of text. Returns (svg path data, width)."""
    f = TTFont(font)
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm
    k = size / upm
    pen = SVGPathPen(gs)
    cx = x
    for i, ch in enumerate(text):
        name = cmap[ord(ch)]
        t = Transform(k, 0, -skew * k, -k, cx, base)
        gs[name].draw(TransformPen(pen, t))
        cx += gs[name].width * k + (tracking * size if i < len(text) - 1 else 0)
    return pen.getCommands(), cx - x


def twister(cx, top, scale=1.0):
    """The dust devil: six discs, widest on top, the stack swaying as it goes down. Returns svg."""
    # (width, height, x shift, tilt in degrees, fill)
    bands = [
        (318, 80, 0, -8, '#fffaf0'),
        (268, 104, -20, 4, '#fff1d2'),
        (206, 66, -4, -5, '#ffe3aa'),
        (154, 58, 20, 6, '#fbd07e'),
        (104, 50, 26, -6, '#f4b55c'),
        (58, 42, 8, 8, '#ea9a45'),
    ]
    geo, y = [], top
    for i, (w, h, dx, rot, fill) in enumerate(bands):
        w, h, dx = w * scale, h * scale, dx * scale
        geo.append((cx + dx, y + h / 2, w / 2, h / 2, rot, fill))
        y += h * (0.62 if i != 1 else 0.7)
    parts = []
    # drawn from the tip up, so each disc sits on the one below
    for i, (x, yy, rx, ry, rot, fill) in reversed(list(enumerate(geo))):
        g = f'<g transform="rotate({rot} {x:.1f} {yy:.1f})">'
        g += f'<ellipse cx="{x:.1f}" cy="{yy + 7 * scale:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{INK}"/>'
        g += f'<ellipse cx="{x:.1f}" cy="{yy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{fill}" stroke="{INK}" stroke-width="{11 * scale:.1f}"/>'
        # the shaded underside and a streak of light
        g += (f'<path d="M{x - rx * 0.88:.1f} {yy + ry * 0.24:.1f} A{rx:.1f} {ry:.1f} 0 0 0 {x + rx * 0.88:.1f} {yy + ry * 0.24:.1f} '
              f'A{rx * 1.04:.1f} {ry * 0.6:.1f} 0 0 1 {x - rx * 0.88:.1f} {yy + ry * 0.24:.1f}Z" fill="{SAND_D}" opacity=".4"/>')
        if i != 1:
            g += (f'<path d="M{x - rx * 0.62:.1f} {yy - ry * 0.4:.1f} Q{x - rx * 0.1:.1f} {yy - ry * 0.78:.1f} {x + rx * 0.36:.1f} {yy - ry * 0.5:.1f}" '
                  f'fill="none" stroke="#fff" stroke-width="{6 * scale:.1f}" stroke-linecap="round" opacity=".9"/>')
        g += '</g>'
        if i == 1:
            g += face(x, yy, rx, ry, rot, scale)
        parts.append(g)
    return ''.join(parts), y


def face(x, yy, rx, ry, rot, e):
    """Eyes under heavy brows and half a grin, on the second disc. It looks where the storm is going."""
    o = f'<g transform="rotate({rot} {x:.1f} {yy:.1f})">'
    cy = yy + 10 * e
    for side in (-1, 1):
        ex = x + side * 56 * e + 16 * e
        # the white: flat on top where the brow cuts it, round below
        o += (f'<path d="M{ex - 34 * e:.1f} {cy - 10 * e + side * 7 * e:.1f} L{ex + 34 * e:.1f} {cy - 10 * e - side * 7 * e:.1f} '
              f'Q{ex + 30 * e:.1f} {cy + 26 * e:.1f} {ex:.1f} {cy + 26 * e:.1f} Q{ex - 30 * e:.1f} {cy + 26 * e:.1f} {ex - 34 * e:.1f} {cy - 10 * e + side * 7 * e:.1f}Z" '
              f'fill="#fff" stroke="{INK}" stroke-width="{8 * e:.1f}" stroke-linejoin="round"/>')
        o += f'<circle cx="{ex + 8 * e:.1f}" cy="{cy + 6 * e:.1f}" r="{13 * e:.1f}" fill="{INK}"/>'
        o += f'<circle cx="{ex + 13 * e:.1f}" cy="{cy + 1 * e:.1f}" r="{4.2 * e:.1f}" fill="#fff"/>'
        # the brow: a slab of ink pressing down towards the middle
        o += (f'<path d="M{ex - side * 40 * e:.1f} {cy - 5 * e:.1f} L{ex + side * 34 * e:.1f} {cy - 27 * e:.1f}" '
              f'stroke="{INK}" stroke-width="{13 * e:.1f}" stroke-linecap="round"/>')
    o += '</g>'
    return o


def emblem(size=512, badge=True):
    """Square emblem. badge=True: a rounded square with a sky; False: only the sun, the storm and the sand."""
    s = size / 512
    o = []
    if badge:
        o.append(f'<clipPath id="clip"><rect x="0" y="0" width="512" height="512" rx="112"/></clipPath><g clip-path="url(#clip)">')
        o.append(f'<rect width="512" height="512" fill="{TEAL}"/>')
        o.append(f'<path d="M0 0H512V150Q256 210 0 120Z" fill="#3cc4b3"/>')
    # the sun, in rings like the one on the Dune Clash icon
    o.append(f'<circle cx="322" cy="214" r="170" fill="{SUN_D}" stroke="{INK}" stroke-width="12"/>')
    o.append(f'<circle cx="322" cy="214" r="134" fill="{SUN}"/>')
    o.append(f'<circle cx="322" cy="214" r="96" fill="{SUN_L}"/>')
    # sand: dunes across the badge, or a mound when the emblem stands alone
    if badge:
        o.append(f'<path d="M-20 420 Q120 330 300 392 T540 372 V560 H-20Z" fill="{SAND_D}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>')
        o.append(f'<path d="M-20 470 Q160 398 330 446 T540 430 V560 H-20Z" fill="{SAND}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>')
    else:
        o.append(f'<path d="M40 470 Q150 372 300 404 Q420 376 486 470 Q262 512 40 470Z" fill="{SAND}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>')
    tw, _ = twister(226, 86, 1.0)
    # dust kicked up where the tip touches the sand
    o.append(f'<ellipse cx="246" cy="414" rx="84" ry="24" fill="{SAND_L}" stroke="{INK}" stroke-width="10"/>')
    o.append(tw)
    # bits of the desert going round with it
    for x, y, r, rot, fill in ((92, 196, 15, 20, CREAM), (64, 300, 10, 50, SAND_L), (418, 118, 12, 35, CREAM), (444, 300, 16, 10, SAND_L), (130, 96, 9, 60, SAND_L)):
        o.append(f'<rect x="{x - r}" y="{y - r}" width="{2 * r}" height="{2 * r}" rx="3" transform="rotate({rot} {x} {y})" fill="{fill}" stroke="{INK}" stroke-width="7"/>')
    for d in ('M52 236 Q86 222 118 236', 'M400 208 Q438 196 470 214', 'M70 148 Q96 138 120 146'):
        o.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>')
    if badge:
        o.append('</g>')
        o.append(f'<rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="{INK}" stroke-width="12"/>')
    return f'<g transform="scale({s})">' + ''.join(o) + '</g>'


def wordmark(x, base, size):
    """SANDSTORM with GAME on a plate under its right end. Returns (svg, width, bottom)."""
    skew = 0.14
    d, w = text_path(FONT, 'SANDSTORM', size, x, base, tracking=0.012, skew=skew)
    cap = size * 0.7
    o = []
    # a hard shadow, the ink around both, then the letters
    drop = size * 0.085
    o.append(f'<path d="{d}" transform="translate(0 {drop:.1f})" fill="{INK}" stroke="{INK}" stroke-width="{size * 0.2:.1f}" stroke-linejoin="round"/>')
    o.append(f'<path d="{d}" fill="{INK}" stroke="{INK}" stroke-width="{size * 0.2:.1f}" stroke-linejoin="round"/>')
    o.append(f'<path d="{d}" transform="translate(0 {drop:.1f})" fill="{SUN_D}"/>')
    o.append(f'<path d="{d}" fill="url(#letters)"/>')
    # GAME on a teal plate, tucked under the right end
    gs = size * 0.36
    gd, gw = text_path(FONT, 'GAME', gs, 0, 0, tracking=0.16, skew=skew)
    px, py = x + w - gw - gs * 0.55, base + drop + size * 0.2
    ph, pw = gs * 1.32, gw + gs * 1.1
    o.append(f'<g transform="translate({px:.1f} {py:.1f}) rotate(-3)">'
             f'<rect x="0" y="{size * 0.045:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{ph * 0.3:.1f}" fill="{INK}"/>'
             f'<rect x="0" y="0" width="{pw:.1f}" height="{ph:.1f}" rx="{ph * 0.3:.1f}" fill="{TEAL}" stroke="{INK}" stroke-width="{size * 0.055:.1f}"/>'
             f'<path d="{gd}" transform="translate({gs * 0.6:.1f} {ph * 0.5 + gs * 0.35:.1f})" fill="{CREAM}"/></g>')
    return ''.join(o), w, py + ph + size * 0.1, cap


DEFS = (f'<defs><linearGradient id="letters" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#fffdf2"/><stop offset=".55" stop-color="{CREAM}"/><stop offset="1" stop-color="#ffd98a"/></linearGradient></defs>')


def svg(w, h, body, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="Sandstorm Game">{DEFS}{rect}{body}</svg>'


def write(name, data, png=None):
    path = os.path.join(OUT, name)
    open(path, 'w').write(data)
    for target, width in (png or []):
        subprocess.run(['rsvg-convert', '-w', str(width), path, '-o', target], check=True)


os.makedirs(OUT, exist_ok=True)

# 1. the emblem alone: app icon, favicon
write('mark.svg', svg(512, 512, emblem()), [(os.path.join(OUT, 'mark-512.png'), 512), (os.path.join(ROOT, 'public', 'apple-touch-icon.png'), 180),
                                              (os.path.join(ROOT, 'public', 'favicon-96.png'), 96), (os.path.join(ROOT, 'public', 'icon-192.png'), 192), (os.path.join(ROOT, 'public', 'icon-512.png'), 512)])
open(os.path.join(ROOT, 'public', 'favicon.svg'), 'w').write(svg(512, 512, emblem()))

# 2. emblem and wordmark side by side: the site header, letterheads
size = 150
wm, ww, bottom, cap = wordmark(0, 0, size)
pad = 26
mark_h = 300
total_w = mark_h + 44 + ww + pad * 2 + 20
total_h = mark_h + pad * 2
body = (f'<g transform="translate({pad} {pad}) scale({mark_h / 512})">{emblem()}</g>'
        f'<g transform="translate({pad + mark_h + 44} {pad + mark_h * 0.5 + cap * 0.28})">{wm}</g>')
write('logo.svg', svg(total_w, total_h, body), [(os.path.join(OUT, 'logo.png'), 1600)])

# 3. stacked: the storm over the name, for the hero and the press kit
size = 190
wm, ww, bottom, cap = wordmark(0, 0, size)
mark = 520
total_w = max(ww, mark) + 120
total_h = mark + cap + (bottom) + 90
body = (f'<g transform="translate({(total_w - mark) / 2:.1f} 30) scale({mark / 512})">{emblem(badge=False)}</g>'
        f'<g transform="translate({(total_w - ww) / 2:.1f} {30 + mark + cap + 6:.1f})">{wm}</g>')
write('logo-stacked.svg', svg(total_w, total_h, body), [(os.path.join(OUT, 'logo-stacked.png'), 1400)])
write('logo-stacked-sand.svg', svg(total_w, total_h, body, '#f7dfa5'), [(os.path.join(OUT, 'logo-stacked-sand.png'), 1400)])
print('logo written to', os.path.relpath(OUT, ROOT))
