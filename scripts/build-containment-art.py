"""Original painted vapor textures and source-fitted chest seam-light mattes."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "images" / "chests" / "containment"
SEAMS = {
    "field": [(95, 151), (248, 164), (423, 180), (565, 151)],
    "arc": [(92, 146), (165, 155), (192, 169), (389, 188), (405, 173), (486, 173), (562, 156)],
    "overdrive": [(86, 127), (230, 151), (404, 157), (550, 127)],
    "sovereign": [(93, 116), (420, 157), (559, 121)],
}

# Three distinct silhouettes: rear bank, foreground bank and rising vent.
CONTOURS = [
    [(12, 218), (39, 164), (74, 177), (81, 101), (135, 117), (151, 65), (203, 89), (245, 32), (284, 65), (322, 42), (373, 88), (414, 78), (426, 122), (483, 135), (496, 192), (475, 256), (433, 245), (396, 299), (345, 276), (309, 331), (249, 315), (216, 348), (158, 307), (107, 327), (80, 288), (28, 274)],
    [(17, 281), (46, 242), (38, 187), (85, 195), (111, 132), (159, 151), (170, 101), (207, 117), (242, 52), (276, 90), (313, 27), (349, 61), (390, 50), (421, 96), (469, 111), (477, 157), (500, 204), (473, 259), (438, 243), (408, 309), (354, 293), (332, 337), (277, 314), (234, 354), (187, 331), (137, 352), (88, 318), (45, 324)],
    [(210, 374), (175, 323), (165, 285), (107, 260), (130, 216), (105, 174), (170, 149), (186, 85), (234, 104), (275, 29), (329, 65), (349, 135), (394, 158), (383, 204), (344, 240), (338, 281), (301, 322), (282, 373)],
]


def noise(rng, size, cells):
    values = rng.integers(0, 256, (cells[1], cells[0]), dtype=np.uint8)
    return np.asarray(Image.fromarray(values).resize(size, Image.Resampling.BICUBIC), dtype=np.float32) / 255


def smoke(index):
    size = (512, 384)
    rng = np.random.default_rng(831 + index * 137)
    mask = Image.new("L", size)
    ImageDraw.Draw(mask).polygon(CONTOURS[index], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(10 if index < 2 else 6))
    broad, medium, fine = (noise(rng, size, cells) for cells in [(11, 8), (30, 23), (90, 64)])
    field = broad * .57 + medium * .32 + fine * .11
    alpha = np.asarray(mask, dtype=np.float32) / 255
    alpha *= np.clip((field - .19) * 1.8, 0, 1)
    alpha = np.clip(alpha * 1.45, 0, 1)
    y = np.arange(size[1], dtype=np.float32)[:, None] / size[1]
    x = np.arange(size[0], dtype=np.float32)[None, :] / size[0]
    neck = .48 - np.clip((y - .6) / .4, 0, 1) * .39
    alpha *= np.clip((neck - np.abs(x - .49)) * 20, 0, 1)
    # Cold light grazes the upper banks; deep folds remain charcoal rather
    # than flat white fog. Low-alpha outskirts retain fine internal breakup.
    gradient_y, gradient_x = np.gradient(broad)
    sculpt = np.clip(gradient_x * -11 + gradient_y * -7, -.45, .45)
    value = np.clip(55 + field * 135 + (1 - y) * 40 + sculpt * 105, 0, 255)
    rgba = np.empty((size[1], size[0], 4), dtype=np.uint8)
    rgba[:, :, 0] = value * .91
    rgba[:, :, 1] = value * .96
    rgba[:, :, 2] = value
    rgba[:, :, 3] = alpha * 255
    return Image.fromarray(rgba)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (1536, 384))
    for index in range(3):
        atlas.paste(smoke(index), (index * 512, 0))
    atlas.save(OUT / "vapor-atlas.png", optimize=True)
    for family, seam in SEAMS.items():
        source = Image.open(ROOT / "assets" / "images" / "chests" / f"{family}-closed.png").convert("RGBA")
        core = Image.new("L", source.size)
        ImageDraw.Draw(core).line(seam, fill=255, width=2)
        soft = core.filter(ImageFilter.GaussianBlur(6))
        alpha = np.maximum(np.asarray(core), np.asarray(soft) * 1.8)
        alpha = np.minimum(alpha, np.asarray(source.getchannel("A")))
        layer = Image.new("RGBA", source.size, (242, 246, 255, 0))
        layer.putalpha(Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8)))
        layer.save(OUT / f"{family}-seam.png", optimize=True)
    print("Built three original vapor silhouettes in one 1536x384 atlas and four source-alpha seam mattes.")


if __name__ == "__main__":
    main()
