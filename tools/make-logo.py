#!/usr/bin/env python3
"""Draws the Sandstorm Game logo: a sand twister on a dune in front of the sun, and the wordmark.

    python3 tools/make-logo.py [path/to/rubik-latin-900-normal.woff]

Writes SVG and PNG files into public/brand/ and the favicons into public/. Needs fonttools, rsvg-convert and,
for favicon.ico, ImageMagick. Afterwards run node tools/make-covers.mjs: the share pictures carry the emblem.
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


def crescent(cx, cy, L1, L2, T, rot, fill, shade, stroke=10, drop=7):
    """One band of the twister: the front half of a ring of sand, tips up and belly down.
    L1, L2: how far the left and the right tip reach; T: thickness."""
    h, a = T * 0.3, T * 0.16
    b = a + T * 1.25

    def pt(x, y):
        return f'{cx + x:.1f} {cy + y:.1f}'
    d = (f'M{pt(-L1, -h)} C{pt(-L1 * 0.62, b)} {pt(L2 * 0.62, b)} {pt(L2, -h)} '
         f'C{pt(L2 * 0.6, a)} {pt(-L1 * 0.6, a)} {pt(-L1, -h)}Z')
    # the underside in shade, and a streak of light on the upper edge
    m = a + T * 0.72
    d2 = (f'M{pt(-L1 * 0.9, -h * 0.55)} C{pt(-L1 * 0.58, b * 0.985)} {pt(L2 * 0.58, b * 0.985)} {pt(L2 * 0.9, -h * 0.55)} '
          f'C{pt(L2 * 0.56, m)} {pt(-L1 * 0.56, m)} {pt(-L1 * 0.9, -h * 0.55)}Z')
    hl = f'M{pt(-L1 * 0.52, a * 0.75 + T * 0.1 - h * 0.25)} Q{pt(-L1 * 0.15, a * 0.75 + T * 0.26)} {pt(L2 * 0.2, a * 0.75 + T * 0.22)}'
    o = f'<g transform="rotate({rot:.1f} {cx:.1f} {cy:.1f})">'
    if drop:
        o += f'<path d="{d}" transform="translate(0 {drop})" fill="{INK}" stroke="{INK}" stroke-width="{stroke}" stroke-linejoin="round"/>'
    o += f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{stroke}" stroke-linejoin="round"/>'
    o += f'<path d="{d2}" fill="{shade}"/>'
    o += f'<path d="{hl}" fill="none" stroke="#fff" stroke-width="{max(4, T * 0.12):.1f}" stroke-linecap="round" opacity=".9"/>'
    return o + '</g>'


# The funnel from the top down: reach left, reach right, thickness, fill, shade. Pale dust above, hot sand at the tip.
BANDS = [
    (150, 146, 58, '#fffaf0', '#ecd5a4'),
    (132, 128, 54, '#fff1d2', '#e6c688'),
    (108, 116, 50, '#ffe3aa', '#deb068'),
    (94, 86, 45, '#fbd07e', '#d59646'),
    (68, 74, 39, '#f6bb5c', '#cb8235'),
    (54, 48, 33, '#ee9f42', '#be6d28'),
    (34, 36, 27, '#e58a2b', '#ab5c1e'),
    (20, 20, 21, '#d97a22', '#9c5219'),
]


# The same funnel for 16 to 32 pixels: five thick rings and nothing else.
BANDS_SMALL = [
    (182, 160, 88, '#fffaf0', '#ecd5a4'),
    (122, 146, 80, '#ffe9b8', '#e2bb77'),
    (110, 86, 70, '#fbd07e', '#d59646'),
    (56, 72, 58, '#f0a548', '#c27430'),
    (38, 28, 44, '#de8226', '#a3571b'),
]


def twister(p0, p1, p2, lean=0.7, bands=BANDS, stroke=10):
    """The sand twister: rings strung along a curve from p0 (the top) through p1 to the tip p2, so the funnel bends
    the way a real one does. Each ring lies across the curve, more so towards the tip. Returns (svg, positions)."""
    total = sum(b[2] for b in bands)
    geo, acc = [], 0.0
    for (L1, L2, T, fill, shade) in bands:
        t = (acc + T * 0.2) / total
        acc += T
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
        dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
        rot = (math.degrees(math.atan2(dy, dx)) - 90) * (0.2 + lean * t)
        geo.append((x, y, L1, L2, T, rot, fill, shade))
    out = []
    # drawn from the tip up, so each ring overlaps the one below; every other ring tips the other way: it spins
    for i, (x, y, L1, L2, T, rot, fill, shade) in reversed(list(enumerate(geo))):
        out.append(crescent(x, y, L1, L2, T, rot + (4 if i % 2 else -4), fill, shade, stroke=stroke, drop=7 if stroke <= 10 else 0))
    return ''.join(out), geo


def eyes(geo):
    """The variant with a character: two eyes glaring out of the storm, under the top ring."""
    x, y, L1, L2, T, rot, _, _ = geo[1]
    cy = y + T * 0.62
    o = f'<g transform="rotate({rot:.1f} {x:.1f} {y:.1f})">'
    for side in (-1, 1):
        ex = x + side * 44 + 6
        o += (f'<path d="M{ex - 30:.1f} {cy - 12 + side * 8:.1f} L{ex + 30:.1f} {cy - 12 - side * 8:.1f} '
              f'Q{ex + 26:.1f} {cy + 20:.1f} {ex:.1f} {cy + 20:.1f} Q{ex - 26:.1f} {cy + 20:.1f} {ex - 30:.1f} {cy - 12 + side * 8:.1f}Z" '
              f'fill="#fff" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>')
        o += f'<circle cx="{ex + 6:.1f}" cy="{cy + 4:.1f}" r="11" fill="{INK}"/>'
        o += f'<circle cx="{ex + 10:.1f}" cy="{cy:.1f}" r="3.6" fill="#fff"/>'
        o += f'<path d="M{ex - side * 36:.1f} {cy - 6:.1f} L{ex + side * 30:.1f} {cy - 26:.1f}" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
    return o + '</g>'


def emblem(size=512, badge=True, face=False, bleed=False):
    """Square emblem: a sand twister on a dune in front of the sun.
    badge=True: a rounded square with a sky; False: only the sun, the twister and a mound of sand.
    face=True: the variant with eyes.
    bleed=True: the badge without rounded corners and without its outline, for a phone's home screen, which cuts
    the corners itself and paints anything transparent black."""
    s = size / 512
    o = []
    if badge:
        o.append(f'<clipPath id="clip"><rect x="0" y="0" width="512" height="512" rx="{0 if bleed else 112}"/></clipPath><g clip-path="url(#clip)">')
        o.append(f'<rect width="512" height="512" fill="{TEAL}"/>')
        o.append(f'<path d="M0 0H512V150Q256 210 0 120Z" fill="#3cc4b3"/>')
    # the sun, in rings like the one on the Dune Clash icon
    o.append(f'<circle cx="280" cy="236" r="180" fill="{SUN_D}" stroke="{INK}" stroke-width="12"/>')
    o.append(f'<circle cx="280" cy="236" r="142" fill="{SUN}"/>')
    o.append(f'<circle cx="280" cy="236" r="102" fill="{SUN_L}"/>')
    # sand: dunes across the badge, or a mound when the emblem stands alone
    if badge:
        o.append(f'<path d="M-20 430 Q120 356 300 406 T540 388 V560 H-20Z" fill="{SAND_D}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>')
        o.append(f'<path d="M-20 478 Q160 412 330 454 T540 440 V560 H-20Z" fill="{SAND}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>')
    else:
        o.append(f'<path d="M30 474 Q140 380 290 410 Q410 384 482 474 Q256 512 30 474Z" fill="{SAND}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>')
    tw, geo = twister((256, 106), (296, 268), (226, 404))
    # dust thrown up where the tip digs into the dune: outlines first, then the fills, so the puffs merge into one cloud
    tipx, tipy = geo[-1][0], geo[-1][1]
    puffs = ((-66, 22, 24), (58, 24, 24), (-34, 34, 31), (22, 36, 31), (-6, 18, 25))
    for dx, dy, r in puffs:
        o.append(f'<circle cx="{tipx + dx:.1f}" cy="{tipy + dy:.1f}" r="{r}" fill="{SAND_L}" stroke="{INK}" stroke-width="10"/>')
    for dx, dy, r in puffs:
        o.append(f'<circle cx="{tipx + dx:.1f}" cy="{tipy + dy:.1f}" r="{r - 5}" fill="{SAND_L}"/>')
    o.append(tw)
    if face:
        o.append(eyes(geo))
    # the wind around it, and bits of the desert going round
    for d in ('M34 250 Q70 232 104 246', 'M410 206 Q448 190 484 208', 'M46 128 Q76 116 102 124', 'M400 318 Q432 306 462 320'):
        o.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>')
    for x, y, r, rot, fill in ((62, 150, 12, 20, CREAM), (58, 322, 9, 50, SAND_L), (452, 104, 10, 35, CREAM), (112, 78, 8, 60, SAND_L), (470, 262, 8, 15, CREAM)):
        o.append(f'<rect x="{x - r}" y="{y - r}" width="{2 * r}" height="{2 * r}" rx="3" transform="rotate({rot} {x} {y})" fill="{fill}" stroke="{INK}" stroke-width="7"/>')
    if badge:
        o.append('</g>')
        if not bleed:
            o.append(f'<rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="{INK}" stroke-width="12"/>')
    return f'<g transform="scale({s})">' + ''.join(o) + '</g>'


def emblem_small():
    """The emblem for a browser tab: the same picture with everything fine taken out, so it holds at 16 pixels."""
    o = ['<clipPath id="clip"><rect x="0" y="0" width="512" height="512" rx="112"/></clipPath><g clip-path="url(#clip)">']
    o.append(f'<rect width="512" height="512" fill="{TEAL}"/>')
    o.append(f'<circle cx="262" cy="232" r="196" fill="{SUN_D}" stroke="{INK}" stroke-width="16"/>')
    o.append(f'<circle cx="262" cy="232" r="140" fill="{SUN}"/>')
    o.append(f'<path d="M-20 452 Q150 384 320 430 T540 414 V560 H-20Z" fill="{SAND}" stroke="{INK}" stroke-width="16" stroke-linejoin="round"/>')
    tw, geo = twister((256, 92), (292, 262), (238, 412), bands=BANDS_SMALL, stroke=16)
    tipx, tipy = geo[-1][0], geo[-1][1]
    puffs = ((-62, 34, 34), (56, 36, 34), (-4, 44, 38))
    for dx, dy, r in puffs:
        o.append(f'<circle cx="{tipx + dx:.1f}" cy="{tipy + dy:.1f}" r="{r}" fill="{SAND_L}" stroke="{INK}" stroke-width="16"/>')
    for dx, dy, r in puffs:
        o.append(f'<circle cx="{tipx + dx:.1f}" cy="{tipy + dy:.1f}" r="{r - 8}" fill="{SAND_L}"/>')
    o.append(tw)
    o.append('</g>')
    o.append(f'<rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="{INK}" stroke-width="16"/>')
    return ''.join(o)


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

PUBLIC = os.path.join(ROOT, 'public')


def render(data, targets):
    """Draw an svg that is not kept as a file: targets are (path, width) pairs."""
    tmp = os.path.join(OUT, '.tmp.svg')
    open(tmp, 'w').write(data)
    for target, width in targets:
        subprocess.run(['rsvg-convert', '-w', str(width), tmp, '-o', target], check=True)
    os.remove(tmp)


# 1. the emblem alone: the press kit, the icon of the site when it is added to a home screen
write('mark.svg', svg(512, 512, emblem()), [(os.path.join(OUT, 'mark-512.png'), 512), (os.path.join(PUBLIC, 'icon-192.png'), 192), (os.path.join(PUBLIC, 'icon-512.png'), 512)])
render(svg(512, 512, emblem(bleed=True)), [(os.path.join(PUBLIC, 'apple-touch-icon.png'), 180)])
# the variant with eyes, kept beside it for comparison; nothing on the site uses it
render(svg(512, 512, emblem(face=True)), [(os.path.join(OUT, 'mark-eyes.png'), 512)])

# 1a. the browser tab: the simplified emblem, as svg, as png, and as an .ico drawn at each size (needs ImageMagick)
open(os.path.join(PUBLIC, 'favicon.svg'), 'w').write(svg(512, 512, emblem_small()))
sizes = (48, 32, 16)
render(svg(512, 512, emblem_small()), [(os.path.join(PUBLIC, 'favicon-96.png'), 96)] + [(os.path.join(OUT, f'.ico-{n}.png'), n) for n in sizes])
subprocess.run(['convert'] + [os.path.join(OUT, f'.ico-{n}.png') for n in sizes] + [os.path.join(PUBLIC, 'favicon.ico')], check=True)
for n in sizes:
    os.remove(os.path.join(OUT, f'.ico-{n}.png'))

# 2. emblem and wordmark side by side: the site header, letterheads
size = 150
wm, ww, bottom, cap = wordmark(0, 0, size)
pad = 26
mark_h = 300
total_w = mark_h + 44 + ww + pad * 2 + 20
total_h = mark_h + pad * 2
lockup = lambda mark: (f'<g transform="translate({pad} {pad}) scale({mark_h / 512})">{mark}</g>'
                       f'<g transform="translate({pad + mark_h + 44} {pad + mark_h * 0.5 + cap * 0.28})">{wm}</g>')
write('logo.svg', svg(total_w, total_h, lockup(emblem())), [(os.path.join(OUT, 'logo.png'), 1600)])
# the same with the simplified emblem, for the site header, where the emblem is about 44 pixels high
write('logo-small.svg', svg(total_w, total_h, lockup(emblem_small())))

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
