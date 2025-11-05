from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from app.db.base import Base

class Category(Base):
    __tablename__ = "category"
    __table_args__ = (UniqueConstraint("name", "parent_id", name="uq_category_name_parent"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("category.id"), nullable=True)
