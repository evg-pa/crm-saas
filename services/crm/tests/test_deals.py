"""Integration tests for Deal CRUD endpoints."""

import uuid

import pytest


DEALS_URL = "/api/v1/deals"


async def _create_org(client):
    resp = await client.post(
        "/api/v1/organizations",
        json={"name": "DealTestOrg", "slug": "deal-test-org"},
    )
    return resp.json()["id"]


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_deal(client):
    """POST /deals — create a new deal with minimal fields."""
    org_id = await _create_org(client)

    payload = {
        "organization_id": org_id,
        "name": "Big Sale",
    }
    resp = await client.post(DEALS_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Big Sale"
    assert data["stage"] == "new"  # default
    assert data["organization_id"] == org_id
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_deal_full(client):
    """POST /deals — create a deal with all fields."""
    org_id = await _create_org(client)

    payload = {
        "organization_id": org_id,
        "name": "Enterprise Deal",
        "amount": 50000,
        "stage": "negotiation",
    }
    resp = await client.post(DEALS_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Enterprise Deal"
    assert data["amount"] == 50000
    assert data["stage"] == "negotiation"


@pytest.mark.asyncio
async def test_list_deals(client):
    """GET /deals — list deals."""
    org_id = await _create_org(client)

    await client.post(DEALS_URL, json={"organization_id": org_id, "name": "Deal Alpha"})
    await client.post(DEALS_URL, json={"organization_id": org_id, "name": "Deal Beta"})

    resp = await client.get(DEALS_URL, params={"organization_id": org_id})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_deals_filter_by_stage(client):
    """GET /deals — filter by stage."""
    org_id = await _create_org(client)

    await client.post(
        DEALS_URL,
        json={
            "organization_id": org_id,
            "name": "Prospect Deal",
            "stage": "new",
        },
    )
    await client.post(
        DEALS_URL,
        json={
            "organization_id": org_id,
            "name": "Closing Deal",
            "stage": "closed-won",
        },
    )

    resp = await client.get(
        DEALS_URL,
        params={"organization_id": org_id, "stage": "closed-won"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["stage"] == "closed-won"


@pytest.mark.asyncio
async def test_get_deal(client):
    """GET /deals/{id} — get a deal by ID."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        DEALS_URL, json={"organization_id": org_id, "name": "Target Deal"}
    )
    deal_id = create_resp.json()["id"]

    resp = await client.get(
        f"{DEALS_URL}/{deal_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == deal_id
    assert resp.json()["name"] == "Target Deal"


@pytest.mark.asyncio
async def test_update_deal(client):
    """PATCH /deals/{id} — update a deal."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        DEALS_URL,
        json={"organization_id": org_id, "name": "Old Deal", "stage": "new"},
    )
    deal_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{DEALS_URL}/{deal_id}",
        params={"organization_id": org_id},
        json={"stage": "negotiation", "amount": 10000},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["stage"] == "negotiation"
    assert data["amount"] == 10000
    assert data["name"] == "Old Deal"  # unchanged


@pytest.mark.asyncio
async def test_delete_deal(client):
    """DELETE /deals/{id} — soft-delete a deal."""
    org_id = await _create_org(client)

    create_resp = await client.post(
        DEALS_URL, json={"organization_id": org_id, "name": "Delete Deal"}
    )
    deal_id = create_resp.json()["id"]

    resp = await client.delete(
        f"{DEALS_URL}/{deal_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(
        f"{DEALS_URL}/{deal_id}",
        params={"organization_id": org_id},
    )
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_deal_missing_name(client):
    """POST /deals — missing required name."""
    org_id = await _create_org(client)
    resp = await client.post(DEALS_URL, json={"organization_id": org_id})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_deal_empty_name(client):
    """POST /deals — empty name."""
    org_id = await _create_org(client)
    resp = await client.post(
        DEALS_URL,
        json={"organization_id": org_id, "name": ""},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_deal_negative_amount(client):
    """POST /deals — negative deal amount."""
    org_id = await _create_org(client)
    resp = await client.post(
        DEALS_URL,
        json={"organization_id": org_id, "name": "BadDeal", "amount": -500},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_deal_negative_amount(client):
    """PATCH /deals/{id} — update with negative amount."""
    org_id = await _create_org(client)
    create_resp = await client.post(
        DEALS_URL, json={"organization_id": org_id, "name": "ValidDeal"}
    )
    deal_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{DEALS_URL}/{deal_id}",
        params={"organization_id": org_id},
        json={"amount": -1},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_deal_not_found(client):
    """GET /deals/{id} — non-existent deal."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.get(
        f"{DEALS_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Deal not found"


@pytest.mark.asyncio
async def test_update_deal_not_found(client):
    """PATCH /deals/{id} — non-existent deal."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{DEALS_URL}/{fake_id}",
        params={"organization_id": org_id},
        json={"stage": "closed-won"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_deal_not_found(client):
    """DELETE /deals/{id} — non-existent deal."""
    org_id = await _create_org(client)
    fake_id = str(uuid.uuid4())
    resp = await client.delete(
        f"{DEALS_URL}/{fake_id}",
        params={"organization_id": org_id},
    )
    assert resp.status_code == 404, resp.text
