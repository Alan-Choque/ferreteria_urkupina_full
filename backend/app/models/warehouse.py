from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String
from app.db.base import Base

class Warehouse(Base):
    __tablename__ = "warehouse"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    branch_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
