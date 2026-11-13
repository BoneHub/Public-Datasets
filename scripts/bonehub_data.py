"""
Shared definition of the BoneHub dataset registry, data/bonehub_public_datasets.json.

The file is a JSON array with one object per dataset, ordered by BoneHub ID (1, 2, 3, ...).
Every object has all the fields in FIELDS, in that order. Each field is one of:

- "id":     the BoneHub ID, a positive integer that is unique and never reused.
- "text":   a string, or null when unknown.
- "number": a number, or null when unknown. Free text is kept when the value is not a plain
            number (e.g. "more than 50 TB").
- "list":   a list of strings, one per value; [] when empty. Items must not contain ";".

Run this file to check the JSON file, or with --format to rewrite it in the standard layout:

    python scripts/bonehub_data.py
    python scripts/bonehub_data.py --format
"""

import json
import re
import sys
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "bonehub_public_datasets.json"

ID, TEXT, NUMBER, LIST = "id", "text", "number", "list"

FIELDS = {
    "BoneHub ID": ID,
    "Dataset Name": TEXT,
    "Access Link": LIST,
    "Related Paper": LIST,
    "Country": LIST,
    "Year": NUMBER,
    "Size": NUMBER,
    "Remarks": LIST,
    "Medical Images Included": TEXT,
    "Imaging Modality": LIST,
    "Image Source": LIST,
    "Image Source Details": LIST,
    "Primary Imaged Regions": LIST,
    "Secondary Imaged Regions": LIST,
    "Available 3D Bone Shapes": LIST,
    "Additional Structures": LIST,
    "Landmarks": LIST,
    "Voxel Segmentation Mask": LIST,
    "Mesh Model": LIST,
    "CAD Model": LIST,
    "Number of Subjects": NUMBER,
    "Available Information per Subject": LIST,
    "Subjects Vital Status": LIST,
    "Subjects Clinical Condition": LIST,
    "Access Policy": LIST,
    "Data Redistribution Policy": LIST,
    "Research Use Policy": LIST,
    "Commercial Use Policy": LIST,
    "License": LIST,
}

_NUMBER_RE = re.compile(r"^-?\d+(\.\d+)?$")


class DatasetError(ValueError):
    """Raised when the dataset file does not follow the format described above."""


def parse_number(text: str):
    """Return int/float for a plain number string, the stripped text otherwise, None if empty."""
    text = text.strip()
    if not text:
        return None
    if _NUMBER_RE.match(text):
        return float(text) if "." in text else int(text)
    return text


def _normalize_value(kind, value, where, errors):
    if kind == LIST:
        if value is None:
            return []
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            errors.append(f'{where}: must be a list of strings, e.g. ["value 1", "value 2"]')
            return value
        items = [item.strip() for item in value if item.strip()]
        for item in items:
            if ";" in item:
                errors.append(f'{where}: item "{item}" contains ";". Split it into separate list items.')
        return items

    if kind == TEXT:
        if value is None:
            return None
        if not isinstance(value, str):
            errors.append(f"{where}: must be a string or null")
            return value
        return value.strip() or None

    # ID and NUMBER
    if isinstance(value, str):
        value = parse_number(value)
    if kind == ID:
        if not isinstance(value, int) or isinstance(value, bool) or value < 1:
            errors.append(f"{where}: must be a positive integer")
        return value
    if value is not None and (isinstance(value, bool) or not isinstance(value, (int, float, str))):
        errors.append(f"{where}: must be a number, text or null")
    return value


def normalize_datasets(datasets):
    """
    Check the datasets and return a normalized copy: fields in FIELDS order, whitespace stripped,
    "" turned into null, numeric strings turned into numbers. Raises DatasetError listing every problem.
    """
    if not isinstance(datasets, list):
        raise DatasetError("The dataset file must contain a JSON array of dataset objects.")

    errors = []
    normalized = []
    previous_id = 0
    for index, record in enumerate(datasets):
        label = f"Dataset #{index + 1}"
        if not isinstance(record, dict):
            errors.append(f"{label}: must be a JSON object")
            continue
        if isinstance(record.get("BoneHub ID"), int):
            label = f"BoneHub ID {record['BoneHub ID']}"

        missing = [field for field in FIELDS if field not in record]
        unknown = [field for field in record if field not in FIELDS]
        if missing:
            errors.append(f"{label}: missing fields {missing}")
        if unknown:
            errors.append(f"{label}: unknown fields {unknown} (known fields are listed in scripts/bonehub_data.py)")

        clean = {}
        for field, kind in FIELDS.items():
            if field in record:
                clean[field] = _normalize_value(kind, record[field], f'{label}, "{field}"', errors)
        normalized.append(clean)

        if not clean.get("Dataset Name"):
            errors.append(f'{label}: "Dataset Name" must not be empty')
        dataset_id = clean.get("BoneHub ID")
        if isinstance(dataset_id, int):
            if dataset_id <= previous_id:
                errors.append(
                    f"{label}: datasets must be ordered by increasing BoneHub ID, "
                    f"but ID {dataset_id} comes after ID {previous_id}"
                )
            previous_id = max(previous_id, dataset_id)

    if errors:
        raise DatasetError("\n".join(errors))
    return normalized


def load_datasets(path: Path = DATA_PATH):
    """Read, check and normalize the dataset file."""
    try:
        with Path(path).open("r", encoding="utf-8") as f:
            datasets = json.load(f)
    except json.JSONDecodeError as error:
        raise DatasetError(f"{path} is not valid JSON: {error}") from error
    return normalize_datasets(datasets)


def format_datasets(datasets) -> str:
    """Serialize datasets in the standard layout: one field per line, each list on one line."""
    def dump(value):
        return json.dumps(value, ensure_ascii=False)

    blocks = []
    for record in datasets:
        lines = [f"    {dump(field)}: {dump(value)}" for field, value in record.items()]
        blocks.append("  {\n" + ",\n".join(lines) + "\n  }")
    return "[\n" + ",\n".join(blocks) + "\n]\n" if blocks else "[]\n"


def save_datasets(datasets, path: Path = DATA_PATH):
    """Check the datasets and write them to the dataset file in the standard layout."""
    text = format_datasets(normalize_datasets(datasets))
    with Path(path).open("w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main(argv):
    try:
        datasets = load_datasets()
    except DatasetError as error:
        print(f"✗ {DATA_PATH.name} has problems:\n{error}")
        return 1
    if "--format" in argv:
        save_datasets(datasets)
        print(f"✓ Rewrote {DATA_PATH.name} in the standard layout ({len(datasets)} datasets)")
    else:
        print(f"✓ {DATA_PATH.name} is valid ({len(datasets)} datasets)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
