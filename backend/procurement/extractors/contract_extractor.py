"""Rule-based contract and email extraction (LexAI POC)."""

import re
from procurement.state import ClauseExtraction


def extract_from_contract(text: str, doc_id: str = "contract") -> list[dict]:
    results: list[ClauseExtraction] = []

    price_match = re.search(
        r"\$([\d,]+\.?\d*)\s*per\s*(?:hour|unit)",
        text,
        re.IGNORECASE,
    )
    if not price_match:
        price_match = re.search(r"\(\$([\d,]+\.?\d*)\)", text)

    if price_match:
        val = float(price_match.group(1).replace(",", ""))
        start = price_match.start()
        results.append(
            ClauseExtraction(
                id=f"{doc_id}-unit-price",
                doc=doc_id,
                field="contract_unit_price",
                value=f"${val}",
                numeric_value=val,
                confidence=0.95,
                page=1,
                section="SECTION 2 — PRICING",
                start_char=start,
                end_char=price_match.end(),
                snippet=text[max(0, start - 40) : price_match.end() + 40],
            )
        )

    esc_match = re.search(
        r"(?:no more than|by more than)\s+([\d.]+)\s*%",
        text,
        re.IGNORECASE,
    )
    if esc_match:
        cap = float(esc_match.group(1))
        start = esc_match.start()
        page = 14 if "PAGE 14" in text or "3.2" in text else 1
        results.append(
            ClauseExtraction(
                id=f"{doc_id}-escalation-cap",
                doc=doc_id,
                field="escalation_cap_pct",
                value=f"{cap}%",
                numeric_value=cap,
                confidence=0.92,
                page=page,
                section="SECTION 3.2 — ESCALATION CAPS" if page == 14 else "SECTION 3 — ESCALATION",
                start_char=start,
                end_char=esc_match.end(),
                snippet=text[max(0, start - 60) : esc_match.end() + 60],
            )
        )

    amend_match = re.search(r"AMENDMENTS:\s*(\d+)", text, re.IGNORECASE)
    if amend_match:
        count = int(amend_match.group(1))
        results.append(
            ClauseExtraction(
                id=f"{doc_id}-amendments",
                doc=doc_id,
                field="amendment_count",
                value=str(count),
                numeric_value=float(count),
                confidence=1.0,
                section="AMENDMENTS",
                snippet=amend_match.group(0),
            )
        )

    return [r.model_dump() for r in results]


def extract_from_email(text: str) -> list[dict]:
    results = []
    if "po price exceeds contract" in text.lower() or "sap po price exceeds contract" in text.lower():
        results.append(
            ClauseExtraction(
                id="email-buyer-ack",
                doc="email",
                field="buyer_price_acknowledgment",
                value="true",
                confidence=0.99,
                snippet="SAP PO price exceeds contract price",
            ).model_dump()
        )
    return results
