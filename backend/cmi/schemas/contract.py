from pydantic import BaseModel, Field, field_validator
from typing import Any, Optional, List
from uuid import UUID
from datetime import date, datetime


class ContractResponse(BaseModel):
    id: UUID
    title: str
    vendor_id: UUID
    vendor_name: Optional[str] = None
    type: str
    status: str
    start_date: date
    end_date: date
    total_value: Optional[float] = None
    product_count: int = 0
    ai_confidence: Optional[int] = None
    extracted_terms: int = 0
    file_path: Optional[str] = None
    uploaded_at: datetime
    uploaded_by: Optional[UUID] = None
    uploaded_by_name: Optional[str] = None
    last_modified: datetime
    is_archived: bool = False
    contract_metadata: dict = Field(default_factory=dict)

    @field_validator("contract_metadata", mode="before")
    @classmethod
    def _coerce_metadata(cls, v: Any) -> dict:
        return v if isinstance(v, dict) else {}

    model_config = {"from_attributes": True}


class ContractSummary(BaseModel):
    id: UUID
    title: str
    vendor_name: Optional[str] = None
    status: str
    type: str
    is_archived: bool = False

    model_config = {"from_attributes": True}


class ContractAgentStatusResponse(BaseModel):
    """Subset of contract metadata for the agent pipeline monitoring panel."""
    contract_id: str
    agent_pipeline_phase: Optional[str] = None
    agent_graph_trace: List[str] = Field(default_factory=list)
    agent_cross_check_warnings: List[str] = Field(default_factory=list)
    agent_hitl: Optional[dict] = None
    contract_status: Optional[str] = None


class PaginatedContracts(BaseModel):
    items: List[ContractResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── New schemas for missing CMI screens ──────────────────────────


class ContractCreate(BaseModel):
    """Schema for creating a new contract."""
    title: str = Field(..., min_length=1, max_length=500)
    vendor_id: UUID
    vendor_name: Optional[str] = None
    type: str = Field(default="Master Agreement")
    status: str = Field(default="Pending Review")
    start_date: date
    end_date: date
    total_value: Optional[float] = None


class ContractUpdate(BaseModel):
    """Schema for updating an existing contract."""
    title: Optional[str] = Field(default=None, max_length=500)
    vendor_id: Optional[UUID] = None
    vendor_name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_value: Optional[float] = None


class ContractTermResponse(BaseModel):
    """Schema for an extracted contract term / clause."""
    id: UUID
    contract_id: UUID
    clause: str
    category: str
    extracted_value: str
    confidence: int
    page_ref: Optional[str] = None
    status: str = "Needs Review"
    created_at: datetime
    verified_by: Optional[UUID] = None
    verified_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ContractTermUpdate(BaseModel):
    """Schema for updating a contract term status."""
    status: str = Field(..., pattern="^(Verified|Needs Review|Disputed)$")


class ContractDocumentResponse(BaseModel):
    """Schema for a contract document."""
    id: UUID
    contract_id: UUID
    file_name: str
    file_path: str
    mime_type: str
    file_size: int
    version: str = "v1.0"
    uploaded_at: datetime
    uploaded_by: Optional[UUID] = None

    model_config = {"from_attributes": True}


class BulkArchiveRequest(BaseModel):
    """Schema for bulk-archiving contracts."""
    contract_ids: List[UUID] = Field(..., min_length=1)
