from sqlalchemy import Integer, String, JSON, Numeric, ForeignKey, UniqueConstraint, Text
from sqlalchemy.dialects import mssql
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ProductVariant(Base):
    __tablename__ = "product_variant"
    __table_args__ = (UniqueConstraint("product_id", "sku", name="uq_variant_product_sku"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("product.id"), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(String(64), nullable=False)

    # JSON → NVARCHAR(MAX) para MSSQL
    attributes: Mapped[dict | None] = mapped_column(
        JSON().with_variant(Text().with_variant(mssql.NVARCHAR(None), "mssql"), "mssql"),
        nullable=True
    )

    barcode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
