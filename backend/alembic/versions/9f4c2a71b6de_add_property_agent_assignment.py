"""add property agent assignment

Revision ID: 9f4c2a71b6de
Revises: ce3c27139d51
Create Date: 2026-09-29

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f4c2a71b6de"
down_revision: Union[str, Sequence[str], None] = "ce3c27139d51"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "properties",
        sa.Column("assigned_agent_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_properties_assigned_agent_id_users",
        "properties",
        "users",
        ["assigned_agent_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_properties_assigned_agent_id",
        "properties",
        ["assigned_agent_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_properties_assigned_agent_id",
        table_name="properties",
    )
    op.drop_constraint(
        "fk_properties_assigned_agent_id_users",
        "properties",
        type_="foreignkey",
    )
    op.drop_column("properties", "assigned_agent_id")