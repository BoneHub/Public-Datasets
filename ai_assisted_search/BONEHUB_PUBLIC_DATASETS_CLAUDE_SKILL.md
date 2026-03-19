---
name: bonehub-public-datasets-query
description: Query the BoneHub public datasets CSV - filter by columns, search within semicolon-separated values, and return results.
---

# BoneHub Public Datasets Query Instructions

## Data Source

**The CSV file must be uploaded to Claude along with this skill file.**

Users should upload `bonehub_public_datasets.csv` from:
```
https://github.com/BoneHub/Public-Datasets/blob/main/data/bonehub_public_datasets.csv
```

---

## Important: Semicolon-Separated Values

**Many columns contain multiple values separated by `;` symbol.**

Examples:
- `Primary Imaged Regions`: `Pelvis; Hip; Upper Leg`
- `Available 3D Bone Shapes`: `Femur; Tibia; Fibula`
- `Available Information per Subject`: `Age; Gender; Height; Weight`

**When filtering these columns, use `.str.contains()` to search within the semicolon-separated list.**

---

## Step 1: Load the Uploaded CSV File

**The user must upload the CSV file (`bonehub_public_datasets.csv`) to this conversation along with this skill file.**

```python
import pandas as pd

# Read the uploaded CSV file
df = pd.read_csv('/mnt/data/bonehub_public_datasets.csv')

print(f"Loaded {len(df)} datasets")
print(f"Columns: {list(df.columns)}")
```

**Note:** The file path is `/mnt/data/bonehub_public_datasets.csv` for files uploaded to Claude.

`BoneHub ID` is the first column in the CSV and is the unique internal identifier for each dataset. Use it whenever the user asks for a dataset ID or when returning results that should be easy to reference unambiguously.

---

## Keyword Synonyms — Translate User Terms to CSV Terms

Users may describe filters using natural language that doesn't exactly match the CSV values. **Always translate user terms to the actual CSV keywords listed below before filtering.**

---

### Medical Images Included
Possible CSV values: `Yes`, `No`

| User says | Search for |
|---|---|
| has images, includes scans, image data available | `Yes` |
| no images, shapes only, no scans | `No` |

---

### Imaging Modality
Possible CSV values: `CT`, `CBCT`, `MRI`, `X-ray`, `Ultrasound`, `PET`, `SPECT`, `Other`

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
Possible CSV values: `Original`, `Adopted`

| User says | Search for |
|---|---|
| original, collected, acquired, new data | `Original` |
| adopted, derived, sourced from other datasets, repurposed | `Adopted` |

---

### Primary Imaged Regions / Secondary Imaged Regions
Possible CSV values: `Whole Body`, `Neurocranium`, `Viscerocranium`, `Cervical Spine`, `Thoracic Spine`, `Lumbar Spine`, `Thoracic Cage`, `Abdomen`, `Pelvis`, `Shoulder`, `Upper Arm`, `Forearm`, `Wrist`, `Hand`, `Hip`, `Upper Leg`, `Knee`, `Lower Leg`, `Ankle`, `Foot`

| User says | Search for |
|---|---|
| whole body, full body, total body | `Whole Body` |
| skull, cranium, brain case, neurocranium | `Neurocranium` |
| face, facial, jaw, viscerocranium | `Viscerocranium` |
| head, cranial | `Neurocranium\|Viscerocranium` |
| neck, cervical, cervical spine | `Cervical Spine` |
| thoracic spine, mid back, upper back, thoracic vertebrae | `Thoracic Spine` |
| lumbar spine, lower back, lumbar | `Lumbar Spine` |
| spine, spinal, vertebra, vertebrae, back | `Cervical Spine\|Thoracic Spine\|Lumbar Spine` |
| ribcage, rib cage, thorax, chest, sternum, thoracic cage | `Thoracic Cage` |
| abdomen, abdominal | `Abdomen` |
| pelvis, pelvic, hip bone | `Pelvis` |
| shoulder, glenohumeral | `Shoulder` |
| upper arm, humerus region | `Upper Arm` |
| forearm, radius ulna region | `Forearm` |
| arm, upper extremity, upper limb | `Upper Arm\|Forearm` |
| wrist | `Wrist` |
| hand, fingers | `Hand` |
| hip joint, hip replacement, THR, THA, arthroplasty | `Hip` |
| thigh, upper leg, femur region | `Upper Leg` |
| knee, knee replacement, TKR, TKA | `Knee` |
| lower leg, shin, tibia fibula region | `Lower Leg` |
| leg, lower extremity, lower limb | `Upper Leg\|Lower Leg` |
| ankle | `Ankle` |
| foot, feet, toes | `Foot` |

---

### Available 3D Bone Shapes
Possible CSV values: `Cranial Bones`, `Facial Bones`, `Cervical Vertebrae`, `Thoracic Vertebrae`, `Lumbar Vertebrae`, `Sacrum`, `Coccyx`, `Ribs`, `Sternum`, `Clavicle`, `Scapula`, `Humerus`, `Radius`, `Ulna`, `Carpals`, `Metacarpals`, `Phalanges Hand`, `Hip Bones`, `Proximal Femur`, `Femur`, `Distal Femur`, `Patella`, `Proximal Tibia`, `Tibia`, `Distal Tibia`, `Proximal Fibula`, `Fibula`, `Distal Fibula`, `Tarsals`, `Metatarsals`, `Phalanges Foot`

| User says | Search for |
|---|---|
| skull, cranium, skull bones | `Cranial Bones` |
| face, facial bones, jaw | `Facial Bones` |
| neck vertebrae, C1-C7 | `Cervical Vertebrae` |
| thoracic vertebrae, T1-T12 | `Thoracic Vertebrae` |
| lumbar vertebrae, L1-L5 | `Lumbar Vertebrae` |
| vertebrae, spine, vertebral bodies | `Cervical Vertebrae\|Thoracic Vertebrae\|Lumbar Vertebrae` |
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
| femur, thigh bone | `Femur` |
| distal femur, femoral condyles | `Distal Femur` |
| patella, kneecap | `Patella` |
| proximal tibia, tibial plateau | `Proximal Tibia` |
| tibia, shin bone | `Tibia` |
| distal tibia | `Distal Tibia` |
| fibula | `Fibula` |
| tarsals, ankle bones | `Tarsals` |
| metatarsals, foot bones | `Metatarsals` |
| phalanges foot, toe bones | `Phalanges Foot` |

---

### Voxel Segmentation Mask
Possible CSV values: `Available`, `Supervised Segmentation`, `Automatic Segmentation`

| User says | Search for |
|---|---|
| has segmentation, segmentation masks, segmented | `Available` |
| manual segmentation, expert segmentation, human annotated | `Supervised Segmentation` |
| automatic segmentation, auto segmentation, AI segmentation | `Automatic Segmentation` |

---

### Mesh Model
Possible CSV values: `Available`, `Supervised 3D Reconstruction`, `Automatic 3D Reconstruction`

| User says | Search for |
|---|---|
| has mesh, mesh models, STL, OBJ, PLY, surface model | `Available` |
| manual reconstruction, expert reconstruction | `Supervised 3D Reconstruction` |
| automatic reconstruction, auto mesh, AI reconstruction | `Automatic 3D Reconstruction` |

---

### CAD Model
Possible CSV values: `Available`, `Supervised CAD Modeling`, `Automatic CAD Modeling`

| User says | Search for |
|---|---|
| has CAD, CAD models, STEP, IGES | `Available` |
| manual CAD, expert CAD | `Supervised CAD Modeling` |
| automatic CAD, auto CAD modeling | `Automatic CAD Modeling` |

---

### Subjects Vital Status
Possible CSV values: `Alive`, `Postmortem`

| User says | Search for |
|---|---|
| alive, living, in vivo | `Alive` |
| postmortem, deceased, cadaver, cadaveric, ex vivo, dead | `Postmortem` |

---

### Access Policy
Possible CSV values: `Open Access`, `Restricted`, `Simple Registration`, `Payment Required`

| User says | Search for |
|---|---|
| open access, free, public, freely available, no restrictions | `Open Access` |
| restricted, controlled, requires approval, application required | `Restricted` |
| registration, sign up, account required | `Simple Registration` |
| paid, payment, subscription, fee | `Payment Required` |

---

### Data Redistribution Policy / Research Use Policy / Commercial Use Policy
Possible CSV values: `Allowed`, `Restricted`, `Not Specified`

| User says | Search for |
|---|---|
| allowed, permitted, yes, can redistribute, can use commercially | `Allowed` |
| not allowed, restricted, prohibited, no, cannot redistribute | `Restricted` |
| not specified, unknown, unclear | `Not Specified` |

---

**When in doubt**, use broad `.str.contains()` with synonyms joined by `|` rather than exact match. Example:
```python
# User says "redistribution not allowed" — map to the correct CSV value
result = df[df['Data Redistribution Policy'].str.contains('Restricted', case=False, na=False)]
```

---

## Step 2: Filter the Data

### Filtering Semicolon-Separated Columns

For columns with multiple values (e.g., `Primary Imaged Regions`, `Available 3D Bone Shapes`), use partial matching:

```python
# Find datasets with "Pelvis" in Primary Imaged Regions
result = df[df['Primary Imaged Regions'].str.contains('Pelvis', case=False, na=False)]

# Find datasets with "Femur" in Available 3D Bone Shapes  
result = df[df['Available 3D Bone Shapes'].str.contains('Femur', case=False, na=False)]

# Find datasets with "CT" imaging modality
result = df[df['Imaging Modality'].str.contains('CT', case=False, na=False)]
```

### Filtering by Multiple Values (OR condition)

```python
# Find datasets with Pelvis OR Hip in Primary Imaged Regions
result = df[df['Primary Imaged Regions'].str.contains('Pelvis|Hip', case=False, na=False)]

# Find datasets with CT OR MRI imaging
result = df[df['Imaging Modality'].str.contains('CT|MRI', case=False, na=False)]
```

### Filtering by Multiple Conditions (AND condition)

```python
# Find datasets with Pelvis AND from USA
result = df[
    (df['Primary Imaged Regions'].str.contains('Pelvis', case=False, na=False)) &
    (df['Country'] == 'USA')
]

# Find CT datasets from 2023 or later with Femur
result = df[
    (df['Imaging Modality'].str.contains('CT', case=False, na=False)) &
    (df['Year'] >= 2023) &
    (df['Available 3D Bone Shapes'].str.contains('Femur', case=False, na=False))
]
```

### Filtering Exact Matches

```python
# Find datasets from specific country
result = df[df['Country'] == 'USA']

# Find datasets from specific year
result = df[df['Year'] == 2023]

# Find datasets with Open Access
result = df[df['Access Policy'] == 'Open Access']
```

---

## Step 3: Return Results

Always include these **base columns** in the output, plus any columns the user specifically asked about:

```python
# Base columns always shown
base_cols = ['BoneHub ID', 'Dataset Name', 'Access Link', 'Related Paper']

# Add columns relevant to the user's query — examples:
query_cols = ['Country', 'Year', 'Primary Imaged Regions', 'Imaging Modality']  # adjust per request

# Combine, preserving order and avoiding duplicates
columns_to_show = base_cols + [c for c in query_cols if c not in base_cols]

print(f"Found {len(result)} datasets")
print(result[columns_to_show].to_markdown(index=False))
```

**Always present the result as a Markdown table** using `.to_markdown(index=False)`. This renders as a clean table for the user. Install `tabulate` if needed: `pip install tabulate`.

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

## CSV Columns Reference

- `BoneHub ID`: Unique BoneHub identifier for the dataset
- `Dataset Name`: Name of the dataset
- `Access Link`: URL to access the dataset
- `Related Paper`: Associated publication
- `Country`: Country of origin
- `Year`: Publication/release year
- `Size`: Dataset size
- `Remarks`: Additional notes
- `Medical Images Included`: Whether medical images are included
- `Imaging Modality`: CT, MRI, X-ray, etc. (can be multiple, separated by `;`)
- `Image Source`: Original or Adopted
- `Image Source Details`: Additional source information
- `Primary Imaged Regions`: **Semicolon-separated** list (e.g., `Pelvis; Hip; Upper Leg`)
- `Secondary Imaged Regions`: **Semicolon-separated** list
- `Available 3D Bone Shapes`: **Semicolon-separated** list (e.g., `Femur; Tibia; Fibula`)
- `Additional Structures`: Other anatomical structures
- `Landmarks`: Anatomical landmarks
- `Voxel Segmentation Mask`: Availability status
- `Mesh Model`: Availability status
- `CAD Model`: Availability status  
- `Number of Subjects`: Number of subjects/patients
- `Available Information per Subject`: **Semicolon-separated** list (e.g., `Age; Gender; Height`)
- `Subjects Vital Status`: Alive/Deceased status
- `Subjects Clinical Condition`: Clinical conditions
- `Access Policy`: Open Access, Registration Required, etc.
- `Data Redistribution Policy`: Allowed/Not Allowed
- `Research Use Policy`: Usage terms for research
- `Commercial Use Policy`: Usage terms for commercial purposes
- `License`: License type (e.g., CC BY 4.0)

---

## Common Query Patterns

### By Anatomical Region

```python
# Pelvis datasets
df[df['Primary Imaged Regions'].str.contains('Pelvis', case=False, na=False)]

# Femur in 3D bone shapes
df[df['Available 3D Bone Shapes'].str.contains('Femur', case=False, na=False)]

# Spine (any type)
df[df['Primary Imaged Regions'].str.contains('Spine', case=False, na=False)]
```

### By Imaging Type

```python
# CT scans only
df[df['Imaging Modality'].str.contains('CT', case=False, na=False)]

# MRI scans only
df[df['Imaging Modality'].str.contains('MRI', case=False, na=False)]
```

### By Country and Year

```python
# USA datasets
df[df['Country'] == 'USA']

# Dataset with a known BoneHub ID
df[df['BoneHub ID'] == 109]

# Recent datasets (2023 or later)
df[df['Year'] >= 2023]

# USA datasets from 2023+
df[(df['Country'] == 'USA') & (df['Year'] >= 2023)]
```

### By Access Policy

```python
# Open access only
df[df['Access Policy'] == 'Open Access']

# Datasets allowing commercial use
df[df['Commercial Use Policy'].str.contains('Allowed', case=False, na=False)]
```

### By Available Data

```python
# Datasets with mesh models
df[df['Mesh Model'] == 'Available']

# Datasets with segmentation masks
df[df['Voxel Segmentation Mask'] == 'Available']

# Datasets with age and gender information
df[df['Available Information per Subject'].str.contains('Age.*Gender|Gender.*Age', case=False, na=False)]
```

---

## Tips

1. **Always use `.str.contains()` with `na=False`** for semicolon-separated columns
2. **Use `case=False`** for case-insensitive search
3. **Use `|` for OR conditions** within `.str.contains()`: `'Pelvis|Hip'`
4. **Use `&` for AND conditions** between different filters
5. **Use `==` for exact matches** on single-value columns like Country, Year
6. **Check column names** if unsure: `print(df.columns.tolist())`
