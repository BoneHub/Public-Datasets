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
https://raw.githubusercontent.com/BoneHub/Public-Datasets/main/data/datasets.csv
```

---

## Step-by-Step Procedure

### 1. Download the CSV

**Do NOT use `curl` or any bash network command** — the bash environment has no network access.

Instead, use the `web_fetch` tool (available natively to Claude) to fetch the raw CSV content:

- URL to fetch: `https://raw.githubusercontent.com/BoneHub/Public-Datasets/main/data/datasets.csv`

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

### 3. Understand the Schema

Before answering any question, quickly inspect the CSV structure:

```bash
head -1 /home/claude/data.csv   # column names
wc -l /home/claude/data.csv     # row count
```

Keep a mental note of: column names, approximate row count, and likely data types.

### 4. Answer the User's Question

Use Python (via `bash_tool`) with `pandas` to answer questions accurately and efficiently.

```bash
python3 - <<'EOF'
import pandas as pd

df = pd.read_csv('/home/claude/data.csv')

# --- Your query logic here ---

EOF
```

#### Common query patterns

| User intent | Pandas approach |
|---|---|
| "Show rows where X = Y" | `df[df['X'] == 'Y']` |
| "Find rows where X > N" | `df[df['X'] > N]` |
| "What is the average of X?" | `df['X'].mean()` |
| "Top 10 by X" | `df.nlargest(10, 'X')` |
| "Count by category" | `df['X'].value_counts()` |
| "Summary / describe" | `df.describe()` |
| "Search for keyword in text" | `df[df['col'].str.contains('keyword', case=False, na=False)]` |
| "Missing values?" | `df.isnull().sum()` |
| "Unique values in column" | `df['X'].unique()` |
| "Sort by X" | `df.sort_values('X')` |

Always print results clearly. For large outputs, limit display to a sensible number of rows
(e.g. top 20) and tell the user the total count.

### 5. Present Results Clearly

- Lead with a direct answer to the user's question in plain language.
- Follow with the supporting data (table, number, list) formatted for readability.
- If the result is a large table, summarize key takeaways, and offer the full data as a
  downloadable file if useful:
  ```bash
  cp /home/claude/data.csv /mnt/user-data/outputs/data.csv
  # or write a filtered result:
  df.to_csv('/mnt/user-data/outputs/result.csv', index=False)
  ```
- If the question is ambiguous (e.g. "find big orders" without a threshold), make a
  reasonable assumption and state it explicitly.

### 6. Handle Follow-Up Questions

The CSV is already downloaded to `/home/claude/data.csv`. For every follow-up question,
skip straight to Step 4 — no need to re-download.

If the user asks about a **different** CSV, go back to Step 1 and download the new file,
overwriting the previous one.

---

## Error Handling

| Problem | Action |
|---|---|
| `web_fetch` fails | Report that the file could not be fetched; confirm the repo is public |
| Column not found | Print available columns and ask the user to clarify |
| CSV is very large (>100 MB) | Warn the user; use chunked reading: `pd.read_csv(..., chunksize=10000)` |
| Encoding errors | Try `pd.read_csv(..., encoding='latin-1')` as a fallback |
| pandas not installed | `pip install pandas --break-system-packages` then retry |

---

## Example Interactions

**User:** What datasets are available?

**Claude should:**
1. Download the CSV from the hardcoded URL
2. Inspect column names and row count
3. Show the user a summary of available datasets (names, categories, or whatever columns are present)

---

**User:** Find all datasets related to healthcare.

**Claude should:**
- Skip the download (file already cached at `/home/claude/data.csv`)
- Search relevant text columns for "health" / "healthcare" using `str.contains`
- Return matching rows and state the total count

---

## Notes

- Never ask the user for a URL — the source is always the hardcoded URL above.
- Prefer pandas for all data manipulation — it handles edge cases (quoted commas, mixed types) better than manual parsing.
- Be explicit about any assumptions made (e.g. column name guesses, case-insensitive search).
- If producing a filtered output the user might want to keep, save it to `/mnt/user-data/outputs/` and use `present_files` to share it.
