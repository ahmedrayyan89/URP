"""CMI Products API — mounted at /api/cmi/products in URP."""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID

from cmi.database import get_cmi_db
from cmi.models.product import CMIProduct
from cmi.schemas.product import ProductResponse, ProductListItem, PaginatedProducts

router = APIRouter(prefix="/products", tags=["CMI Products"])


@router.get("", response_model=PaginatedProducts)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_cmi_db),
):
    """List products with filtering and pagination."""
    query = select(CMIProduct)
    if status:
        query = query.where(CMIProduct.status == status)
    if category:
        query = query.where(CMIProduct.category == category)
    if search:
        query = query.where(
            CMIProduct.name.ilike(f"%{search}%") | CMIProduct.sku.ilike(f"%{search}%")
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()

    query = query.order_by(CMIProduct.name).offset((page - 1) * page_size).limit(page_size)
    products = (await db.execute(query)).scalars().all()

    return PaginatedProducts(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, -(-total // page_size)),
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Get product by ID."""
    result = await db.execute(select(CMIProduct).where(CMIProduct.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return ProductResponse.model_validate(product)
