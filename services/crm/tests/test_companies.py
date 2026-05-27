"""Integration tests for Company CRUD endpoints."""

import uuid

import pytest


COMPANIES_URL = "/api/v1/companies"


async def _create_org(client):
    resp = await client.post(
        "/api/v1/organizations",
        json={"name": "CompanyTestOrg", "slug": "company-test-org"},
    )
    return resp.json()["id"]


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_company(client):
    """POST /companies — create a new company."""
    org_id = await _create_org(client)

    payload = {
        "organization_id": org_id,
        "name": "Acme Inc",
        "website": "https://acme.example.com",
        "industry": "Technology",
        "size": 500,
        "address": "123 Main St",
    }
    resp = await client.post(COMPANIES_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Acme Inc"
    assert data["website"] == "https://acme.example.com"
    assert data["industry"] == "Technology"
    assert data["size"] == 500
    assert data["address"] == "123 Main St"
    assert data["organization_id"] == org_id
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_list_companies(client):
    """GET /companies — list companies."""
    org_id = await _create_org(client)

    await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "Alpha Inc", "industry": "Tech"},
    )
    await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "Beta LLC", "industry": "Finance"},
    )

    resp = await client.get(COMPANIES_URL, params={"organization_id": org_id})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_companies_filter_by_industry(client):
    """GET /companies — filter by industry."""
    org_id = await _create_org(client)

    await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "DevShop", "industry": "Tech"},
    )
    await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "BankCo", "industry": "Finance"},
    )

    resp = await client.get(
        COMPANIES_URL,
        params={"organization_id": org_id, "industry": "Tech"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["industry"] == "Tech"


@pytest.mark.asyncio
async def test_get_company(client):
    """GET /companies/{id} — get a company by ID."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "Target Corp"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.get(
        f"{COMPANIES_URL}/{company_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == company_id
    assert resp.json()["name"] == "Target Corp"


@pytest.mark.asyncio
async def test_update_company(client):
    """PATCH /companies/{id} — update a company."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "OldName Inc"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{COMPANIES_URL}/{company_id}",
        params={"organization_id": org_id},
        json={"name": "NewName Inc", "size": 1000},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["name"] == "NewName Inc"
    assert data["size"] == 1000


@pytest.mark.asyncio
async def test_delete_company(client):
    """DELETE /companies/{id} — soft-delete a company."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "DeleteMe Corp"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.delete(
        f"{COMPANIES_URL}/{company_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(
        f"{COMPANIES_URL}/{company_id}",
        params={"organization_id": org_id},
    )
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_company_missing_name(client):
    """POST /companies — missing required name."""
    org_id = await _create_org(client)
    resp = await client.post(COMPANIES_URL, json={"organization_id": org_id})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_company_empty_name(client):
    """POST /companies — empty name."""
    org_id = await _create_org(client)
    resp = await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": ""},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_company_negative_size(client):
    """POST /companies — negative company size."""
    org_id = await _create_org(client)
    resp = await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "BadSize", "size": -1},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_company_empty_name(client):
    """PATCH /companies/{id} — update with empty name."""
    org_id = await _create_org(client)
    create_resp = await client.post(
        COMPANIES_URL,
        json={"organization_id": org_id, "name": "ValidCo"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{COMPANIES_URL}/{company_id}",
        params={"organization_id": org_id},
        json={"name": ""},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_company_not_found(client):
    """GET /companies/{id} — non-existent company."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"{COMPANIES_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Company not found"


@pytest.mark.asyncio
async def test_update_company_not_found(client):
    """PATCH /companies/{id} — non-existent company."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{COMPANIES_URL}/{fake_id}",
        params={"organization_id": org_id},
        json={"name": "Ghost"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_company_not_found(client):
    """DELETE /companies/{id} — non-existent company."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.delete(
        f"{COMPANIES_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
