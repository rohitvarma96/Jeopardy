"""Preserve every painted alpha pixel while omitting empty mesh cells."""
import json
import math
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
columns, rows = 24, 48
result = {}
for file in sorted((root / "assets/images/fighters/human").glob("*.png")):
    image = Image.open(file).convert("RGBA")
    alpha = image.getchannel("A")
    width, height = image.size
    cells = []
    for row in range(rows):
        for column in range(columns):
            bounds = (
                math.floor(column / columns * width),
                math.floor(row / rows * height),
                min(width, math.ceil((column + 1) / columns * width) + 1),
                min(height, math.ceil((row + 1) / rows * height) + 1),
            )
            if alpha.crop(bounds).getbbox():
                cells.append(row * columns + column)
    result[file.stem] = {"width": width, "height": height, "columns": columns, "rows": rows, "cells": cells}
target = root / "src/assets/painted-coverage.json"
target.write_text(json.dumps(result, separators=(",", ":")) + "\n", encoding="utf-8")
print("Built exact painted alpha coverage for", len(result), "Brawlers.")
