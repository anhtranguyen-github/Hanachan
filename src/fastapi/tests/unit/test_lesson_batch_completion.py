from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.review_sessions import (
    _build_initial_fsrs_rows,
    complete_lesson,
)


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
        self.select_columns: str | None = None
        self.upsert_rows: list[dict] | dict | None = None

    def select(self, columns: str):
        self.select_columns = columns
        return self

    def eq(self, key: str, value: object):
        self.filters.append((key, value))
        return self

    def update(self, payload: dict):
        self.pending_update = payload
        return self

    def insert(self, payload):
        self.pending_insert = payload
        return self

    def upsert(self, payload, on_conflict: str | None = None):
        self.upsert_rows = payload
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
                row.update(self.pending_update)
            return _FakeResponse(deepcopy(matched))

        if self.pending_insert is not None:
            payloads = self.pending_insert if isinstance(self.pending_insert, list) else [self.pending_insert]
            for payload in payloads:
                rows.append(deepcopy(payload))
            return _FakeResponse(deepcopy(payloads))

        if self.upsert_rows is not None:
            payloads = self.upsert_rows if isinstance(self.upsert_rows, list) else [self.upsert_rows]
            for payload in payloads:
                existing = next(
                    (
                        row
                        for row in rows
                        if row.get("user_id") == payload.get("user_id")
                        and row.get("item_id") == payload.get("item_id")
                        and row.get("item_type") == payload.get("item_type")
                        and row.get("facet") == payload.get("facet")
                    ),
                    None,
                )
                if existing:
                    existing.update(deepcopy(payload))
                else:
                    rows.append(deepcopy(payload))
            return _FakeResponse(deepcopy(payloads))

        return _FakeResponse(deepcopy(matched))


class _FakeClient:
    def __init__(self, store: dict[str, list[dict]]):
        self.store = store

    def table(self, table_name: str):
        self.store.setdefault(table_name, [])
        return _FakeTable(self.store, table_name)


def test_build_initial_fsrs_rows_matches_learning_flow():
    rows = _build_initial_fsrs_rows(
        user_id="user-1",
        ku_id="ku-1",
        ku_type="vocabulary",
        now=datetime(2026, 3, 24, 12, 0, tzinfo=timezone.utc),
    )

    assert [row["facet"] for row in rows] == ["meaning", "reading"]
    assert all(row["state"] == "learning" for row in rows)
    assert all(row["reps"] == 1 for row in rows)


@pytest.mark.asyncio
async def test_complete_lesson_requires_all_items_quiz_passed():
    client = _FakeClient(
        {
            "lesson_batches": [{"id": "batch-1", "user_id": "user-1", "status": "in_progress"}],
            "lesson_items": [
                {"batch_id": "batch-1", "ku_id": "ku-1", "status": "quiz_passed", "knowledge_units": {"type": "radical"}},
                {"batch_id": "batch-1", "ku_id": "ku-2", "status": "viewed", "knowledge_units": {"type": "vocabulary"}},
            ],
            "user_fsrs_states": [],
        }
    )

    with pytest.raises(HTTPException) as exc:
        await complete_lesson("batch-1", current_user={"id": "user-1"}, client=client)

    assert exc.value.status_code == 400
    assert "must pass the batch quiz" in exc.value.detail
    assert client.store["user_fsrs_states"] == []


@pytest.mark.asyncio
async def test_complete_lesson_initializes_fsrs_and_marks_batch_complete():
    client = _FakeClient(
        {
            "lesson_batches": [{"id": "batch-1", "user_id": "user-1", "status": "in_progress"}],
            "lesson_items": [
                {"batch_id": "batch-1", "ku_id": "ku-1", "status": "quiz_passed", "knowledge_units": {"type": "radical"}},
                {"batch_id": "batch-1", "ku_id": "ku-2", "status": "quiz_passed", "knowledge_units": {"type": "vocabulary"}},
            ],
            "user_fsrs_states": [],
        }
    )

    result = await complete_lesson("batch-1", current_user={"id": "user-1"}, client=client)

    assert result["status"] == "success"
    assert result["learned_item_count"] == 2
    assert result["scheduled_review_count"] == 3
    assert client.store["lesson_batches"][0]["status"] == "completed"
    assert all(item["status"] == "learned" for item in client.store["lesson_items"])
    assert sorted((row["item_id"], row["facet"]) for row in client.store["user_fsrs_states"]) == [
        ("ku-1", "meaning"),
        ("ku-2", "meaning"),
        ("ku-2", "reading"),
    ]
