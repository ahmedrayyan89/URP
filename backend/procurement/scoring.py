"""Risk score calculation — deterministic only."""

WEIGHTS = {
    "po_exceeds_contract": 25,
    "no_amendment_on_file": 20,
    "escalation_cap_breach": 30,
    "gr_without_po": 25,
    "late_bid_accepted": 10,
    "emergency_single_source_unsupported": 15,
    "buyer_acknowledged_price_violation": 15,
    "unexplained_bid_to_contract_increase": 11,
    "missing_scorecard": 10,
    "missing_proposal": 10,
    "collusion_signal": 20,
    "vendor_adverse_media": 10,
    "vendor_prior_fraud": 15,
}


def compute_risk_score(
    process_flags: list[str],
    completeness_score: float,
    financial_exposure: float,
    collusion_count: int = 0,
    vendor_profile: dict | None = None,
) -> int:
    score = 0
    for flag in process_flags:
        score += WEIGHTS.get(flag, 5)

    if collusion_count:
        score += WEIGHTS["collusion_signal"] * min(collusion_count, 3)

    if completeness_score < 0.75:
        score += int((1 - completeness_score) * 20)

    if financial_exposure >= 500000:
        score += 25
    elif financial_exposure >= 100000:
        score += 15
    elif financial_exposure >= 50000:
        score += 8

    vp = vendor_profile or {}
    if vp.get("adverse_media"):
        score += WEIGHTS["vendor_adverse_media"]
    if (vp.get("prior_fraud_cases") or 0) > 0:
        score += WEIGHTS["vendor_prior_fraud"]

    return min(100, max(0, score))


def severity_band(score: int) -> str:
    if score >= 95:
        return "Critical"
    if score >= 80:
        return "High"
    if score >= 50:
        return "Medium"
    return "Low"
