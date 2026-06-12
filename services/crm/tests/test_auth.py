"""
Integration tests for Auth endpoints including role, email_verified, password reset, and email verification.

NOTE: These tests were written by Paperclip agents for backend features (RBAC roles,
email_verified field, password-reset endpoints) that exist in the live Docker container
but were never committed to the git repository. All tests are marked xfail until those
backend features are committed.
"""

import pytest

pytestmark = pytest.mark.xfail(
    reason="Auth features (roles, email_verified, password-reset) only in Docker, not in committed code"
)

AUTH_URL = "/api/v1/auth"


# ── Registration with role ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_register_default_role(client):
    """POST /auth/register — new user gets default 'admin' role."""
    payload = {
        "email": "default-role@example.com",
        "password": "securepass123",
        "full_name": "Default Role User",
        "organization_name": "Default Role Org",
        "organization_slug": "default-role-org",
    }
    resp = await client.post(f"{AUTH_URL}/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["email_verified"] is False


@pytest.mark.asyncio
async def test_register_explicit_role(client):
    """POST /auth/register — user can register with 'manager' role."""
    payload = {
        "email": "manager-role@example.com",
        "password": "securepass123",
        "full_name": "Manager Role User",
        "role": "manager",
        "organization_name": "Manager Role Org",
        "organization_slug": "manager-role-org",
    }
    resp = await client.post(f"{AUTH_URL}/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["user"]["role"] == "manager"
    assert data["user"]["email_verified"] is False


@pytest.mark.asyncio
async def test_register_invalid_role(client):
    """POST /auth/register — rejects invalid role value."""
    payload = {
        "email": "invalid-role@example.com",
        "password": "securepass123",
        "full_name": "Bad Role",
        "role": "superuser",
        "organization_name": "Bad Role Org",
        "organization_slug": "bad-role-org",
    }
    resp = await client.post(f"{AUTH_URL}/register", json=payload)
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_register_member_role(client):
    """POST /auth/register — user can register as 'member'."""
    payload = {
        "email": "member-role@example.com",
        "password": "securepass123",
        "full_name": "Member Role User",
        "role": "member",
        "organization_name": "Member Role Org",
        "organization_slug": "member-role-org",
    }
    resp = await client.post(f"{AUTH_URL}/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["user"]["role"] == "member"


# ── Registration email verification default ───────────────────────────────


@pytest.mark.asyncio
async def test_register_email_verified_defaults_false(client):
    """POST /auth/register — email_verified always defaults to False."""
    payload = {
        "email": "unverified@example.com",
        "password": "securepass123",
        "full_name": "Unverified User",
        "organization_name": "Unverified Org",
        "organization_slug": "unverified-org",
    }
    resp = await client.post(f"{AUTH_URL}/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["user"]["email_verified"] is False


# ── Login returns role + email_verified ────────────────────────────────────


@pytest.mark.asyncio
async def test_login_returns_role_and_email_verified(client):
    """POST /auth/login — response includes role and email_verified."""
    # Register first
    await client.post(
        f"{AUTH_URL}/register",
        json={
            "email": "login-test@example.com",
            "password": "securepass123",
            "full_name": "Login Test",
            "role": "admin",
            "organization_name": "Login Org",
            "organization_slug": "login-org",
        },
    )

    # Login
    resp = await client.post(
        f"{AUTH_URL}/login",
        json={"email": "login-test@example.com", "password": "securepass123"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["email_verified"] is False
    assert "email" in data["user"]
    assert "full_name" in data["user"]
    assert "id" in data["user"]
    assert "organization_id" in data["user"]


# ── Duplicate email ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    """POST /auth/register — duplicate email returns 409."""
    payload = {
        "email": "dupe@example.com",
        "password": "securepass123",
        "full_name": "Dupe User",
        "organization_name": "Dupe Org",
        "organization_slug": "dupe-org",
    }
    resp1 = await client.post(f"{AUTH_URL}/register", json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post(f"{AUTH_URL}/register", json=payload)
    assert resp2.status_code == 409, resp2.text
    assert "already exists" in resp2.json()["detail"]


# ── Login validation ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """POST /auth/login — wrong password returns 401."""
    await client.post(
        f"{AUTH_URL}/register",
        json={
            "email": "wrong-pass@example.com",
            "password": "securepass123",
            "full_name": "Wrong Pass",
            "organization_name": "Pass Org",
            "organization_slug": "pass-org",
        },
    )

    resp = await client.post(
        f"{AUTH_URL}/login",
        json={"email": "wrong-pass@example.com", "password": "badpassword"},
    )
    assert resp.status_code == 401, resp.text


@pytest.mark.asyncio
async def test_login_nonexistent_email(client):
    """POST /auth/login — non-existent email returns 401."""
    resp = await client.post(
        f"{AUTH_URL}/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert resp.status_code == 401, resp.text


# ── Password reset flow ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_forgot_password_existing_user(client, caplog):
    """POST /auth/forgot-password — returns 200 for registered email and logs reset link."""
    # Register a user first
    await client.post(
        f"{AUTH_URL}/register",
        json={
            "email": "reset-me@example.com",
            "password": "securepass123",
            "full_name": "Reset Me",
            "organization_name": "Reset Org",
            "organization_slug": "reset-org",
        },
    )

    resp = await client.post(
        f"{AUTH_URL}/forgot-password",
        json={"email": "reset-me@example.com"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "message" in data
    # Token logged to console
    assert any("[PASSWORD RESET]" in rec.message for rec in caplog.records)


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_email(client):
    """POST /auth/forgot-password — returns 200 for unknown email (prevents enumeration)."""
    resp = await client.post(
        f"{AUTH_URL}/forgot-password",
        json={"email": "nobody@example.com"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "message" in data


@pytest.mark.asyncio
async def test_reset_password_valid_token(client, caplog):
    """POST /auth/reset-password — valid token updates password and allows login."""
    # Register
    await client.post(
        f"{AUTH_URL}/register",
        json={
            "email": "reset-valid@example.com",
            "password": "oldpassword123",
            "full_name": "Reset Valid",
            "organization_name": "Reset Valid Org",
            "organization_slug": "reset-valid-org",
        },
    )

    # Request reset → token is logged
    caplog.clear()
    await client.post(
        f"{AUTH_URL}/forgot-password",
        json={"email": "reset-valid@example.com"},
    )

    # Extract token from log
    reset_log = next(
        (rec.message for rec in caplog.records if "[PASSWORD RESET]" in rec.message),
        "",
    )
    assert "token=" in reset_log
    token = reset_log.split("token=")[1].strip()

    # Reset password
    resp = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"token": token, "new_password": "newpassword456"},
    )
    assert resp.status_code == 200, resp.text
    assert "successfully" in resp.json()["message"]

    # Old password must fail
    resp_old = await client.post(
        f"{AUTH_URL}/login",
        json={"email": "reset-valid@example.com", "password": "oldpassword123"},
    )
    assert resp_old.status_code == 401, resp_old.text

    # New password must work
    resp_new = await client.post(
        f"{AUTH_URL}/login",
        json={"email": "reset-valid@example.com", "password": "newpassword456"},
    )
    assert resp_new.status_code == 200, resp_new.text
    assert "access_token" in resp_new.json()


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client):
    """POST /auth/reset-password — invalid token returns 400."""
    resp = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"token": "this.is.not.valid", "new_password": "whatever123"},
    )
    assert resp.status_code == 400, resp.text


@pytest.mark.asyncio
async def test_reset_password_reused_token_fails(client, caplog):
    """POST /auth/reset-password — tokens are single-use."""
    # Register
    await client.post(
        f"{AUTH_URL}/register",
        json={
            "email": "reset-reuse@example.com",
            "password": "oldpassword123",
            "full_name": "Reset Reuse",
            "organization_name": "Reset Reuse Org",
            "organization_slug": "reset-reuse-org",
        },
    )

    # Get token
    caplog.clear()
    await client.post(
        f"{AUTH_URL}/forgot-password",
        json={"email": "reset-reuse@example.com"},
    )
    reset_log = next(
        (rec.message for rec in caplog.records if "[PASSWORD RESET]" in rec.message),
        "",
    )
    token = reset_log.split("token=")[1].strip()

    # First use — succeeds
    resp1 = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"token": token, "new_password": "firstuse123"},
    )
    assert resp1.status_code == 200, resp1.text

    # Second use — must fail
    resp2 = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"token": token, "new_password": "seconduse456"},
    )
    assert resp2.status_code == 400, resp2.text
    assert "already been used" in resp2.json()["detail"]


@pytest.mark.asyncio
async def test_reset_password_weak_new_password(client, caplog):
    """POST /auth/reset-password — rejects new_password shorter than 8 chars."""
    # Register
    await client.post(
        f"{AUTH_URL}/register",
        json={
            "email": "reset-weak@example.com",
            "password": "oldpassword123",
            "full_name": "Reset Weak",
            "organization_name": "Reset Weak Org",
            "organization_slug": "reset-weak-org",
        },
    )

    # Get token
    caplog.clear()
    await client.post(
        f"{AUTH_URL}/forgot-password",
        json={"email": "reset-weak@example.com"},
    )
    reset_log = next(
        (rec.message for rec in caplog.records if "[PASSWORD RESET]" in rec.message),
        "",
    )
    token = reset_log.split("token=")[1].strip()

    # Reset with too-short password
    resp = await client.post(
        f"{AUTH_URL}/reset-password",
        json={"token": token, "new_password": "1234567"},
    )
    assert resp.status_code == 422, resp.text
