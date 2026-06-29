"""CMI Contract SQLAlchemy model — mirrors CMI's contracts table."""
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Integer, Numeric, Text, Date, DateTime, BigInteger, ForeignKey, CheckConstraint, Index, Boolean, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from cmi.database import Base


class CMIContract(Base):
    __tablename__ = "contracts"
    __table_args__ = (
        CheckConstraint(
            "type IN ('Master Agreement', 'Purchase Order', 'Amendment', 'Renewal')",
            name="ck_contracts_type",
        ),
        CheckConstraint(
            "status IN ('Active', 'Pending Review', 'Expired', 'Under Negotiation', 'AI Processing', 'Superseded', 'On Hold')",
            name="ck_contracts_status",
        ),
        CheckConstraint("end_date > start_date", name="ck_contracts_dates"),
        Index('ix_contracts_vendor_status', 'vendor_id', 'status'),
        Index('ix_contracts_uploaded_at', 'uploaded_at'),
        Index('ix_contracts_is_archived', 'is_archived'),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendors.id", ondelete="CASCADE"), index=True)
    vendor_name: Mapped[str | None] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Pending Review", index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_value: Mapped[float | None] = mapped_column(Numeric(15, 2))
    product_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_confidence: Mapped[int | None] = mapped_column(Integer)
    extracted_terms: Mapped[int] = mapped_column(Integer, default=0)
    file_path: Mapped[str | None] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    uploaded_by_name: Mapped[str | None] = mapped_column(String(255))
    last_modified: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    contract_metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default=text("false"))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    vendor = relationship("Vendor", back_populates="contracts")
    terms = relationship("CMIContractTerm", back_populates="contract", cascade="all, delete-orphan")
    documents = relationship("CMIContractDocument", back_populates="contract", cascade="all, delete-orphan")


class CMIContractTerm(Base):
    __tablename__ = "contract_terms"
    __table_args__ = (
        CheckConstraint(
            "status IN ('Verified', 'Needs Review', 'Disputed')",
            name="ck_ct_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contracts.id", ondelete="CASCADE"), index=True)
    clause: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    extracted_value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, nullable=False)
    page_ref: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="Needs Review", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    verified_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    contract = relationship("CMIContract", back_populates="terms")


class CMIContractDocument(Base):
    __tablename__ = "contract_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contracts.id", ondelete="CASCADE"), index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="v1.0")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    contract = relationship("CMIContract", back_populates="documents")


# Alias
Contract = CMIContract
ContractTerm = CMIContractTerm
ContractDocument = CMIContractDocument
ContractExtractedIngredient = None  # not used in URP integration scope
