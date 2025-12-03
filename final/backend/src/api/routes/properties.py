"""Property endpoints."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from datetime import date

from ..schemas import Property, PropertyListResponse, PropertyStatsResponse
from ...db.database import get_db

router = APIRouter(prefix="/api/properties", tags=["properties"])


@router.get("", response_model=PropertyListResponse)
def list_properties(
    suburb: Optional[str] = Query(None, description="Filter by suburb"),
    property_type: Optional[str] = Query(None, description="Filter by property type (house/unit)"),
    min_price: Optional[float] = Query(None, description="Minimum sale price"),
    max_price: Optional[float] = Query(None, description="Maximum sale price"),
    start_date: Optional[date] = Query(None, description="Start date (settlement_date)"),
    end_date: Optional[date] = Query(None, description="End date (settlement_date)"),
    limit: int = Query(100, ge=1, le=1000, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """List properties with optional filters."""
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
        conditions.append("sale_price >= :min_price")
        params["min_price"] = min_price
    
    if max_price is not None:
        conditions.append("sale_price <= :max_price")
        params["max_price"] = max_price
    
    if start_date:
        conditions.append("settlement_date >= :start_date")
        params["start_date"] = start_date
    
    if end_date:
        conditions.append("settlement_date <= :end_date")
        params["end_date"] = end_date
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    # Get total count
    count_query = text(f"SELECT COUNT(*) FROM properties WHERE {where_clause}")
    total = db.execute(count_query, params).scalar()
    
    # Get paginated results
    query = text(f"""
        SELECT id, suburb, postcode, district, property_type,
               listing_date, contract_date, settlement_date,
               sale_price, days_on_market, contract_to_settlement_days,
               created_at
        FROM properties
        WHERE {where_clause}
        ORDER BY settlement_date DESC, id DESC
        LIMIT :limit OFFSET :offset
    """)
    params["limit"] = limit
    params["offset"] = offset
    
    result = db.execute(query, params)
    rows = result.fetchall()
    
    # Convert to Property objects
    properties = []
    for row in rows:
        prop_dict = {
            "id": row[0],
            "suburb": row[1],
            "postcode": row[2],
            "district": row[3],
            "property_type": row[4],
            "listing_date": row[5],
            "contract_date": row[6],
            "settlement_date": row[7],
            "sale_price": row[8],
            "days_on_market": row[9],
            "contract_to_settlement_days": row[10],
            "created_at": row[11],
        }
        properties.append(Property(**prop_dict))
    
    return PropertyListResponse(
        items=properties,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{property_id}", response_model=Property)
def get_property(property_id: int, db: Session = Depends(get_db)):
    """Get a single property by ID."""
    query = text("""
        SELECT id, suburb, postcode, district, property_type,
               listing_date, contract_date, settlement_date,
               sale_price, days_on_market, contract_to_settlement_days,
               created_at
        FROM properties
        WHERE id = :id
    """)
    
    result = db.execute(query, {"id": property_id})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Property not found")
    
    prop_dict = {
        "id": row[0],
        "suburb": row[1],
        "postcode": row[2],
        "district": row[3],
        "property_type": row[4],
        "listing_date": row[5],
        "contract_date": row[6],
        "settlement_date": row[7],
        "sale_price": row[8],
        "days_on_market": row[9],
        "contract_to_settlement_days": row[10],
        "created_at": row[11],
    }
    
    return Property(**prop_dict)


@router.get("/stats/summary", response_model=PropertyStatsResponse)
def get_property_stats(
    suburb: Optional[str] = Query(None, description="Filter by suburb"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    db: Session = Depends(get_db)
):
    """Get aggregate statistics for properties."""
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
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    # Get basic stats
    query = text(f"""
        SELECT 
            COUNT(*) as total_count,
            AVG(sale_price) as avg_price,
            MIN(sale_price) as min_price,
            MAX(sale_price) as max_price
        FROM properties
        WHERE {where_clause}
    """)
    
    result = db.execute(query, params)
    row = result.fetchone()
    
    # Calculate median separately (SQLite doesn't have built-in median)
    count = row[0] if row else 0
    median_price = None
    if count > 0:
        median_query = text(f"""
            SELECT sale_price 
            FROM properties 
            WHERE {where_clause}
            ORDER BY sale_price
            LIMIT 1 OFFSET :offset
        """)
        median_offset = count // 2
        median_result = db.execute(median_query, {**params, "offset": median_offset})
        median_row = median_result.fetchone()
        median_price = median_row[0] if median_row else None
    
    return PropertyStatsResponse(
        total_count=row[0] or 0,
        avg_price=float(row[1]) if row[1] else None,
        min_price=float(row[2]) if row[2] else None,
        max_price=float(row[3]) if row[3] else None,
        median_price=float(median_price) if median_price else None
    )

