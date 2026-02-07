from sqlalchemy import String, Boolean, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.database import Base
import uuid

class VendorLocation(Base):
    __tablename__ = "vendor_locations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    vendor_id: Mapped[str] = mapped_column(
        String, ForeignKey("vendors.id"), index=True
    )

    name: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)

    pricing: Mapped[str] = mapped_column(String)  # free | paid
    differently_abled_supported: Mapped[bool] = mapped_column(Boolean)

    vendor = relationship("Vendor")
