#!/usr/bin/env python3
"""
Update Webpage Script
This script reads the bonehub_public_datasets.csv file and generates
a data.js file for the GitHub Pages website.
"""

import csv
import json
import os
from pathlib import Path


def read_csv_data(csv_path):
    """Read the CSV file and return the data as a list of dictionaries."""
    datasets = []

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Keep all columns from CSV
            datasets.append(dict(row))

    return datasets


def generate_data_js(datasets, output_path):
    """Generate the data.js file with the datasets."""
    # Keep all columns from CSV (no transformation needed if you want all data)
    # For full data display, skip transformation

    from datetime import datetime

    # Create JavaScript content with all CSV columns
    js_content = f"""// Auto-generated from bonehub_public_datasets.csv
// Do not edit manually - run scripts/update_webpage.py instead
// Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

const datasetsData = {json.dumps(datasets, indent=2, ensure_ascii=False)};
"""

    # Write to file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"✓ Generated {output_path} with {len(datasets)} datasets")


def main():
    """Main function to update the webpage."""
    # Get the project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Define paths
    csv_path = project_root / "data" / "bonehub_public_datasets.csv"
    output_path = project_root / "webpage" / "data.js"

    # Check if CSV file exists
    if not csv_path.exists():
        print(f"✗ Error: CSV file not found at {csv_path}")
        return 1

    # Create webpage directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Read CSV data
    print(f"Reading CSV from {csv_path}...")
    datasets = read_csv_data(csv_path)
    print(f"✓ Found {len(datasets)} datasets")

    # Generate data.js
    print(f"Generating data.js...")
    generate_data_js(datasets, output_path)

    print("\n✓ Webpage update complete!")
    print(f"  - CSV file: {csv_path}")
    print(f"  - Output file: {output_path}")
    print(f"  - Datasets processed: {len(datasets)}")

    return 0


if __name__ == "__main__":
    exit(main())
