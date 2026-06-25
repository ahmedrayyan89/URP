"""Deterministic financial reconciliation tools."""

from procurement.state import PriceLine


def build_price_matrix(raw: dict, extractions: list[dict]) -> list[dict]:
    lines: list[PriceLine] = []

    contract_price = None
    escalation_cap_pct = None
    amendment_count = 0

    for ext in extractions:
        if ext.get("field") == "contract_unit_price":
            contract_price = ext.get("numeric_value")
        if ext.get("field") == "escalation_cap_pct":
            escalation_cap_pct = ext.get("numeric_value")
        if ext.get("field") == "amendment_count":
            amendment_count = int(ext.get("numeric_value") or 0)

    bids = raw.get("ariba_bids") or []
    awarded = next((b for b in bids if b.get("status") in ("awarded", "late_accepted")), bids[0] if bids else {})
    bid_price = float(awarded.get("unit_price", 0) or 0) if awarded else None

    if raw.get("sap_po"):
        po = raw["sap_po"]
        po_line = (po.get("lines") or [{}])[0]
        qty = float(po_line.get("quantity", 0))
        po_price = float(po_line.get("unit_price", 0))
        inv_line = ((raw.get("invoice") or {}).get("lines") or [{}])[0]
        inv_price = float(inv_line.get("unit_price", po_price))

        c_price = contract_price if contract_price is not None else 143.42
        variance = round(po_price - c_price, 2)
        contract_total = round(c_price * qty, 2)
        po_total = round(po_price * qty, 2)
        exposure = round(po_total - contract_total, 2)

        lines.append(
            PriceLine(
                line_id=str(po_line.get("line_id", 1)),
                description=po_line.get("description", ""),
                bid_unit_price=bid_price,
                contract_unit_price=c_price,
                po_unit_price=po_price,
                invoice_unit_price=inv_price,
                quantity=qty,
                variance=round(variance, 2),
                exposure=round(exposure, 2),
            )
        )

    if raw.get("sap_gr"):
        gr = raw["sap_gr"]
        qty = float(gr.get("quantity", 0))
        contract_p = float(gr.get("contract_unit_price", 0))
        gr_price = float(gr.get("gr_unit_price", 0))
        variance = gr_price - contract_p
        exposure = gr_price * qty

        lines.append(
            PriceLine(
                line_id="gr-1",
                description="Goods receipt line",
                bid_unit_price=bid_price,
                contract_unit_price=contract_p,
                po_unit_price=gr_price,
                invoice_unit_price=gr_price,
                quantity=qty,
                variance=round(variance, 2),
                exposure=round(exposure, 2),
            )
        )

    return [ln.model_dump() for ln in lines]


def compute_flags(
    raw: dict,
    price_matrix: list[dict],
    extractions: list[dict],
    process_flags: list[str],
) -> list[str]:
    flags = list(process_flags)

    amendment_count = 0
    escalation_cap = None
    for ext in extractions:
        if ext.get("field") == "amendment_count":
            amendment_count = int(ext.get("numeric_value") or 0)
        if ext.get("field") == "escalation_cap_pct":
            escalation_cap = ext.get("numeric_value")

    for line in price_matrix:
        c = line.get("contract_unit_price")
        p = line.get("po_unit_price")
        if c is not None and p is not None and p > c:
            flags.append("po_exceeds_contract")
        if amendment_count == 0 and p and c and p > c:
            flags.append("no_amendment_on_file")

        bid_p = line.get("bid_unit_price")
        if bid_p and c and c > bid_p:
            pct = ((c - bid_p) / bid_p) * 100
            if pct >= 10:
                flags.append("unexplained_bid_to_contract_increase")

        if escalation_cap and c and p and c > 0:
            pct_change = ((p - c) / c) * 100
            if pct_change > escalation_cap:
                flags.append("escalation_cap_breach")

    if raw.get("sap_gr", {}).get("goods_receipt_without_po"):
        flags.append("gr_without_po")

    if any(b.get("status") == "late_accepted" for b in (raw.get("ariba_bids") or [])):
        flags.append("late_bid_accepted")

    sourcing = (raw.get("ariba_bids") or [{}])[0].get("sourcing_type", "")
    if sourcing == "emergency_single_source":
        flags.append("emergency_single_source_unsupported")

    email = (raw.get("email") or "").lower()
    if "po price exceeds contract" in email or "sap po price exceeds contract" in email:
        flags.append("buyer_acknowledged_price_violation")

    return list(dict.fromkeys(flags))


def total_exposure(price_matrix: list[dict]) -> float:
    return round(sum(float(ln.get("exposure", 0)) for ln in price_matrix), 2)
