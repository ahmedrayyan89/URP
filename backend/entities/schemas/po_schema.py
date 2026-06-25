from pydantic import BaseModel, ConfigDict


class POLineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    item:       str   | None = None
    quantity:   float | None = None
    unit_price: float | None = None
    total:      float | None = None


class POEntity(BaseModel):
    model_config = ConfigDict(extra="ignore")

    po_number:      str   | None = None
    contract_ref:   str   | None = None   # CRITICAL — links to contract entity later
    vendor:         str   | None = None
    vendor_id:      str   | None = None
    po_date:        str   | None = None   # ISO 8601
    delivery_date:  str   | None = None   # ISO 8601
    region:         str   | None = None
    category:       str   | None = None
    total_amount:   float | None = None
    currency:       str   | None = None
    source_system:  str   | None = None   # "manual_upload" for now
    line_items:     list[POLineItem] = []
