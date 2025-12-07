"""Shared utility functions for API routes."""
from fastapi import HTTPException
from typing import Optional, Dict, List, Any
from sqlalchemy.engine import Row


def validate_property_type(property_type: Optional[str]) -> None:
    """
    Validate that property_type is either 'house' or 'unit'.
    
    Args:
        property_type: The property type to validate
        
    Raises:
        HTTPException: If property_type is not None and not 'house' or 'unit'
    """
    if property_type and property_type not in ["house", "unit"]:
        raise HTTPException(
            status_code=400,
            detail="property_type must be 'house' or 'unit'"
        )


def build_where_clause(
    conditions: List[str],
    params: Dict[str, any]
) -> str:
    """
    Build a WHERE clause from conditions list.
    
    Args:
        conditions: List of condition strings (e.g., ["suburb = :suburb", "property_type = :property_type"])
        params: Dictionary of parameters for the conditions
        
    Returns:
        WHERE clause string (e.g., "suburb = :suburb AND property_type = :property_type" or "1=1" if empty)
    """
    return " AND ".join(conditions) if conditions else "1=1"


def row_to_dict(row: Row, column_mapping: Dict[int, str]) -> Dict[str, Any]:
    """
    Convert a SQLAlchemy Row to a dictionary using column mapping.
    
    This is a safer alternative to positional indexing. For SQLAlchemy 1.4+,
    consider using row._mapping directly instead.
    
    Args:
        row: SQLAlchemy Row object
        column_mapping: Dictionary mapping column index to field name
            (e.g., {0: "id", 1: "suburb", 2: "property_type"})
        
    Returns:
        Dictionary with field names as keys
    """
    return {field_name: row[idx] for idx, field_name in column_mapping.items()}

