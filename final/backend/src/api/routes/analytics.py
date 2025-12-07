"""Analytics endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..schemas import Analytics, AnalyticsListResponse, SuburbSearchResponse
from ..utils import validate_property_type, build_where_clause
from ...db.database import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsListResponse)
def list_analytics(
    suburb: Optional[str] = Query(None, description="Filter by suburb"),
    property_type: Optional[str] = Query(None, description="Filter by property type (house/unit)"),
    min_price: Optional[float] = Query(None, description="Minimum current median price"),
    sort_by: Optional[str] = Query("suburb", description="Sort by field (price_rank, growth_rank, speed_rank, suburb)"),
    limit: int = Query(100, ge=1, le=1000, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """List suburb analytics with optional filters."""
    # Build WHERE clause
    conditions = []
    params = {}
    
    if suburb:
        conditions.append("suburb = :suburb")
        params["suburb"] = suburb
    
    if property_type:
        validate_property_type(property_type)
        conditions.append("property_type = :property_type")
        params["property_type"] = property_type
    
    if min_price is not None:
        conditions.append("current_median_price >= :min_price")
        params["min_price"] = min_price
    
    where_clause = build_where_clause(conditions, params)
    
    # Validate sort_by
    valid_sorts = ["suburb", "price_rank", "growth_rank", "speed_rank", "current_median_price"]
    if sort_by not in valid_sorts:
        raise HTTPException(status_code=400, detail=f"sort_by must be one of: {', '.join(valid_sorts)}")
    
    # Get total count
    count_query = text(f"SELECT COUNT(*) FROM suburb_analytics WHERE {where_clause}")
    total = db.execute(count_query, params).scalar()
    
    # Get paginated results
    query = text(f"""
        SELECT suburb, property_type, last_updated, current_quarter,
               current_median_price, current_median_price_smoothed, current_avg_ctsd, current_num_sales,
               growth_1yr_percentage, growth_3yr_percentage, growth_5yr_percentage,
               growth_10yr_percentage, growth_since_2005_percentage,
               cagr_5yr, cagr_10yr,
               growth_1yr_percentage_smoothed, growth_3yr_percentage_smoothed, growth_5yr_percentage_smoothed,
               growth_10yr_percentage_smoothed, growth_since_2005_percentage_smoothed,
               cagr_5yr_smoothed, cagr_10yr_smoothed,
               volatility_score, max_drawdown_pct,
               recovery_quarters, avg_quarterly_volume, overall_liquidity_score,
               market_health_score, q1_avg_premium_percentage, q2_avg_premium_percentage,
               q3_avg_premium_percentage, q4_avg_premium_percentage, best_quarter_to_sell,
               forecast_q1_price, forecast_q1_lower, forecast_q1_upper,
               forecast_q2_price, forecast_q2_lower, forecast_q2_upper,
               price_rank, growth_rank, speed_rank,
               total_quarters_with_data, data_completeness_percentage,
               price_quarterly, ctsd_quarterly
        FROM suburb_analytics
        WHERE {where_clause}
        ORDER BY {sort_by} ASC
        LIMIT :limit OFFSET :offset
    """)
    params["limit"] = limit
    params["offset"] = offset
    
    result = db.execute(query, params)
    rows = result.fetchall()
    
    # Convert to Analytics objects
    analytics_list = []
    for row in rows:
        analytics_dict = {
            "suburb": row[0],
            "property_type": row[1],
            "last_updated": row[2],
            "current_quarter": row[3],
            "current_median_price": row[4],
            "current_median_price_smoothed": row[5],
            "current_avg_ctsd": row[6],
            "current_num_sales": row[7],
            "growth_1yr_percentage": row[8],
            "growth_3yr_percentage": row[9],
            "growth_5yr_percentage": row[10],
            "growth_10yr_percentage": row[11],
            "growth_since_2005_percentage": row[12],
            "cagr_5yr": row[13],
            "cagr_10yr": row[14],
            "growth_1yr_percentage_smoothed": row[15],
            "growth_3yr_percentage_smoothed": row[16],
            "growth_5yr_percentage_smoothed": row[17],
            "growth_10yr_percentage_smoothed": row[18],
            "growth_since_2005_percentage_smoothed": row[19],
            "cagr_5yr_smoothed": row[20],
            "cagr_10yr_smoothed": row[21],
            "volatility_score": row[22],
            "max_drawdown_pct": row[23],
            "recovery_quarters": row[24],
            "avg_quarterly_volume": row[25],
            "overall_liquidity_score": row[26],
            "market_health_score": row[27],
            "q1_avg_premium_percentage": row[28],
            "q2_avg_premium_percentage": row[29],
            "q3_avg_premium_percentage": row[30],
            "q4_avg_premium_percentage": row[31],
            "best_quarter_to_sell": row[32],
            "forecast_q1_price": row[33],
            "forecast_q1_lower": row[34],
            "forecast_q1_upper": row[35],
            "forecast_q2_price": row[36],
            "forecast_q2_lower": row[37],
            "forecast_q2_upper": row[38],
            "price_rank": row[39],
            "growth_rank": row[40],
            "speed_rank": row[41],
            "total_quarters_with_data": row[42],
            "data_completeness_percentage": row[43],
            "price_quarterly": row[44],
            "ctsd_quarterly": row[45],
        }
        analytics_list.append(Analytics(**analytics_dict))
    
    return AnalyticsListResponse(
        items=analytics_list,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{suburb}", response_model=List[Analytics])
def get_suburb_analytics(
    suburb: str,
    property_type: Optional[str] = Query(None, description="Filter by property type (house/unit). If not specified, returns both."),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific suburb."""
    conditions = ["suburb = :suburb"]
    params = {"suburb": suburb}
    
    if property_type:
        validate_property_type(property_type)
        conditions.append("property_type = :property_type")
        params["property_type"] = property_type
    
    where_clause = " AND ".join(conditions)
    
    query = text(f"""
        SELECT suburb, property_type, last_updated, current_quarter,
               current_median_price, current_median_price_smoothed, current_avg_ctsd, current_num_sales,
               growth_1yr_percentage, growth_3yr_percentage, growth_5yr_percentage,
               growth_10yr_percentage, growth_since_2005_percentage,
               cagr_5yr, cagr_10yr,
               growth_1yr_percentage_smoothed, growth_3yr_percentage_smoothed, growth_5yr_percentage_smoothed,
               growth_10yr_percentage_smoothed, growth_since_2005_percentage_smoothed,
               cagr_5yr_smoothed, cagr_10yr_smoothed,
               volatility_score, max_drawdown_pct,
               recovery_quarters, avg_quarterly_volume, overall_liquidity_score,
               market_health_score, q1_avg_premium_percentage, q2_avg_premium_percentage,
               q3_avg_premium_percentage, q4_avg_premium_percentage, best_quarter_to_sell,
               forecast_q1_price, forecast_q1_lower, forecast_q1_upper,
               forecast_q2_price, forecast_q2_lower, forecast_q2_upper,
               price_rank, growth_rank, speed_rank,
               total_quarters_with_data, data_completeness_percentage,
               price_quarterly, ctsd_quarterly
        FROM suburb_analytics
        WHERE {where_clause}
        ORDER BY property_type
    """)
    
    result = db.execute(query, params)
    rows = result.fetchall()
    
    if not rows:
        raise HTTPException(status_code=404, detail=f"Analytics not found for suburb: {suburb}")
    
    analytics_list = []
    for row in rows:
        analytics_dict = {
            "suburb": row[0],
            "property_type": row[1],
            "last_updated": row[2],
            "current_quarter": row[3],
            "current_median_price": row[4],
            "current_median_price_smoothed": row[5],
            "current_avg_ctsd": row[6],
            "current_num_sales": row[7],
            "growth_1yr_percentage": row[8],
            "growth_3yr_percentage": row[9],
            "growth_5yr_percentage": row[10],
            "growth_10yr_percentage": row[11],
            "growth_since_2005_percentage": row[12],
            "cagr_5yr": row[13],
            "cagr_10yr": row[14],
            "growth_1yr_percentage_smoothed": row[15],
            "growth_3yr_percentage_smoothed": row[16],
            "growth_5yr_percentage_smoothed": row[17],
            "growth_10yr_percentage_smoothed": row[18],
            "growth_since_2005_percentage_smoothed": row[19],
            "cagr_5yr_smoothed": row[20],
            "cagr_10yr_smoothed": row[21],
            "volatility_score": row[22],
            "max_drawdown_pct": row[23],
            "recovery_quarters": row[24],
            "avg_quarterly_volume": row[25],
            "overall_liquidity_score": row[26],
            "market_health_score": row[27],
            "q1_avg_premium_percentage": row[28],
            "q2_avg_premium_percentage": row[29],
            "q3_avg_premium_percentage": row[30],
            "q4_avg_premium_percentage": row[31],
            "best_quarter_to_sell": row[32],
            "forecast_q1_price": row[33],
            "forecast_q1_lower": row[34],
            "forecast_q1_upper": row[35],
            "forecast_q2_price": row[36],
            "forecast_q2_lower": row[37],
            "forecast_q2_upper": row[38],
            "price_rank": row[39],
            "growth_rank": row[40],
            "speed_rank": row[41],
            "total_quarters_with_data": row[42],
            "data_completeness_percentage": row[43],
            "price_quarterly": row[44],
            "ctsd_quarterly": row[45],
        }
        analytics_list.append(Analytics(**analytics_dict))
    
    return analytics_list


@router.get("/search/suburbs", response_model=SuburbSearchResponse)
def search_suburbs(
    q: str = Query(..., min_length=1, description="Search term"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """Search suburbs (autocomplete)."""
    query = text("""
        SELECT DISTINCT suburb
        FROM suburb_analytics
        WHERE suburb LIKE :pattern
        ORDER BY suburb
        LIMIT :limit
    """)
    
    params = {
        "pattern": f"%{q}%",
        "limit": limit
    }
    
    result = db.execute(query, params)
    rows = result.fetchall()
    
    suburbs = [row[0] for row in rows]
    
    # Get total count
    count_query = text("SELECT COUNT(DISTINCT suburb) FROM suburb_analytics WHERE suburb LIKE :pattern")
    total = db.execute(count_query, {"pattern": f"%{q}%"}).scalar()
    
    return SuburbSearchResponse(
        suburbs=suburbs,
        total=total
    )

