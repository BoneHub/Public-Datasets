# BoneHub Public Datasets — Data Guide

- 🌐 **Browse, filter and export to CSV:** [bonehub.github.io/Public-Datasets](https://bonehub.github.io/Public-Datasets/)
- 📄 **Raw data:** [bonehub_public_datasets.json](bonehub_public_datasets.json)

## File Format

`bonehub_public_datasets.json` is a JSON array with one object per dataset, ordered by **BoneHub ID** (1, 2, 3, …). Every object has all the fields described below, in the same order. Each field has one of these types:

| Type | Value | Empty value |
|------|-------|-------------|
| **ID** | A positive integer. Unique, and never reused for another dataset. | — |
| **Text** | A string. | `null` |
| **Number** | A number. Kept as text when the value is not a plain number (e.g. `"more than 50 TB"`). | `null` |
| **List** | An array of strings, one item per value. | `[]` |

Example (shortened):

```json
{
  "BoneHub ID": 2,
  "Dataset Name": "AMOS",
  "Access Link": ["https://doi.org/10.5281/zenodo.7155725", "https://doi.org/10.5281/zenodo.7262585"],
  "Country": ["China"],
  "Year": 2022,
  "Size": 105,
  "Medical Images Included": "Yes",
  "Imaging Modality": ["CT", "MRI"],
  "Available 3D Bone Shapes": [],
  "Number of Subjects": 3800,
  "Access Policy": ["Open Access"],
  "License": ["CC BY 4.0", "CC BY-NC-SA 4.0"]
}
```

**Need a spreadsheet?** Click **Export CSV** on the [website](https://bonehub.github.io/Public-Datasets/). It downloads all fields of the datasets that match your filters (all datasets when no filter is set), with list items joined by `; `.

**Order:** the website lists the datasets most complete first. That ranking is applied when the website data is generated; the JSON file itself always stays in BoneHub ID order.

## Field Descriptions

### Basic Information

| Field | Type | Description |
|-------|------|-------------|
| **BoneHub ID** | ID | The unique BoneHub identifier for the dataset entry. This can be used as a stable reference for a dataset within the BoneHub catalog. |
| **Dataset Name** | Text | The name of the dataset. |
| **Access Link** | List | URL(s) where the dataset can be accessed. |
| **Related Paper** | List | Link(s) to the paper(s) describing the dataset, if available (e.g., DOI link). |
| **Country** | List | Country or countries that own or host the dataset. |
| **Year** | Number | Year when the dataset was published or made available. |
| **Size** | Number | Approximate size of the dataset in GB (gigabytes). |
| **Remarks** | List | Additional remarks that may be relevant to people who want to use the dataset, one remark per item. This may include study population characteristics, imaging modality details, annotations, previous usage, limitations, or intended use. |

### Medical Image Data

| Field | Type | Description |
|-------|------|-------------|
| **Medical Images Included** | Text | Indicates whether the dataset provides medical images (e.g., CT, MRI). Values: `Yes` or `No`. |
| **Imaging Modality** | List | The imaging modality(ies) that the dataset is based on. Possible values include: CT, CBCT, MRI, X-ray, Ultrasound, PET, SPECT, or Other. |
| **Image Source** | List | The source of the medical images. Values can include: `Original` (images created specifically for this dataset) or `Adopted` (images sourced from other datasets). |
| **Image Source Details** | List | If adopted images are used, links to (or names of) the original dataset(s) from which images were sourced. |
| **Primary Imaged Regions** | List | The primary imaged regions covered in the dataset—main areas of focus that are predominantly visible and fully captured in every image. Examples include: Whole Body, Neurocranium, Viscerocranium, Cervical Spine, Thoracic Spine, Lumbar Spine, Thoracic Cage, Abdomen, Pelvis, Shoulder, Upper Arm, Elbow, Forearm, Wrist, Hand, Hip, Upper Leg, Knee, Lower Leg, Ankle, or Foot. |
| **Secondary Imaged Regions** | List | Additional imaged regions that are partially or fully captured in some images, appearing alongside primary regions but not being the main intended target. Same anatomical region options as Primary Imaged Regions. |

### Medical Shapes Data

| Field | Type | Description |
|-------|------|-------------|
| **Available 3D Bone Shapes** | List | The available 3D bone shapes in the dataset. Examples include: Cranial Bones, Facial Bones, Cervical Vertebrae, Thoracic Vertebrae, Lumbar Vertebrae, Sacrum, Coccyx, Ribs, Sternum, Clavicle, Scapula, Humerus, Radius, Ulna, Carpals, Metacarpals, Phalanges Hand, Hip Bones, Proximal Femur, Femur, Distal Femur, Patella, Proximal Tibia, Tibia, Distal Tibia, Proximal Fibula, Fibula, Distal Fibula, Tarsals, Metatarsals, or Phalanges Foot. |
| **Additional Structures** | List | Additional structures (non-bone) available in the dataset that are related to bones. Examples include: intervertebral discs, knee cartilage, muscles, or ligaments. |
| **Landmarks** | List | Anatomical landmarks available in the dataset, if any. Examples include: Pelvic Landmarks, Spinal Landmarks, etc. |
| **Voxel Segmentation Mask** | List | Indicates if voxel segmentation masks are available in the dataset. Values can include: `Available`, `Supervised Segmentation` (created or verified by human experts), or `Automatic Segmentation` (generated using automated algorithms). |
| **Mesh Model** | List | Indicates if mesh models (e.g., STL, OBJ, PLY) are available in the dataset. Values can include: `Available`, `Supervised 3D Reconstruction` (created or verified by experts), or `Automatic 3D Reconstruction` (generated using automated algorithms). |
| **CAD Model** | List | Indicates if CAD models (e.g., STEP, IGES) are available in the dataset. Values can include: `Available`, `Supervised CAD Modeling` (created or verified by experts), or `Automatic CAD Modeling` (generated using automated algorithms). |

### Subjects Metadata

| Field | Type | Description |
|-------|------|-------------|
| **Number of Subjects** | Number | Total number of subjects in the dataset. Note that the number of subjects may differ from the number of images or 3D shapes. |
| **Available Information per Subject** | List | Types of information available for each subject. Examples include: Age, Gender, Height, Weight, BMI, Ethnicity, Medical History, etc. Information can be found in DICOM tags or in separate CSV/Excel files. |
| **Subjects Vital Status** | List | Vital status of the subjects in the dataset. Values can include: `Alive` or `Postmortem`. |
| **Subjects Clinical Condition** | List | Clinical condition of the subjects in the dataset. Examples include: Healthy, Osteoarthritis, Fracture, Implant, Post-operative, Ligament Tear, etc. |

### Data Usage Policy

| Field | Type | Description |
|-------|------|-------------|
| **Access Policy** | List | The access type for this dataset. Values can include: `Open Access` (free to access without restrictions), `Restricted` (requires approval from dataset owner), `Simple Registration` (requires account creation), or `Payment Required`. |
| **Data Redistribution Policy** | List | Whether derivatives of this dataset may be redistributed. Values can include: `Allowed`, `Restricted`, or `Not Specified`. |
| **Research Use Policy** | List | Whether the dataset can be used for research purposes. Values can include: `Allowed`, `Restricted`, or `Not Specified`. |
| **Commercial Use Policy** | List | Whether the dataset can be used for commercial purposes. Values can include: `Allowed`, `Restricted`, or `Not Specified`. |
| **License** | List | The license(s) under which the dataset is released. Examples include: CC BY 4.0, CC BY-NC-ND 4.0, MIT, or Custom License. |

## Editing the Data

Datasets suggested through the [issue form](https://github.com/BoneHub/Public-Datasets/issues/new?template=new-dataset-suggestion.yml) are added automatically once the issue is approved. To edit the file by hand:

- **Add** a dataset by appending a new object at the end of the array, with BoneHub ID = highest existing ID + 1. Copy an existing object as a template so that every field is present.
- **Empty values:** use `[]` for an empty list and `null` for an empty text or number.
- **Lists:** put each value in its own item, e.g. `["CT", "MRI"]`, not `["CT; MRI"]`.
- **Check** your edit with `python scripts/bonehub_data.py` (it lists any problem it finds). `python scripts/bonehub_data.py --format` rewrites the file in the standard layout: one field per line, each list on one line.
- **Publish:** after a push to `main`, the *Update Webpage* workflow checks the file, ranks the datasets and deploys the website. If the file has a problem, the workflow fails and its log lists what to fix.
- **New fields** must be added to `FIELDS` in [scripts/bonehub_data.py](../scripts/bonehub_data.py), to the [issue form](../.github/ISSUE_TEMPLATE/new-dataset-suggestion.yml) (with the same label), and to this guide.
