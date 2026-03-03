# BoneHub Public Datasets - Webpage

This folder contains the GitHub Pages website for the BoneHub Public Datasets repository.

## Files

- **index.html** - Main HTML page
- **styles.css** - Styling for the website
- **script.js** - JavaScript for filtering, sorting, and interactivity
- **data.js** - Auto-generated data file from CSV (do not edit manually)

## Updating the Webpage

The webpage is automatically updated from the CSV file using the Python script.

### Manual Update

To manually update the webpage data:

```bash
python scripts/update_webpage.py
```

This will read `data/bonehub_public_datasets.csv` and regenerate `docs/data.js`.

### Automatic Update via GitHub Actions

The webpage is automatically updated when:
1. You manually trigger the "Update Webpage" workflow from the GitHub Actions tab
2. You push changes to `data/bonehub_public_datasets.csv` on the main branch

## Features

- **Search**: Global search across all dataset fields
- **Column Filters**: Individual filters for each column
- **Sorting**: Click column headers to sort (click again to reverse)
- **Responsive Design**: Works on desktop and mobile devices
- **Dataset Details**: Click "Details" button to see all information
- **Direct Links**: Quick access to dataset links and papers

## Local Testing

To test the webpage locally:

1. Generate the data.js file:
   ```bash
   python scripts/update_webpage.py
   ```

2. Serve the webpage folder using a simple HTTP server:
   ```bash
   # Python 3
   cd docs
   python -m http.server 8000
   ```

3. Open http://localhost:8000 in your browser

## GitHub Pages Setup

To publish this website on GitHub Pages:

1. Push all changes to your GitHub repository
2. Go to repository Settings → Pages
3. Under "Source", select "Deploy from a branch"
4. Select branch "main" and folder "/docs"
5. Click "Save"
6. Your site will be published at `https://yourusername.github.io/repository-name/`

Note: The first deployment may take a few minutes.
