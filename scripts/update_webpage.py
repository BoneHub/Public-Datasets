#!/usr/bin/env python3
"""
Update Webpage Script
Reads data/bonehub_public_datasets.json, ranks the datasets (most complete first) and writes
webpage/data.js for the GitHub Pages website. The JSON file itself is never reordered: it stays
in BoneHub ID order, and the ranking exists only in the generated data.js.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

from bonehub_data import DATA_PATH, DatasetError, load_datasets


def _count(items) -> int:
    return len(items)


def _has(items) -> int:
    return int(bool(items))


def _subjects(value) -> float:
    is_number = isinstance(value, (int, float)) and not isinstance(value, bool)
    return value if is_number else 0


def _open_access(policies) -> int:
    return int(any("open access" in policy.lower() for policy in policies))


def rank_datasets(datasets):
    """
    Order datasets for the website, most complete first. Each criterion is compared in turn
    (higher first); ties fall back to the BoneHub ID.
    """
    def key(d):
        return (
            -_count(d["Available 3D Bone Shapes"]),
            -_has(d["Mesh Model"]),
            -_has(d["Voxel Segmentation Mask"]),
            -_count(d["Secondary Imaged Regions"]),
            -_subjects(d["Number of Subjects"]),
            -_count(d["Available Information per Subject"]),
            -_open_access(d["Access Policy"]),
            d["BoneHub ID"],
        )

    return sorted(datasets, key=key)


def generate_data_js(datasets, output_path):
    """Write the data.js file with the datasets."""
    js_content = (
        f"// Auto-generated from data/{DATA_PATH.name} (ranked, most complete first)\n"
        "// Do not edit manually - run scripts/update_webpage.py instead\n"
        f"// Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        "\n"
        f"const datasetsData = {json.dumps(datasets, indent=2, ensure_ascii=False)};\n"
    )
    with open(output_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(js_content)
    print(f"✓ Generated {output_path} with {len(datasets)} datasets")


def main():
    output_path = Path(__file__).resolve().parent.parent / "webpage" / "data.js"

    if not DATA_PATH.exists():
        print(f"✗ Error: dataset file not found at {DATA_PATH}")
        return 1

    print(f"Reading {DATA_PATH}...")
    try:
        datasets = load_datasets()
    except DatasetError as error:
        print(f"✗ {DATA_PATH.name} has problems:\n{error}")
        return 1
    print(f"✓ Found {len(datasets)} datasets")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    generate_data_js(rank_datasets(datasets), output_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
