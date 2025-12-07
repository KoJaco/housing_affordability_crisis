"""Pydantic models for API request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# Property Schemas
class PropertyBase(BaseModel):
    """Base property schema."""
    suburb: str
    postcode: Optional[str] = None
    district: Optional[str] = None
    property_type: str = Field(..., pattern="^(house|unit)$")
    contract_date: date
    settlement_date: date
    sale_price: float
    contract_to_settlement_days: Optional[int] = None


class Property(PropertyBase):
    """Property response schema."""
    id: int
    listing_date: Optional[date] = None
    days_on_market: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PropertyListResponse(BaseModel):
    """Response schema for property list endpoint."""
    items: List[Property]
    total: int
    limit: int
    offset: int


class PropertyStatsResponse(BaseModel):
    """Response schema for property statistics."""
    total_count: int
    avg_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    median_price: Optional[float] = None


# Quarterly Stats Schemas
class QuarterlyStatsBase(BaseModel):
    """Base quarterly stats schema."""
    suburb: str
    property_type: str = Field(..., pattern="^(house|unit)$")
    year: int
    quarter: int = Field(..., ge=1, le=4)
    quarter_start: date
    num_sales: int
    median_price: Optional[float] = None
    median_price_smoothed: Optional[float] = None
    mean_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None


class QuarterlyStats(QuarterlyStatsBase):
    """Quarterly stats response schema."""
    id: int
    price_stddev: Optional[float] = None
    price_p25: Optional[float] = None
    price_p75: Optional[float] = None
    median_ctsd: Optional[float] = None
    mean_ctsd: Optional[float] = None
    fast_sales_percentage: Optional[float] = None
    fast_settlements_percentage: Optional[float] = None
    liquidity_score: Optional[float] = None
    contract_to_settlement_score: Optional[float] = None
    qoq_price_change_percentage: Optional[float] = None
    yoy_price_change_percentage: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class QuarterlyStatsListResponse(BaseModel):
    """Response schema for quarterly stats list."""
    items: List[QuarterlyStats]
    total: int
    limit: int
    offset: int


# Analytics Schemas
class AnalyticsBase(BaseModel):
    """Base analytics schema."""
    suburb: str
    property_type: str = Field(..., pattern="^(house|unit)$")
    current_median_price: Optional[float] = None
    current_median_price_smoothed: Optional[float] = None
    current_avg_ctsd: Optional[float] = None
    current_num_sales: Optional[int] = None


class Analytics(AnalyticsBase):
    """Analytics response schema."""
    last_updated: Optional[datetime] = None
    current_quarter: Optional[str] = None
    growth_1yr_percentage: Optional[float] = None
    growth_3yr_percentage: Optional[float] = None
    growth_5yr_percentage: Optional[float] = None
    growth_10yr_percentage: Optional[float] = None
    growth_since_2005_percentage: Optional[float] = None
    cagr_5yr: Optional[float] = None
    cagr_10yr: Optional[float] = None
    growth_1yr_percentage_smoothed: Optional[float] = None
    growth_3yr_percentage_smoothed: Optional[float] = None
    growth_5yr_percentage_smoothed: Optional[float] = None
    growth_10yr_percentage_smoothed: Optional[float] = None
    growth_since_2005_percentage_smoothed: Optional[float] = None
    cagr_5yr_smoothed: Optional[float] = None
    cagr_10yr_smoothed: Optional[float] = None
    volatility_score: Optional[float] = None
    max_drawdown_pct: Optional[float] = None
    recovery_quarters: Optional[int] = None
    avg_quarterly_volume: Optional[int] = None
    overall_liquidity_score: Optional[float] = None
    market_health_score: Optional[float] = None
    q1_avg_premium_percentage: Optional[float] = None
    q2_avg_premium_percentage: Optional[float] = None
    q3_avg_premium_percentage: Optional[float] = None
    q4_avg_premium_percentage: Optional[float] = None
    best_quarter_to_sell: Optional[str] = None
    forecast_q1_price: Optional[float] = None
    forecast_q1_lower: Optional[float] = None
    forecast_q1_upper: Optional[float] = None
    forecast_q2_price: Optional[float] = None
    forecast_q2_lower: Optional[float] = None
    forecast_q2_upper: Optional[float] = None
    price_rank: Optional[int] = None
    growth_rank: Optional[int] = None
    speed_rank: Optional[int] = None
    total_quarters_with_data: Optional[int] = None
    data_completeness_percentage: Optional[float] = None
    price_quarterly: Optional[str] = None  # JSON string
    ctsd_quarterly: Optional[str] = None  # JSON string

    class Config:
        from_attributes = True


class AnalyticsListResponse(BaseModel):
    """Response schema for analytics list."""
    items: List[Analytics]
    total: int
    limit: int
    offset: int


class SuburbSearchResponse(BaseModel):
    """Response schema for suburb search."""
    suburbs: List[str]
    total: int

