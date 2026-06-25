from fastapi import APIRouter, Query
from pydantic import BaseModel

from procurement.cases_store import escalate_case, get_case, list_cases, upsert_case
from procurement.data_loader import initial_state
from procurement.graph import run_graph

router = APIRouter(prefix="/api/procurement", tags=["procurement"])


class RunCasePayload(BaseModel):
    scenario_id: str = "case_010"
    project_id: str = "procure-guard-demo"


@router.get("/cases")
async def list_cases_endpoint(project_id: str | None = Query(None)):
    cases = list_cases(project_id)
    return {"cases": cases, "total": len(cases)}


@router.get("/cases/{case_id}")
async def get_case_endpoint(case_id: str):
    return get_case(case_id)


@router.post("/cases/run")
async def run_case_pipeline(payload: RunCasePayload):
    state = initial_state(payload.scenario_id, payload.project_id)
    result = run_graph("procure_guard_pipeline", state)
    record = upsert_case(dict(result))
    return {"case": record, "result": dict(result)}


@router.post("/cases/{case_id}/escalate")
async def escalate_case_endpoint(case_id: str):
    return escalate_case(case_id)


@router.post("/cases/seed-demo")
async def seed_demo_cases():
    """Run both demo scenarios and populate the case queue."""
    results = []
    for scenario in ("case_010", "case_011"):
        state = initial_state(scenario)
        result = run_graph("procure_guard_pipeline", state)
        record = upsert_case(dict(result))
        results.append(record)
    return {"cases": results, "total": len(results)}
