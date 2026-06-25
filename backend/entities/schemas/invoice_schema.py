from pydantic import BaseModel, ConfigDict


class LineItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    description: str | None = None
    quantity:    float | None = None
    unit_price:  float | None = None
    total:       float | None = None


class InvoiceEntity(BaseModel):
    model_config = ConfigDict(extra="ignore")

    invoice_number: str   | None = None
    vendor:         str   | None = None
    vendor_address: str   | None = None
    po_reference:   str   | None = None   # links to a PO entity
    invoice_date:   str   | None = None   # ISO 8601
    due_date:       str   | None = None   # ISO 8601
    subtotal:       float | None = None
    tax_amount:     float | None = None
    total_amount:   float | None = None
    currency:       str   | None = None
    payment_terms:  str   | None = None
    line_items:     list[LineItem] = []
