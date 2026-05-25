"""Integration tests for Note CRUD endpoints."""

import uuid

import pytest


NOTES_URL = "/api/v1/notes"
CONTACTS_URL = "/api/v1/contacts"


async def _create_org(client):
    resp = await client.post(
        "/api/v1/organizations",
        json={"name": "NoteTestOrg", "slug": "note-test-org"},
    )
    return resp.json()["id"]


async def _create_contact(client, org_id: str) -> str:
    resp = await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Note",
            "last_name": "Target",
            "email": f"note-target-{uuid.uuid4().hex[:8]}@example.com",
        },
    )
    return resp.json()["id"]


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_note(client):
    """POST /notes — create a new note."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    payload = {
        "organization_id": org_id,
        "contact_id": contact_id,
        "content": "Follow up on the proposal next week.",
    }
    resp = await client.post(NOTES_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["content"] == "Follow up on the proposal next week."
    assert data["organization_id"] == org_id
    assert data["contact_id"] == contact_id
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_list_notes(client):
    """GET /notes — list notes."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_id,
            "content": "Note one",
        },
    )
    await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_id,
            "content": "Note two",
        },
    )

    resp = await client.get(NOTES_URL, params={"organization_id": org_id})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_notes_filter_by_contact(client):
    """GET /notes — filter by contact_id."""
    org_id = await _create_org(client)
    contact_a = await _create_contact(client, org_id)
    contact_b = await _create_contact(client, org_id)

    await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_a,
            "content": "Note for A",
        },
    )
    await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_b,
            "content": "Note for B",
        },
    )

    resp = await client.get(
        NOTES_URL, params={"organization_id": org_id, "contact_id": contact_a}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["contact_id"] == contact_a


@pytest.mark.asyncio
async def test_get_note(client):
    """GET /notes/{id} — get a note by ID."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_id,
            "content": "Target note content",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.get(
        f"{NOTES_URL}/{note_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == note_id
    assert resp.json()["content"] == "Target note content"
    assert resp.json()["contact_id"] == contact_id


@pytest.mark.asyncio
async def test_update_note(client):
    """PATCH /notes/{id} — update a note."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_id,
            "content": "Old content",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{NOTES_URL}/{note_id}",
        params={"organization_id": org_id},
        json={"content": "Updated content with more detail"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["content"] == "Updated content with more detail"


@pytest.mark.asyncio
async def test_delete_note(client):
    """DELETE /notes/{id} — soft-delete a note."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_id,
            "content": "Delete me",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.delete(
        f"{NOTES_URL}/{note_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(
        f"{NOTES_URL}/{note_id}",
        params={"organization_id": org_id},
    )
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_note_missing_content(client):
    """POST /notes — missing required content."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    resp = await client.post(
        NOTES_URL,
        json={"organization_id": org_id, "contact_id": contact_id},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_note_empty_content(client):
    """POST /notes — empty content."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    resp = await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_id,
            "content": "",
        },
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_note_missing_contact(client):
    """POST /notes — missing contact_id."""
    org_id = await _create_org(client)

    resp = await client.post(
        NOTES_URL,
        json={"organization_id": org_id, "content": "No contact"},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_note_empty_content(client):
    """PATCH /notes/{id} — update with empty content."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "organization_id": org_id,
            "contact_id": contact_id,
            "content": "Valid content",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{NOTES_URL}/{note_id}",
        params={"organization_id": org_id},
        json={"content": ""},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_note_not_found(client):
    """GET /notes/{id} — non-existent note."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"{NOTES_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Note not found"


@pytest.mark.asyncio
async def test_update_note_not_found(client):
    """PATCH /notes/{id} — non-existent note."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{NOTES_URL}/{fake_id}",
        params={"organization_id": org_id},
        json={"content": "Ghost"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_note_not_found(client):
    """DELETE /notes/{id} — non-existent note."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.delete(
        f"{NOTES_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text


# ── Edge Cases ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_notes_pagination(client):
    """GET /notes — pagination respects offset/limit."""
    org_id = await _create_org(client)
    contact_id = await _create_contact(client, org_id)

    # Create 5 notes
    for i in range(5):
        await client.post(
            NOTES_URL,
            json={
                "organization_id": org_id,
                "contact_id": contact_id,
                "content": f"Note {i}",
            },
        )

    resp = await client.get(
        NOTES_URL,
        params={"organization_id": org_id, "offset": 2, "limit": 2},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["offset"] == 2
    assert data["limit"] == 2
    assert len(data["items"]) == 2
