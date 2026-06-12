"""Integration tests for Deal CRUD endpoints."""

import uuid

import pytest


DEALS_URL = "/api/v1/deals"


# ── Happy Path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_deal(client, test_org_id):
    """POST /deals — create a new deal with minimal fields."""
    payload = {
        "name": "Big Sale",
    }
    resp = await client.post(DEALS_URL, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == "Big Sale"
    assert data["stage"] == "new"  # default
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_deal_full(client, test_org_id):
    """POST /deals — create a deal with all fields."""
    payload = {
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
async def test_list_deals(client, test_org_id):
    """GET /deals — list deals."""
    await client.post(DEALS_URL, json={"name": "Deal Alpha"})
    await client.post(DEALS_URL, json={"name": "Deal Beta"})

    resp = await client.get(DEALS_URL)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_list_deals_filter_by_stage(client, test_org_id):
    """GET /deals — filter by stage."""
    await client.post(
        DEALS_URL,
        json={
            "name": "Prospect Deal",
            "stage": "new",
        },
    )
    await client.post(
        DEALS_URL,
        json={
            "name": "Closing Deal",
            "stage": "closed-won",
        },
    )

    resp = await client.get(
        DEALS_URL,
        params={"stage": "closed-won"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["stage"] == "closed-won"


@pytest.mark.asyncio
async def test_get_deal(client, test_org_id):
    """GET /deals/{id} — get a deal by ID."""
    create_resp = await client.post(
        DEALS_URL, json={"name": "Target Deal"}
    )
    deal_id = create_resp.json()["id"]

    resp = await client.get(f"{DEALS_URL}/{deal_id}")
    assert resp.status_code == 200, resp.text
    assert resp.json()["id"] == deal_id
    assert resp.json()["name"] == "Target Deal"


@pytest.mark.asyncio
async def test_update_deal(client, test_org_id):
    """PATCH /deals/{id} — update a deal."""
    create_resp = await client.post(
        DEALS_URL,
        json={"name": "Old Deal", "stage": "new"},
    )
    deal_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{DEALS_URL}/{deal_id}",
        json={"stage": "negotiation", "amount": 10000},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["stage"] == "negotiation"
    assert data["amount"] == 10000
    assert data["name"] == "Old Deal"  # unchanged


@pytest.mark.asyncio
async def test_delete_deal(client, test_org_id):
    """DELETE /deals/{id} — soft-delete a deal."""
    create_resp = await client.post(
        DEALS_URL, json={"name": "Delete Deal"}
    )
    deal_id = create_resp.json()["id"]

    resp = await client.delete(f"{DEALS_URL}/{deal_id}")
    assert resp.status_code == 204, resp.text

    get_resp = await client.get(f"{DEALS_URL}/{deal_id}")
    assert get_resp.status_code == 404


# ── Validation Errors ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_deal_missing_name(client, test_org_id):
    """POST /deals — missing required name."""
    resp = await client.post(DEALS_URL, json={})
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_deal_empty_name(client, test_org_id):
    """POST /deals — empty name."""
    resp = await client.post(
        DEALS_URL,
        json={"name": ""},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_create_deal_negative_amount(client, test_org_id):
    """POST /deals — negative deal amount."""
    resp = await client.post(
        DEALS_URL,
        json={"name": "BadDeal", "amount": -500},
    )
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_update_deal_negative_amount(client, test_org_id):
    """PATCH /deals/{id} — update with negative amount."""
    create_resp = await client.post(
        DEALS_URL, json={"name": "ValidDeal"}
    )
    deal_id = create_resp.json()["id"]

    resp = await client.patch(
        f"{DEALS_URL}/{deal_id}",
        json={"amount": -1},
    )
    assert resp.status_code == 422, resp.text


# ── 404 Cases ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_deal_not_found(client, test_org_id):
    """GET /deals/{id} — non-existent deal."""
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"{DEALS_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
    assert resp.json()["detail"] == "Deal not found"


@pytest.mark.asyncio
async def test_update_deal_not_found(client, test_org_id):
    """PATCH /deals/{id} — non-existent deal."""
    fake_id = str(uuid.uuid4())
    resp = await client.patch(
        f"{DEALS_URL}/{fake_id}",
        json={"stage": "closed-won"},
    )
    assert resp.status_code == 404, resp.text


@pytest.mark.asyncio
async def test_delete_deal_not_found(client, test_org_id):
    """DELETE /deals/{id} — non-existent deal."""
    fake_id = str(uuid.uuid4())
    resp = await client.delete(f"{DEALS_URL}/{fake_id}")
    assert resp.status_code == 404, resp.text
