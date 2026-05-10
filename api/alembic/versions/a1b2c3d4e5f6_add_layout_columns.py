"""add layout columns

Revision ID: a1b2c3d4e5f6
Revises: 8c0c72024717
Create Date: 2026-05-10 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8c0c72024717'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_preferences', sa.Column('dashboard_layout', postgresql.JSONB(), nullable=True))
    op.add_column('user_preferences', sa.Column('coin_order', postgresql.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    op.drop_column('user_preferences', 'coin_order')
    op.drop_column('user_preferences', 'dashboard_layout')
