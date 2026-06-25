from pydantic import BaseModel, ConfigDict


class EntityRecord(BaseModel):
    """API response model returned from the DI upload endpoint."""

    model_config = ConfigDict(extra="ignore")

    entity_id:          str
    entity_type:        str
    status:             str
    overall_confidence: float | None
    entity:             dict                 # parsed entity as a plain dict
    confidence_map:     dict | None
    source_file:        str  | None
    created_at:         str


class EntityCreateInput(BaseModel):
    """
    Internal model used by DocumentService → EntityRepository.
    Never returned directly from the API.
    """

    model_config = ConfigDict(extra="forbid")

    project_id:         str
    entity_type:        str
    status:             str
    body:               dict                 # repository serialises to JSON string
    confidence_map:     dict | None = None
    overall_confidence: float | None = None
    source_file:        str  | None = None
    parser_used:        str  | None = None
