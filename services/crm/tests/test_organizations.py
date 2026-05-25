"""Integration tests for Organization CRUD endpoints."""

import uuid
import pytest


ORG_URL = "/api/v1/organizations"


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_organization(client):
    """POST /organizations — create a new organization."""
    payload = {"name": "Acme Corp", "slug": "acme-corp"}
    resp = await client.post(ORG_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Acme Corp"
    assert data["slug"] == "acme-corp"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_list_organizations(client):
    """GET /organizations — list all organizations."""
    # Create two orgs first
    await client.post(ORG_URL, json={"name": "Alpha", "slug": "alpha"})
    await client.post(ORG_URL, json={"name": "Beta", "slug": "beta"})

    resp = await client.get(ORG_URL)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2
    assert "offset" in data
    assert "limit" in data


@pytest.mark.asyncio
async def test_get_organization(client):
    """GET /organizations/{id} — get an organization by ID."""
    create_resp = await client.post(
        ORG_URL, json={"name": "GetMe", "slug": "get-me"}
    )
    org_id = create_resp.json()["id"]

    resp = await client.get(f"{ORG_URL}/{org_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["id"] == org_id
    assert data["name"] == "GetMe"
    assert data["slug"] == "get-me"


@pytest.mark.asyncio
async def test_update_organization(client):
    """PATCH /organizations/{id} — update an organization."""
    create_resp = await client.post(
        ORG_URL, json={"name": "OldName", "slug": "old-name"}
    )
    org_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{ORG_URL}/{org_id}", json={"name": "NewName"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["name"] == "NewName"
    assert data["slug"] == "old-name"  # unchanged


@pytest.mark.asyncio
async def test_delete_organization(client):
    """DELETE /organizations/{id} — soft-delete an organization."""
    create_resp = await client.post(
        ORG_URL, json={"name": "DeleteMe", "slug": "delete-me"}
    )
    org_id = create_resp.json()["id"]

    resp = await client.delete(f"{ORG_URL}/{org_id}")
    assert resp.status_code == 204, resp.text

    # Verify it's gone (404)
    get_resp = await client.get(f"{ORG_URL}/{org_id}")
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_organization_missing_name(client):
    """POST /organizations — missing required field."""
    resp = await client.post(ORG_URL, json={"slug": "no-name"})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_organization_empty_name(client):
    """POST /organizations — name too short."""
    resp = await client.post(ORG_URL, json={"name": "", "slug": "x"})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_organization_invalid_slug(client):
    """POST /organizations — slug doesn't match pattern."""
    resp = await client.post(
        ORG_URL, json={"name": "Bad Slug", "slug": "BAD SLUG!!"}
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_organization_empty_name(client):
    """PATCH /organizations/{id} — update with invalid data."""
    create_resp = await client.post(
        ORG_URL, json={"name": "ValidOrg", "slug": "valid-org"}
    )
    org_id = create_resp.json()["id"]

    resp = await client.patch(f"{ORG_URL}/{org_id}", json={"name": ""})
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_organization_not_found(client):
    """GET /organizations/{id} — non-existent org."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"{ORG_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Organization not found"


@pytest.mark.asyncio
async def test_update_organization_not_found(client):
    """PATCH /organizations/{id} — non-existent org."""
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{ORG_URL}/{fake_id}", json={"name": "Ghost"}
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_organization_not_found(client):
    """DELETE /organizations/{id} — non-existent org."""
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"{ORG_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
