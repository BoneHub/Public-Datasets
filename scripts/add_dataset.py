"""
This script is designed to be called from a GitHub Action workflow when a new dataset suggestion issue
is approved. It takes the issue body and title as input, parses the markdown content of the issue body to
extract the dataset information, converts each value to its field type (multiple values separated by ";"
or picked in a multi-select dropdown become list items), and appends the new dataset, with the next
BoneHub ID, to the end of `data/bonehub_public_datasets.json`.
"""

import re
import sys
from pathlib import Path

import yaml

from bonehub_data import DATA_PATH, FIELDS, ID, LIST, NUMBER, DatasetError, load_datasets, parse_number, save_datasets

TEMPLATE_PATH = Path(__file__).resolve().parent.parent / ".github" / "ISSUE_TEMPLATE" / "new-dataset-suggestion.yml"


def parse_issue_form(body: str) -> dict:
    """
    Parses GitHub Issue Form markdown into a dict:
    {
      "Dataset Name": "value",
      "Access Link": "value",
      ...
    }
    """
    fields = {}

    # Split on headings (### Heading)
    sections = re.split(r"\n### ", body)

    for section in sections:
        section = section.strip()
        if not section:
            continue

        # First section may start without ###
        if section.startswith("### "):
            section = section[4:]

        lines = section.splitlines()
        key = lines[0].strip()
        value = "\n".join(lines[1:]).strip()

        if value == "_No response_":
            value = ""
        fields[key] = value

    return fields


def dropdown_labels(template_path: Path) -> set:
    """Labels of the dropdown fields in the issue template."""
    if not template_path.exists():
        return set()
    with template_path.open("r", encoding="utf-8") as f:
        template = yaml.safe_load(f)
    return {
        field.get("attributes", {}).get("label", "")
        for field in template.get("body", [])
        if field.get("type") == "dropdown"
    }


def to_list(text: str, is_dropdown: bool) -> list:
    """
    Split a form answer into list items. Multi-select dropdowns join their choices with ",";
    typed answers separate entries with ";" (or put them on separate lines).
    """
    separators = r"[,;]" if is_dropdown else r"[;\n]"
    items = []
    for part in re.split(separators, text):
        part = re.sub(r"^\s*[-*•]\s+", "", part).strip()  # drop markdown bullet markers
        if part:
            items.append(part)
    return items


def issue_to_record(fields: dict, dropdowns: set) -> dict:
    """Convert the parsed issue form into a dataset record (without a BoneHub ID)."""
    record = {}
    for field, kind in FIELDS.items():
        if kind == ID:
            continue
        text = fields.get(field, "").strip()
        if kind == LIST:
            record[field] = to_list(text, field in dropdowns)
        elif kind == NUMBER:
            record[field] = parse_number(text)
        else:
            record[field] = text or None
    return record


if __name__ == "__main__":
    issue_body = sys.argv[1]
    issue_title = sys.argv[2]

    try:
        datasets = load_datasets()
    except (FileNotFoundError, DatasetError) as error:
        print(f"Failed. Could not read {DATA_PATH}:\n{error}")
        sys.exit(1)

    fields = parse_issue_form(issue_body)

    # Only add the dataset when the issue fields match the dataset fields exactly.
    expected = [field for field, kind in FIELDS.items() if kind != ID]
    missing = [field for field in expected if field not in fields]
    unexpected = [field for field in fields if field not in expected]
    if missing or unexpected:
        print("Failed. Issue fields do not match the dataset fields.")
        if missing:
            print(f"  Dataset fields missing from the issue: {missing}")
        if unexpected:
            print(f"  Issue fields with no matching dataset field: {unexpected}")
        sys.exit(1)

    record = issue_to_record(fields, dropdown_labels(TEMPLATE_PATH))
    new_id = max((d["BoneHub ID"] for d in datasets), default=0) + 1
    datasets.append({"BoneHub ID": new_id, **record})

    try:
        save_datasets(datasets)
    except DatasetError as error:
        print(f"Failed. The new dataset is not valid:\n{error}")
        sys.exit(1)

    print(f"Dataset added successfully with BoneHub ID {new_id}.")
