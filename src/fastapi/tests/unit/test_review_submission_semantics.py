from __future__ import annotations

from copy import deepcopy

import pytest

from app.api.v1.endpoints.review_sessions import ReviewSubmitRequest, submit_review


class _FakeResponse:
    def __init__(self, data):
        self.data = data


class _FakeTable:
    def __init__(self, store: dict[str, list[dict]], table_name: str):
        self.store = store
        self.table_name = table_name
        self.filters: list[tuple[str, object]] = []
        self.pending_update: dict | None = None
        self.pending_insert: list[dict] | dict | None = None
        self.pending_upsert: list[dict] | dict | None = None

    def select(self, columns: str):
        return self

    def eq(self, key: str, value: object):
        self.filters.append((key, value))
        return self

    def execute(self):
        rows = self.store[self.table_name]
        matched = [
            row
            for row in rows
            if all(row.get(key) == value for key, value in self.filters)
        ]

        if self.pending_update is not None:
            for row in matched:
                row.update(deepcopy(self.pending_update))
            return _FakeResponse(deepcopy(matched))

        if self.pending_insert is not None:
            payloads = self.pending_insert if isinstance(self.pending_insert, list) else [self.pending_insert]
            for payload in payloads:
                rows.append(deepcopy(payload))
            return _FakeResponse(deepcopy(payloads))

        if self.pending_upsert is not None:
            payloads = self.pending_upsert if isinstance(self.pending_upsert, list) else [self.pending_upsert]
            for payload in payloads:
                existing = next(
                    (
                        row
                        for row in rows
                        if all(
                            row.get(key) == payload.get(key)
                            for key in ("session_id", "ku_id", "facet")
                            if key in payload
                        )
                    ),
                    None,
                )
                if existing:
                    existing.update(deepcopy(payload))
                else:
                    rows.append(deepcopy(payload))
            return _FakeResponse(deepcopy(payloads))

        return _FakeResponse(deepcopy(matched))

    def update(self, payload: dict):
        self.pending_update = payload
        return self

    def insert(self, payload):
        self.pending_insert = payload
        return self

    def upsert(self, payload, on_conflict: str | None = None):
        self.pending_upsert = payload
        return self

    def maybe_single(self):
        return self


class _FakeClient:
    def __init__(self, store: dict[str, list[dict]]):
        self.store = store

    def table(self, table_name: str):
        self.store.setdefault(table_name, [])
        return _FakeTable(self.store, table_name)


def _base_store() -> dict[str, list[dict]]:
    return {
        "review_sessions": [{"id": "session-1", "user_id": "user-1"}],
        "user_fsrs_states": [
            {
                "user_id": "user-1",
                "item_id": "ku-1",
                "facet": "meaning",
                "state": "review",
                "stability": 2.0,
                "difficulty": 3.0,
                "reps": 3,
                "lapses": 0,
            }
        ],
        "fsrs_review_logs": [],
        "review_session_items": [{"session_id": "session-1", "ku_id": "ku-1", "facet": "meaning", "status": "pending"}],
    }


@pytest.mark.asyncio
async def test_submit_review_marks_failed_attempt_incorrect_not_completed():
    client = _FakeClient(_base_store())
    payload = ReviewSubmitRequest(
        ku_id="ku-1",
        facet="meaning",
        rating="again",
        attempt_count=1,
        wrong_count=1,
    )

    result = await submit_review(
        "session-1",
        payload,
        current_user={"id": "user-1"},
        client=client,
    )

    assert result["correct"] is False
    session_item = client.store["review_session_items"][0]
    assert session_item["status"] == "incorrect"


@pytest.mark.asyncio
async def test_submit_review_marks_passed_attempt_completed():
    client = _FakeClient(_base_store())
    payload = ReviewSubmitRequest(
        ku_id="ku-1",
        facet="meaning",
        rating="pass",
        attempt_count=2,
        wrong_count=1,
    )

    result = await submit_review(
        "session-1",
        payload,
        current_user={"id": "user-1"},
        client=client,
    )

    assert result["correct"] is True
    session_item = client.store["review_session_items"][0]
    assert session_item["status"] == "completed"
