"""Integration tests for Note CRUD endpoints."""

import uuid

import pytest


NOTES_URL = "/api/v1/notes"
CONTACTS_URL = "/api/v1/contacts"


async def _create_contact(client) -> str:
    resp = await client.post(
        CONTACTS_URL,
        json={
            "first_name": "Note",
            "last_name": "Target",
            "email": f"note-target-{uuid.uuid4().hex[:8]}@example.com",
        },
    )
    return resp.json()["id"]


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_note(client, test_org_id):
    """POST /notes — create a new note."""
    contact_id = await _create_contact(client)

    payload = {
        "contact_id": contact_id,
        "content": "Follow up on the proposal next week.",
    }
    resp = await client.post(NOTES_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["content"] == "Follow up on the proposal next week."
    assert data["organization_id"] == test_org_id
    assert data["contact_id"] == contact_id
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_list_notes(client, test_org_id):
    """GET /notes — list notes."""
    contact_id = await _create_contact(client)

    await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_id,
            "content": "Note one",
        },
    )
    await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_id,
            "content": "Note two",
        },
    )

    resp = await client.get(NOTES_URL)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_notes_filter_by_contact(client, test_org_id):
    """GET /notes — filter by contact_id."""
    contact_a = await _create_contact(client)
    contact_b = await _create_contact(client)

    await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_a,
            "content": "Note for A",
        },
    )
    await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_b,
            "content": "Note for B",
        },
    )

    resp = await client.get(
        NOTES_URL, params={"contact_id": contact_a}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["contact_id"] == contact_a


@pytest.mark.asyncio
async def test_get_note(client, test_org_id):
    """GET /notes/{id} — get a note by ID."""
    contact_id = await _create_contact(client)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_id,
            "content": "Target note content",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.get(f"{NOTES_URL}/{note_id}")
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == note_id
    assert resp.json()["content"] == "Target note content"
    assert resp.json()["contact_id"] == contact_id


@pytest.mark.asyncio
async def test_update_note(client, test_org_id):
    """PATCH /notes/{id} — update a note."""
    contact_id = await _create_contact(client)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_id,
            "content": "Old content",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{NOTES_URL}/{note_id}",
        json={"content": "Updated content with more detail"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["content"] == "Updated content with more detail"


@pytest.mark.asyncio
async def test_delete_note(client, test_org_id):
    """DELETE /notes/{id} — soft-delete a note."""
    contact_id = await _create_contact(client)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_id,
            "content": "Delete me",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.delete(f"{NOTES_URL}/{note_id}")
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(f"{NOTES_URL}/{note_id}")
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_note_missing_content(client, test_org_id):
    """POST /notes — missing required content."""
    contact_id = await _create_contact(client)

    resp = await client.post(
        NOTES_URL,
        json={"contact_id": contact_id},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_note_empty_content(client, test_org_id):
    """POST /notes — empty content."""
    contact_id = await _create_contact(client)

    resp = await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_id,
            "content": "",
        },
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_note_missing_contact(client, test_org_id):
    """POST /notes — missing contact_id."""
    resp = await client.post(
        NOTES_URL,
        json={"content": "No contact"},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_note_empty_content(client, test_org_id):
    """PATCH /notes/{id} — update with empty content."""
    contact_id = await _create_contact(client)

    create_resp = await client.post(
        NOTES_URL,
        json={
            "contact_id": contact_id,
            "content": "Valid content",
        },
    )
    note_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{NOTES_URL}/{note_id}",
        json={"content": ""},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_note_not_found(client, test_org_id):
    """GET /notes/{id} — non-existent note."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"{NOTES_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Note not found"


@pytest.mark.asyncio
async def test_update_note_not_found(client, test_org_id):
    """PATCH /notes/{id} — non-existent note."""
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{NOTES_URL}/{fake_id}",
        json={"content": "Ghost"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_note_not_found(client, test_org_id):
    """DELETE /notes/{id} — non-existent note."""
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"{NOTES_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text


# ── Edge Cases ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_notes_pagination(client, test_org_id):
    """GET /notes — pagination respects offset/limit."""
    contact_id = await _create_contact(client)

    # Create 5 notes
    for i in range(5):
        await client.post(
            NOTES_URL,
            json={
                "contact_id": contact_id,
                "content": f"Note {i}",
            },
        )

    resp = await client.get(
        NOTES_URL,
        params={"offset": 2, "limit": 2},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["offset"] == 2
    assert data["limit"] == 2
    assert len(data["items"]) == 2
