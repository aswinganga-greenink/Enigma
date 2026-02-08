from pydantic import BaseModel, Field
from datetime import datetime

class CommentCreate(BaseModel):
    location_id: str
    content: str = Field(min_length=3, max_length=500)
    rating: int = Field(ge=1, le=5, default=5)

class CommentOut(BaseModel):
    id: str
    content: str
    rating: int
    created_at: datetime
