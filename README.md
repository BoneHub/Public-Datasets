<div align="center">

<h2>
  ✨ <a href="https://bonehub.github.io/Public-Datasets/">Dataset Browser</a> ✨
</h2>

<p>👆 Click above to browse the datasets 👆</p>


<img src="./webpage/logo-with-text.png" width="30%" />

<br>
<br>

<a href="https://bonehub.github.io/Public-Datasets/"><img alt="Public-Datasets" src="https://img.shields.io/badge/Webpage-Live-green"></a>
<a href="https://doi.org/10.1016/j.jbiomech.2026.113288">
   <img alt="DOI" src="https://img.shields.io/badge/DOI-10.1016/j.jbiomech.2026.113288-blue">
</a>
    


</div>

## Table of Contents
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

The complete dataset collection is available in [data/bonehub_public_datasets.json](data/bonehub_public_datasets.json) (see the [data guide](data/README.md) for the format and field descriptions). You can filter and search through the datasets using one of the following methods:

---

### Option 1: Interactive Web Interface (Recommended) 🌐

**[Visit our interactive website](https://bonehub.github.io/Public-Datasets/)** to browse and search datasets with an easy-to-use interface.

Features:
- **Global Search**: Search across all dataset fields
- **Filters with live counts**: Narrow down by data included (images, segmentations, meshes, CAD, landmarks), imaging modality, body region, 3D bone shapes, number of subjects, year, size, usage rights, license, and more
- **Card or table view**: Scan short dataset summaries, then open any dataset to see all of its details
- **Shareable links**: The URL keeps your filters, so you can bookmark or share a filtered view or a single dataset
- **Interactive Links**: Direct access to datasets and papers
- **CSV Export**: Download the filtered datasets with all fields as a CSV file (e.g., for Excel)
- **Always Up-to-date**: Automatically synchronized with our dataset collection

This is the easiest way to explore and find relevant datasets!

---

### Option 2: AI-Assisted Search (Quick Queries) 🤖

If you're not comfortable with manual filtering or want instant results, we've prepared an AI-powered search tool as a **Claude Skill**. This allows you to ask questions in natural language and get filtered results automatically.

#### How to use:

1. **Download both required files:**  
   - Skill file: [BONEHUB_PUBLIC_DATASETS_CLAUDE_SKILL.md](ai_assisted_search/BONEHUB_PUBLIC_DATASETS_CLAUDE_SKILL.md)
   - JSON data: [bonehub_public_datasets.json](data/bonehub_public_datasets.json)

2. **Upload both files to Claude.ai:**  
   - Go to [claude.ai](https://claude.ai)
   - Start a new chat
   - Upload **both** the `.md` skill file AND the `.json` data file. You can simply drag & drop files into the chat window.

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

1. Open the [website](https://bonehub.github.io/Public-Datasets/) and click **Export CSV** (with no filters set, it exports all datasets)
2. Open the downloaded CSV file with Microsoft Excel
3. Select the header row (row 1)
4. Go to **Data** → **Filter** (or press Ctrl+Shift+L)
5. Click the dropdown arrows in column headers to filter by specific values
6. Use text filters, date filters, or custom filters to narrow down results

**Filtering Semicolon-Separated Values:**  
In the CSV export, many columns (e.g., `Primary Imaged Regions`, `Available 3D Bone Shapes`) contain multiple values separated by `;` in a single cell. Excel's standard filter treats the entire cell as one string, so you **cannot filter individual values** directly from the dropdown menu. However, you have two alternatives:

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

# Load the JSON file (or read it straight from GitHub:
# 'https://raw.githubusercontent.com/BoneHub/Public-Datasets/main/data/bonehub_public_datasets.json')
df = pd.read_json('data/bonehub_public_datasets.json')

# Display first few rows
print(df.head())

# Show all column names
print(df.columns.tolist())

# Basic statistics
print(df.info())
```

Fields with multiple values (e.g., `Imaging Modality`, `Primary Imaged Regions`, `Access Policy`) hold Python lists such as `['CT', 'MRI']`, so filter them with `in`.

##### **Example 1: Filter by Imaging Modality and Access Policy**

```python
import pandas as pd

df = pd.read_json('data/bonehub_public_datasets.json')

# Find all CT datasets with Open Access
ct_open = df[
    df['Imaging Modality'].apply(lambda values: 'CT' in values) &
    df['Access Policy'].apply(lambda values: 'Open Access' in values)
]

print(f"Found {len(ct_open)} CT datasets with Open Access")
print(ct_open[['Dataset Name', 'Year', 'Country', 'Imaging Modality', 'Access Policy']])
```

##### **Example 2: Filter by Anatomical Region and Available 3D Shapes**

```python
import pandas as pd

df = pd.read_json('data/bonehub_public_datasets.json')

# Find datasets with Femur shapes in Available 3D Bone Shapes and Pelvis in Primary Imaged Regions
femur_pelvis = df[
    df['Available 3D Bone Shapes'].apply(lambda values: 'Femur' in values) &
    df['Primary Imaged Regions'].apply(lambda values: 'Pelvis' in values)
]
# Tip: to also match 'Proximal Femur' and 'Distal Femur', use a partial match instead:
#   df['Available 3D Bone Shapes'].apply(lambda values: any('femur' in v.lower() for v in values))

print(f"Found {len(femur_pelvis)} datasets with Femur and Pelvis region")
print(femur_pelvis[['Dataset Name', 'Year', 'Number of Subjects', 'Mesh Model', 'License']])
```
---

## Contribution - Let's Expand the List of Datasets

We welcome contributions from the community to expand the list of datasets. You may:

- **[Suggest a new dataset](https://github.com/BoneHub/Public-Datasets/issues/new?template=new-dataset-suggestion.yml)** via the provided template.

- Report incorrect information by submitting an [issue](https://github.com/BoneHub/Public-Datasets/issues/new).

- You can also make direct changes to [data/bonehub_public_datasets.json](data/bonehub_public_datasets.json) by a pull request! See [Editing the Data](data/README.md#editing-the-data) for the format.

## Citation & Acknowledgment

If you have found this resource useful for your work, we kindly request that you cite us. Your acknowledgment helps support the continued development and maintenance of this resource.

- Cite our [paper](https://doi.org/10.1016/j.jbiomech.2026.113288)
   ```
  Alavi, S. H., Tuijthof, G. J., Verdonschot, N. J., & Asseln, M. (2026). Datasets for acquiring 3D bone shapes: a systematic review. Journal of Biomechanics, 113288. https://doi.org/10.1016/j.jbiomech.2026.113288
  ```

- Cite this repository (BibTeX)
  ```
   @software{AlaviAsseln2025BoneHubPublicDatasets,
      author = {Alavi, S. H. and Asseln, M.},
      title = {A Guide for finding 3D bone shapes and medical image datasets},
      year = {2025},
      url = {https://github.com/BoneHub/Public-Datasets}
  }
  ```
   
## Disclaimer

This repository **does not host** any datasets. It only provides information and links to publicly available datasets. Users are responsible for reviewing and complying with each dataset's licensing terms, restrictions, and usage agreements as provided by the original source.

## Contact

This repository is maintained by: **Hamid Alavi** and **Malte Asseln**

Affiliation: Department of Biomechanical Engineering, University of Twente, The Netherlands.

Email: [hamid.alavi@utwente.nl](mailto:hamid.alavi@utwente.nl)

Email: [m.asseln@utwente.nl](mailto:m.asseln@utwente.nl)

