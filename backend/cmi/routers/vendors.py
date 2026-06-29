"""CMI Vendors API — mounted at /api/cmi/vendors in URP."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from cmi.database import get_cmi_db
from cmi.models.vendor import Vendor, CMIVendorRiskAssessment
from cmi.models.contract import CMIContract
from cmi.schemas.vendor import VendorResponse, VendorCreate, VendorUpdate, VendorSummary, PaginatedVendors

router = APIRouter(prefix="/vendors", tags=["CMI Vendors"])


@router.get("", response_model=PaginatedVendors)
async def list_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_cmi_db),
):
    """List vendors with filtering and pagination."""
    query = select(Vendor).where(Vendor.deleted_at == None)
    if status:
        query = query.where(Vendor.status == status)
    if category:
        query = query.where(Vendor.category == category)
    if search:
        query = query.where(
            Vendor.name.ilike(f"%{search}%") | Vendor.code.ilike(f"%{search}%")
        )

    # Count total
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Paginate
    query = query.order_by(Vendor.name).offset((page - 1) * page_size).limit(page_size)
    vendors = (await db.execute(query)).scalars().all()

    return PaginatedVendors(
        items=[VendorResponse.model_validate(v) for v in vendors],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/summary", response_model=List[VendorSummary])
async def list_vendor_summaries(db: AsyncSession = Depends(get_cmi_db)):
    """Simplified vendor list for dropdowns."""
    result = await db.execute(
        select(Vendor).where(Vendor.deleted_at == None).order_by(Vendor.name)
    )
    return [VendorSummary.model_validate(v) for v in result.scalars().all()]


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Get vendor by ID with live contract count."""
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.deleted_at == None)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")

    # Compute live contract count
    contracts_result = await db.execute(
        select(CMIContract).where(
            CMIContract.vendor_id == vendor_id,
            CMIContract.deleted_at == None,
            CMIContract.is_archived == False,
        )
    )
    contracts = contracts_result.scalars().all()
    vendor.contract_count = len(contracts)
    if contracts:
        latest = max(contracts, key=lambda c: c.last_modified or c.uploaded_at)
        vendor.last_activity = latest.last_modified or latest.uploaded_at

    return VendorResponse.model_validate(vendor)


@router.post("", response_model=VendorResponse, status_code=201)
async def create_vendor(body: VendorCreate, db: AsyncSession = Depends(get_cmi_db)):
    """Create a new vendor."""
    existing = (await db.execute(select(Vendor).where(Vendor.code == body.code))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail=f"Vendor with code '{body.code}' already exists")

    vendor = Vendor(**body.model_dump(), created_by=None, last_activity=datetime.now(timezone.utc))
    db.add(vendor)
    await db.flush()
    await db.refresh(vendor)
    return VendorResponse.model_validate(vendor)


@router.patch("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: UUID, body: VendorUpdate, db: AsyncSession = Depends(get_cmi_db)):
    """Update vendor fields."""
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    vendor.last_activity = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(vendor)
    return VendorResponse.model_validate(vendor)


@router.get("/{vendor_id}/contracts")
async def get_vendor_contracts(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_cmi_db),
):
    """Get all non-archived contracts for this vendor."""
    vendor = (await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.deleted_at == None)
    )).scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail=f"Vendor {vendor_id} not found")

    contracts = (await db.execute(
        select(CMIContract).where(
            CMIContract.vendor_id == vendor_id,
            CMIContract.deleted_at == None,
            CMIContract.is_archived == False,
        ).order_by(CMIContract.last_modified.desc())
    )).scalars().all()

    from cmi.schemas.contract import ContractResponse
    return [ContractResponse.model_validate(c) for c in contracts]
