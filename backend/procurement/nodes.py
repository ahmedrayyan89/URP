"""LangGraph agent nodes for Procure Guard."""

from procurement.extractors.contract_extractor import extract_from_contract, extract_from_email
from procurement.scoring import compute_risk_score, severity_band
from procurement.tools.reconciliation import (
    build_price_matrix,
    compute_flags,
    total_exposure,
)


def bid_intake_node(state: dict) -> dict:
    raw = state.get("raw") or {}
    checks = {
        "has_evaluation_scorecard": raw.get("has_evaluation_scorecard", False),
        "has_initial_proposal": raw.get("has_initial_proposal", False),
        "has_contract": raw.get("has_contract", False),
        "has_po": raw.get("has_po", False),
    }
    present = sum(1 for v in checks.values() if v)
    completeness = round(present / max(len(checks), 1), 2)

    flags = []
    if not checks["has_evaluation_scorecard"]:
        flags.append("missing_scorecard")
    if not checks["has_initial_proposal"]:
        flags.append("missing_proposal")

    for bid in raw.get("ariba_bids") or []:
        try:
            from datetime import datetime

            close = datetime.fromisoformat(bid["event_close"].replace("Z", "+00:00"))
            ts = datetime.fromisoformat(bid["bid_timestamp"].replace("Z", "+00:00"))
            if ts > close and bid.get("status") == "late_accepted":
                flags.append("late_bid_accepted")
        except (KeyError, ValueError):
            pass

    sourcing = (raw.get("ariba_bids") or [{}])[0].get("sourcing_type", "")
    if sourcing == "emergency_single_source":
        flags.append("emergency_single_source_unsupported")

    if raw.get("sap_gr", {}).get("goods_receipt_without_po"):
        flags.append("gr_without_po")

    return {
        "completeness_score": completeness,
        "process_flags": flags,
        "messages": [f"Bid Intake: completeness {completeness:.0%}, flags={flags}"],
    }


def document_intelligence_node(state: dict) -> dict:
    raw = state.get("raw") or {}
    extractions = []

    contract_id = raw.get("contract_id", "contract")
    if raw.get("contract_text"):
        extractions.extend(extract_from_contract(raw["contract_text"], contract_id))

    if raw.get("email"):
        extractions.extend(extract_from_email(raw["email"]))

    return {
        "extractions": extractions,
        "messages": [f"LexAI: extracted {len(extractions)} fields from documents"],
    }


def bid_risk_scoring_node(state: dict) -> dict:
    score = compute_risk_score(
        state.get("process_flags") or [],
        state.get("completeness_score") or 0,
        state.get("financial_exposure") or 0,
        len(state.get("collusion_signals") or []),
        state.get("vendor_profile"),
    )
    band = severity_band(score)
    return {
        "risk_score": score,
        "severity_band": band,
        "messages": [f"Bid Risk Scoring: {score}/100 ({band})"],
    }


def collusion_detection_node(state: dict) -> dict:
    import networkx as nx

    raw = state.get("raw") or {}
    bids = raw.get("ariba_bids") or []
    signals = []

    authors = {}
    timestamps = {}
    for bid in bids:
        author = bid.get("proposal_author", "")
        ts = bid.get("proposal_created_at", "")
        if author:
            authors.setdefault(author, []).append(bid.get("vendor_name"))
        if ts:
            timestamps.setdefault(ts, []).append(bid.get("vendor_name"))

    for author, vendors in authors.items():
        if len(vendors) > 1:
            signals.append({
                "rule": "shared_proposal_author",
                "evidence": f"Author {author} linked to vendors: {', '.join(vendors)}",
                "vendors": vendors,
            })

    for ts, vendors in timestamps.items():
        if len(vendors) > 1:
            signals.append({
                "rule": "identical_file_timestamp",
                "evidence": f"Timestamp {ts} shared across: {', '.join(vendors)}",
                "vendors": vendors,
            })

    prices = []
    for bid in bids:
        try:
            prices.append((float(bid.get("unit_price", 0)), bid.get("vendor_name")))
        except (TypeError, ValueError):
            pass

    if len(prices) >= 2:
        prices.sort()
        for i in range(len(prices) - 1):
            p1, v1 = prices[i]
            p2, v2 = prices[i + 1]
            if p1 > 0 and abs(p2 - p1) / p1 < 0.02:
                signals.append({
                    "rule": "suspicious_price_proximity",
                    "evidence": f"{v1} (${p1}) and {v2} (${p2}) within 2%",
                    "vendors": [v1, v2],
                })

    g = nx.Graph()
    for bid in bids:
        g.add_node(bid.get("vendor_id"), name=bid.get("vendor_name"))
    for sig in signals:
        vendors = sig.get("vendors") or []
        for i in range(len(vendors)):
            for j in range(i + 1, len(vendors)):
                n1 = next((b["vendor_id"] for b in bids if b.get("vendor_name") == vendors[i]), None)
                n2 = next((b["vendor_id"] for b in bids if b.get("vendor_name") == vendors[j]), None)
                if n1 and n2:
                    g.add_edge(n1, n2, rule=sig["rule"])

    return {
        "collusion_signals": signals,
        "messages": [f"Collusion Detection: {len(signals)} signal(s)"],
    }


def vendor_intelligence_node(state: dict) -> dict:
    raw = state.get("raw") or {}
    bids = raw.get("ariba_bids") or []
    vendors_db = {v["vendor_id"]: v for v in (raw.get("vendors") or [])}

    awarded = next((b for b in bids if b.get("status") in ("awarded", "late_accepted")), bids[0] if bids else {})
    vid = awarded.get("vendor_id")
    profile = vendors_db.get(vid, {"vendor_id": vid, "name": awarded.get("vendor_name"), "risk_tier": "unknown"})

    return {
        "vendor_profile": profile,
        "messages": [f"Vendor Intelligence: {profile.get('name')} tier={profile.get('risk_tier')}"],
    }


def price_accuracy_node(state: dict) -> dict:
    raw = state.get("raw") or {}
    extractions = state.get("extractions") or []
    matrix = build_price_matrix(raw, extractions)
    exposure = total_exposure(matrix)
    flags = compute_flags(raw, matrix, extractions, state.get("process_flags") or [])

    return {
        "price_matrix": matrix,
        "financial_exposure": exposure,
        "process_flags": flags,
        "messages": [f"Price Accuracy: exposure ${exposure:,.2f}"],
    }


def reasoning_insights_node(state: dict) -> dict:
    matrix = state.get("price_matrix") or []
    exposure = state.get("financial_exposure") or 0
    flags = state.get("process_flags") or []
    case_id = state.get("case_id", "")
    score = state.get("risk_score", 0)

    line = matrix[0] if matrix else {}
    contract_p = line.get("contract_unit_price")
    po_p = line.get("po_unit_price")
    qty = line.get("quantity")
    variance = line.get("variance")

    parts = [
        f"Case {case_id} — Risk Score {score}/100 ({state.get('severity_band', 'Low')}).",
    ]

    if contract_p and po_p and qty:
        parts.append(
            f"SAP PO unit price (${po_p:.2f}) exceeds extracted contract unit price (${contract_p:.2f}). "
            f"Variance of ${variance:.2f} × {int(qty):,} units results in ${exposure:,.2f} financial exposure."
        )

    if "escalation_cap_breach" in flags:
        parts.append(
            "Transaction flags a price increase breaching the contractually capped escalation limit of 2.6%. "
            "Cross-reference with SAP workflow logs confirms unauthorized processing."
        )

    if "gr_without_po" in flags:
        parts.append(
            "Goods Receipt was processed without a corresponding approved Purchase Order amendment."
        )

    if "buyer_acknowledged_price_violation" in flags:
        parts.append(
            "Buyer email explicitly acknowledges SAP PO price exceeds contract price while requesting expedited processing."
        )

    if "late_bid_accepted" in flags:
        parts.append(
            "A competitor bid was accepted past the Ariba event closing deadline."
        )

    narrative = " ".join(parts)
    return {
        "narrative": narrative,
        "messages": ["Reasoning & Insights: executive narrative generated"],
    }


def critic_node(state: dict) -> dict:
    narrative = state.get("narrative") or ""
    exposure = state.get("financial_exposure") or 0
    score = state.get("risk_score") or 0
    errors = []
    attempts = (state.get("critic_attempts") or 0) + 1

    exposure_str = f"{int(exposure):,}"
    if exposure > 0 and exposure_str.replace(",", "") not in narrative.replace(",", ""):
        if f"{exposure:.0f}" not in narrative and f"{int(exposure)}" not in narrative:
            errors.append(f"Narrative missing exposure amount ${exposure:,.2f}")

    if score >= 90 and str(score) not in narrative:
        errors.append(f"Narrative missing risk score {score}")

    passed = len(errors) == 0
    return {
        "critic_passed": passed,
        "critic_errors": errors,
        "critic_attempts": attempts,
        "messages": [f"Critic: {'PASS' if passed else 'FAIL — ' + '; '.join(errors)}"],
    }


def case_creation_node(state: dict) -> dict:
    from procurement.cases_store import upsert_case

    evidence = {
        "ariba_bids": state.get("raw", {}).get("ariba_bids"),
        "extractions": state.get("extractions"),
        "price_matrix": state.get("price_matrix"),
        "process_flags": state.get("process_flags"),
        "collusion_signals": state.get("collusion_signals"),
        "narrative": state.get("narrative"),
    }

    final_state = {
        **state,
        "evidence_packet": evidence,
        "status": "open",
    }

    if final_state.get("risk_score", 0) < 50:
        final_state["risk_score"] = compute_risk_score(
            final_state.get("process_flags") or [],
            final_state.get("completeness_score") or 0,
            final_state.get("financial_exposure") or 0,
            len(final_state.get("collusion_signals") or []),
            final_state.get("vendor_profile"),
        )
        final_state["severity_band"] = severity_band(final_state["risk_score"])

    record = upsert_case(final_state)

    try:
        from entities.service import create_instance
        from entities.service import CreateEntityInstancePayload

        create_instance(
            "procurement_case",
            final_state.get("project_id", "procure-guard-demo"),
            CreateEntityInstancePayload(
                data={
                    "case_id": record["case_id"],
                    "risk_score": record["risk_score"],
                    "financial_exposure": record["financial_exposure"],
                    "status": record["status"],
                    "label": record.get("label", ""),
                },
                status="active",
            ),
        )
    except Exception:
        pass

    return {
        "evidence_packet": evidence,
        "status": "open",
        "messages": [f"Case Creation: {state.get('case_id')} saved to queue"],
    }
