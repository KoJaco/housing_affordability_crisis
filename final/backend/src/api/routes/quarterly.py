"""Quarterly stats endpoints."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

from ..schemas import QuarterlyStats, QuarterlyStatsListResponse
from ...db.database import get_db

router = APIRouter(prefix="/api/quarterly", tags=["quarterly"])


@router.get("", response_model=QuarterlyStatsListResponse)
def list_quarterly_stats(
    suburb: Optional[str] = Query(None, description="Filter by suburb"),
    property_type: Optional[str] = Query(None, description="Filter by property type (house/unit)"),
    year: Optional[int] = Query(None, description="Filter by year"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="Filter by quarter (1-4)"),
    start_year: Optional[int] = Query(None, description="Start year (inclusive)"),
    end_year: Optional[int] = Query(None, description="End year (inclusive)"),
    limit: int = Query(100, ge=1, le=1000, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """List quarterly stats with optional filters."""
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
    
    if year is not None:
        conditions.append("year = :year")
        params["year"] = year
    
    if quarter is not None:
        conditions.append("quarter = :quarter")
        params["quarter"] = quarter
    
    if start_year is not None:
        conditions.append("year >= :start_year")
        params["start_year"] = start_year
    
    if end_year is not None:
        conditions.append("year <= :end_year")
        params["end_year"] = end_year
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    # Get total count
    count_query = text(f"SELECT COUNT(*) FROM suburb_quarterly WHERE {where_clause}")
    total = db.execute(count_query, params).scalar()
    
    # Get paginated results
    query = text(f"""
        SELECT id, suburb, property_type, year, quarter, quarter_start,
               num_sales, median_price, mean_price, min_price, max_price,
               price_stddev, price_p25, price_p75, median_ctsd, mean_ctsd,
               fast_sales_percentage, liquidity_score, contract_to_settlement_score,
               qoq_price_change_percentage, yoy_price_change_percentage,
               created_at
        FROM suburb_quarterly
        WHERE {where_clause}
        ORDER BY year DESC, quarter DESC, suburb ASC
        LIMIT :limit OFFSET :offset
    """)
    params["limit"] = limit
    params["offset"] = offset
    
    result = db.execute(query, params)
    rows = result.fetchall()
    
    # Convert to QuarterlyStats objects
    stats_list = []
    for row in rows:
        stats_dict = {
            "id": row[0],
            "suburb": row[1],
            "property_type": row[2],
            "year": row[3],
            "quarter": row[4],
            "quarter_start": row[5],
            "num_sales": row[6],
            "median_price": row[7],
            "mean_price": row[8],
            "min_price": row[9],
            "max_price": row[10],
            "price_stddev": row[11],
            "price_p25": row[12],
            "price_p75": row[13],
            "median_ctsd": row[14],
            "mean_ctsd": row[15],
            "fast_sales_percentage": row[16],
            "liquidity_score": row[17],
            "contract_to_settlement_score": row[18],
            "qoq_price_change_percentage": row[19],
            "yoy_price_change_percentage": row[20],
            "created_at": row[21],
        }
        stats_list.append(QuarterlyStats(**stats_dict))
    
    return QuarterlyStatsListResponse(
        items=stats_list,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{suburb}", response_model=List[QuarterlyStats])
def get_suburb_quarterly_stats(
    suburb: str,
    property_type: Optional[str] = Query(None, description="Filter by property type (house/unit). If not specified, returns both."),
    start_year: Optional[int] = Query(None, description="Start year (inclusive)"),
    end_year: Optional[int] = Query(None, description="End year (inclusive)"),
    db: Session = Depends(get_db)
):
    """Get quarterly stats for a specific suburb."""
    conditions = ["suburb = :suburb"]
    params = {"suburb": suburb}
    
    if property_type:
        if property_type not in ["house", "unit"]:
            raise HTTPException(status_code=400, detail="property_type must be 'house' or 'unit'")
        conditions.append("property_type = :property_type")
        params["property_type"] = property_type
    
    if start_year is not None:
        conditions.append("year >= :start_year")
        params["start_year"] = start_year
    
    if end_year is not None:
        conditions.append("year <= :end_year")
        params["end_year"] = end_year
    
    where_clause = " AND ".join(conditions)
    
    query = text(f"""
        SELECT id, suburb, property_type, year, quarter, quarter_start,
               num_sales, median_price, mean_price, min_price, max_price,
               price_stddev, price_p25, price_p75, median_ctsd, mean_ctsd,
               fast_sales_percentage, liquidity_score, contract_to_settlement_score,
               qoq_price_change_percentage, yoy_price_change_percentage,
               created_at
        FROM suburb_quarterly
        WHERE {where_clause}
        ORDER BY property_type, year DESC, quarter DESC
    """)
    
    result = db.execute(query, params)
    rows = result.fetchall()
    
    if not rows:
        raise HTTPException(status_code=404, detail=f"Quarterly stats not found for suburb: {suburb}")
    
    stats_list = []
    for row in rows:
        stats_dict = {
            "id": row[0],
            "suburb": row[1],
            "property_type": row[2],
            "year": row[3],
            "quarter": row[4],
            "quarter_start": row[5],
            "num_sales": row[6],
            "median_price": row[7],
            "mean_price": row[8],
            "min_price": row[9],
            "max_price": row[10],
            "price_stddev": row[11],
            "price_p25": row[12],
            "price_p75": row[13],
            "median_ctsd": row[14],
            "mean_ctsd": row[15],
            "fast_sales_percentage": row[16],
            "liquidity_score": row[17],
            "contract_to_settlement_score": row[18],
            "qoq_price_change_percentage": row[19],
            "yoy_price_change_percentage": row[20],
            "created_at": row[21],
        }
        stats_list.append(QuarterlyStats(**stats_dict))
    
    return stats_list

