"""CMI Vendor SQLAlchemy model — mirrors CMI's vendors table (read from PostgreSQL)."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, CheckConstraint, Index, Boolean, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from cmi.database import Base


class Vendor(Base):
    __tablename__ = "vendors"
    __table_args__ = (
        CheckConstraint("status IN ('Active', 'Inactive', 'Pending')", name="ck_vendors_status"),
        CheckConstraint("risk_score BETWEEN 0 AND 100", name="ck_vendors_risk_score"),
        Index('ix_vendors_category_status', 'category', 'status'),
        Index('ix_vendors_risk_status', 'risk_score', 'status'),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Active", index=True)
    contact_name: Mapped[str | None] = mapped_column(String(255))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    address: Mapped[str | None] = mapped_column(Text)
    country: Mapped[str | None] = mapped_column(String(100))
    contract_count: Mapped[int] = mapped_column(Integer, default=0)
    total_spend: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    last_activity: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    contracts = relationship("CMIContract", back_populates="vendor")
    product_vendors = relationship("CMIProductVendor", back_populates="vendor")
    risk_assessments = relationship("CMIVendorRiskAssessment", back_populates="vendor")


class CMIVendorRiskAssessment(Base):
    __tablename__ = "vendor_risk_assessments"
    __table_args__ = (
        CheckConstraint("risk_level IN ('Critical', 'High', 'Medium', 'Low')", name="ck_vra_risk_level"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendors.id", ondelete="CASCADE"), index=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255))
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assessed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    vendor = relationship("Vendor", back_populates="risk_assessments")


# Alias for backward compatibility in schemas
VendorRiskAssessment = CMIVendorRiskAssessment
