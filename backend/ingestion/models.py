from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class Document(BaseModel):
    doc_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    source: str
    doc_type: str = "policy"
    category: str = "unstructured"
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat()
    )
    metadata: dict = Field(default_factory=dict)


class Chunk(BaseModel):
    chunk_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doc_id: str
    doc_title: str
    content: str
    chunk_index: int
    start_char: int
    end_char: int
    metadata: dict = Field(default_factory=dict)


class IngestedDocument(BaseModel):
    doc_id: str
    title: str
    source: str
    doc_type: str = "policy"
    category: str = "unstructured"
    chunk_count: int
    ingested_at: str
    status: str = "indexed"
    file_size: Optional[int] = None
    