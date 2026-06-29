"""CMI Contracts API — mounted at /api/cmi/contracts in URP."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID

from cmi.database import get_cmi_db
from cmi.models.contract import CMIContract
from cmi.schemas.contract import ContractResponse, ContractSummary, ContractAgentStatusResponse, PaginatedContracts

router = APIRouter(prefix="/contracts", tags=["CMI Contracts"])


@router.get("", response_model=PaginatedContracts)
async def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    archived: bool = Query(False),
    status: Optional[str] = None,
    vendor_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_cmi_db),
):
    """List contracts with filtering and pagination."""
    query = select(CMIContract).where(
        CMIContract.deleted_at == None,
        CMIContract.is_archived == archived,
    )
    if status:
        query = query.where(CMIContract.status == status)
    if vendor_id:
        query = query.where(CMIContract.vendor_id == vendor_id)
    if search:
        query = query.where(CMIContract.title.ilike(f"%{search}%"))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()

    query = query.order_by(CMIContract.last_modified.desc()).offset((page - 1) * page_size).limit(page_size)
    contracts = (await db.execute(query)).scalars().all()

    return PaginatedContracts(
        items=[ContractResponse.model_validate(c) for c in contracts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/summary")
async def list_contract_summaries(db: AsyncSession = Depends(get_cmi_db)):
    """Lightweight contract list for dropdowns."""
    result = await db.execute(
        select(CMIContract).where(CMIContract.deleted_at == None, CMIContract.is_archived == False)
        .order_by(CMIContract.title)
    )
    return [ContractSummary.model_validate(c) for c in result.scalars().all()]


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Get contract by ID."""
    result = await db.execute(
        select(CMIContract).where(CMIContract.id == contract_id, CMIContract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail=f"Contract {contract_id} not found")
    return ContractResponse.model_validate(contract)


@router.get("/{contract_id}/agent/status", response_model=ContractAgentStatusResponse)
async def get_contract_agent_status(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Read-only contract agent pipeline status from contract_metadata."""
    result = await db.execute(
        select(CMIContract).where(CMIContract.id == contract_id, CMIContract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail=f"Contract {contract_id} not found")

    meta = contract.contract_metadata or {}
    return ContractAgentStatusResponse(
        contract_id=str(contract_id),
        agent_pipeline_phase=meta.get("agent_pipeline_phase"),
        agent_graph_trace=meta.get("agent_graph_trace", []),
        agent_cross_check_warnings=meta.get("agent_cross_check_warnings", []),
        agent_hitl=meta.get("agent_hitl"),
        contract_status=contract.status,
    )
