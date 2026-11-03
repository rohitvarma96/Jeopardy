"""Import the local Animation Lab's original vectors and skeletal clips, not frame captures."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import xml.etree.ElementTree as ET


EXPORT = r"""
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const root = process.argv[1];
const rig = await import(pathToFileURL(path.join(root, 'src', 'rig.mjs')));
const art = await import(pathToFileURL(path.join(root, 'src', 'artwork.mjs')));
const tokens = ['metal', 'light', 'edge', 'shadow', 'deep', 'cloth', 'clothLight',
  'clothDark', 'leather', 'skin', 'jewel', 'outline'];
const palette = Object.fromEntries(tokens.map((name, i) => [name, `C0FF${i.toString(16).padStart(2, '0')}`]));
const skins = Object.fromEntries([['sentinel', false], ['warden', true]].map(([name, frost]) => {
  const c = { ...art.CHARACTERS[frost ? 1 : 0], ...palette, frost };
  return [name, {
    bones: Object.fromEntries(rig.RIG.map(bone => [bone.name, art.artworkFor(bone, c)])),
    cape: art.capeArtwork(c, new Map(rig.RIG.map((bone, i) => [bone.name, `${i}:1`])))
  }];
}));
console.log(JSON.stringify({
  rig: rig.RIG,
  clips: rig.CLIPS.filter(clip => ['idle', 'punch', 'block', 'knockback', 'knockout', 'special'].includes(clip.action)),
  frostSpecial: { ...rig.CLIPS.find(clip => clip.action === 'special'), ...rig.SPECIAL_MOVES.frost },
  skins, tokens, bind: Object.fromEntries(rig.bindTransforms())
}));
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()
    root = args.source.resolve(strict=True)
    result = subprocess.run(
        ["node", "--input-type=module", "-e", EXPORT, str(root)],
        check=True, capture_output=True, text=True, encoding="utf-8",
    )
    source = json.loads(result.stdout)
    tokens = {f"C0FF{i:02X}": token for i, token in enumerate(source["tokens"])}

    def pigment(value):
        alpha, rgb = value[:2], value[2:].upper()
        return {"color": tokens.get(rgb, f"#{rgb}"), "opacity": int(alpha, 16) / 255}

    def vector(element):
        kind = element.tag
        props = element.attrib
        transform = {
            key: float(props[key])
            for key in ["x", "y", "rotation", "scaleX", "scaleY"]
            if key in props
        }
        common = {"transform": transform, "opacity": float(props.get("opacity", 1))}
        if kind == "Node":
            return {**common, "kind": "group", "children": [vector(child) for child in reversed(list(element))]}
        if kind != "Shape":
            raise ValueError(f"Unsupported reference node: {kind}")
        geometry = next(child for child in element if child.tag in ["PointsPath", "Ellipse", "Rectangle"])
        fill = element.find("Fill/SolidColor")
        stroke = element.find("Stroke")
        common["fill"] = pigment(fill.attrib["colorValue"]) if fill is not None else None
        common["stroke"] = (
            {**pigment(stroke.find("SolidColor").attrib["colorValue"]),
             "width": float(stroke.attrib.get("thickness", 2))}
            if stroke is not None else None
        )
        if geometry.tag == "PointsPath":
            vertices = [child for child in geometry if child.tag == "StraightVertex"]
            points = [[float(v.attrib["x"]), float(v.attrib["y"])] for v in vertices]
            weights = []
            for vertex in vertices:
                weight = vertex.find("Weight")
                if weight is not None:
                    indices, values = int(weight.attrib["indices"]), int(weight.attrib["values"])
                    weights.append([
                        sum(((values >> (i * 8)) & 255) / 255
                            for i in range(4) if ((indices >> (i * 8)) & 255) == bone + 1)
                        for bone in range(3)
                    ])
            return {**common, "kind": "path", "points": points, "weights": weights,
                    "closed": geometry.attrib.get("isClosed") == "true"}
        attributes = geometry.attrib
        return {**common, "kind": "oval" if geometry.tag == "Ellipse" else "rect",
                "width": float(attributes["width"]), "height": float(attributes["height"]),
                "radius": float(attributes.get("cornerRadiusTL", 0))}

    aliases = {"punch": "attack", "knockout": "fall"}
    channels = ["root.x", "root.y", "torso.scaleY"] + [f"{bone['name']}.rotation" for bone in source["rig"]]

    def clip(item):
        return {
            "frames": item["duration"], "contact": item["contact"],
            "loop": item["loop"], "hold": item.get("holdEnd", False),
            "keys": [{"frame": key["frame"], "easing": key["easing"],
                      "values": [key["values"][channel] for channel in channels]}
                     for key in item["keys"]],
        }

    data = {
        "source": "BB / 2D-Animation-Lab: original code-authored Rive artwork and timelines",
        "sha256": {name: hashlib.sha256((root / "src" / name).read_bytes()).hexdigest()
                   for name in ["rig.mjs", "artwork.mjs"]},
        "rig": source["rig"], "channels": channels, "bind": source["bind"],
        "clips": {aliases.get(item["action"], item["action"]): clip(item) for item in source["clips"]},
        "frostSpecial": clip(source["frostSpecial"]),
        "skins": {
            name: {
                "bones": {bone: vector(ET.fromstring(xml)) for bone, xml in skin["bones"].items() if xml},
                "cape": [vector(ET.fromstring(xml)) for xml in reversed(skin["cape"])],
            }
            for name, skin in source["skins"].items()
        },
    }
    output = Path(__file__).resolve().parents[1] / "src" / "components" / "fighters" / "combat" / "reference.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Imported {len(data['rig'])} bones, six shared actions, two special variants and both original vector skins.")
    print(f"{output}: {output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
