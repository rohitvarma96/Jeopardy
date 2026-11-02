"""Optimize the three approved-source candidates without generating artwork."""

import argparse
from pathlib import Path

from PIL import Image, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--arcane", type=Path, required=True)
    parser.add_argument("--shadow", type=Path, required=True)
    parser.add_argument("--arena", type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1] / "assets" / "images"

    for name in ("arcane", "shadow"):
        with Image.open(getattr(args, name)) as source:
            image = source.convert("RGBA")
            alpha = image.getchannel("A")
            if alpha.getextrema()[0] != 0 or alpha.getextrema()[1] < 250:
                raise ValueError(f"{name} requires real alpha and an opaque foreground.")
            image = ImageOps.contain(image, (512, 768), Image.Resampling.LANCZOS)
            if image.size != (512, 768):
                raise ValueError(f"{name} must have a 2:3 aspect ratio.")
            target = root / "fighters" / name / "full.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            image.save(target, optimize=True)
            print(f"{name}: {image.size}, RGBA PNG, {target.stat().st_size} bytes")

    with Image.open(args.arena) as source:
        image = ImageOps.fit(source.convert("RGB"), (1280, 720), Image.Resampling.LANCZOS)
        target = root / "arenas" / "mystic-arena.jpg"
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, quality=88, optimize=True)
        print(f"arena: {image.size}, RGB JPEG, {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
