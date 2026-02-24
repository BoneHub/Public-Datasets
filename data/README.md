# 👉 [BoneHub Public Datasets](bonehub_public_datasets.csv) 👈

## Column Descriptions

### Basic Information

| Column | Description |
|--------|-------------|
| **Dataset Name** | The name of the dataset. |
| **Access Link** | URL(s) where the dataset can be accessed. Multiple links are separated by semicolons (`;`). |
| **Related Paper** | Link to the paper(s) describing the dataset, if available (e.g., DOI link). |
| **Country** | Country or countries that own or host the dataset. Multiple countries are separated by semicolons (`;`). |
| **Year** | Year when the dataset was published or made available. |
| **Size** | Approximate size of the dataset in GB (gigabytes). |
| **Remarks** | Any additional remarks that may be relevant to people who want to use the dataset. This may include study population characteristics, imaging modality details, annotations, previous usage, limitations, or intended use. |

### Medical Image Data

| Column | Description |
|--------|-------------|
| **Medical Images Included** | Indicates whether the dataset provides medical images (e.g., CT, MRI). Values: `Yes` or `No`. |
| **Imaging Modality** | The imaging modality(ies) that the dataset is based on. Possible values include: CT, CBCT, MRI, X-ray, Ultrasound, PET, SPECT, or Other. Multiple modalities are separated by semicolons (`;`). |
| **Image Source** | The source of the medical images. Values can include: `Original` (images created specifically for this dataset) or `Adopted` (images sourced from other datasets). Multiple sources are separated by semicolons (`;`). |
| **Image Source Details** | If adopted images are used, this field provides links to the original dataset(s) from which images were sourced. Multiple links are separated by semicolons (`;`). |
| **Primary Imaged Regions** | The primary imaged regions covered in the dataset—main areas of focus that are predominantly visible and fully captured in every image. Examples include: Whole Body, Neurocranium, Viscerocranium, Cervical Spine, Thoracic Spine, Lumbar Spine, Thoracic Cage, Abdomen, Pelvis, Shoulder, Upper Arm, Forearm, Wrist, Hand, Hip, Upper Leg, Knee, Lower Leg, Ankle, or Foot. Multiple regions are separated by semicolons (`;`). |
| **Secondary Imaged Regions** | Additional imaged regions that are partially or fully captured in some images, appearing alongside primary regions but not being the main intended target. Same anatomical region options as Primary Imaged Regions. Multiple regions are separated by semicolons (`;`). |

### Medical Shapes Data

| Column | Description |
|--------|-------------|
| **Available 3D Bone Shapes** | The available 3D bone shapes in the dataset. Examples include: Cranial Bones, Facial Bones, Cervical Vertebrae, Thoracic Vertebrae, Lumbar Vertebrae, Sacrum, Coccyx, Ribs, Sternum, Clavicle, Scapula, Humerus, Radius, Ulna, Carpals, Metacarpals, Phalanges Hand, Hip Bones, Proximal Femur, Femur, Distal Femur, Patella, Proximal Tibia, Tibia, Distal Tibia, Proximal Fibula, Fibula, Distal Fibula, Tarsals, Metatarsals, or Phalanges Foot. Multiple bones are separated by semicolons (`;`). |
| **Additional Structures** | Additional structures (non-bone) available in the dataset that are related to bones. Examples include: intervertebral discs, knee cartilage, muscles, or ligaments. Multiple structures are separated by semicolons (`;`). |
| **Landmarks** | Anatomical landmarks available in the dataset, if any. Examples include: Pelvic Landmarks, Spinal Landmarks, etc. Multiple landmarks are separated by semicolons (`;`). |
| **Voxel Segmentation Mask** | Indicates if voxel segmentation masks are available in the dataset. Values can include: `Available`, `Supervised Segmentation` (created or verified by human experts), or `Automatic Segmentation` (generated using automated algorithms). Multiple options are separated by semicolons (`;`). |
| **Mesh Model** | Indicates if mesh models (e.g., STL, OBJ, PLY) are available in the dataset. Values can include: `Available`, `Supervised 3D Reconstruction` (created or verified by experts), or `Automatic 3D Reconstruction` (generated using automated algorithms). Multiple options are separated by semicolons (`;`). |
| **CAD Model** | Indicates if CAD models (e.g., STEP, IGES) are available in the dataset. Values can include: `Available`, `Supervised CAD Modeling` (created or verified by experts), or `Automatic CAD Modeling` (generated using automated algorithms). Multiple options are separated by semicolons (`;`). |

### Subjects Metadata

| Column | Description |
|--------|-------------|
| **Number of Subjects** | Total number of subjects in the dataset. Note that the number of subjects may differ from the number of images or 3D shapes. |
| **Available Information per Subject** | Types of information available for each subject. Examples include: Age, Gender, Height, Weight, BMI, Ethnicity, Medical History, etc. Information can be found in DICOM tags or in separate CSV/Excel files. Multiple attributes are separated by semicolons (`;`). |
| **Subjects Vital Status** | Vital status of the subjects in the dataset. Values can include: `Alive` or `Postmortem`. Multiple statuses are separated by semicolons (`;`). |
| **Subjects Clinical Condition** | Clinical condition of the subjects in the dataset. Examples include: Healthy, Osteoarthritis, Fracture, Implant, Post-operative, Ligament Tear, etc. Multiple conditions are separated by semicolons (`;`). |

### Data Usage Policy

| Column | Description |
|--------|-------------|
| **Access Policy** | The access type for this dataset. Values can include: `Open Access` (free to access without restrictions), `Restricted` (requires approval from dataset owner), `Simple Registration` (requires account creation), or `Payment Required`. Multiple policies are separated by semicolons (`;`). |
| **Data Redistribution Policy** | Whether derivatives of this dataset may be redistributed. Values can include: `Allowed`, `Restricted`, or `Not Specified`. Multiple policies are separated by semicolons (`;`). |
| **Research Use Policy** | Whether the dataset can be used for research purposes. Values can include: `Allowed`, `Restricted`, or `Not Specified`. Multiple policies are separated by semicolons (`;`). |
| **Commercial Use Policy** | Whether the dataset can be used for commercial purposes. Values can include: `Allowed`, `Restricted`, or `Not Specified`. Multiple policies are separated by semicolons (`;`). |
| **License** | The license under which the dataset is released. Examples include: CC BY 4.0, CC BY-NC-ND 4.0, MIT, or Custom License. Multiple licenses are separated by semicolons (`;`). |

## Notes

- **Multiple Values**: When multiple values are applicable for a column, they are separated by semicolons (`;`).
- **Empty Fields**: Fields that are not applicable or not specified for a particular dataset are left blank.
- **3D Bone Shapes Requirement**: Datasets in this registry must include 3D bone shapes (as segmentation masks or surface meshes) AND/OR 3D medical images (CT, MRI) from which 3D bone shapes could be generated.

## Contributing

To suggest a new dataset for inclusion in this registry, please refer to the issue template [here](https://github.com/BoneHub/Public-Datasets/issues/new?template=new-dataset-suggestion.yml).
