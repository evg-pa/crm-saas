"""Integration tests for Contact CRUD endpoints."""

import uuid

import pytest


CONTACTS_URL = "/api/v1/contacts"


async def _create_org(client):
    """Helper: create a test organization and return its ID."""
    resp = await client.post(
        "/api/v1/organizations",
        json={"name": "ContactTestOrg", "slug": "contact-test-org"},
    )
    return resp.json()["id"]


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_contact(client):
    """POST /contacts — create a new contact."""
    org_id = await _create_org(client)

    payload = {
        "organization_id": org_id,
        "first_name": "Alice",
        "last_name": "Smith",
        "email": "alice@example.com",
        "phone": "+1-555-0100",
        "title": "CEO",
    }
    resp = await client.post(CONTACTS_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["first_name"] == "Alice"
    assert data["last_name"] == "Smith"
    assert data["email"] == "alice@example.com"
    assert data["phone"] == "+1-555-0100"
    assert data["title"] == "CEO"
    assert data["organization_id"] == org_id
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_list_contacts(client):
    """GET /contacts — list contacts for an organization."""
    org_id = await _create_org(client)

    # Create two contacts
    await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Bob",
            "last_name": "Jones",
            "email": "bob@example.com",
        },
    )
    await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Carol",
            "last_name": "Doe",
            "email": "carol@example.com",
        },
    )

    resp = await client.get(CONTACTS_URL, params={"organization_id": org_id})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_contacts_search(client):
    """GET /contacts — search by name."""
    org_id = await _create_org(client)

    await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Zelda",
            "last_name": "Unique",
            "email": "zelda@example.com",
        },
    )
    await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Mario",
            "last_name": "Common",
            "email": "mario@example.com",
        },
    )

    resp = await client.get(
        CONTACTS_URL, params={"organization_id": org_id, "q": "Zelda"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["first_name"] == "Zelda"


@pytest.mark.asyncio
async def test_get_contact(client):
    """GET /contacts/{id} — get a contact by ID."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Eve",
            "last_name": "Target",
            "email": "eve@example.com",
        },
    )
    contact_id = create_resp.json()["id"]

    resp = await client.get(
        f"{CONTACTS_URL}/{contact_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == contact_id
    assert resp.json()["first_name"] == "Eve"
    assert resp.json()["last_name"] == "Target"


@pytest.mark.asyncio
async def test_update_contact(client):
    """PATCH /contacts/{id} — update a contact."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Frank",
            "last_name": "Old",
            "email": "frank@example.com",
        },
    )
    contact_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{CONTACTS_URL}/{contact_id}",
        params={"organization_id": org_id},
        json={"last_name": "New", "title": "CTO"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["last_name"] == "New"
    assert data["title"] == "CTO"
    assert data["first_name"] == "Frank"  # unchanged


@pytest.mark.asyncio
async def test_delete_contact(client):
    """DELETE /contacts/{id} — soft-delete a contact."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Delete",
            "last_name": "Me",
            "email": "delete@example.com",
        },
    )
    contact_id = create_resp.json()["id"]

    resp = await client.delete(
        f"{CONTACTS_URL}/{contact_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 204, resp.text

    # Verify it's gone
    get_resp = await client.get(
        f"{CONTACTS_URL}/{contact_id}",
        params={"organization_id": org_id},
    )
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_contact_missing_required(client):
    """POST /contacts — missing required fields."""
    resp = await client.post(CONTACTS_URL, json={"email": "no-name@example.com"})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_contact_empty_name(client):
    """POST /contacts — empty first name."""
    org_id = await _create_org(client)
    resp = await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "",
            "last_name": "Empty",
        },
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_contact_no_org_id(client):
    """POST /contacts — missing organization_id."""
    resp = await client.post(
        CONTACTS_URL,
        json={"first_name": "No", "last_name": "Org"},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_contact_empty_first_name(client):
    """PATCH /contacts/{id} — update with invalid data."""
    org_id = await _create_org(client)
    create_resp = await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Valid",
            "last_name": "Contact",
        },
    )
    contact_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{CONTACTS_URL}/{contact_id}",
        params={"organization_id": org_id},
        json={"first_name": ""},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_contact_not_found(client):
    """GET /contacts/{id} — non-existent contact."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"{CONTACTS_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Contact not found"


@pytest.mark.asyncio
async def test_get_contact_wrong_org(client):
    """GET /contacts/{id} — contact exists but in different org."""
    org_id = await _create_org(client)
    other_org_id = "00000000-0000-0000-0000-000000000001"

    create_resp = await client.post(
        CONTACTS_URL,
        json={
            "organization_id": org_id,
            "first_name": "Hidden",
            "last_name": "Contact",
        },
    )
    contact_id = create_resp.json()["id"]

    # Query with wrong org
    resp = await client.get(
        f"{CONTACTS_URL}/{contact_id}",
        params={"organization_id": other_org_id},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_update_contact_not_found(client):
    """PATCH /contacts/{id} — non-existent contact."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{CONTACTS_URL}/{fake_id}",
        params={"organization_id": org_id},
        json={"last_name": "Ghost"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_contact_not_found(client):
    """DELETE /contacts/{id} — non-existent contact."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.delete(
        f"{CONTACTS_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
