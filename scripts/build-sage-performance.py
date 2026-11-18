"""Build the Sage's small, shared texture atlas from the authored puppet sheet."""

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "assets" / "images" / "fighters" / "home"
SOURCE = ART / "sage-source.png"
OUT = ROOT / "src" / "assets" / "sage-performance.json"
HEAD_SOCKET = (216, 172)

# Bounds and connection points are authored against this specific source drawing.
PARTS = {
    "body": ((0, 98, 411, 1210), (205, 132), (8, 8)),
    "neutral": ((439, 20, 625, 253), (480, 197), (428, 8)),
    "focus": ((718, 20, 903, 253), (759, 197), (648, 8)),
    "acknowledge": ((997, 20, 1190, 253), (1038, 197), (868, 8)),
    "blink": ((439, 270, 625, 505), (480, 447), (428, 268)),
    "glance": ((718, 270, 903, 505), (759, 447), (648, 268)),
    "ready": ((997, 270, 1190, 505), (1070, 447), (868, 268)),
    "open": ((400, 535, 666, 774), (431, 703), (428, 528)),
    "pinch": ((668, 535, 907, 774), (701, 710), (778, 528)),
    "release": ((946, 525, 1235, 782), (982, 721), (1128, 528)),
    "coat": ((708, 790, 886, 1225), (787, 813), (428, 820)),
    "star": ((923, 827, 1241, 1150), (1083, 989), (648, 820)),
    "collar": ((150, 100, 260, 210), (205, 132), (1010, 820)),
}

# Follow the skin/shirt boundary, not the detached drawing's collar base.
NECKLINE = [(0, 140), (11, 143), (17, 163), (34, 174), (52, 184), (70, 195), (95, 194), (103, 187), (193, 187)]
READY_NECKLINE = [(0, 150), (23, 158), (35, 169), (54, 180), (68, 184), (87, 175), (104, 162), (112, 148), (193, 148)]
FRONT_COLLAR = [(164, 114), (174, 120), (192, 126), (213, 131), (232, 139), (240, 132), (248, 155), (249, 204), (205, 181), (170, 153)]


def polygon_mask(size, points):
    mask = Image.new("L", (size[0] * 4, size[1] * 4))
    ImageDraw.Draw(mask).polygon([(round(x * 4), round(y * 4)) for x, y in points], fill=255)
    return mask.resize(size, Image.Resampling.LANCZOS)


def matte(image):
    image = image.convert("RGBA")
    pixels = []
    for r, g, b, _ in image.getdata():
        # The source contains no green costume elements; retain purple/white
        # antialiasing while removing and despilling the green backing.
        alpha = round(255 * max(0, min(1, (max(r, b) - g + 100) / 70)))
        pixels.append((r, min(g, max(r, b)), b, alpha))
    image.putdata(pixels)
    return image


def prepare_part(keyed, name, bounds):
    crop = keyed.crop(bounds)
    if name in ("neutral", "focus", "acknowledge", "blink", "glance", "ready"):
        edge = READY_NECKLINE if name == "ready" else NECKLINE
        mask = polygon_mask(crop.size, [(0, 0), (crop.width, 0), *reversed(edge)])
        crop.putalpha(ImageChops.multiply(crop.getchannel("A"), mask))
    elif name == "collar":
        mask = polygon_mask(crop.size, [(x - bounds[0], y - bounds[1]) for x, y in FRONT_COLLAR])
        crop.putalpha(ImageChops.multiply(crop.getchannel("A"), mask))
    elif name == "body":
        # Repaint the exposed neck inside the original shirt opening. The
        # stationary foreground collar hides this overlap during head turns.
        paint = Image.new("RGBA", crop.size, (110, 63, 45, 255))
        draw = ImageDraw.Draw(paint)
        draw.polygon([(173, 18), (175, 10), (181, 7), (202, 25), (215, 34), (189, 26)], fill=(77, 43, 35, 255))
        draw.polygon([(181, 7), (210, 11), (231, 18), (228, 24), (204, 16)], fill=(144, 82, 53, 255))
        paint.putalpha(polygon_mask(crop.size, [(175, 10), (181, 7), (210, 11), (231, 18), (235, 38), (215, 34), (189, 26), (173, 18)]))
        crop.alpha_composite(paint)
        # A disconnected sliver of the open-hand drawing crosses this crop.
        ImageDraw.Draw(crop).rectangle((399, 430, crop.width, 689), fill=(0, 0, 0, 0))
    return crop


def main():
    source = Image.open(SOURCE)
    if source.size != (1254, 1254):
        raise ValueError(f"Unexpected Sage source dimensions: {source.size}")
    keyed = matte(source)
    atlas = Image.new("RGBA", (1536, 1536))
    parts = {}
    for name, (bounds, anchor, position) in PARTS.items():
        crop = prepare_part(keyed, name, bounds)
        box = crop.getbbox()
        if box is None:
            raise ValueError(f"Empty Sage part: {name}")
        crop = crop.crop(box)
        x, y = position
        atlas.paste(crop, position)
        parts[name] = {
            "rect": {"x": x, "y": y, "width": crop.width, "height": crop.height},
            "anchor": {
                "x": anchor[0] - bounds[0] - box[0],
                "y": anchor[1] - bounds[1] - box[1],
            },
        }
    atlas.save(ART / "sage-atlas.png", optimize=True)
    rest = Image.new("RGBA", (560, 1000))
    for name, anchor, scale in [
        ("coat", (324, 411), .88), ("body", (218, 177), .76),
        ("neutral", HEAD_SOCKET, .76), ("collar", (218, 177), .76),
        ("open", (347, 374), .76),
        ("star", (472.4, 261.52), .29),
    ]:
        part = parts[name]
        rect = part["rect"]
        crop = atlas.crop((rect["x"], rect["y"], rect["x"] + rect["width"], rect["y"] + rect["height"]))
        crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
        rest.alpha_composite(crop, (
            round(anchor[0] - part["anchor"]["x"] * scale),
            round(anchor[1] - part["anchor"]["y"] * scale),
        ))
    rest.save(ART / "sage-rest.png", optimize=True)
    OUT.write_text(json.dumps({
        "width": 1536, "height": 1536,
        "headSocket": {"x": HEAD_SOCKET[0], "y": HEAD_SOCKET[1]},
        "parts": parts,
    }, indent=2) + "\n")
    print(f"Built {len(parts)} authored Sage parts; one 1536-square RGBA atlas (9 MiB decoded).")


if __name__ == "__main__":
    main()
