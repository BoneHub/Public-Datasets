"""Sort the dataset CSV using specific ranking criteria."""

from pathlib import Path

import pandas as pd


def count_semicolon_separated_values(value) -> int:
    """Count non-empty semicolon-separated entries in a cell."""
    if pd.isna(value):
        return 0

    entries = [item.strip() for item in str(value).split(";") if item.strip()]
    return len(entries)


def has_available_value(value) -> int:
    """Return 1 when a field has any non-empty value, otherwise 0."""
    if pd.isna(value):
        return 0
    return int(bool(str(value).strip()))


def is_open_access(value) -> int:
    """Return 1 when the access policy includes open access, otherwise 0."""
    if pd.isna(value):
        return 0

    return int("open access" in str(value).strip().lower())


def subject_count(value) -> int:
    """Return the numeric number of subjects when present, otherwise 0."""
    try:
        return int(str(value).strip())
    except ValueError:
        return 0


def sort_datasets(dataframe: pd.DataFrame) -> pd.DataFrame:
    """Sort datasets by the predefined ranking rules."""
    sort_keys = dataframe.assign(
        _available_3d_bone_shapes_count=dataframe["Available 3D Bone Shapes"].apply(count_semicolon_separated_values),
        _mesh_model_available=dataframe["Mesh Model"].apply(has_available_value),
        _segmentation_mask_available=dataframe["Voxel Segmentation Mask"].apply(has_available_value),
        _secondary_imaged_regions_count=dataframe["Secondary Imaged Regions"].apply(count_semicolon_separated_values),
        _subject_count=dataframe["Number of Subjects"].apply(subject_count),
        _metadata_count=dataframe["Available Information per Subject"].apply(count_semicolon_separated_values),
        _open_access_available=dataframe["Access Policy"].apply(is_open_access),
    )

    sorted_dataframe = sort_keys.sort_values(
        by=[
            "_available_3d_bone_shapes_count",
            "_mesh_model_available",
            "_segmentation_mask_available",
            "_secondary_imaged_regions_count",
            "_subject_count",
            "_metadata_count",
            "_open_access_available",
        ],
        ascending=[False, False, False, False, False, False, False],
        kind="mergesort",
    )

    return sorted_dataframe[dataframe.columns]


def main():
    """Read, sort, and overwrite the datasets CSV."""
    csv_path = Path("data/bonehub_public_datasets.csv")

    dataframe = pd.read_csv(csv_path)
    sorted_dataframe = sort_datasets(dataframe)
    sorted_dataframe.to_csv(csv_path, index=False)

    print(f"Sorted {len(sorted_dataframe)} datasets in {csv_path}")


if __name__ == "__main__":
    main()
