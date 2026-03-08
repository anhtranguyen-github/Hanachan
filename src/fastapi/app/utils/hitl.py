from typing import Any, Callable, Dict, Optional, Union
from .safe_sql import do_execute
import requests


def execute_with_approval(engine_url: str, query: str, params: Optional[Dict[str, Any]] = None, *,
                          table_whitelist: Optional[set] = None,
                          approver: Optional[Union[Callable[[Dict[str, Any]], Dict[str, Any]], str]] = None) -> Any:
    """Wrap `do_execute` with a human-in-the-loop approval step.

    - `approver` is a callable that receives a dict with keys `query`, `params`, `tables`
      and must return a dict like `{"type": "approve"}` or `{"type": "reject", "message": "..."}`.
    - If approver approves, the query is executed via `do_execute`.
    - If approver rejects, raises PermissionError.
    """
    if approver is None:
        raise ValueError("approver callback or approver URL is required for HITL execution")

    # build proposed args for approval
    proposed = {"query": query, "params": params or {}, "tables": []}
    try:
        # lightweight table extraction for approver visibility
        from .safe_sql import _extract_tables

        proposed["tables"] = _extract_tables(query)
    except Exception:
        proposed["tables"] = []

    # Support approver as callable or URL string (POSTs proposed payload)
    if isinstance(approver, str):
        try:
            resp = requests.post(approver, json=proposed, timeout=10)
            decision = resp.json()
        except Exception as e:
            raise RuntimeError(f"approver URL call failed: {e}")
    else:
        decision = approver(proposed)

    if not isinstance(decision, dict):
        raise ValueError("approver must return a dict with a 'type' key")

    if decision.get("type") != "approve":
        msg = decision.get("message", "Rejected by approver")
        raise PermissionError(msg)

    return do_execute(engine_url, query, params, table_whitelist=table_whitelist)
