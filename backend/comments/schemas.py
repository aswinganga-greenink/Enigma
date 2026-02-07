from pydantic import BaseModel, Field
from datetime import datetime

class CommentCreate(BaseModel):
    location_id: str
    content: str = Field(min_length=3, max_length=500)

class CommentOut(BaseModel):
    id: str
    content: str
    created_at: datetime
