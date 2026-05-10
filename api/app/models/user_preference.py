import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    coins: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    investor_types: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    content_types: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    dashboard_layout: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    coin_order: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="preferences")  # noqa: F821
