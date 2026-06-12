"""Integration tests for Activity CRUD endpoints."""

import uuid
from datetime import datetime, timezone

import pytest


ACTIVITIES_URL = "/api/v1/activities"


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_activity(client, test_org_id):
    """POST /activities — create a new activity."""
    payload = {
        "activity_type": "call",
        "subject": "Discovery call with prospect",
        "description": "Discussed product features and pricing",
        "occurred_at": _now_iso(),
    }
    resp = await client.post(ACTIVITIES_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["activity_type"] == "call"
    assert data["subject"] == "Discovery call with prospect"
    assert data["description"] == "Discussed product features and pricing"
    assert data["organization_id"] == test_org_id
    assert "id" in data
    assert "created_at" in data
    assert "occurred_at" in data


@pytest.mark.asyncio
async def test_list_activities(client, test_org_id):
    """GET /activities — list activities."""
    await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "email",
            "subject": "Follow-up email",
            "occurred_at": _now_iso(),
        },
    )
    await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "meeting",
            "subject": "Product demo",
            "occurred_at": _now_iso(),
        },
    )

    resp = await client.get(ACTIVITIES_URL)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_activities_filter_by_type(client, test_org_id):
    """GET /activities — filter by activity_type."""
    await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "call",
            "subject": "Phone call",
            "occurred_at": _now_iso(),
        },
    )
    await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "email",
            "subject": "Email outreach",
            "occurred_at": _now_iso(),
        },
    )

    resp = await client.get(
        ACTIVITIES_URL,
        params={"activity_type": "call"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["activity_type"] == "call"


@pytest.mark.asyncio
async def test_get_activity(client, test_org_id):
    """GET /activities/{id} — get an activity by ID."""
    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "note",
            "subject": "Internal note",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.get(f"{ACTIVITIES_URL}/{activity_id}")
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == activity_id
    assert resp.json()["subject"] == "Internal note"


@pytest.mark.asyncio
async def test_update_activity(client, test_org_id):
    """PATCH /activities/{id} — update an activity."""
    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "call",
            "subject": "Old subject",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{ACTIVITIES_URL}/{activity_id}",
        json={"subject": "Updated subject", "description": "Added details"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["subject"] == "Updated subject"
    assert data["description"] == "Added details"
    assert data["activity_type"] == "call"  # unchanged


@pytest.mark.asyncio
async def test_delete_activity(client, test_org_id):
    """DELETE /activities/{id} — soft-delete an activity."""
    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "task",
            "subject": "Delete me",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.delete(f"{ACTIVITIES_URL}/{activity_id}")
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(f"{ACTIVITIES_URL}/{activity_id}")
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_activity_missing_fields(client, test_org_id):
    """POST /activities — missing required fields."""
    resp = await client.post(ACTIVITIES_URL, json={})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_activity_empty_subject(client, test_org_id):
    """POST /activities — empty subject."""
    resp = await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "call",
            "subject": "",
            "occurred_at": _now_iso(),
        },
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_activity_empty_type(client, test_org_id):
    """POST /activities — empty activity_type."""
    resp = await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "",
            "subject": "Test",
            "occurred_at": _now_iso(),
        },
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_activity_empty_type(client, test_org_id):
    """PATCH /activities/{id} — update with empty type."""
    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "activity_type": "call",
            "subject": "Valid",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{ACTIVITIES_URL}/{activity_id}",
        json={"activity_type": ""},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_activity_not_found(client, test_org_id):
    """GET /activities/{id} — non-existent activity."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"{ACTIVITIES_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Activity not found"


@pytest.mark.asyncio
async def test_update_activity_not_found(client, test_org_id):
    """PATCH /activities/{id} — non-existent activity."""
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{ACTIVITIES_URL}/{fake_id}",
        json={"subject": "Ghost"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_activity_not_found(client, test_org_id):
    """DELETE /activities/{id} — non-existent activity."""
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"{ACTIVITIES_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
