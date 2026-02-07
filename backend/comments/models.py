from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from db.database import Base
from datetime import datetime
import uuid

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    location_id: Mapped[str] = mapped_column(String, index=True)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
