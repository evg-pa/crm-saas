"""Integration tests for Activity CRUD endpoints."""

import uuid
from datetime import datetime, timezone

import pytest


ACTIVITIES_URL = "/api/v1/activities"


async def _create_org(client):
    resp = await client.post(
        "/api/v1/organizations",
        json={"name": "ActivityTestOrg", "slug": "activity-test-org"},
    )
    return resp.json()["id"]


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_activity(client):
    """POST /activities — create a new activity."""
    org_id = await _create_org(client)

    payload = {
        "organization_id": org_id,
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
    assert data["organization_id"] == org_id
    assert "id" in data
    assert "created_at" in data
    assert "occurred_at" in data


@pytest.mark.asyncio
async def test_list_activities(client):
    """GET /activities — list activities."""
    org_id = await _create_org(client)

    await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "email",
            "subject": "Follow-up email",
            "occurred_at": _now_iso(),
        },
    )
    await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "meeting",
            "subject": "Product demo",
            "occurred_at": _now_iso(),
        },
    )

    resp = await client.get(ACTIVITIES_URL, params={"organization_id": org_id})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_activities_filter_by_type(client):
    """GET /activities — filter by activity_type."""
    org_id = await _create_org(client)

    await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "call",
            "subject": "Phone call",
            "occurred_at": _now_iso(),
        },
    )
    await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "email",
            "subject": "Email outreach",
            "occurred_at": _now_iso(),
        },
    )

    resp = await client.get(
        ACTIVITIES_URL,
        params={"organization_id": org_id, "activity_type": "call"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["activity_type"] == "call"


@pytest.mark.asyncio
async def test_get_activity(client):
    """GET /activities/{id} — get an activity by ID."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "note",
            "subject": "Internal note",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.get(
        f"{ACTIVITIES_URL}/{activity_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == activity_id
    assert resp.json()["subject"] == "Internal note"


@pytest.mark.asyncio
async def test_update_activity(client):
    """PATCH /activities/{id} — update an activity."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "call",
            "subject": "Old subject",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{ACTIVITIES_URL}/{activity_id}",
        params={"organization_id": org_id},
        json={"subject": "Updated subject", "description": "Added details"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["subject"] == "Updated subject"
    assert data["description"] == "Added details"
    assert data["activity_type"] == "call"  # unchanged


@pytest.mark.asyncio
async def test_delete_activity(client):
    """DELETE /activities/{id} — soft-delete an activity."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "task",
            "subject": "Delete me",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.delete(
        f"{ACTIVITIES_URL}/{activity_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(
        f"{ACTIVITIES_URL}/{activity_id}",
        params={"organization_id": org_id},
    )
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_activity_missing_fields(client):
    """POST /activities — missing required fields."""
    org_id = await _create_org(client)
    resp = await client.post(
        ACTIVITIES_URL,
        json={"organization_id": org_id},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_activity_empty_subject(client):
    """POST /activities — empty subject."""
    org_id = await _create_org(client)
    resp = await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "call",
            "subject": "",
            "occurred_at": _now_iso(),
        },
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_activity_empty_type(client):
    """POST /activities — empty activity_type."""
    org_id = await _create_org(client)
    resp = await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "",
            "subject": "Test",
            "occurred_at": _now_iso(),
        },
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_activity_empty_type(client):
    """PATCH /activities/{id} — update with empty type."""
    org_id = await _create_org(client)
    create_resp = await client.post(
        ACTIVITIES_URL,
        json={
            "organization_id": org_id,
            "activity_type": "call",
            "subject": "Valid",
            "occurred_at": _now_iso(),
        },
    )
    activity_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{ACTIVITIES_URL}/{activity_id}",
        params={"organization_id": org_id},
        json={"activity_type": ""},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_activity_not_found(client):
    """GET /activities/{id} — non-existent activity."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"{ACTIVITIES_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Activity not found"


@pytest.mark.asyncio
async def test_update_activity_not_found(client):
    """PATCH /activities/{id} — non-existent activity."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{ACTIVITIES_URL}/{fake_id}",
        params={"organization_id": org_id},
        json={"subject": "Ghost"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_activity_not_found(client):
    """DELETE /activities/{id} — non-existent activity."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.delete(
        f"{ACTIVITIES_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
