from sqlalchemy import Column, String, Float, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class EntityModel(Base):
    """
    SQLAlchemy ORM model for the DI entities table.

    body and confidence_map are stored as JSON strings (Text columns).
    Serialisation/deserialisation is done explicitly in the repository layer
    with json.dumps / json.loads — no custom TypeDecorator.
    """

    __tablename__ = "entities"

    id                 = Column(String, primary_key=True)
    project_id         = Column(String, nullable=False, index=True)
    entity_type        = Column(String, nullable=False, index=True)
    status             = Column(String, nullable=False)            # complete | needs_review | failed
    body               = Column(Text,   nullable=False)            # JSON string
    confidence_map     = Column(Text,   nullable=True)             # JSON string, nullable
    overall_confidence = Column(Float,  nullable=True)
    source_file        = Column(String, nullable=True)
    parser_used        = Column(String, nullable=True)
    created_at         = Column(String, nullable=False)            # ISO 8601
    updated_at         = Column(String, nullable=False)            # ISO 8601
