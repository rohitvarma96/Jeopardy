"""Split the current painted chests into aligned, physically hinged layers."""
import json
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

root = Path(__file__).resolve().parents[1]
folder = root / "assets/images/chests"
designs = {
    "field": {
        "outline": [(89, 150), (109, 126), (154, 101), (240, 98), (529, 112), (572, 144), (572, 220), (530, 267), (248, 275), (113, 250), (83, 218)],
        "lid": [(91, 151), (106, 130), (154, 101), (240, 98), (529, 112), (572, 144), (572, 164), (419, 193), (118, 167), (90, 160)],
        "mouth": [(157, 111), (527, 122), (416, 190), (101, 159)],
        "hinge": [[155, 105], [530, 116]], "depth": [-62, 70], "lift": 145, "latch": [273, 185], "accent": "#E9FF3C",
    },
    "arc": {
        "outline": [(80, 145), (97, 119), (143, 79), (195, 72), (451, 111), (535, 132), (565, 150), (565, 235), (524, 280), (305, 288), (117, 259), (82, 220)],
        "lid": [(80, 145), (97, 119), (143, 79), (195, 72), (451, 111), (535, 132), (565, 150), (565, 170), (488, 190), (394, 194), (293, 188), (182, 180), (170, 170), (86, 159)],
        "mouth": [(148, 88), (527, 139), (488, 184), (95, 155)],
        "hinge": [[148, 81], [528, 134]], "depth": [-49, 78], "lift": 150, "latch": [276, 195], "accent": "#C4A4FF",
    },
    "overdrive": {
        "outline": [(77, 116), (112, 90), (154, 73), (280, 76), (505, 108), (577, 136), (578, 226), (530, 277), (271, 287), (102, 254), (76, 218)],
        "lid": [(77, 116), (112, 90), (154, 73), (280, 76), (505, 108), (577, 136), (577, 155), (450, 176), (302, 171), (239, 161), (226, 172), (99, 153), (77, 138)],
        "mouth": [(157, 84), (531, 126), (450, 171), (87, 144)],
        "hinge": [[153, 79], [535, 120]], "depth": [-66, 73], "lift": 150, "latch": [269, 173], "accent": "#FF596B",
    },
    "sovereign": {
        "outline": [(85, 79), (157, 40), (294, 44), (511, 79), (568, 109), (570, 233), (526, 294), (295, 314), (111, 280), (81, 239)],
        "lid": [(85, 79), (157, 40), (294, 44), (511, 79), (568, 109), (565, 135), (473, 170), (109, 132), (83, 112)],
        "mouth": [(162, 53), (528, 103), (467, 160), (95, 121)],
        "hinge": [[162, 46], [529, 96]], "depth": [-68, 74], "lift": 158, "latch": [269, 155], "accent": "#9CE2EF",
    },
}


def polygon_mask(size, points):
    mask = Image.new("L", size)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask


registry = []
for family, design in designs.items():
    source = Image.open(folder / f"{family}-closed.png").convert("RGBA")
    width, height = source.size
    clean = ImageChops.multiply(source.getchannel("A"), polygon_mask(source.size, design["outline"]))
    lid_mask = ImageChops.multiply(clean, polygon_mask(source.size, design["lid"]))
    base_mask = ImageChops.subtract(clean, lid_mask)
    base, lid = source.copy(), source.copy()
    base.putalpha(base_mask)
    lid.putalpha(lid_mask)
    base.save(folder / f"{family}-base.png", optimize=True)
    lid.save(folder / f"{family}-lid.png", optimize=True)

    inner = Image.new("RGBA", source.size)
    paint = ImageDraw.Draw(inner)
    paint.polygon(design["mouth"], fill="#080D14", outline="#87919D", width=5)
    inset = [(x, y + 9) for x, y in design["mouth"]]
    paint.polygon(inset, fill="#101925", outline="#354354", width=3)
    paint.line([design["mouth"][0], design["mouth"][1]], fill=design["accent"], width=3)
    cx = sum(p[0] for p in design["mouth"]) / 4
    cy = sum(p[1] for p in design["mouth"]) / 4
    paint.line([(cx - 42, cy + 10), (cx + 42, cy + 15)], fill=design["accent"], width=3)
    inner.save(folder / f"{family}-interior.png", optimize=True)

    under = Image.new("RGBA", source.size)
    pixels = under.load()
    for y in range(height):
        for x in range(width):
            tone = int(25 + 27 * (1 - y / height) + 2 * math.sin(x * .2))
            pixels[x, y] = (tone, tone + 6, tone + 14, 255)
    paint = ImageDraw.Draw(under)
    paint.line(design["lid"] + [design["lid"][0]], fill="#A2ACB7", width=7)
    a, b = design["hinge"]
    paint.line([(a[0] + 8, a[1] + 12), (b[0] - 8, b[1] + 12)], fill=design["accent"], width=3)
    paint.rounded_rectangle((cx - 56, cy - 15, cx + 56, cy + 16), radius=7, fill="#111925", outline="#758697", width=3)
    paint.line([(cx - 31, cy), (cx + 31, cy)], fill=design["accent"], width=3)
    under.putalpha(lid_mask)
    under.save(folder / f"{family}-lid-inner.png", optimize=True)

    geometry = {
        "width": width, "height": height, "padding": 200,
        "hinge": design["hinge"], "depth": design["depth"], "lift": design["lift"],
        "latch": design["latch"], "mouth": design["mouth"],
    }
    sources = ",\n".join(f"    {key}: require('../../assets/images/chests/{family}-{name}.png')"
                         for key, name in [("base", "base"), ("lid", "lid"), ("lidInner", "lid-inner"), ("interior", "interior")])
    registry.append(f"  {family}: {{\n    geometry: {json.dumps(geometry)},\n{sources},\n  }},")
    print(family, "aligned base, lid, inner lid and cavity:", source.size)

(root / "src/assets/chest-layers.ts").write_text(
    "// Generated by scripts/build-chest-layers.py from the current painted chest designs.\n"
    "export const chestLayers = {\n" + "\n".join(registry) + "\n} as const;\n", encoding="utf-8"
)
