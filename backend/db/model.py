from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from db.database import Base
import uuid

class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    business_name: Mapped[str] = mapped_column(String)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
