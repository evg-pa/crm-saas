"""Integration tests for Company CRUD endpoints."""

import uuid

import pytest


COMPANIES_URL = "/api/v1/companies"


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_company(client, test_org_id):
    """POST /companies — create a new company."""
    payload = {
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
    assert data["organization_id"] == test_org_id
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_list_companies(client, test_org_id):
    """GET /companies — list companies."""
    await client.post(
        COMPANIES_URL,
        json={"name": "Alpha Inc", "industry": "Tech"},
    )
    await client.post(
        COMPANIES_URL,
        json={"name": "Beta LLC", "industry": "Finance"},
    )

    resp = await client.get(COMPANIES_URL)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_companies_filter_by_industry(client, test_org_id):
    """GET /companies — filter by industry."""
    await client.post(
        COMPANIES_URL,
        json={"name": "DevShop", "industry": "Tech"},
    )
    await client.post(
        COMPANIES_URL,
        json={"name": "BankCo", "industry": "Finance"},
    )

    resp = await client.get(
        COMPANIES_URL,
        params={"industry": "Tech"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["industry"] == "Tech"


@pytest.mark.asyncio
async def test_get_company(client, test_org_id):
    """GET /companies/{id} — get a company by ID."""
    create_resp = await client.post(
        COMPANIES_URL,
        json={"name": "Target Corp"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.get(f"{COMPANIES_URL}/{company_id}")
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == company_id
    assert resp.json()["name"] == "Target Corp"


@pytest.mark.asyncio
async def test_update_company(client, test_org_id):
    """PATCH /companies/{id} — update a company."""
    create_resp = await client.post(
        COMPANIES_URL,
        json={"name": "OldName Inc"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{COMPANIES_URL}/{company_id}",
        json={"name": "NewName Inc", "size": 1000},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["name"] == "NewName Inc"
    assert data["size"] == 1000


@pytest.mark.asyncio
async def test_delete_company(client, test_org_id):
    """DELETE /companies/{id} — soft-delete a company."""
    create_resp = await client.post(
        COMPANIES_URL,
        json={"name": "DeleteMe Corp"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.delete(f"{COMPANIES_URL}/{company_id}")
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(f"{COMPANIES_URL}/{company_id}")
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_company_missing_name(client, test_org_id):
    """POST /companies — missing required name."""
    resp = await client.post(COMPANIES_URL, json={})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_company_empty_name(client, test_org_id):
    """POST /companies — empty name."""
    resp = await client.post(COMPANIES_URL, json={"name": ""})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_company_negative_size(client, test_org_id):
    """POST /companies — negative company size."""
    resp = await client.post(
        COMPANIES_URL,
        json={"name": "BadSize", "size": -1},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_company_empty_name(client, test_org_id):
    """PATCH /companies/{id} — update with empty name."""
    create_resp = await client.post(
        COMPANIES_URL,
        json={"name": "ValidCo"},
    )
    company_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{COMPANIES_URL}/{company_id}",
        json={"name": ""},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_company_not_found(client, test_org_id):
    """GET /companies/{id} — non-existent company."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"{COMPANIES_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Company not found"


@pytest.mark.asyncio
async def test_update_company_not_found(client, test_org_id):
    """PATCH /companies/{id} — non-existent company."""
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{COMPANIES_URL}/{fake_id}",
        json={"name": "Ghost"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_company_not_found(client, test_org_id):
    """DELETE /companies/{id} — non-existent company."""
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"{COMPANIES_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
