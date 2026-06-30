from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime


class ProductResponse(BaseModel):
    id: UUID
    sku: str
    name: str
    category: str
    mapping_type: str = "INDEPENDENT"
    primary_vendor_id: Optional[UUID] = None
    primary_vendor_name: Optional[str] = None
    status: str
    unit_cost: Optional[float] = None
    target_cost: Optional[float] = None
    margin: Optional[float] = None
    ingredient_count: int = 0
    last_updated: datetime
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("unit_cost", mode="before")
    @classmethod
    def _unit_cost_from_json(cls, v: Any) -> Any:
        """unit_cost stored as JSONB {period: value} — extract latest value."""
        if v is None:
            return None
        if isinstance(v, dict):
            if not v:
                return None
            try:
                vals = [float(x) for x in v.values() if x is not None]
                return max(vals) if vals else None
            except (TypeError, ValueError):
                return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None


class ProductListItem(BaseModel):
    id: UUID
    sku: str
    name: str
    category: str
    status: str
    primary_vendor_name: Optional[str] = None
    unit_cost: Optional[float] = None
    ingredient_count: int = 0

    model_config = {"from_attributes": True}

    @field_validator("unit_cost", mode="before")
    @classmethod
    def _unit_cost_from_json(cls, v: Any) -> Any:
        return ProductResponse._unit_cost_from_json(v)


class PaginatedProducts(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProductCreate(BaseModel):
    sku: str
    name: str
    category: str
    mapping_type: str = "INDEPENDENT"
    status: str = "Active"
    target_cost: Optional[float] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    mapping_type: Optional[str] = None
    status: Optional[str] = None
    target_cost: Optional[float] = None
    unit_cost: Optional[float] = None
    primary_vendor_id: Optional[UUID] = None
    primary_vendor_name: Optional[str] = None


class ProductVendorResponse(BaseModel):
    id: UUID
    product_id: UUID
    vendor_id: UUID
    vendor_name: Optional[str] = None
    is_primary: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class BOMItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    name: str
    quantity: float
    unit_of_measure: str
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}
