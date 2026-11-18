"""Precompute bounded, opaque painted mesh anchors and their original colors."""
import json
import math
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
coverage = json.loads((root / "src/assets/painted-coverage.json").read_text())
result = {}
for fighter, spec in coverage.items():
    image = Image.open(root / f"assets/images/fighters/human/{fighter}.png").convert("RGBA")
    if image.size != (spec["width"], spec["height"]):
        raise ValueError(f"Rebuild painted coverage before fragment anchors: {fighter}")
    candidates = []
    for row in range(spec["rows"] + 1):
        for column in range(spec["columns"] + 1):
            x = min(image.width - 1, math.floor(column / spec["columns"] * image.width))
            y = min(image.height - 1, math.floor(row / spec["rows"] * image.height))
            r, g, b, alpha = image.getpixel((x, y))
            if alpha >= 240:
                candidates.append({
                    "vertex": row * (spec["columns"] + 1) + column,
                    "color": f"#{r:02X}{g:02X}{b:02X}",
                    "x": column / spec["columns"], "y": row / spec["rows"],
                })
    if len(candidates) < 32:
        raise ValueError(f"Not enough opaque painted anchors: {fighter}")
    chosen = [min(candidates, key=lambda p: (p["y"] - .14) ** 2 + (p["x"] - .5) ** 2)]
    while len(chosen) < 32:
        chosen.append(max(
            (p for p in candidates if p not in chosen),
            key=lambda p: min((p["x"] - q["x"]) ** 2 + (p["y"] - q["y"]) ** 2 for q in chosen),
        ))
    result[fighter] = {
        "width": image.width, "height": image.height,
        "points": [{"vertex": p["vertex"], "color": p["color"]} for p in chosen],
    }
target = root / "src/assets/brawler-fragments.json"
target.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
print("Built 32 opaque, source-colored fragment anchors for each of", len(result), "Brawlers.")
