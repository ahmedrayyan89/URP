"""CMI Products API — mounted at /api/cmi/products in URP."""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone

from cmi.database import get_cmi_db
from cmi.models.product import CMIProduct, CMIProductVendor, CMIBOMItem
from cmi.schemas.product import (
    ProductResponse,
    ProductListItem,
    PaginatedProducts,
    ProductCreate,
    ProductUpdate,
    ProductVendorResponse,
    BOMItemResponse
)

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


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_cmi_db)):
    """Create a new product."""
    # Check if sku already exists
    existing = (await db.execute(select(CMIProduct).where(CMIProduct.sku == product_in.sku))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")

    product = CMIProduct(
        sku=product_in.sku,
        name=product_in.name,
        category=product_in.category,
        mapping_type=product_in.mapping_type,
        status=product_in.status,
        target_cost=product_in.target_cost,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """Get product by ID."""
    result = await db.execute(select(CMIProduct).where(CMIProduct.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return ProductResponse.model_validate(product)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID, product_in: ProductUpdate, db: AsyncSession = Depends(get_cmi_db)
):
    """Update product details."""
    result = await db.execute(select(CMIProduct).where(CMIProduct.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "unit_cost" and value is not None:
            # Reconstruct jsonb
            current = product.unit_cost or {}
            period = datetime.now(timezone.utc).strftime("%Y-%m")
            current[period] = value
            setattr(product, key, current)
        else:
            setattr(product, key, value)
    
    product.last_updated = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


@router.get("/{product_id}/vendors", response_model=List[ProductVendorResponse])
async def list_product_vendors(product_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """List vendors for a product."""
    result = await db.execute(
        select(CMIProductVendor).where(CMIProductVendor.product_id == product_id)
        .order_by(CMIProductVendor.is_primary.desc(), CMIProductVendor.created_at.desc())
    )
    return [ProductVendorResponse.model_validate(pv) for pv in result.scalars().all()]


@router.get("/{product_id}/bom", response_model=List[BOMItemResponse])
async def list_product_bom(product_id: UUID, db: AsyncSession = Depends(get_cmi_db)):
    """List Bill of Materials (BOM) items / ingredients for a product."""
    result = await db.execute(
        select(CMIBOMItem).where(CMIBOMItem.product_id == product_id)
        .order_by(CMIBOMItem.created_at)
    )
    return [BOMItemResponse.model_validate(b) for b in result.scalars().all()]
