## Table of Contents

### 🌐 [Browse Datasets on Our Website](https://bonehub.github.io/Public-Datasets/)
### 📖 [Introduction](#introduction---welcome-to-the-bonehubs-public-datasets)
### 🔍 [Usage Instructions](#usage-instructions)
### 🤝 [Contribution](#contribution---lets-expand-the-list-of-datasets)
### 📚 [Citation & Acknowledgment](#citation--acknowledgment)
### ⚠️ [Disclaimer](#disclaimer)
### 📬 [Contact](#contact)

## Introduction - Welcome to the BoneHub's Public Datasets

This repository is a curated collection of publicly available datasets that include **3D bone shapes** or **3D medical images** (such as CT and MRI scans) from which **3D bone shapes can be extracted**. It is designed as a centralized resource for researchers, engineers, and developers working in:

- Biomedical engineering  
- Medical image analysis  
- Biomechanics  
- Computer-aided diagnosis  
- 3D reconstruction and modeling  

We provide structured metadata, links, and usage details for each dataset in both human-readable and machine-readable formats. The aim is to simplify dataset discovery and comparison across anatomical regions and imaging modalities.

> 📌 *Note: This repository does not host any original dataset files — only information and links are provided.*

## Usage Instructions

The complete dataset collection is available in [data/bonehub_public_datasets.csv](data/README.md). You can filter and search through the datasets using one of the following methods:

---

### Interactive Web Interface (Recommended) 🌐

**[Visit our interactive website](https://bonehub.github.io/Public-Datasets/)** to browse and search datasets with an easy-to-use interface.

Features:
- **Global Search**: Search across all dataset fields
- **Column Filters**: Filter by specific attributes (every column is filterable!)
- **Interactive Links**: Direct access to datasets and papers
- **Responsive Design**: Works on all devices
- **Always Up-to-date**: Automatically synchronized with our dataset collection

This is the easiest way to explore and find relevant datasets!

---

### Option 2: AI-Assisted Search (Quick Queries) 🤖

If you're not comfortable with manual filtering or want instant results, we've prepared an AI-powered search tool as a **Claude Skill**. This allows you to ask questions in natural language and get filtered results automatically.

#### How to use:

1. **Download both required files:**  
   - Skill file: [BONEHUB_PUBLIC_DATASETS_CLAUDE_SKILL.md](ai_assisted_search/BONEHUB_PUBLIC_DATASETS_CLAUDE_SKILL.md)
   - CSV data: [bonehub_public_datasets.csv](data/bonehub_public_datasets.csv)

2. **Upload both files to Claude.ai:**  
   - Go to [claude.ai](https://claude.ai)
   - Start a new chat
   - Upload **both** the `.md` skill file AND the `.csv` data file. You can simply drag & drop files into the chat window.

3. **Ask your question:**  
   Simply describe what you're looking for in natural language. Claude will filter the datasets and return matching results.

#### Example prompts:

- *"Find CT datasets with Pelvis in Primary Imaged Regions that have Sacrum in Available 3D Bone Shapes and Data Redistribution Policy = Allowed."*

- *"Show me Open Access datasets with MRI imaging that have 100 or more subjects."*

- *"Which datasets have Femur in Available 3D Bone Shapes, include Mesh Model = Available, and license = CC BY 4.0?"*

- *"List datasets from 2024 or later with Knee in Primary Imaged Regions and available information includes Age and Gender."*

- *"Find Whole Body CT datasets with Open Access policy and Commercial Use Policy = Allowed."*

- *"What datasets have Pelvis in Primary Imaged Regions with Available 3D Reconstruction for the mesh model?"*

The AI assistant will search through the entire dataset collection and provide you with a filtered list matching your criteria.

---

### Option 3: Manual Filtering 🛠️

If you prefer to filter datasets yourself, you have two main approaches:

#### **A) Using Microsoft Excel**

1. Download the [data/bonehub_public_datasets.csv](data/bonehub_public_datasets.csv) file
2. Open it with Microsoft Excel
3. Select the header row (row 1)
4. Go to **Data** → **Filter** (or press Ctrl+Shift+L)
5. Click the dropdown arrows in column headers to filter by specific values
6. Use text filters, date filters, or custom filters to narrow down results

**Filtering Semicolon-Separated Values:**  
Many columns (e.g., `Primary Imaged Regions`, `Available 3D Bone Shapes`) contain multiple values separated by `;` in a single cell. Excel's standard filter treats the entire cell as one string, so you **cannot filter individual values** directly from the dropdown menu. However, you have two alternatives:

- **Use Find & Replace with Filters**: Use **Ctrl+H** to open Find & Replace, search for a specific term (e.g., "Femur"), then manually select matching rows.
- **Use Custom AutoFilter**: Click the dropdown in a column, select **Text Filters** → **Contains**, and enter the term you're looking for (e.g., "Pelvis"). This will show all rows where that value appears anywhere in the cell.

**Tip:** For complex filtering across multiple semicolon-separated values, Python (Option B) is more efficient.

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
df = pd.read_csv('data/bonehub_public_datasets.csv')

# Display first few rows
print(df.head())

# Show all column names
print(df.columns.tolist())

# Basic statistics
print(df.info())
```

##### **Example 1: Filter by Imaging Modality and Access Policy**

```python
import pandas as pd

df = pd.read_csv('data/bonehub_public_datasets.csv')

# Find all CT datasets with Open Access
ct_open = df[
    (df['Imaging Modality'].str.contains('CT', case=False, na=False)) &
    (df['Access Policy'] == 'Open Access')
]

print(f"Found {len(ct_open)} CT datasets with Open Access")
print(ct_open[['Dataset Name', 'Year', 'Country', 'Imaging Modality', 'Access Policy']])
```

##### **Example 2: Filter by Anatomical Region and Available 3D Shapes**

```python
import pandas as pd

df = pd.read_csv('data/bonehub_public_datasets.csv')

# Find datasets with Femur shapes in Available 3D Bone Shapes and Pelvis in Primary Imaged Regions
femur_pelvis = df[
    (df['Available 3D Bone Shapes'].str.contains('Femur', case=False, na=False)) &
    (df['Primary Imaged Regions'].str.contains('Pelvis', case=False, na=False))
]

print(f"Found {len(femur_pelvis)} datasets with Femur and Pelvis region")
print(femur_pelvis[['Dataset Name', 'Year', 'Number of Subjects', 'Mesh Model', 'License']])
```
---

## Contribution - Let's Expand the List of Datasets

We welcome contributions from the community to expand the list of datasets. You may:

- **[Suggest a new dataset](https://github.com/BoneHub/Public-Datasets/issues/new?template=new-dataset-suggestion.yml)** via the provided template.

- Report incorrect information by submitting an [issue](https://github.com/BoneHub/Public-Datasets/issues/new).

- You can also make direct changes to [data/bonehub_public_datasets.csv](data/bonehub_public_datasets.csv) by a pull request!

## Citation & Acknowledgment

If you have found this resource useful for your work, we kindly request that you cite us. Your acknowledgment helps support the continued development and maintenance of this resource.

- Cite our paper
  
  (paper doi pending)

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
   
## Disclaimer

This repository **does not host** any datasets. It only provides links and metadata to publicly available datasets. Users are responsible for reviewing and complying with each dataset's licensing terms, restrictions, and usage agreements as provided by the original source.

## Contact

This repository is maintained by: **Hamid Alavi** and **Malte Asseln**

Affiliation: Department of Biomechanical Engineering, University of Twente, The Netherlands.

Email: [hamid.alavi@utwente.nl](mailto:hamid.alavi@utwente.nl)

Email: [m.asseln@utwente.nl](mailto:m.asseln@utwente.nl)

