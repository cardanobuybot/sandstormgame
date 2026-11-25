#!/usr/bin/env python3
"""Cut pictures of buildings, units and the worm out of the game's sprite atlas for the site.

    python3 tools/export-sprites.py /path/to/dune-of-clash

Reads src/rendering/sprites.gen.json and public/sprites/p*.webp of the game and writes
public/img/dc/sprites/*.webp here: one picture per building level (a gun gets its head put on, the way the
game's own build menu does it), one per unit, the worm and the two resource icons. Needs Pillow.
Run it again after the game's sprites are re-baked.
"""
import json
import os
import sys
from PIL import Image

GAME = sys.argv[1] if len(sys.argv) > 1 else '../dune-of-clash'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'img', 'dc', 'sprites')
MAX = 320  # longest side of a picture, in pixels (shown at up to 160 CSS pixels)

atlas = json.load(open(f'{GAME}/src/rendering/sprites.gen.json'))
frames = atlas['frames']
pages = [Image.open(f'{GAME}/public/sprites/{p}').convert('RGBA') for p in atlas['pages']]
buildings = json.load(open(f'{GAME}/src/data/buildings.json'))
units = json.load(open(f'{GAME}/src/data/units.json'))

# the same tables as src/rendering/art.ts of the game
BUILDING_ART = {
    'citadel': ('citadel', None), 'collector': ('pump', None), 'storage': ('tank', None), 'salvage': ('salvage', None),
    'depot': ('depot', None), 'barracks': ('barracks', None), 'proving': ('proving', None), 'motor': ('motor', None),
    'rotor': ('rotor', None), 'turret': ('turret', 'turreth'), 'shellpit': ('shellpit', None), 'flak': ('flak', 'flakh'),
    'blind': ('blind', 'blindh'), 'rocket': ('rocket', 'rocketh'), 'wall': ('wall', None), 'trap': ('trap', None),
    'snare': ('snare', None),
}
UNIT_ART = {
    'infantry': ('inf', 4), 'shooter': ('sho', 4), 'breaker': ('brk', 0), 'scavenger': ('scv', 0), 'flyer': ('fly', 2),
    'bulwark': ('blw', 0), 'longshot': ('lng', 0), 'wrench': ('wrn', 0), 'thunderwing': ('thw', 2),
}


def compose(parts, limit=MAX):
    """parts: [(frame name, dx, dy)] in world pixels from the first frame's anchor. Returns an RGBA image."""
    boxes = []
    for name, dx, dy in parts:
        f = frames[name]
        r = f['r']
        boxes.append((f, dx - f['ax'] / r, dy - f['ay'] / r, dx + (f['w'] - f['ax']) / r, dy + (f['h'] - f['ay']) / r))
    x0 = min(b[1] for b in boxes); y0 = min(b[2] for b in boxes)
    x1 = max(b[3] for b in boxes); y1 = max(b[4] for b in boxes)
    k = limit / max(x1 - x0, y1 - y0)
    k = min(k, max(b[0]['r'] for b in boxes))  # never above the baked resolution
    out = Image.new('RGBA', (max(1, round((x1 - x0) * k)), max(1, round((y1 - y0) * k))), (0, 0, 0, 0))
    for f, bx0, by0, bx1, by1 in boxes:
        tile = pages[f['a']].crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
        w, h = max(1, round((bx1 - bx0) * k)), max(1, round((by1 - by0) * k))
        tile = tile.resize((w, h), Image.LANCZOS)
        out.alpha_composite(tile, (round((bx0 - x0) * k), round((by0 - y0) * k)))
    box = out.getbbox()
    return out.crop(box) if box else out


def save(img, name):
    img.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=86, method=6)
    return img.size


def tier(levels, level):
    return min(3, 1 + ((max(1, level) - 1) * 3) // levels)


os.makedirs(OUT, exist_ok=True)
sizes = {}
for key, d in buildings.items():
    base, head = BUILDING_ART[key]
    n = len(d['levels'])
    for level in range(1, n + 1):
        if key == 'wall':
            parts = [(f'wall_{level}_5', 0, 0)]
        elif key == 'collector':
            parts = [(f'pump_{level}_0', 0, 0)]
        else:
            parts = [(f'{base}_{level}', 0, 0)]
        if head:
            sx, sy = frames[parts[0][0]]['s']['head']
            parts.append((f'{head}_{tier(n, level)}_1', sx, sy))
        # small things are baked small: do not blow a wall or a mine up to the size of a Citadel
        limit = MAX if d['size'] >= 2 else 160
        sizes[f'b-{key}-{level}'] = save(compose(parts, limit), f'b-{key}-{level}')

for key in units:
    prefix, n = UNIT_ART[key]
    # direction 0 (three-quarter view towards the camera) reads best on a page
    name = f'{prefix}_0_0' if n else f'{prefix}_0'
    sizes[f'u-{key}'] = save(compose([(name, 0, 0)], 240), f'u-{key}')

for name, frame, limit in (('worm', 'worm_0', 360), ('ico-oil', 'ico_barrel', 96), ('ico-scrap', 'ico_scrap', 96), ('blind-hidden', 'blind_hidden', 200)):
    sizes[name] = save(compose([(frame, 0, 0)], limit), name)

json.dump({k: list(v) for k, v in sorted(sizes.items())}, open(os.path.join(OUT, 'sizes.json'), 'w'), indent=0)
total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f'{len(sizes)} pictures, {total // 1024} KB')
