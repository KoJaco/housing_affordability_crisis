# Sydney Housing Data API

A FastAPI-based REST API for querying Sydney property sales data, analytics, and quarterly statistics. The API provides access to property sales data split between houses and units, with comprehensive analytics and time-series data.

## Features

-   **Property Sales Data**: Query individual property sales with filters (suburb, property type, price range, dates)
-   **Suburb Analytics**: Get comprehensive analytics including growth rates, rankings, and market health scores
-   **Quarterly Statistics**: Access quarterly aggregated statistics per suburb
-   **Split by Property Type**: All data is separated between houses and units

## Prerequisites

-   Python 3.9+
-   SQLite (included with Python)
-   Virtual environment (pythom -m venv .venv)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Key dependencies:

-   FastAPI
-   SQLAlchemy
-   Uvicorn
-   Pandas
-   Pydantic

### 2. Data cleaning, Exploration and Analysis

!!!! This is what you're doing right now.

-   See notebooks 01 -> 05.

### 3. Initialize Database (store our data)

The database needs to be initialized and populated with data before running the server.

#### Option A: Using the Notebook (Recommended)

1. Run the data loading notebook:

    ```bash
    jupyter notebook notebooks/06_store_data.ipynb
    ```

2. Execute all cells in order:
    - Cell 1: Import libraries
    - Cell 2: Initialize database from schema
    - Cell 3-7: Load and transform parquet files
    - Cell 8: Insert data into database

#### Option B: Using Python Script

```bash
python src/db/init_db.py
```

Then load data using the notebook (Cell 3 onwards).

### 4. Verify Database

Check that the database was created successfully:

```bash
sqlite3 src/db/database.sqlite "SELECT COUNT(*) FROM properties;"
```

You should see records for properties, suburb_quarterly, and suburb_analytics tables.

## Running the Server

### Development Mode (with auto-reload)

```bash
uvicorn src.main:app --reload
```

The server will start on `http://localhost:8000`

### Production Mode

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

### Using Python Directly

```bash
python -m src.main
```

### Environment Variables

You can configure the server using environment variables:

```bash
export DATABASE_URL="sqlite:///src/db/database.sqlite"
export API_HOST="0.0.0.0"
export API_PORT="8000"

uvicorn src.main:app --reload
```

## API Endpoints

### Base URL

```
http://localhost:8000
```

### Documentation

-   **Interactive API Docs (Swagger)**: http://localhost:8000/docs
-   **ReDoc Documentation**: http://localhost:8000/redoc

### Available Endpoints

#### Health Check

```
GET /health
```

#### Properties

```
GET /api/properties
GET /api/properties/{id}
GET /api/properties/stats/summary
```

Query parameters:

-   `suburb`: Filter by suburb name
-   `property_type`: Filter by property type (`house` or `unit`)
-   `min_price`: Minimum sale price
-   `max_price`: Maximum sale price
-   `start_date`: Start date (YYYY-MM-DD)
-   `end_date`: End date (YYYY-MM-DD)
-   `limit`: Number of results (default: 100, max: 1000)
-   `offset`: Pagination offset (default: 0)

#### Analytics

```
GET /api/analytics
GET /api/analytics/{suburb}
GET /api/analytics/search/suburbs
```

Query parameters:

-   `suburb`: Filter by suburb name
-   `property_type`: Filter by property type (`house` or `unit`)
-   `min_price`: Minimum current median price
-   `sort_by`: Sort field (`suburb`, `price_rank`, `growth_rank`, `speed_rank`, `current_median_price`)
-   `limit`: Number of results (default: 100)
-   `offset`: Pagination offset (default: 0)

#### Quarterly Statistics

```
GET /api/quarterly
GET /api/quarterly/{suburb}
```

Query parameters:

-   `suburb`: Filter by suburb name
-   `property_type`: Filter by property type (`house` or `unit`)
-   `year`: Filter by year
-   `quarter`: Filter by quarter (1-4)
-   `start_year`: Start year (inclusive)
-   `end_year`: End year (inclusive)
-   `limit`: Number of results (default: 100)
-   `offset`: Pagination offset (default: 0)

## Example Requests

### Get properties in a suburb

```bash
curl "http://localhost:8000/api/properties?suburb=NEWTOWN&limit=10"
```

### Get analytics for a suburb

```bash
curl "http://localhost:8000/api/analytics/NEWTOWN"
```

### Search suburbs

```bash
curl "http://localhost:8000/api/analytics/search/suburbs?q=NEW&limit=10"
```

### Get quarterly stats for a suburb

```bash
curl "http://localhost:8000/api/quarterly/NEWTOWN?property_type=house"
```

## Testing

### Using the Test Notebook

1. Start the server (in a separate terminal):

    ```bash
    uvicorn src.main:app --reload
    ```

2. Run the test notebook:

    ```bash
    jupyter notebook notebooks/07_test_db.ipynb
    ```

3. Execute all cells to test all endpoints

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Get properties
curl http://localhost:8000/api/properties?limit=5

# Get analytics
curl http://localhost:8000/api/analytics?limit=5
```

## Project Structure

```
sydney_housing/
├── src/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── db/
│   │   ├── database.py      # Database connection and session management
│   │   ├── init_db.py       # Database initialization script
│   │   ├── schma.sql        # Database schema
│   │   └── database.sqlite  # SQLite database file
│   └── api/
│       ├── schemas.py       # Pydantic models for request/response
│       └── routes/
│           ├── properties.py # Property endpoints
│           ├── analytics.py  # Analytics endpoints
│           └── quarterly.py # Quarterly stats endpoints
├── notebooks/
│   ├── 06_store_data.ipynb # Data loading notebook
│   └── 07_test_db.ipynb    # API testing notebook
├── data/
│   └── transformed_split/  # Transformed parquet files
└── requirements.txt         # Python dependencies
```

## Database Schema

The database consists of three main tables:

1. **properties**: Individual property sales records
2. **suburb_quarterly**: Quarterly aggregated statistics per suburb
3. **suburb_analytics**: Summary analytics and metrics per suburb

All tables include a `property_type` column to distinguish between `house` and `unit` data.

## Future Migration to Turso

The codebase is designed to easily migrate from local SQLite to Turso (libSQL). Since Turso uses SQLite-compatible SQL, you can switch by:

1. Updating the `DATABASE_URL` environment variable to your Turso connection string
2. The same schema and queries will work without modification

## Troubleshooting

### Database not found

-   Ensure you've run the database initialization and data loading steps
-   Check that `src/db/database.sqlite` exists

### Port already in use

-   Change the port: `uvicorn src.main:app --port 8001`
-   Or kill the process using port 8000

### Import errors

-   Ensure you're running from the project root directory
-   Check that all dependencies are installed: `pip install -r requirements.txt`

## License

[Add your license here]
