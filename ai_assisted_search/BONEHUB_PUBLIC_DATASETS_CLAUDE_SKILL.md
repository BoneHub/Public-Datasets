---
name: bonehub-public-datasets-query
description: Query the BoneHub public datasets JSON - filter by fields, match values inside list fields, and return results.
---

# BoneHub Public Datasets Query Instructions

## Data Source

**The JSON file must be uploaded to Claude along with this skill file.**

Users should upload `bonehub_public_datasets.json` from:
```
https://github.com/BoneHub/Public-Datasets/blob/main/data/bonehub_public_datasets.json
```

---

## Important: List Fields

The file is a JSON array with one object per dataset. **Fields that can hold several values are JSON lists** (Python lists after loading). Empty lists (`[]`) mean "not available / not specified".

Examples:
- `Primary Imaged Regions`: `["Pelvis", "Hip", "Upper Leg"]`
- `Available 3D Bone Shapes`: `["Femur", "Tibia", "Fibula"]`
- `Available Information per Subject`: `["Age", "Gender", "Height", "Weight"]`

Other fields:
- **Numbers:** `BoneHub ID`, `Year`, `Number of Subjects` (may be empty → `NaN`), `Size` in GB (usually a number; a few entries are text such as `"more than 50 TB"`).
- **Text:** `Dataset Name`, `Medical Images Included` (`"Yes"` or `"No"`).

**Never use `.str.contains()` on list fields.** Use the helpers below.

---

## Step 1: Load the Uploaded JSON File

**The user must upload the JSON file (`bonehub_public_datasets.json`) to this conversation along with this skill file.**

```python
import re
import pandas as pd

# Read the uploaded JSON file
df = pd.read_json('/mnt/data/bonehub_public_datasets.json')

print(f"Loaded {len(df)} datasets")
print(f"Columns: {list(df.columns)}")


def has_any(column, *values):
    """Rows whose list in `column` contains at least one of `values` (whole item, case-insensitive)."""
    wanted = {v.lower() for v in values}
    return df[column].apply(lambda items: any(item.lower() in wanted for item in items))


def has_all(column, *values):
    """Rows whose list in `column` contains every one of `values` (whole item, case-insensitive)."""
    wanted = {v.lower() for v in values}
    return df[column].apply(lambda items: wanted <= {item.lower() for item in items})


def mentions(column, pattern):
    """Rows where any item of the list in `column` matches the regex `pattern` (case-insensitive).
    Use for free-text lists such as clinical conditions, landmarks, remarks."""
    rx = re.compile(pattern, re.IGNORECASE)
    return df[column].apply(lambda items: any(rx.search(item) for item in items))


def is_filled(column):
    """Rows where the list in `column` is not empty."""
    return df[column].apply(len) > 0


size_gb = pd.to_numeric(df['Size'], errors='coerce')  # Size as numbers (text entries become NaN)
```

**Note:** The file path is `/mnt/data/bonehub_public_datasets.json` for files uploaded to Claude.

`BoneHub ID` is the first field and is the unique internal identifier for each dataset. Use it whenever the user asks for a dataset ID or when returning results that should be easy to reference unambiguously.

---

## Keyword Synonyms — Translate User Terms to Data Values

Users may describe filters using natural language that doesn't exactly match the values in the data. **Always translate user terms to the actual values listed below before filtering.** When a row lists several values, pass all of them to `has_any(...)`.

---

### Medical Images Included
Possible values: `Yes`, `No`

| User says | Search for |
|---|---|
| has images, includes scans, image data available | `Yes` |
| no images, shapes only, no scans | `No` |

---

### Imaging Modality
Possible values: `CT`, `CBCT`, `MRI`, `X-ray`, `Ultrasound`, `PET`, `SPECT`, `Other`

| User says | Search for |
|---|---|
| CT, computed tomography, cat scan | `CT` |
| CBCT, cone beam CT, cone beam computed tomography | `CBCT` |
| MRI, magnetic resonance, MR imaging | `MRI` |
| X-ray, radiograph, plain film, plain radiograph | `X-ray` |
| ultrasound, US, echo, sonography | `Ultrasound` |
| PET, positron emission | `PET` |
| SPECT, bone scan, nuclear imaging, scintigraphy | `SPECT` |

---

### Image Source
Possible values: `Original`, `Adopted`

| User says | Search for |
|---|---|
| original, collected, acquired, new data | `Original` |
| adopted, derived, sourced from other datasets, repurposed | `Adopted` |

---

### Primary Imaged Regions / Secondary Imaged Regions
Possible values: `Whole Body`, `Neurocranium`, `Viscerocranium`, `Cervical Spine`, `Thoracic Spine`, `Lumbar Spine`, `Thoracic Cage`, `Abdomen`, `Pelvis`, `Shoulder`, `Upper Arm`, `Elbow`, `Forearm`, `Wrist`, `Hand`, `Hip`, `Upper Leg`, `Knee`, `Lower Leg`, `Ankle`, `Foot`

| User says | Search for |
|---|---|
| whole body, full body, total body | `Whole Body` |
| skull, cranium, brain case, neurocranium | `Neurocranium` |
| face, facial, jaw, viscerocranium | `Viscerocranium` |
| head, cranial | `Neurocranium`, `Viscerocranium` |
| neck, cervical, cervical spine | `Cervical Spine` |
| thoracic spine, mid back, upper back, thoracic vertebrae | `Thoracic Spine` |
| lumbar spine, lower back, lumbar | `Lumbar Spine` |
| spine, spinal, vertebra, vertebrae, back | `Cervical Spine`, `Thoracic Spine`, `Lumbar Spine` |
| ribcage, rib cage, thorax, chest, sternum, thoracic cage | `Thoracic Cage` |
| abdomen, abdominal | `Abdomen` |
| pelvis, pelvic, hip bone | `Pelvis` |
| shoulder, glenohumeral | `Shoulder` |
| upper arm, humerus region | `Upper Arm` |
| elbow | `Elbow` |
| forearm, radius ulna region | `Forearm` |
| arm, upper extremity, upper limb | `Upper Arm`, `Forearm` |
| wrist | `Wrist` |
| hand, fingers | `Hand` |
| hip joint, hip replacement, THR, THA, arthroplasty | `Hip` |
| thigh, upper leg, femur region | `Upper Leg` |
| knee, knee replacement, TKR, TKA | `Knee` |
| lower leg, shin, tibia fibula region | `Lower Leg` |
| leg, lower extremity, lower limb | `Upper Leg`, `Lower Leg` |
| ankle | `Ankle` |
| foot, feet, toes | `Foot` |

---

### Available 3D Bone Shapes
Possible values: `Cranial Bones`, `Facial Bones`, `Cervical Vertebrae`, `Thoracic Vertebrae`, `Lumbar Vertebrae`, `Sacrum`, `Coccyx`, `Ribs`, `Sternum`, `Clavicle`, `Scapula`, `Humerus`, `Radius`, `Ulna`, `Carpals`, `Metacarpals`, `Phalanges Hand`, `Hip Bones`, `Proximal Femur`, `Femur`, `Distal Femur`, `Patella`, `Proximal Tibia`, `Tibia`, `Distal Tibia`, `Proximal Fibula`, `Fibula`, `Distal Fibula`, `Tarsals`, `Metatarsals`, `Phalanges Foot`

| User says | Search for |
|---|---|
| skull, cranium, skull bones | `Cranial Bones` |
| face, facial bones, jaw | `Facial Bones` |
| neck vertebrae, C1-C7 | `Cervical Vertebrae` |
| thoracic vertebrae, T1-T12 | `Thoracic Vertebrae` |
| lumbar vertebrae, L1-L5 | `Lumbar Vertebrae` |
| vertebrae, spine, vertebral bodies | `Cervical Vertebrae`, `Thoracic Vertebrae`, `Lumbar Vertebrae` |
| sacrum | `Sacrum` |
| coccyx, tailbone | `Coccyx` |
| ribs, rib bones | `Ribs` |
| sternum, breastbone | `Sternum` |
| clavicle, collarbone | `Clavicle` |
| scapula, shoulder blade | `Scapula` |
| humerus, upper arm bone | `Humerus` |
| radius | `Radius` |
| ulna | `Ulna` |
| carpals, carpal bones, wrist bones | `Carpals` |
| metacarpals, hand bones | `Metacarpals` |
| phalanges, finger bones, hand phalanges | `Phalanges Hand` |
| hip bones, ilium, ischium, pubis, acetabulum | `Hip Bones` |
| proximal femur, femoral head, femoral neck | `Proximal Femur` |
| femur, thigh bone | `Femur` (add `Proximal Femur`, `Distal Femur` if partial femurs are acceptable) |
| distal femur, femoral condyles | `Distal Femur` |
| patella, kneecap | `Patella` |
| proximal tibia, tibial plateau | `Proximal Tibia` |
| tibia, shin bone | `Tibia` (add `Proximal Tibia`, `Distal Tibia` if partial tibias are acceptable) |
| distal tibia | `Distal Tibia` |
| fibula | `Fibula` (add `Proximal Fibula`, `Distal Fibula` if partial fibulas are acceptable) |
| tarsals, ankle bones | `Tarsals` |
| metatarsals, foot bones | `Metatarsals` |
| phalanges foot, toe bones | `Phalanges Foot` |

---

### Voxel Segmentation Mask
Possible values: `Available`, `Supervised Segmentation`, `Automatic Segmentation`

| User says | Search for |
|---|---|
| has segmentation, segmentation masks, segmented | any value (`is_filled(...)`) |
| manual segmentation, expert segmentation, human annotated | `Supervised Segmentation` |
| automatic segmentation, auto segmentation, AI segmentation | `Automatic Segmentation` |

---

### Mesh Model
Possible values: `Available`, `Supervised 3D Reconstruction`, `Automatic 3D Reconstruction`

| User says | Search for |
|---|---|
| has mesh, mesh models, STL, OBJ, PLY, surface model | any value (`is_filled(...)`) |
| manual reconstruction, expert reconstruction | `Supervised 3D Reconstruction` |
| automatic reconstruction, auto mesh, AI reconstruction | `Automatic 3D Reconstruction` |

---

### CAD Model
Possible values: `Available`, `Supervised CAD Modeling`, `Automatic CAD Modeling`

| User says | Search for |
|---|---|
| has CAD, CAD models, STEP, IGES | any value (`is_filled(...)`) |
| manual CAD, expert CAD | `Supervised CAD Modeling` |
| automatic CAD, auto CAD modeling | `Automatic CAD Modeling` |

---

### Subjects Vital Status
Possible values: `Alive`, `Postmortem`

| User says | Search for |
|---|---|
| alive, living, in vivo | `Alive` |
| postmortem, deceased, cadaver, cadaveric, ex vivo, dead | `Postmortem` |

---

### Access Policy
Possible values: `Open Access`, `Restricted`, `Simple Registration`, `Payment Required`

| User says | Search for |
|---|---|
| open access, free, public, freely available, no restrictions | `Open Access` |
| restricted, controlled, requires approval, application required | `Restricted` |
| registration, sign up, account required | `Simple Registration` |
| paid, payment, subscription, fee | `Payment Required` |

---

### Data Redistribution Policy / Research Use Policy / Commercial Use Policy
Possible values: `Allowed`, `Restricted`, `Not Specified`

| User says | Search for |
|---|---|
| allowed, permitted, yes, can redistribute, can use commercially | `Allowed` |
| not allowed, restricted, prohibited, no, cannot redistribute | `Restricted` |
| not specified, unknown, unclear | `Not Specified` |

---

### Free-text list fields
`Subjects Clinical Condition`, `Available Information per Subject`, `Additional Structures`, `Landmarks`, `Remarks`, `Country`, `License` and `Image Source Details` are not limited to fixed values. **When in doubt, use `mentions()` with synonyms joined by `|`** rather than an exact match. Example:
```python
# User says "osteoarthritis or arthritic knees"
result = df[mentions('Subjects Clinical Condition', 'osteoarthritis|arthritis|OA')]
```

---

## Step 2: Filter the Data

### Filtering List Fields

```python
# Find datasets with "Pelvis" in Primary Imaged Regions
result = df[has_any('Primary Imaged Regions', 'Pelvis')]

# Find datasets with "Femur" in Available 3D Bone Shapes
result = df[has_any('Available 3D Bone Shapes', 'Femur')]

# Find datasets with "CT" imaging modality (does not match "CBCT")
result = df[has_any('Imaging Modality', 'CT')]
```

### Filtering by Multiple Values (OR condition)

```python
# Find datasets with Pelvis OR Hip in Primary Imaged Regions
result = df[has_any('Primary Imaged Regions', 'Pelvis', 'Hip')]

# Find datasets with CT OR MRI imaging
result = df[has_any('Imaging Modality', 'CT', 'MRI')]
```

### Filtering by Multiple Conditions (AND condition)

```python
# Find datasets with Pelvis AND from USA
result = df[has_any('Primary Imaged Regions', 'Pelvis') & has_any('Country', 'USA')]

# Find CT datasets from 2023 or later with Femur
result = df[
    has_any('Imaging Modality', 'CT') &
    (df['Year'] >= 2023) &
    has_any('Available 3D Bone Shapes', 'Femur')
]

# Datasets that provide BOTH age and gender per subject
result = df[has_all('Available Information per Subject', 'Age', 'Gender')]
```

### Filtering Numbers and Text

```python
# Datasets from a specific year
result = df[df['Year'] == 2023]

# Datasets with 100 or more subjects
result = df[df['Number of Subjects'] >= 100]

# Datasets smaller than 10 GB (text sizes are excluded)
result = df[size_gb < 10]

# Datasets that include medical images
result = df[df['Medical Images Included'] == 'Yes']
```

---

## Step 3: Return Results

Always include these **base columns** in the output, plus any columns the user specifically asked about. List fields are joined with `; ` for display:

```python
# Base columns always shown
base_cols = ['BoneHub ID', 'Dataset Name', 'Access Link', 'Related Paper']

# Add columns relevant to the user's query — examples:
query_cols = ['Country', 'Year', 'Primary Imaged Regions', 'Imaging Modality']  # adjust per request

# Combine, preserving order and avoiding duplicates
columns_to_show = base_cols + [c for c in query_cols if c not in base_cols]


def as_table(frame, columns):
    """Markdown table with list fields joined by '; '."""
    shown = frame[columns].apply(lambda col: col.map(lambda v: '; '.join(v) if isinstance(v, list) else v))
    return shown.to_markdown(index=False)


print(f"Found {len(result)} datasets")
print(as_table(result, columns_to_show))
```

**Always present the result as a Markdown table** using `as_table(...)`. This renders as a clean table for the user. Install `tabulate` if needed: `pip install tabulate`.

**Column selection examples:**

```python
# User asks about imaged regions → include region columns
columns_to_show = base_cols + ['Country', 'Year', 'Imaging Modality', 'Primary Imaged Regions', 'Secondary Imaged Regions']

# User asks about access/licensing → include policy columns
columns_to_show = base_cols + ['Access Policy', 'Data Redistribution Policy', 'Commercial Use Policy', 'License']

# User asks about 3D models → include 3D/model columns
columns_to_show = base_cols + ['Available 3D Bone Shapes', 'Voxel Segmentation Mask', 'Mesh Model', 'CAD Model']

# User asks about subjects → include subject columns
columns_to_show = base_cols + ['Number of Subjects', 'Available Information per Subject', 'Subjects Vital Status', 'Subjects Clinical Condition']
```

If the user asks for a specific BoneHub entry, filter by exact ID:

```python
result = df[df['BoneHub ID'] == 109]
```

---

## Fields Reference

- `BoneHub ID` (number): Unique BoneHub identifier for the dataset
- `Dataset Name` (text): Name of the dataset
- `Access Link` (list): URLs to access the dataset
- `Related Paper` (list): Associated publications
- `Country` (list): Country of origin
- `Year` (number): Publication/release year
- `Size` (number, sometimes text): Dataset size in GB
- `Remarks` (list): Additional notes, one per item
- `Medical Images Included` (text): `Yes` or `No`
- `Imaging Modality` (list): CT, MRI, X-ray, etc.
- `Image Source` (list): Original and/or Adopted
- `Image Source Details` (list): Source datasets of adopted images
- `Primary Imaged Regions` (list): e.g. `["Pelvis", "Hip", "Upper Leg"]`
- `Secondary Imaged Regions` (list)
- `Available 3D Bone Shapes` (list): e.g. `["Femur", "Tibia", "Fibula"]`
- `Additional Structures` (list): Other anatomical structures
- `Landmarks` (list): Anatomical landmarks
- `Voxel Segmentation Mask` (list): Availability and how the masks were made
- `Mesh Model` (list): Availability and how the meshes were made
- `CAD Model` (list): Availability and how the CAD models were made
- `Number of Subjects` (number): Number of subjects/patients
- `Available Information per Subject` (list): e.g. `["Age", "Gender", "Height"]`
- `Subjects Vital Status` (list): Alive and/or Postmortem
- `Subjects Clinical Condition` (list): Clinical conditions
- `Access Policy` (list): Open Access, Restricted, Simple Registration, Payment Required
- `Data Redistribution Policy` (list): Allowed, Restricted, Not Specified
- `Research Use Policy` (list): Allowed, Restricted, Not Specified
- `Commercial Use Policy` (list): Allowed, Restricted, Not Specified
- `License` (list): License types (e.g. CC BY 4.0)

---

## Common Query Patterns

### By Anatomical Region

```python
# Pelvis datasets
df[has_any('Primary Imaged Regions', 'Pelvis')]

# Femur in 3D bone shapes
df[has_any('Available 3D Bone Shapes', 'Femur')]

# Spine (any type)
df[has_any('Primary Imaged Regions', 'Cervical Spine', 'Thoracic Spine', 'Lumbar Spine')]
```

### By Imaging Type

```python
# CT scans
df[has_any('Imaging Modality', 'CT')]

# MRI scans
df[has_any('Imaging Modality', 'MRI')]
```

### By Country and Year

```python
# USA datasets
df[has_any('Country', 'USA')]

# Dataset with a known BoneHub ID
df[df['BoneHub ID'] == 109]

# Recent datasets (2023 or later)
df[df['Year'] >= 2023]

# USA datasets from 2023+
df[has_any('Country', 'USA') & (df['Year'] >= 2023)]
```

### By Access Policy

```python
# Open access
df[has_any('Access Policy', 'Open Access')]

# Datasets allowing commercial use
df[has_any('Commercial Use Policy', 'Allowed')]
```

### By Available Data

```python
# Datasets with mesh models
df[is_filled('Mesh Model')]

# Datasets with segmentation masks
df[is_filled('Voxel Segmentation Mask')]

# Datasets with age and gender information
df[has_all('Available Information per Subject', 'Age', 'Gender')]
```

---

## Tips

1. **List fields hold Python lists** — use `has_any`, `has_all`, `mentions` or `is_filled`, never `.str.contains()`
2. **`has_any`/`has_all` match whole items, case-insensitively**: `'CT'` does not match `'CBCT'`
3. **Use `mentions(column, 'a|b')`** for partial or synonym matches in free-text lists
4. **Use `&` for AND conditions** between different filters, `|` for OR between filters
5. **Use `==`, `>=`, `<`** on number fields (`Year`, `Number of Subjects`, `size_gb`)
6. **Check column names** if unsure: `print(df.columns.tolist())`
