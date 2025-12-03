# Housing Affordability Crisis - Beginner Lessons

This project guides you through analyzing Sydney property sales data from 2005-2025. You'll learn to filter, explore, analyze, and store property data in a SQLite database.

## Setup Instructions

### 1. Create a Virtual Environment

First, create and activate a Python virtual environment:

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

**Note:** You can use any virtual environment manager you prefer, I'm using `venv` as it's the default but I also use `poetry` and `pipenv`.

### 2. Install Requirements

Install all required Python packages:

```bash
pip install -r requirements.txt
```

### 3. Download Data

Download the property sales data from the Google Drive link below and extract the parquet files to the `data/parquet/` directory. The data should be organized as one parquet file per year (2005.parquet, 2006.parquet, etc.):

**Google Drive Link:** https://drive.google.com/drive/folders/1OATvNow0WpXgpPf2ARsJMTEXQOms0Q87?usp=sharing

After downloading, your directory structure should look like:

```
data/
  parquet/
    2005.parquet
    2006.parquet
    2007.parquet
    ...
    2025.parquet
```

### 4. Get Static Data Files

You'll need a list of Sydney suburbs to filter the NSW property data. You have two options:

**Option A (Recommended):** Find the data yourself (A CHALLENGE), or think of some way to get Sydney suburbs out of the data we currently have (_HINT_: look at the postcodes and districts, and think about how you might be able to filter by them). OR, you could use some other creative method.

**Option B (Alternative):** Copy `sydney_burbs.json` from `/final/backend/notebooks/data/` to your `data/` directory. This file contains a curated list of all Sydney suburbs.

**Note:** The GeoJSON files (`nsw-administrative-boundaries-theme-suburb.geojson`, `sydney_suburbs.geojson`) are optional - they're only needed if you want to create geographic visualizations for the frontend (which I'm doing). The `sydney_burbs.json` file is required for filtering the data.

## Project Structure

```
<cam/nick>_working/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── data/                     # Data directory
│   ├── parquet/             # Raw NSW property data (one file per year)
│   └── sydney/              # Filtered Sydney data (created during lessons)
│   └── transformed_split/   # This may be a bit advanced but you can look at my    transformed data and see how I did it.
├── notebooks/               # Lesson notebooks (work through in order)
│   ├── 01_data_filter.ipynb      # Filter NSW data to Sydney only
│   ├── 02_exploration.ipynb      # Explore and visualize the data
│   ├── 03_quarterly_analysis.ipynb  # Transform data and create quarterly aggregations
│   ├── 04_store_data.ipynb        # Store data in SQLite database
│   ├── 05_test_db.ipynb           # Test database queries
│   └── 06_geojson.ipynb           # Optional: Process GeoJSON for frontend
└── src/
    └── db/
        ├── schema.sql       # Database schema (reference for data structure)
        └── init_db.py       # Database initialization helper (optional)
        └── database.sqlite  # Main application database file
```

## Lesson Overview (I generated lessons using Claude btw)

### Notebook 01: Data Filtering

Learn to load parquet files, combine multiple years of data, and filter NSW property sales down to Sydney suburbs only.

### Notebook 02: Data Exploration

Explore the filtered Sydney data with visualizations and summary statistics to understand patterns and data quality.

### Notebook 03: Quarterly Analysis

Transform the data to match the database schema, split houses vs units, and create quarterly aggregations per suburb.

### Notebook 04: Store Data

Initialize a SQLite database and insert your transformed data into the appropriate tables.

### Notebook 05: Test Database

Write queries to verify your data was stored correctly and test database operations.

### Notebook 06: GeoJSON (Optional)

Process geographic boundary data for frontend mapping visualizations.

## Getting Started

1. Complete the setup steps above
2. Open `notebooks/01_data_filter.ipynb` and follow the hints to begin filtering the data
3. Work through each notebook in order - each builds on the previous one
4. Reference `src/db/schema.sql` to understand the target database structure
