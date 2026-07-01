"""CMI Contracts API — mounted at /api/cmi/contracts in URP."""
import os
from pathlib import Path
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from cmi.database import get_cmi_db
from cmi.models.contract import CMIContract, CMIContractTerm, CMIContractDocument
from cmi.schemas.contract import (
    ContractResponse,
    ContractSummary,
    ContractAgentStatusResponse,
    PaginatedContracts,
    ContractCreate,
    ContractUpdate,
    ContractTermResponse,
    ContractTermUpdate,
    ContractDocumentResponse,
    BulkArchiveRequest,
)

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


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(contract_in: ContractCreate, db: AsyncSession = Depends(get_cmi_db)):
    """Create a new contract."""
    contract = CMIContract(
        title=contract_in.title,
        vendor_id=contract_in.vendor_id,
        vendor_name=contract_in.vendor_name,
        type=contract_in.type,
        status=contract_in.status,
        start_date=contract_in.start_date,
        end_date=contract_in.end_date,
        total_value=contract_in.total_value,
        contract_metadata={},
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


@router.post("/bulk-archive")
async def bulk_archive_contracts(req: BulkArchiveRequest, db: AsyncSession = Depends(get_cmi_db)):
    """Bulk archive multiple contracts."""
    stmt = (
        update(CMIContract)
        .where(CMIContract.id.in_(req.contract_ids))
        .values(is_archived=True, last_modified=datetime.now(timezone.utc))
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": f"Successfully archived {len(req.contract_ids)} contracts."}


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


@router.patch("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: UUID, contract_in: ContractUpdate, db: AsyncSession = Depends(get_cmi_db)
):
    """Update contract details."""
    result = await db.execute(
        select(CMIContract).where(CMIContract.id == contract_id, CMIContract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail=f"Contract {contract_id} not found")

    update_data = contract_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(contract, key, value)
    
    contract.last_modified = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contract)
    return ContractResponse.model_validate(contract)


@router.patch("/{contract_id}/archive", response_model=ContractResponse)
async def archive_contract(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Archive a contract."""
    result = await db.execute(
        select(CMIContract).where(CMIContract.id == contract_id, CMIContract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail=f"Contract {contract_id} not found")

    contract.is_archived = True
    contract.last_modified = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(contract)
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


@router.get("/{contract_id}/terms", response_model=List[ContractTermResponse])
async def list_contract_terms(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """List terms/clauses for a contract."""
    result = await db.execute(
        select(CMIContractTerm).where(CMIContractTerm.contract_id == contract_id)
        .order_by(CMIContractTerm.created_at.desc())
    )
    return [ContractTermResponse.model_validate(t) for t in result.scalars().all()]


@router.patch("/{contract_id}/terms/{term_id}", response_model=ContractTermResponse)
async def update_contract_term(
    contract_id: UUID, term_id: UUID, term_in: ContractTermUpdate, db: AsyncSession = Depends(get_cmi_db)
):
    """Update a contract term's status (e.g. Verified, Disputed)."""
    result = await db.execute(
        select(CMIContractTerm).where(
            CMIContractTerm.id == term_id,
            CMIContractTerm.contract_id == contract_id
        )
    )
    term = result.scalar_one_or_none()
    if not term:
        raise HTTPException(status_code=404, detail="Contract term not found")

    term.status = term_in.status
    if term.status == "Verified":
        term.verified_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(term)
    return ContractTermResponse.model_validate(term)


@router.get("/{contract_id}/documents", response_model=List[ContractDocumentResponse])
async def list_contract_documents(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """List documents for a contract."""
    result = await db.execute(
        select(CMIContractDocument).where(CMIContractDocument.contract_id == contract_id)
        .order_by(CMIContractDocument.uploaded_at.desc())
    )
    return [ContractDocumentResponse.model_validate(d) for d in result.scalars().all()]


@router.get("/{contract_id}/document-url")
async def get_contract_document_url(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Return a URL to the contract PDF (served via /pdf endpoint)."""
    result = await db.execute(
        select(CMIContract).where(CMIContract.id == contract_id, CMIContract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail=f"Contract {contract_id} not found")

    if contract.file_path and (os.path.isfile(contract.file_path) or contract.file_path.startswith("http")):
        return {"document_url": f"/api/cmi/contracts/{contract_id}/pdf"}

    doc_result = await db.execute(
        select(CMIContractDocument)
        .where(CMIContractDocument.contract_id == contract_id)
        .order_by(CMIContractDocument.uploaded_at.desc())
        .limit(1)
    )
    doc = doc_result.scalar_one_or_none()
    if doc and (os.path.isfile(doc.file_path) or doc.file_path.startswith("http")):
        return {"document_url": f"/api/cmi/contracts/{contract_id}/pdf"}

    raise HTTPException(status_code=404, detail="No PDF file found for this contract")

@router.get("/{contract_id}/debug-path")
async def debug_contract_path(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    result = await db.execute(
        select(CMIContract).where(CMIContract.id == contract_id, CMIContract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    
    doc_result = await db.execute(
        select(CMIContractDocument)
        .where(CMIContractDocument.contract_id == contract_id)
        .order_by(CMIContractDocument.uploaded_at.desc())
        .limit(1)
    )
    doc = doc_result.scalar_one_or_none()
    
    return {
        "contract_file_path": contract.file_path if contract else None,
        "doc_file_path": doc.file_path if doc else None,
    }

@router.get("/{contract_id}/pdf")
async def stream_contract_pdf(contract_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Stream the contract PDF file directly."""
    result = await db.execute(
        select(CMIContract).where(CMIContract.id == contract_id, CMIContract.deleted_at == None)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail=f"Contract {contract_id} not found")

    path = contract.file_path
    if not path:
        doc_result = await db.execute(
            select(CMIContractDocument)
            .where(CMIContractDocument.contract_id == contract_id)
            .order_by(CMIContractDocument.uploaded_at.desc())
            .limit(1)
        )
        doc = doc_result.scalar_one_or_none()
        if doc:
            path = doc.file_path

    if not path:
        raise HTTPException(status_code=404, detail="PDF file not found in database")

    # The database path might be an Azure URL. Extract the filename.
    file_name = path.split("/")[-1] if "/" in path else Path(path).name
    if "?" in file_name:
        file_name = file_name.split("?")[0]

    # Search for the physical file in the CMI procurement_mock directory
    cmi_mock_dir = r"C:\Users\Veera Prasd Elluru\Downloads\Cost-model-Intelligence-unit_conversion\Cost-model-Intelligence-unit_conversion\Backend\data\procurement_mock"
    local_path = None
    if os.path.exists(cmi_mock_dir):
        for root, dirs, files in os.walk(cmi_mock_dir):
            if file_name in files:
                local_path = os.path.join(root, file_name)
                break

    if local_path and os.path.isfile(local_path):
        mime = "application/pdf" if local_path.lower().endswith(".pdf") else "application/octet-stream"
        return FileResponse(
            path=local_path,
            media_type=mime,
            filename=file_name,
            headers={"Content-Disposition": f'inline; filename="{file_name}"'},
        )
        
    raise HTTPException(status_code=404, detail="PDF file not found on local disk")
