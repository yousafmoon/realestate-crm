"""create properties table

Revision ID: ce3c27139d51
Revises: d5fedecf22c7
Create Date: 2026-09-29 09:58:42.625897

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "ce3c27139d51"
down_revision: Union[str, Sequence[str], None] = "d5fedecf22c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("property_type", sa.String(length=50), nullable=False),
        sa.Column("listing_type", sa.String(length=50), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("bedrooms", sa.Integer(), nullable=False),
        sa.Column("bathrooms", sa.Integer(), nullable=False),
        sa.Column("area", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_properties_id",
        "properties",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_properties_id", table_name="properties")
    op.drop_table("properties")