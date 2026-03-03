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
            datasets.append(row)

    return datasets


def transform_dataset(row):
    """Transform a CSV row into a simplified dataset object for the webpage."""
    return {
        "name": row.get("Dataset Name", ""),
        "link": row.get("Access Link", ""),
        "paper": row.get("Related Paper", ""),
        "country": row.get("Country", ""),
        "year": row.get("Year", ""),
        "size": row.get("Size", ""),
        "remarks": row.get("Remarks", ""),
        "medicalImages": row.get("Medical Images Included", ""),
        "modality": row.get("Imaging Modality", ""),
        "imageSource": row.get("Image Source", ""),
        "imageSourceDetails": row.get("Image Source Details", ""),
        "primaryRegions": row.get("Primary Imaged Regions", ""),
        "secondaryRegions": row.get("Secondary Imaged Regions", ""),
        "boneShapes": row.get("Available 3D Bone Shapes", ""),
        "additionalStructures": row.get("Additional Structures", ""),
        "landmarks": row.get("Landmarks", ""),
        "voxelMask": row.get("Voxel Segmentation Mask", ""),
        "meshModel": row.get("Mesh Model", ""),
        "cadModel": row.get("CAD Model", ""),
        "subjects": row.get("Number of Subjects", ""),
        "subjectInfo": row.get("Available Information per Subject", ""),
        "vitalStatus": row.get("Subjects Vital Status", ""),
        "clinicalCondition": row.get("Subjects Clinical Condition", ""),
        "access": row.get("Access Policy", ""),
        "redistribution": row.get("Data Redistribution Policy", ""),
        "research": row.get("Research Use Policy", ""),
        "commercial": row.get("Commercial Use Policy", ""),
        "license": row.get("License", ""),
    }


def generate_data_js(datasets, output_path):
    """Generate the data.js file with the datasets."""
    # Transform datasets
    transformed_datasets = [transform_dataset(row) for row in datasets]

    # Create JavaScript content
    js_content = f"""// Auto-generated from bonehub_public_datasets.csv
// Do not edit manually - run scripts/update_webpage.py instead

const datasets = {json.dumps(transformed_datasets, indent=2, ensure_ascii=False)};
"""

    # Write to file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"✓ Generated {output_path} with {len(transformed_datasets)} datasets")


def main():
    """Main function to update the webpage."""
    # Get the project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Define paths
    csv_path = project_root / "data" / "bonehub_public_datasets.csv"
    output_path = project_root / "docs" / "data.js"

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
