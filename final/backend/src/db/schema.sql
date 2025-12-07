-- Database schema for property sales data. We're talking about Sydney specifically, and we want our data stored per-suburb on a quarterly basis. 
-- Usually we'd want our ID to be a UUID, but for this project we'll use an integer primary key.


-- Properties (raw data - just filtered down)
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suburb TEXT NOT NULL,
    postcode TEXT,
    district TEXT,
    property_type TEXT NOT NULL CHECK(property_type IN ('house', 'unit')),

    listing_date DATE, -- I made a mistake here, we don't actually have listing date. We have contract date.
    contract_date DATE NOT NULL,
    settlement_date DATE NOT NULL,
    sale_price REAL NOT NULL,
    days_on_market INTEGER, -- This is calculated as the difference in days between the listing and settlement dates. It could be calculated in SQL if we wanted, but I think it's better to do it in the application layer.
    contract_to_settlement_days INTEGER, -- This is calculated as the difference in days between the contract and settlement dates. It could be calculated in SQL if we wanted, but I think it's better to do it in the application layer.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_suburb ON properties(suburb);
CREATE INDEX idx_property_type ON properties(property_type);
CREATE INDEX idx_suburb_type on properties(suburb, property_type);
CREATE INDEX idx_dates ON properties(contract_date, settlement_date);
CREATE INDEX idx_suburb_dates ON properties(suburb, settlement_date);

-- Quarterly aggregates of analytics per suburb
CREATE TABLE suburb_quarterly (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suburb TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK(property_type IN ('house', 'unit')),

    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL,  -- 1, 2, 3, or 4
    quarter_start DATE NOT NULL,  -- e.g. '2024-01-01' for Q1 2024
    
    -- Volume metrics (based on settlement dates within the quarter)
    num_sales INTEGER NOT NULL,
    
    -- Price metrics (based on sales prices within the quarter)
    median_price REAL,
    median_price_smoothed REAL, -- applied exponential smoothing to median price
    mean_price REAL,
    min_price REAL,
    max_price REAL,
    price_stddev REAL,
    
    -- Price percentiles (useful for distribution)
    price_p25 REAL,  -- 25th percentile
    price_p75 REAL,  -- 75th percentile
    
    -- Days on market metrics 
    median_dom REAL,
    mean_dom REAL,
    fast_sales_percentage REAL,  -- % sold within X days (maybe 30 days?)
    median_ctsd REAL, -- ctsd is contracts to settlement days (need a better name)
    mean_ctsd REAL,
    fast_settlements_percentage REAL,  -- % ssettled within X days (42 for NSW)

    -- Market characteristics
    liquidity_score REAL,  -- Volume + speed composite. Can't really calculate this with our current data.
    contract_to_settlement_score REAL,
   
    -- Derived metrics (calculated from previous quarters)
    qoq_price_change_percentage REAL,  -- Quarter-over-quarter
    yoy_price_change_percentage REAL,  -- Year-over-year
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(suburb, property_type, year, quarter)
);

-- Indexes for efficiency in querying
CREATE INDEX idx_suburb_quarter ON suburb_quarterly(suburb, year, quarter);
CREATE INDEX idx_quarter_date ON suburb_quarterly(quarter_start);
CREATE INDEX idx_suburb_property_type ON suburb_quarterly(suburb, property_type);

-- Suburb analytics (summary metrics)
CREATE TABLE suburb_analytics (
    suburb TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK(property_type IN ('house', 'unit')),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Current state (most recent quarter)
    current_quarter TEXT,  -- e.g., '2024-Q4'
    current_median_price REAL,
    current_median_price_smoothed REAL,
    current_avg_ctsd REAL,
    current_num_sales INTEGER,
    
    -- Growth rates (raw)
    growth_1yr_percentage REAL,
    growth_3yr_percentage REAL,
    growth_5yr_percentage REAL,
    growth_10yr_percentage REAL,
    growth_since_2005_percentage REAL,
    cagr_5yr REAL,  -- Compound annual growth rate
    cagr_10yr REAL,

    -- Growth rates (smoothed)
    growth_1yr_percentage_smoothed REAL,
    growth_3yr_percentage_smoothed REAL,
    growth_5yr_percentage_smoothed REAL,
    growth_10yr_percentage_smoothed REAL,
    growth_since_2005_percentage_smoothed REAL,
    cagr_5yr_smoothed REAL,
    cagr_10yr_smoothed REAL,
    
    -- Risk/volatility (calculated from quarterly data)
    volatility_score REAL,  -- Std dev of quarterly returns
    max_drawdown_pct REAL,  -- Worst peak-to-trough decline
    recovery_quarters INTEGER,  -- How long to recover from 2008 crash
    
    -- Market characteristics
    avg_quarterly_volume INTEGER,
    overall_liquidity_score REAL,  -- Volume + speed composite 
    market_health_score REAL,
    
    -- Seasonal patterns (avg by quarter)
    q1_avg_premium_percentage REAL,  -- Q1 price vs annual avg
    q2_avg_premium_percentage REAL,
    q3_avg_premium_percentage REAL,
    q4_avg_premium_percentage REAL,
    best_quarter_to_sell TEXT,  -- e.g., 'Q2' (highest prices historically)
    
    -- Forecasts (next 2 quarters)
    forecast_q1_price REAL,
    forecast_q1_lower REAL,
    forecast_q1_upper REAL,
    forecast_q2_price REAL,
    forecast_q2_lower REAL,
    forecast_q2_upper REAL,
    
    -- Rankings
    price_rank INTEGER,
    growth_rank INTEGER,
    speed_rank INTEGER,
    
    -- Data quality
    total_quarters_with_data INTEGER,  -- Out of 96 possible
    data_completeness_percentage REAL,
    
    -- JSON fields
    price_quarterly TEXT,  -- JSON string
    ctsd_quarterly TEXT,  -- JSON string
    
    UNIQUE(suburb, property_type)
);

CREATE INDEX idx_analytics_suburb ON suburb_analytics(suburb);
CREATE INDEX idx_analytics_suburb_type ON suburb_analytics(property_type);