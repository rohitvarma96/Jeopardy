"""Build font-independent vector and transparent raster identity assets."""
from pathlib import Path
import json
import math

from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images" / "brand"
OUT.mkdir(parents=True, exist_ok=True)
FONT = TTFont(ROOT / "assets" / "fonts" / "BarlowCondensed-ExtraBold.ttf")
GLYPHS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
COLORS = {"chalk": "#F1F0E8", "ink": "#11141D", "red": "#FF354F", "acid": "#E9FF3C"}
SCALE = 2
MARK = {
    "left": [(130, 5), (20, 73), (15, 135), (35, 148), (9, 166), (5, 226), (99, 282), (157, 18)],
    "right": [(171, 18), (265, 73), (261, 133), (238, 148), (254, 168), (250, 226), (117, 300)],
    "holes": [
        [(56, 100), (96, 78), (79, 122)],
        [(48, 194), (76, 173), (68, 217)],
        [(192, 88), (219, 104), (214, 126), (186, 110)],
        [(175, 177), (204, 198), (175, 222)],
    ],
}


class FlattenPen(BasePen):
    def __init__(self):
        super().__init__(GLYPHS)
        self.contours = []
        self.points = []

    def _moveTo(self, point):
        self.points = [point]

    def _lineTo(self, point):
        self.points.append(point)

    def _curveToOne(self, p1, p2, p3):
        p0 = self._getCurrentPoint()
        for i in range(1, 21):
            t = i / 20
            self.points.append(tuple((1-t)**3*p0[k] + 3*(1-t)**2*t*p1[k] + 3*(1-t)*t*t*p2[k] + t**3*p3[k] for k in (0, 1)))

    def _qCurveToOne(self, p1, p2):
        p0 = self._getCurrentPoint()
        for i in range(1, 17):
            t = i / 16
            self.points.append(tuple((1-t)**2*p0[k] + 2*(1-t)*t*p1[k] + t*t*p2[k] for k in (0, 1)))

    def _closePath(self):
        self.contours.append(self.points)
        self.points = []

    def _endPath(self):
        self._closePath()


def polygon_path(points):
    return "M" + " L".join(f"{x:g} {y:g}" for x, y in points) + " Z"


def mask_polygons(size, contours):
    mask = Image.new("L", size)
    for points in contours:
        layer = Image.new("L", size)
        ImageDraw.Draw(layer).polygon([(round(x*SCALE), round(y*SCALE)) for x, y in points], fill=255)
        mask = ImageChops.difference(mask, layer)
    return mask


def word(text, x, y, width, height):
    offset = 0
    bounds = BoundsPen(GLYPHS)
    for char in text:
        glyph = GLYPHS[CMAP[ord(char)]]
        glyph.draw(TransformPen(bounds, (1, 0, 0, 1, offset, 0)))
        offset += glyph.width - 18
    left, bottom, right, top = bounds.bounds
    sx, sy = width/(right-left), height/(top-bottom)
    shear = math.tan(math.radians(8))*sy
    paths, contours = [], []
    offset = 0
    for char in text:
        glyph = GLYPHS[CMAP[ord(char)]]
        transform = (sx, 0, shear, -sy, x+sx*(offset-left)-shear*bottom, y+sy*top)
        vector = SVGPathPen(GLYPHS)
        glyph.draw(TransformPen(vector, transform))
        paths.append(vector.getCommands())
        flat = FlattenPen()
        glyph.draw(TransformPen(flat, transform))
        contours.extend(flat.contours)
        offset += glyph.width - 18
    return "".join(paths), contours


def build(variant):
    foreground = COLORS["ink"] if variant == "ink" else COLORS["chalk"]
    red = COLORS["red"] if variant == "color" else foreground
    size = (1100*SCALE, 350*SCALE)
    image = Image.new("RGBA", size)
    shapes = []

    def paint(contours, color, paths=None):
        nonlocal image
        mask = mask_polygons(size, contours)
        image.alpha_composite(Image.composite(Image.new("RGBA", size, color), Image.new("RGBA", size), mask))
        shapes.append(f'<path fill="{color}" fill-rule="evenodd" d="{paths or " ".join(polygon_path(p) for p in contours)}"/>')

    mapped = lambda points: [(x*.85+12, y*.95+24) for x, y in points]
    paint([mapped(MARK["left"]), *[mapped(h) for h in MARK["holes"][:2]]], red)
    paint([mapped(MARK["right"]), *[mapped(h) for h in MARK["holes"][2:]]], foreground)
    for text, args in [("BRAIN", (286, 28, 430, 112)), ("BRAWLERS", (264, 160, 780, 156))]:
        path, contours = word(text, *args)
        paint(contours, foreground, path)
    cuts = [
        [(410, 317), (535, 237), (455, 310)],
        [(642, 214), (691, 168), (668, 208)],
        [(955, 284), (1025, 245), (987, 283)],
    ]
    image.putalpha(ImageChops.subtract(image.getchannel("A"), mask_polygons(size, cuts)))
    content = '<g mask="url(#speed-cuts)">' + "".join(shapes) + "</g>"
    shapes = []
    if variant == "color":
        paint([[(728, 28), (775, 28), (718, 82)]], red)
        paint([[(894, 334), (1054, 315), (970, 341)]], COLORS["acid"])
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="350" viewBox="0 0 1100 350" '
           'role="img" aria-labelledby="title description"><title id="title">Brain Brawlers</title>'
           '<desc id="description">Original split-BB emblem and forward-leaning stacked wordmark. '
           'Outlined lettering; no external font or image dependencies.</desc>'
           '<defs><mask id="speed-cuts"><rect width="1100" height="350" fill="white"/>'
           '<path fill="black" d="' + " ".join(polygon_path(p) for p in cuts) + '"/></mask></defs>'
           + content + "".join(shapes) + "</svg>")
    (OUT / f"brain-brawlers-{variant}.svg").write_text(svg, encoding="utf-8")
    image.resize((1100, 350), Image.Resampling.LANCZOS).save(OUT / f"brain-brawlers-{variant}.png", optimize=True)
    return image


master = build("color")
build("chalk")
build("ink")
mark = master.crop((0, 0, 250*SCALE, 350*SCALE))
canvas = Image.new("RGBA", (1024, 1024), COLORS["ink"])
mark.thumbnail((700, 810), Image.Resampling.LANCZOS)
canvas.alpha_composite(mark, ((1024-mark.width)//2, (1024-mark.height)//2))
canvas.save(OUT / "brain-brawlers-icon.png", optimize=True)
(OUT / "emblem-source.json").write_text(json.dumps(MARK, indent=2)+"\n", encoding="utf-8")
print("Built color/chalk/ink SVG and transparent PNG logos, plus the 1024px app icon.")
