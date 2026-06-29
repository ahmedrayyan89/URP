from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class VendorResponse(BaseModel):
    id: UUID
    code: str
    name: str
    category: str
    status: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    contract_count: int = 0
    total_spend: Dict[str, float] = Field(default_factory=dict)
    risk_score: int = 0
    last_activity: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("total_spend", mode="before")
    @classmethod
    def normalize_total_spend(cls, v: Any) -> Dict[str, float]:
        if v is None:
            return {}
        if isinstance(v, dict):
            out: Dict[str, float] = {}
            for k, val in v.items():
                if val is None:
                    continue
                try:
                    out[str(k)] = float(val)
                except (TypeError, ValueError):
                    continue
            return out
        if isinstance(v, (int, float, Decimal)):
            x = float(v)
            return {"_legacy": x} if x else {}
        return {}


class VendorCreate(BaseModel):
    code: str
    name: str
    category: str
    status: str = "Active"
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None


class VendorUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None


class VendorSummary(BaseModel):
    id: UUID
    code: str
    name: str
    category: str
    status: str

    model_config = {"from_attributes": True}


class PaginatedVendors(BaseModel):
    items: List[VendorResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
