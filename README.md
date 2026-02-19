## ✅ Public Datasets

> **[→ Browse the Complete Dataset Collection](data/datasets.csv)**

# Welcome to the BoneHub's Public Datasets

This repository is a curated collection of publicly available datasets that include **3D bone shapes** or **3D medical images** (such as CT and MRI scans) from which **3D bone shapes can be extracted**. It is designed as a centralized resource for researchers, engineers, and developers working in:

- Biomedical engineering  
- Medical image analysis  
- Biomechanics  
- Computer-aided diagnosis  
- 3D reconstruction and modeling  

We provide structured metadata, links, and usage details for each dataset in both human-readable and machine-readable formats. The aim is to simplify dataset discovery and comparison across anatomical regions and imaging modalities.

> 📌 *Note: This repository does not host any original dataset files — only information and links are provided.*

## 📚 Citation & Acknowledgment

If you have found this resource useful for your research, presentations, or publications, we kindly request that you cite our work. Your acknowledgment helps support the continued development and maintenance of BoneHub's Public Datasets.

- Cite our paper
  
  [(paper doi pending)]()

- Cite this repository
  ```
  @misc{AlaviAsseln2025BoneHubPublicDatasets,
  author = {S.H. Alavi, M. Asseln},
  title = {A Curated Collection of Datasets with 3D Bone Shapes and Medical Image Data},
  year = {2025},
  howpublished = {\url{https://github.com/BoneHub/Public-Datasets},
  note = {Accessed: [Insert Date]}
  }
  ```


## 🔍 Usage Instructions

The complete dataset collection is available in [data/datasets.csv](data/datasets.csv). You can filter and search through the datasets using one of the following methods:

---

### Option 1: AI-Assisted Search (Recommended for Quick Queries) 🤖

If you're not comfortable with manual filtering or want instant results, we've prepared an AI-powered search tool as a **Claude Skill**. This allows you to ask questions in natural language and get filtered results automatically.

#### How to use:

1. **Download the skill file:**  
  Download [BONEHUB_PUBLIC_DATASETS_CLAUDE_SKILL.md](ai_assisted_search/BONEHUB_PUBLIC_DATASETS_CLAUDE_SKILL.md)

2. **Upload to Claude.ai:**  
   - Go to [claude.ai](https://claude.ai)
   - Start a new chat
   - Click the attachment button (📎) and upload the downloaded `.md` skill file

3. **Ask your question:**  
   Simply describe what you're looking for in natural language. Claude will filter the datasets and return matching results.

#### Example prompts:

- *"Find me datasets with CT modality, covering pelvis images, including sacrum 3D shapes, and allowing commercial use."*

- *"Show me all open-access datasets that have MRI scans of the spine with more than 100 subjects."*

- *"Which datasets contain femur 3D shapes in surface mesh format and are licensed under CC BY 4.0?"*

- *"List datasets from 2024 or later that include knee imaging and provide subject metadata like age and gender."*

- *"Find datasets with whole body CT scans that allow redistribution."*

- *"What datasets have cervical vertebrae shapes in voxel mask format?"*

The AI assistant will search through the entire dataset collection and provide you with a filtered list matching your criteria.

---

### Option 2: Manual Filtering 🛠️

If you prefer to filter datasets yourself, you have two main approaches:

#### **A) Using Microsoft Excel**

1. Download the [datasets.csv](data/datasets.csv) file
2. Open it with Microsoft Excel
3. Select the header row (row 1)
4. Go to **Data** → **Filter** (or press Ctrl+Shift+L)
5. Click the dropdown arrows in column headers to filter by specific values
6. Use text filters, date filters, or custom filters to narrow down results

**Tip:** You can apply multiple filters simultaneously across different columns to find exactly what you need.

---

#### **B) Using Python and Pandas**

For more advanced filtering and analysis, you can use Python with the `pandas` library.

##### **Installation:**

```bash
pip install pandas
```

##### **Basic Example - Load and Display Data:**

```python
import pandas as pd

# Load the CSV file
df = pd.read_csv('data/datasets.csv')

# Display first few rows
print(df.head())

# Show all column names
print(df.columns.tolist())

# Basic statistics
print(df.info())
```

##### **Example 1: Filter by Modality**

```python
import pandas as pd

df = pd.read_csv('data/datasets.csv')

# Find all datasets with CT modality
ct_datasets = df[df['Modality'].str.contains('CT', case=False, na=False)]

print(f"Found {len(ct_datasets)} CT datasets")
print(ct_datasets[['Dataset', 'Year', 'Modality', '3D Bone Shapes', 'License']])
```

##### **Example 2: Filter by License (Commercial Use Allowed)**

```python
import pandas as pd

df = pd.read_csv('data/datasets.csv')

# Find datasets with licenses allowing commercial use (CC BY 4.0 or similar)
commercial_friendly = df[df['License'].str.contains('CC BY 4.0', case=False, na=False)]

# Or exclude non-commercial licenses
non_nc_licenses = df[~df['License'].str.contains('NC', case=False, na=False)]

print(f"Found {len(commercial_friendly)} datasets with CC BY 4.0")
print(commercial_friendly[['Dataset', 'Modality', '3D Bone Shapes', 'License']])
```

##### **Example 3: Multiple Criteria - CT, Pelvis, Sacrum, Open Access**

```python
import pandas as pd

df = pd.read_csv('data/datasets.csv')

# Apply multiple filters
filtered = df[
    (df['Modality'].str.contains('CT', case=False, na=False)) &
    (df['Primary Imaged Regions'].str.contains('Pelvis', case=False, na=False)) &
    (df['3D Bone Shapes'].str.contains('Sacrum', case=False, na=False)) &
    (df['Accessibility'] == 'Open')
]

print(f"Found {len(filtered)} matching datasets:")
print(filtered[['Dataset', 'Year', 'N subjects', '3D Format', 'License']])
```

##### **Example 4: Filter by Number of Subjects**

```python
import pandas as pd

df = pd.read_csv('data/datasets.csv')

# Convert 'N subjects' to numeric (handling 'N/A' values)
df['N subjects'] = pd.to_numeric(df['N subjects'], errors='coerce')

# Find datasets with more than 100 subjects
large_datasets = df[df['N subjects'] > 100]

print(f"Found {len(large_datasets)} datasets with >100 subjects")
print(large_datasets[['Dataset', 'N subjects', 'Modality', '3D Bone Shapes']].sort_values('N subjects', ascending=False))
```

##### **Example 5: Filter by 3D Format**

```python
import pandas as pd

df = pd.read_csv('data/datasets.csv')

# Find datasets with surface mesh format
surface_mesh = df[df['3D Format'].str.contains('Surface Mesh', case=False, na=False)]

print(f"Found {len(surface_mesh)} datasets with surface mesh format")
print(surface_mesh[['Dataset', 'Modality', '3D Bone Shapes', '3D Format']])
```

##### **Example 6: Search for Specific Anatomical Regions**

```python
import pandas as pd

df = pd.read_csv('data/datasets.csv')

# Find datasets containing femur shapes
femur_datasets = df[df['3D Bone Shapes'].str.contains('Femur', case=False, na=False)]

print(f"Found {len(femur_datasets)} datasets with femur shapes")
print(femur_datasets[['Dataset', 'Year', 'N subjects', '3D Format', 'Accessibility']])
```

##### **Example 7: Save Filtered Results**

```python
import pandas as pd

df = pd.read_csv('data/datasets.csv')

# Apply your filters
filtered = df[
    (df['Modality'].str.contains('MRI', case=False, na=False)) &
    (df['Accessibility'] == 'Open')
]

# Save to a new CSV file
filtered.to_csv('filtered_mri_datasets.csv', index=False)
print(f"Saved {len(filtered)} filtered datasets to 'filtered_mri_datasets.csv'")
```
---

## 🤝 Contribution - Let's Expand the List of Datasets

We welcome contributions from the community to expand the list of datasets. You may:

- **[Suggest a new dataset](https://github.com/BoneHub/Public-Datasets/issues/new?template=new-dataset-suggestion.yml)** via the provided template.

- Report incorrect information by submitting an [issue](https://github.com/BoneHub/Public-Datasets/issues/new).

- You can also make direct changes to [datasets.csv](data/datasets.csv) by a pull request!

## 📜 License

All dataset summaries, tables, and documentation in this repository are licensed under the:

**Creative Commons Attribution 4.0 International ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))**
   
## ⚠️ Disclaimer

This repository **does not host** any datasets. It only provides links and metadata to publicly available datasets. Users are responsible for reviewing and complying with each dataset's licensing terms, restrictions, and usage agreements as provided by the original source.

## 📬 Contact

Maintained by: **Hamid Alavi**, **Malte Asseln**

Affiliation: Department of Biomechanical Engineering, University of Twente, The Netherlands.

Email: [hamid.alavi@utwente.nl](mailto:hamid.alavi@utwente.nl)

Email: [m.asseln@utwente.nl](mailto:m.asseln@utwente.nl)

