---
name: csv-github-query
description: >
  Download the BoneHub public datasets CSV from GitHub and answer user questions about
  its contents — filtering, searching, summarizing, or analyzing the data.
---

# CSV GitHub Query Skill

## Purpose

This skill fetches a fixed, known CSV file from GitHub and answers any question the user
has about its data — filtering rows, summarizing columns, finding specific values,
computing aggregates, and more.

---

## The Data Source

The CSV is always fetched from this hardcoded raw URL (do NOT ask the user for a URL):

```
https://raw.githubusercontent.com/BoneHub/Public-Datasets/main/data/bonehub_public_datasets.csv
```

---

## Step-by-Step Procedure

### 1. Download the CSV

**Do NOT use `curl` or any bash network command** — the bash environment has no network access.

Instead, use the `web_fetch` tool (available natively to Claude) to fetch the raw CSV content:

- URL to fetch: `https://raw.githubusercontent.com/BoneHub/Public-Datasets/main/data/bonehub_public_datasets.csv`

Once `web_fetch` returns the CSV text, write it to disk using `file_create` or `bash_tool`:

```bash
cat > /home/claude/data.csv << 'CSVEOF'
<paste the fetched CSV content here>
CSVEOF
```

Then verify it looks correct:

```bash
head -5 /home/claude/data.csv
wc -l /home/claude/data.csv
```

If `web_fetch` fails, inform the user the file could not be fetched and that the repository may not be publicly accessible.

### 2. Optimize Data Loading

For **efficient processing**, use an optimized pandas loading strategy:

```python
import pandas as pd
import numpy as np

# Load with automatic dtype optimization
df = pd.read_csv(
    '/home/claude/data.csv',
    dtype_backend='numpy_nullable',  # Better memory efficiency
    low_memory=True,                  # Process in chunks
)

# For VERY large files (>500 MB), use chunked reading:
# chunks = pd.read_csv('/home/claude/data.csv', chunksize=10000)
# df = pd.concat([chunk for chunk in chunks], ignore_index=True)

# Optimize dtypes to reduce memory footprint
def optimize_dtypes(df):
    for col in df.select_dtypes(include=['object']).columns:
        if df[col].nunique() < len(df) * 0.05:  # Few unique values
            df[col] = df[col].astype('category')
    return df

df = optimize_dtypes(df)
```

### 3. Build a Schema Index (First Load Only)

Before answering questions, quickly inspect and cache column metadata:

```python
# This runs once per conversation
schema = {
    'columns': df.columns.tolist(),
    'dtypes': df.dtypes.to_dict(),
    'row_count': len(df),
    'numeric_cols': df.select_dtypes(include=[np.number]).columns.tolist(),
    'text_cols': df.select_dtypes(include=['object', 'string']).columns.tolist(),
    'nulls': df.isnull().sum().to_dict(),
}
print(f"Loaded {schema['row_count']:,} rows | Memory: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
print(f"Columns: {schema['columns']}")
```

Keep this metadata in memory for fast subsequent operations.

### 4. Answer the User's Question — Optimized Patterns

**Always use vectorized pandas operations** (never loop row-by-row). Pandas vectorized operations are 10-100x faster.

#### Optimized Query Patterns

| User intent | **Optimized Pandas approach** | Why faster |
|---|---|---|
| "Show rows where X = Y" | `df[df['X'] == 'Y'].head(20)` | Use boolean indexing, limit output |
| "Find rows where X > N" | `df.loc[df['X'] > N]` (use `.loc` for label-based indexing) | Direct index lookup |
| "What is the average of X?" | `df['X'].mean()` | Single-pass vectorized operation |
| "Top 10 by X" | `df.nlargest(10, 'X')` instead of `df.sort_values('X').tail(10)` | Optimized sorting algorithm |
| "Count by category" | `df['X'].value_counts(sort=True)` | C-optimized aggregation |
| "Search for keyword in text" | `df[df['col'].str.contains('keyword', case=False, na=False)]` with `.loc` if filtering | Vectorized string matching |
| "Unique values in column" | `df['X'].unique()` then `.value_counts()` | Vectorized; avoid loops |
| "Group & aggregate" | `df.groupby('X')['Y'].agg(['mean', 'count', 'std'])` | Highly optimized grouped operations |
| "Filter multiple conditions" | `df[(df['A'] > 5) & (df['B'] == 'Y')]` (use `&` not `and`) | Boolean indexing is fast |
| **Avoid:** applying functions row-by-row | DO NOT use `df.apply()` on large datasets | Extremely slow; use vectorized alternatives |

#### Performance Tips for Large DataFrames

```python
# ✅ FAST: Vectorized operations
result = df[df['col'].isin(['a', 'b', 'c'])].groupby('category')['value'].sum()

# ❌ SLOW: Row-by-row processing (NEVER do this)
# result = df.apply(lambda row: ..., axis=1)

# ✅ FAST: Filter before aggregating
result = df[df['year'] >= 2020].groupby('region')['sales'].mean()

# ✅ FAST: Use categorical dtypes for grouped queries
df['region'] = df['region'].astype('category')
result = df.groupby('region')['value'].sum()

# ✅ FAST: Pre-sort for multiple queries on same column
df = df.sort_values('date')
early = df[df['date'] < '2021-01-01']
late = df[df['date'] >= '2021-01-01']
```

**Example optimized workflow:**

```python
import pandas as pd
import numpy as np

df = pd.read_csv('/home/claude/data.csv', low_memory=True)
df['date'] = pd.to_datetime(df['date'], errors='coerce')  # Convert once
df['category'] = df['category'].astype('category')

# Answer the question with vectorized operations
result = df[df['date'] >= '2020-01-01'].groupby('category')['value'].agg(['mean', 'count'])
print(result)
```

### 5. Present Results Clearly & Efficiently

- **Answer first:** Direct answer in plain language before showing data.
- **Limit output:** Always use `.head(20)` or `.iloc[:20]` to cap displayed rows — huge tables are slow to render.
- **Show counts:** Report total rows matching the query, not just displayed rows.
- **Format efficiently:** Use `to_string(max_rows=20)` for cleaner display:
  ```python
  result = df[df['col'] > threshold].head(20)
  print(result.to_string())
  print(f"\n... and {len(df[df['col'] > threshold]) - 20:,} more rows")
  ```
- **Save large results:** If the user asks for detailed results, save to file instead of displaying:
  ```python
  filtered = df[df['condition'] == True]
  if len(filtered) > 100:
      filtered.to_csv('/mnt/user-data/outputs/result.csv', index=False)
      print(f"Saved {len(filtered):,} rows to result.csv")
  else:
      print(filtered.to_string())
  ```
- **Use summaries for big data:** Instead of showing all rows, provide aggregates:
  ```python
  # Instead of: print(df[df['value'] > 100])
  # Do this: print(df[df['value'] > 100].groupby('category').size())
  ```

### 6. Handle Follow-Up Questions — Session Caching

**For multiple questions in the same conversation:**

1. **Load CSV once** — Keep the DataFrame in memory across follow-up questions. Don't reload.
2. **Reuse schema metadata** — Store column names, dtypes, and numeric/text columns in a dict after first load.
3. **Cache filtered subsets** — If the user asks multiple questions about the same subset (e.g. "all 2021 data"), cache that filtered DataFrame.
4. **Pre-compute indexes** — For repeated grouped queries, set the index once:
   ```python
   df = df.set_index('date')  # Fast subsequent lookups by date
   ```

**Example multi-question workflow:**

```python
import pandas as pd

# Question 1: Load and optimize
df = pd.read_csv('/home/claude/data.csv', low_memory=True)
df['date'] = pd.to_datetime(df['date'], errors='coerce')

# Question 2: Reuse df, no reload
result = df[df['category'] == 'A'].groupby('date')['value'].mean()

# Question 3: Cache subset
df_2021 = df[df['date'].dt.year == 2021]
result = df_2021.groupby('region')['value'].sum()  # Fast—using cached subset

# Question 4: Use cache again
result = df_2021['region'].value_counts()  # No filtering needed
```

**If the user asks about a different CSV**, go back to Step 1 and reload.

---

## Performance Optimization Summary

| Technique | Speedup | When to use |
|---|---|---|
| **Vectorized operations** (no loops) | 10–100× | All queries — use `.values`, `.isin()`, groupby, not `.apply()` |
| **Categorical dtypes** | 5–10× | For columns with many repeated values (seasons, regions, categories) |
| **Chunked reading** | ∞ (memory) | Files >500 MB — use `chunksize=10000` or `dask` |
| **Pre-filtering** | 2–5× | Filter early before expensive operations (groupby, merge) |
| **Setting index** | 2–3× | For repeated lookups on same column — `df.set_index('col')` |
| **Query caching** | Variables | Store frequently accessed subsets as separate variables |
| **Output limiting** | 1–2× | Always `.head(20)` before printing huge tables |

---

## Error Handling

| Problem | Action | Performance note |
|---|---|---|
| `web_fetch` fails | Report that the file could not be fetched | Fail-fast; don't retry indefinitely |
| Column not found | Print available columns; ask for clarification | Keep schema dict handy; don't re-scan |
| CSV is very large (>500 MB) | Use chunked reading: `pd.read_csv(..., chunksize=10000)` | Prevents memory overflow |
| Encoding errors | Try `encoding='latin-1'` or `encoding='iso-8859-1'` | Fallback quickly; don't try multiple times |
| pandas not installed | Install immediately: `pip install pandas` | Required; install once per session |
| Slow groupby on large data | Convert column to `category` dtype first; use `observed=True` in groupby | Reduces memory and compute |
| Out of memory | Switch to chunked reading or `dask` for massive files | Don't load all data at once |

---

## Example Interactions — Optimized

**User:** What datasets are available?

**Claude should:**
1. Load CSV with dtype optimization (Step 2)
2. Build schema index (Step 3)
3. Show a summary (limit output, use `value_counts()` for aggregates):
   ```python
   print(f"Total datasets: {len(df)}")
   print(df['category'].value_counts().head(10))
   ```

---

**User:** Find all datasets related to healthcare.

**Claude should:**
- Use the cached DataFrame (no reload)
- Use vectorized string search with boolean indexing:
  ```python
  result = df[df['description'].str.contains('health|medical', case=False, na=False)]
  print(f"Found {len(result)} datasets")
  print(result[['name', 'category']].head(20).to_string())
  ```

---

**User:** What's the distribution of datasets by year?

**Claude should:**
- Convert year column to numeric if needed
- Use `.value_counts()` (vectorized):
  ```python
  dist = df['year'].value_counts().sort_index(ascending=False)
  print(dist.head(20))
  ```

---

**User (follow-up):** Show top 5 datasets by citation count.

**Claude should:**
- Reuse the same DataFrame (already loaded)
- Use `.nlargest()` (optimized for this operation):
  ```python
  top = df.nlargest(5, 'citations')[['name', 'citations']]
  print(top.to_string())
  ```

## Best Practices for Speed & Efficiency

- **Always use vectorized operations** — No `apply()`, `iterrows()`, or loops on large data. Use pandas built-in methods instead.
- **Never ask the user for a URL** — The source is always the hardcoded URL above.
- **Optimize dtypes immediately** — After loading, convert low-cardinality `object` columns to `category` (5–10× faster).
- **Pre-convert dates & numerics once** — `pd.to_datetime()` and `.astype()` should happen immediately after load, then reused.
- **Cache filtered subsets for multi-question sessions** — If the user asks multiple questions about the same subset (e.g., "all 2021 data"), store it: `df_2021 = df[df['year'] == 2021]`.
- **Limit output always** — Always use `.head(20)` or `.iloc[:20]` before printing; show summary statistics instead of massive tables.
- **Prefer `.nlargest()/.nsmallest()` over sorting** — 2–3× faster than `sort_values()` + slicing for top-N queries.
- **Use `.isin()` for membership checks** — Vectorized; much faster than `== 'A' | == 'B' | == 'C'`.
- **Be explicit about assumptions** — State case-insensitivity, null handling, and data types where relevant.
- **Fail fast** — If columns are missing or data is malformed, report the error immediately with available column names.
- **Save large outputs to files** — Use `.to_csv()` for results with >100 rows; don't print to terminal.
