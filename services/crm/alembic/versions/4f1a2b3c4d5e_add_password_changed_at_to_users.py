"""add role, email_verified, and password_changed_at to users

Revision ID: 4f1a2b3c4d5e
Revises: e9d2cd4bba54
Create Date: 2026-06-15 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4f1a2b3c4d5e"
down_revision: Union[str, None] = "e9d2cd4bba54"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(20),
            nullable=False,
            server_default="admin",
        ),
    )
    op.create_index(op.f("ix_users_role"), "users", ["role"])
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "users",
        sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_changed_at")
    op.drop_column("users", "email_verified")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_column("users", "role")
