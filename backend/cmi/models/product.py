"""CMI Product SQLAlchemy model — mirrors CMI's products table."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from cmi.database import Base


class CMIProduct(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("status IN ('Active', 'Discontinued', 'Draft')", name="ck_products_status"),
        CheckConstraint("mapping_type IN ('INDEPENDENT', 'VENDOR_MAPPED')", name="ck_products_mapping_type"),
        Index('ix_products_category_status', 'category', 'status'),
        Index('ix_products_vendor_status', 'primary_vendor_id', 'status'),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    mapping_type: Mapped[str] = mapped_column(String(30), default="INDEPENDENT", index=True)
    primary_vendor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("vendors.id", ondelete="SET NULL"), index=True)
    primary_vendor_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="Active", index=True)
    unit_cost: Mapped[dict | None] = mapped_column(JSONB)
    target_cost: Mapped[float | None] = mapped_column(Numeric(10, 2))
    margin: Mapped[float | None] = mapped_column(Numeric(5, 2))
    ingredient_count: Mapped[int] = mapped_column(Integer, default=0)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    product_vendors = relationship("CMIProductVendor", back_populates="product", cascade="all, delete-orphan")
    bom_items = relationship("CMIBOMItem", back_populates="product", cascade="all, delete-orphan")


class CMIProductVendor(Base):
    __tablename__ = "product_vendors"
    __table_args__ = (
        Index('ix_product_vendors_product_primary', 'product_id', 'is_primary'),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendors.id", ondelete="CASCADE"), index=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    product = relationship("CMIProduct", back_populates="product_vendors")
    vendor = relationship("Vendor", back_populates="product_vendors")


class CMIBOMItem(Base):
    __tablename__ = "bom_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(50))
    unit_cost: Mapped[float | None] = mapped_column(Numeric(10, 4))
    total_cost: Mapped[float | None] = mapped_column(Numeric(10, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    product = relationship("CMIProduct", back_populates="bom_items")


# Aliases
Product = CMIProduct
ProductVendor = CMIProductVendor
BOMItem = CMIBOMItem
