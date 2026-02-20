"""
This script is designed to be called from a GitHub Action workflow when a new dataset suggestion issue
is created. It takes the issue body and title as input, parses the markdown content of the issue body to
extract the dataset information, normalizes the values (especially for dropdown fields), and appends the new
dataset information as a new row in a CSV file located at `data/bonehub_public_datasets.csv`.
"""

import sys
import csv
import re
from pathlib import Path
import yaml


def parse_issue_form(body: str) -> dict:
    """
    Parses GitHub Issue Form markdown into a dict:
    {
      "Dataset name": "value",
      "Access link": "value",
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

        # Remove empty markdown artifacts
        value = re.sub(r"^\s*$", "", value)

        if value == "_No response_":
            value = ""
        fields[key] = value

    return fields


def normalize_values(row, template_path) -> str:
    def comma2semicolon(value: str) -> str:
        parts = [v.strip() for v in value.split(",") if v.strip()]
        return ";".join(parts)

    # Identify dropdown fields from the template
    dropdown_fields = set()

    if template_path.exists():
        with template_path.open("r", encoding="utf-8") as f:
            template = yaml.safe_load(f)

        for field in template.get("body", []):
            if field.get("type") == "dropdown":
                field_label = field.get("attributes", {}).get("label", "")
                if field_label:
                    dropdown_fields.add(field_label)

    for key in row.keys():
        # For dropdown fields, convert commas to semicolons
        if key in dropdown_fields:
            row[key] = comma2semicolon(row[key])
        # For all fields, remove white space around semicolon-separated values
        if ";" in row[key]:
            parts = [v.strip() for v in row[key].split(";") if v.strip()]
            row[key] = "; ".join(parts)
    return row


if __name__ == "__main__":
    issue_body = sys.argv[1]
    issue_title = sys.argv[2]
    row = parse_issue_form(issue_body)
    yaml_path = Path(".github/ISSUE_TEMPLATE/new-dataset-suggestion.yml")
    row = normalize_values(row, yaml_path)
    csv_path = Path("data/bonehub_public_datasets.csv")

    # Ensure data folder exists
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    # Ensure CSV exists with header
    if not csv_path.exists():
        with csv_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=row.keys(), delimiter=",")
            writer.writeheader()

    with csv_path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys(), delimiter=",")
        writer.writerow(row)

    print("Dataset added successfully.")
