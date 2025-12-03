"""Analytics endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..schemas import Analytics, AnalyticsListResponse, SuburbSearchResponse
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
        if property_type not in ["house", "unit"]:
            raise HTTPException(status_code=400, detail="property_type must be 'house' or 'unit'")
        conditions.append("property_type = :property_type")
        params["property_type"] = property_type
    
    if min_price is not None:
        conditions.append("current_median_price >= :min_price")
        params["min_price"] = min_price
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
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
               current_median_price, current_avg_ctsd, current_num_sales,
               growth_1yr_percentage, growth_3yr_percentage, growth_5yr_percentage,
               growth_10yr_percentage, growth_since_2005_percentage,
               cagr_5yr, cagr_10yr, volatility_score, max_drawdown_pct,
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
            "current_avg_ctsd": row[5],
            "current_num_sales": row[6],
            "growth_1yr_percentage": row[7],
            "growth_3yr_percentage": row[8],
            "growth_5yr_percentage": row[9],
            "growth_10yr_percentage": row[10],
            "growth_since_2005_percentage": row[11],
            "cagr_5yr": row[12],
            "cagr_10yr": row[13],
            "volatility_score": row[14],
            "max_drawdown_pct": row[15],
            "recovery_quarters": row[16],
            "avg_quarterly_volume": row[17],
            "overall_liquidity_score": row[18],
            "market_health_score": row[19],
            "q1_avg_premium_percentage": row[20],
            "q2_avg_premium_percentage": row[21],
            "q3_avg_premium_percentage": row[22],
            "q4_avg_premium_percentage": row[23],
            "best_quarter_to_sell": row[24],
            "forecast_q1_price": row[25],
            "forecast_q1_lower": row[26],
            "forecast_q1_upper": row[27],
            "forecast_q2_price": row[28],
            "forecast_q2_lower": row[29],
            "forecast_q2_upper": row[30],
            "price_rank": row[31],
            "growth_rank": row[32],
            "speed_rank": row[33],
            "total_quarters_with_data": row[34],
            "data_completeness_percentage": row[35],
            "price_quarterly": row[36],
            "ctsd_quarterly": row[37],
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
        if property_type not in ["house", "unit"]:
            raise HTTPException(status_code=400, detail="property_type must be 'house' or 'unit'")
        conditions.append("property_type = :property_type")
        params["property_type"] = property_type
    
    where_clause = " AND ".join(conditions)
    
    query = text(f"""
        SELECT suburb, property_type, last_updated, current_quarter,
               current_median_price, current_avg_ctsd, current_num_sales,
               growth_1yr_percentage, growth_3yr_percentage, growth_5yr_percentage,
               growth_10yr_percentage, growth_since_2005_percentage,
               cagr_5yr, cagr_10yr, volatility_score, max_drawdown_pct,
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
            "current_avg_ctsd": row[5],
            "current_num_sales": row[6],
            "growth_1yr_percentage": row[7],
            "growth_3yr_percentage": row[8],
            "growth_5yr_percentage": row[9],
            "growth_10yr_percentage": row[10],
            "growth_since_2005_percentage": row[11],
            "cagr_5yr": row[12],
            "cagr_10yr": row[13],
            "volatility_score": row[14],
            "max_drawdown_pct": row[15],
            "recovery_quarters": row[16],
            "avg_quarterly_volume": row[17],
            "overall_liquidity_score": row[18],
            "market_health_score": row[19],
            "q1_avg_premium_percentage": row[20],
            "q2_avg_premium_percentage": row[21],
            "q3_avg_premium_percentage": row[22],
            "q4_avg_premium_percentage": row[23],
            "best_quarter_to_sell": row[24],
            "forecast_q1_price": row[25],
            "forecast_q1_lower": row[26],
            "forecast_q1_upper": row[27],
            "forecast_q2_price": row[28],
            "forecast_q2_lower": row[29],
            "forecast_q2_upper": row[30],
            "price_rank": row[31],
            "growth_rank": row[32],
            "speed_rank": row[33],
            "total_quarters_with_data": row[34],
            "data_completeness_percentage": row[35],
            "price_quarterly": row[36],
            "ctsd_quarterly": row[37],
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

